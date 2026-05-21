import { BaseGameAdapter } from './GameAdapter';
import { GameState, Player, AIDifficulty } from '../../types/game';
import { Deck } from '../Deck';
import { trickWinnerIndex } from './trickUtils';

const WINNING_SCORE = 500;
const DEFAULT_BID = 4;
const BAG_PENALTY_EVERY = 10;
const BAG_PENALTY_POINTS = 100;

interface SpadesVariantState {
  team1Bid: number;
  team2Bid: number;
  team1Tricks: number;
  team2Tricks: number;
  team1Bags: number;
  team2Bags: number;
  waitingForBids: boolean;
  spadesBroken: boolean;
}

function getSpadesState(state: GameState): SpadesVariantState {
  const vs = state.variantState?.spades as SpadesVariantState | undefined;
  return (
    vs ?? {
      team1Bid: DEFAULT_BID,
      team2Bid: DEFAULT_BID,
      team1Tricks: 0,
      team2Tricks: 0,
      team1Bags: 0,
      team2Bags: 0,
      waitingForBids: true,
      spadesBroken: false
    }
  );
}

export class SpadesGame extends BaseGameAdapter {
  variant = 'spades' as const;
  private state?: GameState;

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    const team1Bid = (options?.team1Bid as number) ?? DEFAULT_BID;
    const team2Bid = (options?.team2Bid as number) ?? DEFAULT_BID;
    this.state = this.createRoundState(playerNames, options, 1, { team1: 0, team2: 0 }, team1Bid, team2Bid, true);
    return this.cloneState(this.state);
  }

  getCurrentState(): GameState {
    if (!this.state) throw new Error('SpadesGame not initialized');
    return this.cloneState(this.state);
  }

  applyBids(team1Bid: number, team2Bid: number): void {
    if (!this.state) return;
    const spades = getSpadesState(this.state);
    spades.team1Bid = Math.max(0, Math.min(13, team1Bid));
    spades.team2Bid = Math.max(0, Math.min(13, team2Bid));
    spades.waitingForBids = false;
    this.state.waitingForRoundStart = false;
    this.state.variantState = { ...this.state.variantState, spades };
  }

  private createRoundState(
    playerNames: string[],
    options: Record<string, unknown> | undefined,
    round: number,
    gameScore: { team1: number; team2: number },
    team1Bid: number,
    team2Bid: number,
    waitingForBids: boolean
  ): GameState {
    const deck = new Deck('standard52');
    const localPlayerIndex = options?.localPlayerIndex as number | undefined;

    const players: Player[] = playerNames.slice(0, 4).map((name, index) => {
      const isTeam1 = index === 0 || index === 2;
      const isLocalHuman = localPlayerIndex !== undefined ? index === localPlayerIndex : index === 0;
      const playerType =
        localPlayerIndex !== undefined
          ? isLocalHuman
            ? 'human'
            : 'ai'
          : isLocalHuman
            ? 'human'
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

    return {
      variant: 'spades',
      players,
      currentPlayerIndex: 0,
      dealerIndex: 0,
      trumpSuit: 'spades',
      trumpCard: null,
      currentTrick: [],
      trickLeader: 0,
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
          team1Bid,
          team2Bid,
          team1Tricks: 0,
          team2Tricks: 0,
          team1Bags: 0,
          team2Bags: 0,
          waitingForBids,
          spadesBroken: false
        }
      }
    };
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
      { aiDifficulty: s.aiDifficulty },
      s.round + 1,
      gameScore,
      prev.team1Bid,
      prev.team2Bid,
      true
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
    const spades = getSpadesState(this.state!);
    const player = state.players[playerIndex];
    if (!player) return -1;
    const valid: number[] = [];
    for (let i = 0; i < player.hand.length; i++) {
      if (this.canPlayCard(state, playerIndex, i)) valid.push(i);
    }
    if (valid.length === 0) return -1;

    const team = player.team ?? 1;
    const teamTricks = team === 1 ? spades.team1Tricks : spades.team2Tricks;
    const teamBid = team === 1 ? spades.team1Bid : spades.team2Bid;
    const needTricks = teamTricks < teamBid;

    if (state.currentTrick.length === 0) {
      const nonSpades = valid.filter((i) => player.hand[i].suit !== 'spades');
      const pool = nonSpades.length > 0 ? nonSpades : valid;
      return pool[needTricks ? pool.length - 1 : 0];
    }

    const ledSuit = state.currentTrick[0].suit;
    const trumpPlayed = state.currentTrick.some((c) => c.suit === 'spades');
    const winning = valid.find((i) => {
      const c = player.hand[i];
      if (trumpPlayed && c.suit === 'spades') return true;
      return c.suit === ledSuit;
    });
    return winning ?? valid[0];
  }
}
