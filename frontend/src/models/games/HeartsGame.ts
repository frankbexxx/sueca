import { BaseGameAdapter } from './GameAdapter';
import { GameState, Card, Player, AIDifficulty } from '../../types/game';
import { pickAIPassCards } from '../../ai/games/hearts/HeartsPassStrategy';
import { chooseHeartsCard } from '../../ai/games/hearts/HeartsPlayStrategy';
import { Deck } from '../Deck';
import { trickWinnerIndex } from './trickUtils';
import { applyHandSortToState } from '../../utils/handSort';
import {
  canHeartsEndRoundEarly,
  countHeartsInTrick,
  trickHasQueenSpades
} from '../../utils/earlyRoundEnd';
import { settleHeartsRoundDeltas } from './heartsRoundDisplay';

const TARGET_SCORE = 100;

export type PassDirection = 'left' | 'right' | 'across' | 'hold';

export interface HeartsVariantState {
  heartsBroken: boolean;
  playerScores: number[];
  roundPoints: number[];
  /** Deltas applied to totals at round end (moon-adjusted). */
  lastRoundDeltas: number[];
  waitingForPass: boolean;
  passDirection: PassDirection;
  humanPassIndices: number[];
  heartsTakenCount: number;
  queenSpadesTaken: boolean;
  penaltyCardsTaken: Card[][];
  waitingForEarlyEnd: boolean;
  scoringFrozen: boolean;
  earlyEndOffered: boolean;
}

function emptyPenaltyCardsTaken(): Card[][] {
  return [[], [], [], []];
}

function penaltyCardsFromTrick(trick: Card[]): Card[] {
  return trick.filter(
    (card) => card.suit === 'hearts' || (card.rank === 'Q' && card.suit === 'spades')
  );
}

export function getHeartsState(state: GameState): HeartsVariantState {
  const vs = state.variantState?.hearts as HeartsVariantState | undefined;
  const defaults: HeartsVariantState = {
    heartsBroken: false,
    playerScores: [0, 0, 0, 0],
    roundPoints: [0, 0, 0, 0],
    lastRoundDeltas: [0, 0, 0, 0],
    waitingForPass: true,
    passDirection: 'left',
    humanPassIndices: [],
    heartsTakenCount: 0,
    queenSpadesTaken: false,
    penaltyCardsTaken: emptyPenaltyCardsTaken(),
    waitingForEarlyEnd: false,
    scoringFrozen: false,
    earlyEndOffered: false
  };
  return vs ? { ...defaults, ...vs } : defaults;
}

function passDirectionForRound(round: number): PassDirection {
  const cycle: PassDirection[] = ['left', 'right', 'across', 'hold'];
  return cycle[(round - 1) % 4];
}

function trickPoints(trick: Card[]): number {
  return trick.reduce((sum, card) => {
    if (card.suit === 'hearts') return sum + 1;
    if (card.rank === 'Q' && card.suit === 'spades') return sum + 13;
    return sum;
  }, 0);
}

export class HeartsGame extends BaseGameAdapter {
  variant = 'hearts' as const;
  private state?: GameState;

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    this.state = this.createRoundState(playerNames, options, 1, [0, 0, 0, 0]);
    return this.cloneState(this.state);
  }

  getCurrentState(): GameState {
    if (!this.state) throw new Error('HeartsGame not initialized');
    return this.cloneState(this.state);
  }

  protected getMutableEngineState(): GameState | undefined {
    return this.state;
  }

  /** Human selects up to 3 cards to pass (toggle indices). */
  togglePassCard(cardIndex: number, localPlayerIndex = 0): void {
    if (!this.state) return;
    const hearts = getHeartsState(this.state);
    if (!hearts.waitingForPass) return;
    const idx = hearts.humanPassIndices.indexOf(cardIndex);
    if (idx >= 0) {
      hearts.humanPassIndices.splice(idx, 1);
    } else if (hearts.humanPassIndices.length < 3) {
      hearts.humanPassIndices.push(cardIndex);
    }
    this.state.variantState = { ...this.state.variantState, hearts };
  }

  /** Confirm pass for human + auto-pass for AI, then start play. */
  confirmPass(localPlayerIndex = 0): boolean {
    if (!this.state) return false;
    const hearts = getHeartsState(this.state);
    if (!hearts.waitingForPass) return false;

    if (hearts.passDirection === 'hold') {
      hearts.waitingForPass = false;
      hearts.humanPassIndices = [];
      this.state.waitingForRoundStart = false;
      this.state.variantState = { ...this.state.variantState, hearts };
      this.setOpeningLeader();
      return true;
    }

    if (hearts.humanPassIndices.length !== 3) return false;

    const passes: Card[][] = [[], [], [], []];
    const human = this.state.players[localPlayerIndex];
    const sorted = [...hearts.humanPassIndices].sort((a, b) => b - a);
    for (const i of sorted) {
      passes[localPlayerIndex].push(human.hand.splice(i, 1)[0]);
    }

    for (let p = 0; p < 4; p++) {
      if (p === localPlayerIndex) continue;
      const aiPass = this.pickAIPassCards(this.state.players[p].hand);
      passes[p] = aiPass;
      for (const c of aiPass) {
        const idx = this.state.players[p].hand.findIndex((h) => h.id === c.id);
        if (idx >= 0) this.state.players[p].hand.splice(idx, 1);
      }
    }

    for (let from = 0; from < 4; from++) {
      const to = this.passTarget(from, hearts.passDirection);
      this.state.players[to].hand.push(...passes[from]);
    }

    hearts.waitingForPass = false;
    hearts.humanPassIndices = [];
    this.state.waitingForRoundStart = false;
    this.state.variantState = { ...this.state.variantState, hearts };

    this.setOpeningLeader();
    return true;
  }

  private setOpeningLeader(): void {
    if (!this.state) return;
    const twoClubs = this.state.players.findIndex((pl) =>
      pl.hand.some((c) => c.rank === '2' && c.suit === 'clubs')
    );
    const leader = twoClubs >= 0 ? twoClubs : 0;
    this.state.currentPlayerIndex = leader;
    this.state.trickLeader = leader;
    this.state.isFirstTrick = true;
  }

  private passTarget(from: number, dir: PassDirection): number {
    if (dir === 'left') return (from + 1) % 4;
    if (dir === 'right') return (from + 3) % 4;
    return (from + 2) % 4;
  }

  private pickAIPassCards(hand: Card[]): Card[] {
    return pickAIPassCards(hand, this.state?.aiDifficulty ?? 'medium');
  }

  private createRoundState(
    playerNames: string[],
    options: Record<string, unknown> | undefined,
    round: number,
    playerScores: number[]
  ): GameState {
    const deck = new Deck('standard52');
    const localPlayerIndex = options?.localPlayerIndex as number | undefined;
    const multiplayerSlots = options?.multiplayerSlots as Array<'human' | 'ai'> | undefined;
    const passDirection = passDirectionForRound(round);
    const dealerIndex = (round - 1) % 4;

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

    const state: GameState = {
      variant: 'hearts',
      players,
      currentPlayerIndex: 0,
      dealerIndex,
      trumpSuit: null,
      trumpCard: null,
      currentTrick: [],
      trickLeader: 0,
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      completedPentes: [],
      round,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: true,
      dealingMethod: 'A',
      waitingForRoundStart: true,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [],
      isPaused: false,
      playerName: players[0]?.name || 'Player 1',
      aiDifficulty: (options?.aiDifficulty as AIDifficulty) || 'medium',
      partnerSignals: [],
      variantState: {
        hearts: {
          heartsBroken: false,
          playerScores,
          roundPoints: [0, 0, 0, 0],
          lastRoundDeltas: [0, 0, 0, 0],
          waitingForPass: passDirection !== 'hold',
          passDirection,
          humanPassIndices: [],
          heartsTakenCount: 0,
          queenSpadesTaken: false,
          penaltyCardsTaken: emptyPenaltyCardsTaken(),
          waitingForEarlyEnd: false,
          scoringFrozen: false,
          earlyEndOffered: false
        }
      }
    };

    applyHandSortToState(state);

    if (passDirection === 'hold') {
      const twoClubs = players.findIndex((pl) =>
        pl.hand.some((c) => c.rank === '2' && c.suit === 'clubs')
      );
      const leader = twoClubs >= 0 ? twoClubs : 0;
      state.currentPlayerIndex = leader;
      state.trickLeader = leader;
      state.waitingForRoundStart = false;
    }

    return state;
  }

  canPlayCard(_state: GameState, playerIndex: number, cardIndex: number): boolean {
    const s = this.state!;
    const hearts = getHeartsState(s);
    if (hearts.waitingForPass || s.waitingForRoundStart) return false;
    if (hearts.waitingForEarlyEnd) return false;
    const player = s.players[playerIndex];
    if (!player || cardIndex < 0 || cardIndex >= player.hand.length) return false;
    if (playerIndex !== s.currentPlayerIndex) return false;
    if (s.waitingForTrickEnd || s.isPaused) return false;

    const card = player.hand[cardIndex];

    if (s.isFirstTrick) {
      const must2c = player.hand.some((c) => c.rank === '2' && c.suit === 'clubs');
      if (s.currentTrick.length === 0 && must2c && !(card.rank === '2' && card.suit === 'clubs')) {
        return false;
      }
    }

    if (s.currentTrick.length === 0 && card.suit === 'hearts' && !hearts.heartsBroken) {
      const hasOther = player.hand.some((c) => c.suit !== 'hearts');
      if (hasOther) return false;
    }

    if (s.currentTrick.length > 0) {
      const ledSuit = s.currentTrick[0].suit;
      const canFollow = player.hand.some((c) => c.suit === ledSuit);
      if (canFollow && card.suit !== ledSuit) return false;

      // First trick: hearts/Q♠ banned only while a non-penalty follow-legal card exists.
      if (s.isFirstTrick) {
        const isFirstTrickPenalty =
          card.suit === 'hearts' || (card.rank === 'Q' && card.suit === 'spades');
        if (isFirstTrickPenalty) {
          const hasNonPenaltyLegal = player.hand.some((c) => {
            if (canFollow && c.suit !== ledSuit) return false;
            return !(c.suit === 'hearts' || (c.rank === 'Q' && c.suit === 'spades'));
          });
          if (hasNonPenaltyLegal) return false;
        }
      }

      return true;
    }

    return true;
  }

  playCard(_state: GameState, playerIndex: number, cardIndex: number): boolean {
    if (!this.canPlayCard(_state, playerIndex, cardIndex)) return false;
    const s = this.state!;
    const player = s.players[playerIndex];
    const card = player.hand.splice(cardIndex, 1)[0];
    s.currentTrick.push(card);

    const hearts = getHeartsState(s);
    if (card.suit === 'hearts') hearts.heartsBroken = true;
    if (card.rank === 'Q' && card.suit === 'spades' && s.currentTrick.length > 0) {
      hearts.heartsBroken = true;
    }
    s.variantState = { ...s.variantState, hearts };

    if (s.currentTrick.length === 4) {
      const winner = trickWinnerIndex(s.currentTrick, s.trickLeader, null);
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
    const hearts = getHeartsState(s);

    if (!hearts.scoringFrozen) {
      const points = trickPoints(s.currentTrick);
      hearts.roundPoints[winner] += points;
    }

    hearts.heartsTakenCount += countHeartsInTrick(s.currentTrick);
    if (trickHasQueenSpades(s.currentTrick)) {
      hearts.queenSpadesTaken = true;
    }
    const penaltyCards = penaltyCardsFromTrick(s.currentTrick);
    if (penaltyCards.length > 0) {
      hearts.penaltyCardsTaken[winner].push(...penaltyCards);
    }

    s.variantState = { ...s.variantState, hearts };

    s.waitingForTrickEnd = false;
    s.currentTrick = [];
    s.isFirstTrick = false;
    s.trickLeader = winner;
    s.currentPlayerIndex = winner;

    if (s.players[0].hand.length === 0) {
      this.endRound(s);
      return;
    }

    if (
      !hearts.scoringFrozen &&
      !hearts.earlyEndOffered &&
      canHeartsEndRoundEarly(hearts.heartsTakenCount, hearts.queenSpadesTaken)
    ) {
      hearts.earlyEndOffered = true;
      hearts.waitingForEarlyEnd = true;
      s.variantState = { ...s.variantState, hearts };
    }
  }

  acceptEarlyEnd(): void {
    const s = this.state!;
    const hearts = getHeartsState(s);
    if (!hearts.waitingForEarlyEnd) return;
    hearts.waitingForEarlyEnd = false;
    s.variantState = { ...s.variantState, hearts };
    this.endRound(s);
  }

  declineEarlyEnd(): void {
    const s = this.state!;
    const hearts = getHeartsState(s);
    if (!hearts.waitingForEarlyEnd) return;
    hearts.waitingForEarlyEnd = false;
    hearts.scoringFrozen = true;
    s.variantState = { ...s.variantState, hearts };
  }

  private endRound(s: GameState): void {
    const hearts = getHeartsState(s);
    const deltas = settleHeartsRoundDeltas(hearts.roundPoints);
    hearts.lastRoundDeltas = deltas;
    for (let i = 0; i < 4; i++) {
      hearts.playerScores[i] += deltas[i];
    }

    s.variantState = { ...s.variantState, hearts };
    const max = Math.max(...hearts.playerScores);
    if (max >= TARGET_SCORE) {
      s.isGameOver = true;
      const loser = hearts.playerScores.indexOf(max);
      s.winner = loser < 2 ? 2 : 1;
      s.waitingForGameStart = true;
      return;
    }
    s.waitingForRoundEnd = true;
    s.scores = {
      team1: hearts.playerScores[0] + hearts.playerScores[2],
      team2: hearts.playerScores[1] + hearts.playerScores[3]
    };
  }

  continueToNextRound(_state: GameState): void {
    const s = this.state!;
    if (!s.waitingForRoundEnd) return;
    const hearts = getHeartsState(s);
    const names = s.players.map((p) => p.name);
    this.state = this.createRoundState(
      names,
      { aiDifficulty: s.aiDifficulty },
      s.round + 1,
      [...hearts.playerScores]
    );
  }

  startRound(_state: GameState): void {
    if (this.state) this.state.waitingForRoundStart = false;
  }

  restoreState(state: GameState): GameState {
    this.state = JSON.parse(JSON.stringify(state));
    return this.getCurrentState();
  }

  chooseAICard(_state: GameState, playerIndex: number): number {
    return chooseHeartsCard(this, this.state!, playerIndex, this.state!.aiDifficulty);
  }
}
