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
import { heartsPassExchangeMs, cardPlayDelayMs } from './gamePacingPolicy';
import { HeartsVariantFlow } from './variantFlowApi';
import { recordHeartsPass } from '../../diagnostics/session';
import { individualMatchResult } from '../matchResult';

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
  /**
   * Presentation lock after a real exchange. Null when play may proceed.
   * Not a second pass. Restore clears it so a reload continues from the exchanged hands.
   */
  passExchangeUntilMs: number | null;
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
    passExchangeUntilMs: null,
    heartsTakenCount: 0,
    queenSpadesTaken: false,
    penaltyCardsTaken: emptyPenaltyCardsTaken(),
    waitingForEarlyEnd: false,
    scoringFrozen: false,
    earlyEndOffered: false
  };
  return vs ? { ...defaults, ...vs } : defaults;
}

const PASS_DIRECTIONS: readonly PassDirection[] = ['left', 'right', 'across', 'hold'];

export type HeartsResumeRejection =
  | 'missing_variant_state'
  | 'malformed_variant_state'
  | 'invalid_pass_direction'
  | 'invalid_pass_indices'
  | 'invalid_scores'
  | 'invalid_round_points'
  | 'invalid_hands'
  | 'impossible_pass_phase'
  | 'impossible_leader'
  | 'incomplete_variant_state';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSeat(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 3;
}

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isScoreRow(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === 4 && value.every(isNonNegativeInt);
}

function isCardShape(value: unknown): value is Card {
  if (!value || typeof value !== 'object') return false;
  const card = value as Card;
  return typeof card.id === 'string' && card.id.length > 0
    && typeof card.rank === 'string'
    && typeof card.suit === 'string';
}

function optionalBool(value: unknown, fallback: boolean): boolean | null {
  if (value === undefined) return fallback;
  return typeof value === 'boolean' ? value : null;
}

function optionalScoreRow(value: unknown, fallback: number[]): number[] | null {
  if (value === undefined) return [...fallback];
  if (!isScoreRow(value) || value.some((score) => score > 26)) return null;
  return [...value];
}

/**
 * Recognizable Hearts resume payload.
 * Copies and checks the saved object. Fills only optional fields that older
 * complete saves may omit. Never invents a pass, scores, or a leader.
 */
export function assessHeartsResume(
  raw: unknown,
  game: GameState
): { ok: true; hearts: HeartsVariantState } | { ok: false; reason: HeartsResumeRejection } {
  if (raw == null) return { ok: false, reason: 'missing_variant_state' };
  if (!isPlainObject(raw)) return { ok: false, reason: 'malformed_variant_state' };

  if (!PASS_DIRECTIONS.includes(raw.passDirection as PassDirection)) {
    return { ok: false, reason: 'invalid_pass_direction' };
  }
  if (typeof raw.waitingForPass !== 'boolean') {
    return { ok: false, reason: 'incomplete_variant_state' };
  }
  if (typeof raw.heartsBroken !== 'boolean') {
    return { ok: false, reason: 'incomplete_variant_state' };
  }
  if (!isScoreRow(raw.playerScores)) return { ok: false, reason: 'invalid_scores' };
  if (!isScoreRow(raw.roundPoints) || raw.roundPoints.some((points) => points > 26)) {
    return { ok: false, reason: 'invalid_round_points' };
  }
  if (raw.roundPoints.reduce((sum, points) => sum + points, 0) > 26) {
    return { ok: false, reason: 'invalid_round_points' };
  }

  const handsIssue = heartsHandsIssue(game);
  if (handsIssue) return { ok: false, reason: handsIssue };

  const localSeat = isSeat(game.localPlayerIndex) ? game.localPlayerIndex : 0;
  if (passIndicesIssue(raw.humanPassIndices, game.players[localSeat].hand.length)) {
    return { ok: false, reason: 'invalid_pass_indices' };
  }

  if (raw.waitingForPass) {
    const trickEmpty = Array.isArray(game.currentTrick) && game.currentTrick.length === 0;
    const dealt = game.players.every((player) => player.hand.length === 13);
    if (!trickEmpty || !dealt || game.waitingForRoundEnd || game.isGameOver) {
      return { ok: false, reason: 'impossible_pass_phase' };
    }
  } else if (openingLeaderImpossible(game)) {
    return { ok: false, reason: 'impossible_leader' };
  }

  const lastRoundDeltas = optionalScoreRow(raw.lastRoundDeltas, [0, 0, 0, 0]);
  const heartsTakenCount = raw.heartsTakenCount === undefined
    ? 0
    : isNonNegativeInt(raw.heartsTakenCount) && raw.heartsTakenCount <= 13
      ? raw.heartsTakenCount
      : null;
  const queenSpadesTaken = optionalBool(raw.queenSpadesTaken, false);
  const penaltyCardsTaken = optionalPenaltyCards(raw.penaltyCardsTaken);
  const waitingForEarlyEnd = optionalBool(raw.waitingForEarlyEnd, false);
  const scoringFrozen = optionalBool(raw.scoringFrozen, false);
  const earlyEndOffered = optionalBool(raw.earlyEndOffered, false);
  if (
    !lastRoundDeltas ||
    heartsTakenCount == null ||
    queenSpadesTaken == null ||
    !penaltyCardsTaken ||
    waitingForEarlyEnd == null ||
    scoringFrozen == null ||
    earlyEndOffered == null
  ) {
    return { ok: false, reason: 'incomplete_variant_state' };
  }

  return {
    ok: true,
    hearts: {
      heartsBroken: raw.heartsBroken,
      playerScores: [...raw.playerScores],
      roundPoints: [...raw.roundPoints],
      lastRoundDeltas,
      waitingForPass: raw.waitingForPass,
      passDirection: raw.passDirection as PassDirection,
      humanPassIndices: [...(raw.humanPassIndices as number[])],
      passExchangeUntilMs: null,
      heartsTakenCount,
      queenSpadesTaken,
      penaltyCardsTaken,
      waitingForEarlyEnd,
      scoringFrozen,
      earlyEndOffered
    }
  };
}

function heartsHandsIssue(game: GameState): HeartsResumeRejection | null {
  if (!Array.isArray(game.players) || game.players.length !== 4) return 'invalid_hands';
  if (!Array.isArray(game.currentTrick) || game.currentTrick.length > 4) return 'invalid_hands';
  const seen = new Set<string>();
  let count = 0;
  for (const player of game.players) {
    if (!player || !Array.isArray(player.hand) || player.hand.length > 13) return 'invalid_hands';
    for (const card of player.hand) {
      if (!isCardShape(card) || seen.has(card.id)) return 'invalid_hands';
      seen.add(card.id);
      count += 1;
    }
  }
  for (const card of game.currentTrick) {
    if (!isCardShape(card) || seen.has(card.id)) return 'invalid_hands';
    seen.add(card.id);
    count += 1;
  }
  return count > 52 ? 'invalid_hands' : null;
}

function passIndicesIssue(indices: unknown, handLength: number): boolean {
  if (!Array.isArray(indices) || indices.length > 3) return true;
  const seen = new Set<number>();
  for (const index of indices) {
    if (!Number.isInteger(index) || (index as number) < 0 || (index as number) >= handLength) return true;
    if (seen.has(index as number)) return true;
    seen.add(index as number);
  }
  return false;
}

function openingLeaderImpossible(game: GameState): boolean {
  if (game.isFirstTrick !== true) return false;
  if (game.waitingForRoundStart || game.waitingForRoundEnd || game.waitingForTrickEnd || game.isGameOver) {
    return false;
  }
  if (!Array.isArray(game.currentTrick) || game.currentTrick.length !== 0) return false;
  if (!isSeat(game.currentPlayerIndex)) return true;
  const hand = game.players[game.currentPlayerIndex]?.hand ?? [];
  return !hand.some((card) => card.rank === '2' && card.suit === 'clubs');
}

function optionalPenaltyCards(value: unknown): Card[][] | null {
  if (value === undefined) return emptyPenaltyCardsTaken();
  if (!Array.isArray(value) || value.length !== 4) return null;
  const taken: Card[][] = [];
  for (const pile of value) {
    if (!Array.isArray(pile) || !pile.every(isCardShape)) return null;
    taken.push([...pile]);
  }
  return taken;
}

export function isHeartsPassExchangeLocked(
  hearts: { passExchangeUntilMs?: number | null },
  now = Date.now()
): boolean {
  const until = hearts.passExchangeUntilMs;
  return typeof until === 'number' && now < until;
}

/**
 * Card-play arm for Hearts. Null while the pass-exchange beat is still running,
 * so the lead delay starts only after that beat.
 */
export function heartsCardPlayArmDelayMs(state: GameState, now = Date.now()): number | null {
  if (isHeartsPassExchangeLocked(getHeartsState(state), now)) return null;
  return cardPlayDelayMs('hearts', state.currentTrick.length);
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

  getVariantFlow(): HeartsVariantFlow {
    return {
      kind: 'hearts',
      readState: getHeartsState,
      togglePassCard: (cardIndex, localPlayerIndex) =>
        this.togglePassCard(cardIndex, localPlayerIndex),
      confirmPass: (localPlayerIndex) => this.confirmPass(localPlayerIndex),
      releasePassExchange: () => this.releasePassExchange(),
      acceptEarlyEnd: () => this.acceptEarlyEnd(),
      declineEarlyEnd: () => this.declineEarlyEnd()
    };
  }

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
      try {
        for (let from = 0; from < 4; from++) {
          recordHeartsPass({
            passDirection: 'hold',
            sourceSeat: from,
            destinationSeat: from,
            cards: [],
            roundIndex: this.state.round
          });
        }
      } catch {
        /* ignore */
      }
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

    try {
      for (let from = 0; from < 4; from++) {
        const to = this.passTarget(from, hearts.passDirection);
        recordHeartsPass({
          passDirection: hearts.passDirection,
          sourceSeat: from,
          destinationSeat: to,
          cards: passes[from],
          roundIndex: this.state.round
        });
      }
    } catch {
      /* diagnostic must never block pass */
    }

    hearts.waitingForPass = false;
    hearts.humanPassIndices = [];
    hearts.passExchangeUntilMs = Date.now() + heartsPassExchangeMs();
    this.state.waitingForRoundStart = false;
    this.state.variantState = { ...this.state.variantState, hearts };

    this.setOpeningLeader();
    return true;
  }

  /** Ends the receipt beat. Does not move cards. */
  releasePassExchange(): void {
    if (!this.state) return;
    if (this.state.isPaused) return;
    const hearts = getHeartsState(this.state);
    if (hearts.passExchangeUntilMs == null) return;
    hearts.passExchangeUntilMs = null;
    this.state.variantState = { ...this.state.variantState, hearts };
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
      dealingDirection: 'left',
      playDirection: 'right',
      dealAlignment: 'same',
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
    if (isHeartsPassExchangeLocked(hearts)) return false;
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
      const best = Math.min(...hearts.playerScores);
      const winnerSeats = hearts.playerScores.flatMap((score, seat) =>
        score === best ? [seat] : []
      );
      s.matchResult = individualMatchResult(winnerSeats);
      const loser = hearts.playerScores.indexOf(max);
      s.winner = loser < 2 ? 2 : 1;
      s.waitingForGameStart = true;
      return;
    }
    s.matchResult = null;
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
    const restored = JSON.parse(JSON.stringify(state)) as GameState;
    const assessed = assessHeartsResume(restored.variantState?.hearts, restored);
    if (!assessed.ok) {
      throw new Error(`Hearts restoreState rejected: ${assessed.reason}`);
    }
    restored.variantState = { ...restored.variantState, hearts: assessed.hearts };
    this.state = restored;
    return this.getCurrentState();
  }

  chooseAICard(_state: GameState, playerIndex: number): number {
    return chooseHeartsCard(this, this.state!, playerIndex, this.state!.aiDifficulty);
  }
}
