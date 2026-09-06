import { BaseGameAdapter } from './GameAdapter';
import { GameState, Player, AIDifficulty } from '../../types/game';
import { chooseSpadesBid } from '../../ai/games/spades/SpadesBidEstimator';
import { chooseSpadesCard } from '../../ai/games/spades/SpadesPlayStrategy';
import { Deck } from '../Deck';
import { trickWinnerIndex } from './trickUtils';
import { applyHandSortToState } from '../../utils/handSort';
import { resolvePresetId } from '../../constants/rulesPresets';
import {
  getSpadesPresetOptions,
  SpadesBidType
} from './spades/spadesRules';

const WINNING_SCORE = 500;
const BAG_PENALTY_EVERY = 10;
const BAG_PENALTY_POINTS = 100;

export interface SpadesVariantState {
  playerBids: (number | null)[];
  playerBidTypes: SpadesBidType[];
  bidLeaderIndex: number;
  currentBidderIndex: number;
  team1Bid: number;
  team2Bid: number;
  team1Tricks: number;
  team2Tricks: number;
  playerTricks: number[];
  team1Bags: number;
  team2Bags: number;
  waitingForBids: boolean;
  spadesBroken: boolean;
  nilEnabled: boolean;
  blindNilEnabled: boolean;
}

function emptyBidTypes(): SpadesBidType[] {
  return ['normal', 'normal', 'normal', 'normal'];
}

export function getSpadesState(state: GameState): SpadesVariantState {
  const vs = state.variantState?.spades as SpadesVariantState | undefined;
  return (
    vs ?? {
      playerBids: [null, null, null, null],
      playerBidTypes: emptyBidTypes(),
      bidLeaderIndex: 0,
      currentBidderIndex: 0,
      team1Bid: 0,
      team2Bid: 0,
      team1Tricks: 0,
      team2Tricks: 0,
      playerTricks: [0, 0, 0, 0],
      team1Bags: 0,
      team2Bags: 0,
      waitingForBids: true,
      spadesBroken: false,
      nilEnabled: false,
      blindNilEnabled: false
    }
  );
}

function teamBidsFromPlayerBids(
  bids: number[],
  types: SpadesBidType[]
): { team1: number; team2: number } {
  let team1 = 0;
  let team2 = 0;
  for (let i = 0; i < 4; i++) {
    if (types[i] === 'nil' || types[i] === 'blindNil') continue;
    if (i === 0 || i === 2) team1 += bids[i];
    else team2 += bids[i];
  }
  return { team1, team2 };
}

function nilRoundBonus(bidType: SpadesBidType, tricksTaken: number): number {
  if (bidType === 'nil') return tricksTaken === 0 ? 100 : -100;
  if (bidType === 'blindNil') return tricksTaken === 0 ? 200 : -200;
  return 0;
}


export class SpadesGame extends BaseGameAdapter {
  variant = 'spades' as const;
  private state?: GameState;

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    this.state = this.createRoundState(playerNames, options, 1, { team1: 0, team2: 0 }, {
      prevDealerIndex: undefined,
      prevBidLeaderIndex: undefined,
      waitingForBids: true,
      carriedBags: { team1: 0, team2: 0 }
    });
    return this.cloneState(this.state);
  }

  getCurrentState(): GameState {
    if (!this.state) throw new Error('SpadesGame not initialized');
    return this.cloneState(this.state);
  }

  protected getMutableEngineState(): GameState | undefined {
    return this.state;
  }

  /** @deprecated Use submitBid sequentially. Kept for tests. */
  applyBids(playerBids: number[]): void {
    if (!this.state) return;
    const spades = getSpadesState(this.state);
    if (!spades.waitingForBids) return;

    const leader = spades.bidLeaderIndex;
    for (let step = 0; step < 4; step++) {
      const playerIndex = (leader + step) % 4;
      this.submitBid(playerIndex, playerBids[playerIndex] ?? 0, 'normal');
    }
  }

  submitBid(playerIndex: number, bid: number, bidType: SpadesBidType = 'normal'): boolean {
    if (!this.state) return false;
    const spades = getSpadesState(this.state);
    if (!spades.waitingForBids) return false;
    if (playerIndex !== spades.currentBidderIndex) return false;

    let normalizedBid = Math.max(0, Math.min(13, Math.floor(bid)));
    let normalizedType: SpadesBidType = bidType;

    if (normalizedType === 'nil') {
      if (!spades.nilEnabled) return false;
      normalizedBid = 0;
    } else if (normalizedType === 'blindNil') {
      if (!spades.blindNilEnabled) return false;
      normalizedBid = 0;
    } else {
      normalizedType = 'normal';
    }

    spades.playerBids[playerIndex] = normalizedBid;
    spades.playerBidTypes[playerIndex] = normalizedType;

    const bidsComplete = spades.playerBids.every((value) => value !== null);
    if (bidsComplete) {
      this.finalizeBidding(spades);
    } else {
      spades.currentBidderIndex = (spades.currentBidderIndex + 1) % 4;
    }

    this.state.variantState = { ...this.state.variantState, spades };
    return true;
  }

  chooseAIBid(playerIndex: number): { bid: number; bidType: SpadesBidType } {
    const s = this.state!;
    const spades = getSpadesState(s);
    const hand = s.players[playerIndex]?.hand ?? [];
    return chooseSpadesBid(hand, spades.nilEnabled, spades.blindNilEnabled, s.aiDifficulty);
  }

  tickBidAi(): void {
    if (!this.state) return;
    const spades = getSpadesState(this.state);
    if (!spades.waitingForBids) return;

    const playerIndex = spades.currentBidderIndex;
    const player = this.state.players[playerIndex];
    if (!player || player.type === 'human') return;

    const { bid, bidType } = this.chooseAIBid(playerIndex);
    this.submitBid(playerIndex, bid, bidType);
  }

  private finalizeBidding(spades: SpadesVariantState): void {
    const resolvedBids = spades.playerBids.map((value) => value ?? 0);
    const teams = teamBidsFromPlayerBids(resolvedBids, spades.playerBidTypes);
    spades.playerBids = resolvedBids;
    spades.team1Bid = teams.team1;
    spades.team2Bid = teams.team2;
    spades.waitingForBids = false;
    spades.team1Tricks = 0;
    spades.team2Tricks = 0;
    spades.playerTricks = [0, 0, 0, 0];

    const leadIndex = (this.state!.dealerIndex + 1) % 4;
    this.state!.waitingForRoundStart = false;
    this.state!.currentPlayerIndex = leadIndex;
    this.state!.trickLeader = leadIndex;
    this.state!.isFirstTrick = true;
  }

  private createRoundState(
    playerNames: string[],
    options: Record<string, unknown> | undefined,
    round: number,
    gameScore: { team1: number; team2: number },
    roundOptions: {
      prevDealerIndex?: number;
      prevBidLeaderIndex?: number;
      waitingForBids: boolean;
      carriedBags?: { team1: number; team2: number };
    }
  ): GameState {
    const deck = new Deck('standard52');
    const localPlayerIndex = options?.localPlayerIndex as number | undefined;
    const multiplayerSlots = options?.multiplayerSlots as Array<'human' | 'ai'> | undefined;
    const presetId = resolvePresetId('spades', options?.rulesPresetId as string | undefined);
    const presetOptions = getSpadesPresetOptions(presetId);

    const dealerIndex =
      roundOptions.prevDealerIndex === undefined
        ? 0
        : (roundOptions.prevDealerIndex + 1) % 4;
    const bidLeaderIndex =
      roundOptions.prevBidLeaderIndex === undefined
        ? Math.floor(Math.random() * 4)
        : (roundOptions.prevBidLeaderIndex + 1) % 4;

    const players: Player[] = playerNames.slice(0, 4).map((name, index) => {
      const isTeam1 = index === 0 || index === 2;
      const isLocalHuman = localPlayerIndex !== undefined ? index === localPlayerIndex : index === 0;
      const playerType =
        isLocalHuman
          ? 'human'
          : multiplayerSlots !== undefined
            ? (multiplayerSlots[index] === 'ai' ? 'ai' : 'remote')
            : 'ai';

      return {
        id: `player_${index}`,
        name,
        hand: [],
        team: (isTeam1 ? 1 : 2) as 1 | 2,
        type: playerType
      };
    });

    for (let i = 0; i < 13; i++) {
      for (let p = 0; p < 4; p++) {
        const card = deck.deal(1)[0];
        if (card) players[p].hand.push(card);
      }
    }

    const waitingForBids = roundOptions.waitingForBids;
    const carriedBags = roundOptions.carriedBags ?? { team1: 0, team2: 0 };

    const state: GameState = {
      variant: 'spades',
      players,
      currentPlayerIndex: bidLeaderIndex,
      dealerIndex,
      trumpSuit: 'spades',
      trumpCard: null,
      currentTrick: [],
      trickLeader: bidLeaderIndex,
      scores: { team1: 0, team2: 0 },
      gameScore,
      completedPentes: [],
      round,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: true,
      dealingMethod: 'A',
      waitingForRoundStart: waitingForBids,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [],
      isPaused: false,
      playerName: players[0]?.name || 'Player 1',
      aiDifficulty: (options?.aiDifficulty as AIDifficulty) || 'medium',
      partnerSignals: [],
      variantState: {
        spades: {
          playerBids: [null, null, null, null],
          playerBidTypes: emptyBidTypes(),
          bidLeaderIndex,
          currentBidderIndex: bidLeaderIndex,
          team1Bid: 0,
          team2Bid: 0,
          team1Tricks: 0,
          team2Tricks: 0,
          playerTricks: [0, 0, 0, 0],
          team1Bags: carriedBags.team1,
          team2Bags: carriedBags.team2,
          waitingForBids,
          spadesBroken: false,
          nilEnabled: presetOptions.nilEnabled,
          blindNilEnabled: presetOptions.blindNilEnabled
        },
        rulesPresetId: presetId
      }
    };
    applyHandSortToState(state);
    return state;
  }

  canPlayCard(_state: GameState, playerIndex: number, cardIndex: number): boolean {
    const s = this.state!;
    const spades = getSpadesState(s);
    if (spades.waitingForBids || s.waitingForRoundStart) return false;
    const player = s.players[playerIndex];
    if (!player || cardIndex < 0 || cardIndex >= player.hand.length) return false;
    if (playerIndex !== s.currentPlayerIndex) return false;
    if (s.waitingForTrickEnd || s.isPaused) return false;

    const card = player.hand[cardIndex];
    if (s.currentTrick.length === 0) {
      const hasNonSpades = player.hand.some((c) => c.suit !== 'spades');
      if (card.suit === 'spades' && hasNonSpades && !spades.spadesBroken) return false;
      return true;
    }

    const ledSuit = s.currentTrick[0].suit;
    const canFollowSuit = player.hand.some((c) => c.suit === ledSuit);
    return !canFollowSuit || card.suit === ledSuit;
  }

  playCard(_state: GameState, playerIndex: number, cardIndex: number): boolean {
    if (!this.canPlayCard(_state, playerIndex, cardIndex)) return false;
    const s = this.state!;
    const player = s.players[playerIndex];
    const card = player.hand.splice(cardIndex, 1)[0];
    s.currentTrick.push(card);

    const spades = getSpadesState(s);
    if (card.suit === 'spades') {
      spades.spadesBroken = true;
    }
    s.variantState = { ...s.variantState, spades };

    if (s.currentTrick.length === 4) {
      const winner = trickWinnerIndex(s.currentTrick, s.trickLeader, 'spades');
      s.lastTrickWinner = winner;
      s.waitingForTrickEnd = true;
      s.nextTrickLeader = winner;
    } else {
      s.currentPlayerIndex = (s.currentPlayerIndex + 1) % 4;
    }
    return true;
  }

  finishTrick(_state: GameState): void {
    const s = this.state!;
    if (!s.waitingForTrickEnd) return;

    const winner = s.nextTrickLeader ?? s.lastTrickWinner ?? 0;
    const spades = getSpadesState(s);
    const team = s.players[winner]?.team ?? 1;
    if (team === 1) spades.team1Tricks++;
    else spades.team2Tricks++;
    spades.playerTricks[winner]++;
    s.variantState = { ...s.variantState, spades };

    s.waitingForTrickEnd = false;
    s.currentTrick = [];
    s.trickLeader = winner;
    s.currentPlayerIndex = winner;

    if (s.players[0].hand.length === 0) {
      this.endRound(s);
    }
  }

  private scoreTeam(tricks: number, bid: number, bags: number): { round: number; newBags: number } {
    let round = 0;
    let newBags = bags;
    if (tricks >= bid) {
      round = bid * 10 + (tricks - bid);
      newBags += tricks - bid;
    } else {
      round = -bid * 10;
    }
    while (newBags >= BAG_PENALTY_EVERY) {
      round -= BAG_PENALTY_POINTS;
      newBags -= BAG_PENALTY_EVERY;
    }
    return { round, newBags };
  }

  private endRound(s: GameState): void {
    const spades = getSpadesState(s);
    const t1 = this.scoreTeam(spades.team1Tricks, spades.team1Bid, spades.team1Bags);
    const t2 = this.scoreTeam(spades.team2Tricks, spades.team2Bid, spades.team2Bags);

    let team1NilBonus = 0;
    let team2NilBonus = 0;
    for (let i = 0; i < 4; i++) {
      const bonus = nilRoundBonus(spades.playerBidTypes[i], spades.playerTricks[i]);
      if (s.players[i]?.team === 1) team1NilBonus += bonus;
      else team2NilBonus += bonus;
    }

    t1.round += team1NilBonus;
    t2.round += team2NilBonus;

    spades.team1Bags = t1.newBags;
    spades.team2Bags = t2.newBags;
    s.variantState = { ...s.variantState, spades };

    s.scores = { team1: t1.round, team2: t2.round };
    s.gameScore.team1 += t1.round;
    s.gameScore.team2 += t2.round;

    if (s.gameScore.team1 >= WINNING_SCORE) {
      s.isGameOver = true;
      s.winner = 1;
      s.waitingForGameStart = true;
      s.waitingForRoundEnd = false;
      return;
    }
    if (s.gameScore.team2 >= WINNING_SCORE) {
      s.isGameOver = true;
      s.winner = 2;
      s.waitingForGameStart = true;
      s.waitingForRoundEnd = false;
      return;
    }

    s.waitingForRoundEnd = true;
  }

  continueToNextRound(_state: GameState): void {
    const s = this.state!;
    if (!s.waitingForRoundEnd) return;

    const names = s.players.map((p) => p.name);
    const gameScore = { ...s.gameScore };
    const prev = getSpadesState(s);
    this.state = this.createRoundState(
      names,
      {
        aiDifficulty: s.aiDifficulty,
        rulesPresetId: s.variantState?.rulesPresetId
      },
      s.round + 1,
      gameScore,
      {
        prevDealerIndex: s.dealerIndex,
        prevBidLeaderIndex: prev.bidLeaderIndex,
        waitingForBids: true,
        carriedBags: { team1: prev.team1Bags, team2: prev.team2Bags }
      }
    );
  }

  startRound(_state: GameState): void {
    if (this.state) this.state.waitingForRoundStart = false;
  }

  restoreState(state: GameState): GameState {
    this.state = JSON.parse(JSON.stringify(state));
    return this.getCurrentState();
  }

  chooseAICard(state: GameState, playerIndex: number): number {
    return chooseSpadesCard(this, state, playerIndex, getSpadesState(this.state!), this.state!.aiDifficulty);
  }
}
