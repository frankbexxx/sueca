/**
 * ARCH-SUECA-08/09 — central Sueca persisted-state migrator.
 *
 * Canonical schema v2 persists:
 * - schemaVersion: 2
 * - playDirection
 * - dealAlignment
 *
 * Legacy Method A/B × DealingDirection are READ-ONLY migration inputs.
 * Migrated output is canonical-only (no Method/Direction writers).
 */

import type {
  DealAlignment,
  DealingDirection,
  DealingMethod,
  GameState,
  PlayDirection
} from '../../types/game';
import { asSeat, firstLeader, oppositeDirection, seatAtOffset } from './suecaRules';
import { cloneGameState } from './cloneGameState';

/** Canonical Sueca GameState schema version (Phase 6). */
export const SUECA_STATE_SCHEMA_VERSION = 2 as const;

export type SuecaMigrationAction = 'exact' | 'migrated' | 'reset-hand' | 'rejected';

export interface SuecaMigrationResult {
  ok: boolean;
  action: SuecaMigrationAction;
  reason: string;
  migratedFrom: 1 | 2 | 'legacy' | 'unknown';
  /** Present when ok. */
  state?: GameState;
}

/**
 * Migration-only: map legacy Method × absolute DealingDirection → DealAlignment.
 * Returns null for ambiguous/non-product combinations.
 */
export function resolveLegacyDealAlignment(
  playDirection: PlayDirection,
  method: DealingMethod,
  dealingDirection: DealingDirection
): DealAlignment | null {
  const play = playDirection === 'left' ? 'left' : 'right';
  const dir = dealingDirection === 'left' ? 'left' : 'right';
  if (method === 'A' && dir === play) return 'same';
  if (method === 'B' && dir === oppositeDirection(play)) return 'opposite';
  return null;
}

function isSeat(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 3;
}

function isPlayDirection(v: unknown): v is PlayDirection {
  return v === 'left' || v === 'right';
}

function isDealAlignment(v: unknown): v is DealAlignment {
  return v === 'same' || v === 'opposite';
}

function isBetweenHands(raw: Partial<GameState>): boolean {
  if (raw.waitingForRoundStart === true) return true;
  const players = Array.isArray(raw.players) ? raw.players : [];
  const handsEmpty =
    players.length === 0 || players.every((p) => !p?.hand || p.hand.length === 0);
  const trickEmpty = !Array.isArray(raw.currentTrick) || raw.currentTrick.length === 0;
  const notWaitingTrickEnd = raw.waitingForTrickEnd !== true;
  return handsEmpty && trickEmpty && notWaitingTrickEnd;
}

function isMidHand(raw: Partial<GameState>): boolean {
  if (raw.waitingForTrickEnd === true) return true;
  const trickLen = Array.isArray(raw.currentTrick) ? raw.currentTrick.length : 0;
  if (trickLen > 0) return true;
  const players = Array.isArray(raw.players) ? raw.players : [];
  return players.some((p) => (p?.hand?.length ?? 0) > 0);
}

/** Strip compatibility-only Method/Direction from canonical Sueca writes. */
function stripLegacyDealFields(state: GameState): void {
  delete state.dealingMethod;
  delete state.dealingDirection;
}

function applyResetHandBoundary(state: GameState): void {
  const play = state.playDirection === 'left' ? 'left' : 'right';
  const dealer = asSeat(state.dealerIndex);
  const leader = firstLeader(dealer, play);
  state.dealAlignment = 'same';
  state.waitingForRoundStart = true;
  state.waitingForTrickEnd = false;
  state.waitingForRoundEnd = false;
  state.currentTrick = [];
  state.playedCards = [];
  state.trumpSuit = null;
  state.trumpCard = null;
  state.lastTrickWinner = null;
  state.nextTrickLeader = null;
  state.isFirstTrick = true;
  state.currentPlayerIndex = leader;
  state.trickLeader = leader;
  state.players = state.players.map((p) => ({ ...p, hand: [] }));
  stripLegacyDealFields(state);
}

/**
 * Validate active-trick progression against playDirection.
 * Returns null if consistent / not applicable; otherwise a rejection reason.
 */
function validateActiveTrickProgression(state: GameState): string | null {
  if (state.waitingForRoundStart || state.waitingForRoundEnd || state.isGameOver) {
    return null;
  }
  if (state.waitingForTrickEnd) return null;
  const trickLen = state.currentTrick?.length ?? 0;
  if (trickLen < 0 || trickLen > 3) {
    return `invalid_trick_length:${trickLen}`;
  }
  if (!isSeat(state.trickLeader) || !isSeat(state.currentPlayerIndex) || !isSeat(state.dealerIndex)) {
    return 'invalid_seat_index';
  }
  if (trickLen === 0 && (state.players[0]?.hand?.length ?? 0) === 0) {
    // Empty table without wait flag — caller should have set waitingForRoundStart.
    return null;
  }
  const expected = seatAtOffset(
    asSeat(state.trickLeader),
    trickLen,
    state.playDirection === 'left' ? 'left' : 'right'
  );
  if (state.currentPlayerIndex !== expected) {
    return `current_player_mismatch:expected_${expected}_got_${state.currentPlayerIndex}`;
  }
  return null;
}

function validateSeats(state: Pick<GameState, 'dealerIndex' | 'currentPlayerIndex' | 'trickLeader'>): string | null {
  if (!isSeat(state.dealerIndex)) return 'invalid_dealerIndex';
  if (!isSeat(state.currentPlayerIndex)) return 'invalid_currentPlayerIndex';
  if (!isSeat(state.trickLeader)) return 'invalid_trickLeader';
  return null;
}

function ensurePlayers(raw: Partial<GameState>): GameState['players'] {
  const players = Array.isArray(raw.players) ? [...raw.players] : [];
  while (players.length < 4) {
    const i = players.length;
    players.push({
      id: `player_${i}`,
      name: `Player ${i + 1}`,
      hand: [],
      team: i % 2 === 0 ? 1 : 2,
      type: i === 0 ? 'human' : 'ai'
    });
  }
  return players.slice(0, 4).map((p, i) => ({
    id: p?.id ?? `player_${i}`,
    name: p?.name ?? `Player ${i + 1}`,
    hand: Array.isArray(p?.hand) ? p.hand : [],
    team: (p?.team === 2 ? 2 : 1) as 1 | 2,
    type: p?.type,
    status: p?.status
  }));
}

function baseFromPartial(raw: Partial<GameState>): GameState {
  const players = ensurePlayers(raw);
  return {
    players,
    currentPlayerIndex: isSeat(raw.currentPlayerIndex) ? raw.currentPlayerIndex : 0,
    dealerIndex: isSeat(raw.dealerIndex) ? raw.dealerIndex : 0,
    trumpSuit: raw.trumpSuit ?? null,
    trumpCard: raw.trumpCard ?? null,
    currentTrick: Array.isArray(raw.currentTrick) ? raw.currentTrick : [],
    trickLeader: isSeat(raw.trickLeader) ? raw.trickLeader : 0,
    scores: {
      team1: raw.scores?.team1 ?? 0,
      team2: raw.scores?.team2 ?? 0
    },
    gameScore: {
      team1: raw.gameScore?.team1 ?? 0,
      team2: raw.gameScore?.team2 ?? 0
    },
    completedPentes: Array.isArray(raw.completedPentes) ? raw.completedPentes : [],
    round: typeof raw.round === 'number' && raw.round >= 1 ? raw.round : 1,
    isGameOver: raw.isGameOver ?? false,
    winner: raw.winner ?? null,
    lastTrickWinner: raw.lastTrickWinner ?? null,
    waitingForTrickEnd: raw.waitingForTrickEnd ?? false,
    nextTrickLeader: raw.nextTrickLeader ?? null,
    isFirstTrick: raw.isFirstTrick ?? true,
    playDirection: 'right',
    dealAlignment: 'same',
    waitingForRoundStart: raw.waitingForRoundStart === true,
    waitingForRoundEnd: raw.waitingForRoundEnd ?? false,
    waitingForGameStart: raw.waitingForGameStart ?? false,
    playedCards: Array.isArray(raw.playedCards) ? raw.playedCards : [],
    isPaused: raw.isPaused ?? false,
    playerName: raw.playerName ?? players[0]?.name ?? 'Player 1',
    aiDifficulty: raw.aiDifficulty === 'easy' || raw.aiDifficulty === 'hard' ? raw.aiDifficulty : 'medium',
    partnerSignals: Array.isArray(raw.partnerSignals) ? raw.partnerSignals : [],
    variant: 'sueca',
    schemaVersion: SUECA_STATE_SCHEMA_VERSION,
    ...(raw.nextRoundValue !== undefined ? { nextRoundValue: raw.nextRoundValue } : {}),
    ...(raw.pendingRoundMultiplier !== undefined
      ? { pendingRoundMultiplier: raw.pendingRoundMultiplier }
      : {}),
    ...(raw.isMultiplayer !== undefined ? { isMultiplayer: raw.isMultiplayer } : {}),
    ...(raw.sessionId !== undefined ? { sessionId: raw.sessionId } : {}),
    ...(raw.localPlayerIndex !== undefined ? { localPlayerIndex: raw.localPlayerIndex } : {}),
    ...(raw.variantState !== undefined ? { variantState: raw.variantState } : {})
  };
}

/**
 * Migrate / validate Sueca persisted GameState to schema v2.
 * Idempotent for already-valid v2 states.
 */
export function migrateSuecaPersistedState(
  raw: Partial<GameState> | null | undefined
): SuecaMigrationResult {
  if (!raw || typeof raw !== 'object') {
    return {
      ok: false,
      action: 'rejected',
      reason: 'empty_or_invalid_payload',
      migratedFrom: 'unknown'
    };
  }

  const schemaVersion =
    typeof raw.schemaVersion === 'number' ? raw.schemaVersion : undefined;
  const isV2 = schemaVersion === SUECA_STATE_SCHEMA_VERSION;

  // --- V2 exact path ---
  if (isV2) {
    if (!isPlayDirection(raw.playDirection) || !isDealAlignment(raw.dealAlignment)) {
      return {
        ok: false,
        action: 'rejected',
        reason: 'v2_missing_canonical_fields',
        migratedFrom: 2
      };
    }
    if (!isSeat(raw.dealerIndex) || !isSeat(raw.currentPlayerIndex) || !isSeat(raw.trickLeader)) {
      return {
        ok: false,
        action: 'rejected',
        reason: 'v2_invalid_seat_index',
        migratedFrom: 2
      };
    }
    if (raw.waitingForRoundStart === undefined) {
      return {
        ok: false,
        action: 'rejected',
        reason: 'v2_missing_waitingForRoundStart',
        migratedFrom: 2
      };
    }

    const state = cloneGameState(baseFromPartial(raw));
    state.schemaVersion = SUECA_STATE_SCHEMA_VERSION;
    state.playDirection = raw.playDirection;
    state.dealAlignment = raw.dealAlignment;
    state.waitingForRoundStart = raw.waitingForRoundStart === true;
    // Preserve seats exactly — do not ??0 rewrite.
    state.dealerIndex = raw.dealerIndex;
    state.currentPlayerIndex = raw.currentPlayerIndex;
    state.trickLeader = raw.trickLeader;
    stripLegacyDealFields(state);

    const seatErr = validateSeats(state);
    if (seatErr) {
      return { ok: false, action: 'rejected', reason: seatErr, migratedFrom: 2 };
    }
    const progErr = validateActiveTrickProgression(state);
    if (progErr) {
      return { ok: false, action: 'rejected', reason: progErr, migratedFrom: 2 };
    }

    return {
      ok: true,
      action: 'exact',
      reason: 'v2_exact',
      migratedFrom: 2,
      state
    };
  }

  // --- Legacy / pre-v2 ---
  const migratedFrom: 1 | 'legacy' = schemaVersion === 1 ? 1 : 'legacy';

  // Invalid / missing critical seats for mid-hand resume: reject (never invent 0).
  if (isMidHand(raw) && !isBetweenHands(raw)) {
    if (!isSeat(raw.dealerIndex) || !isSeat(raw.currentPlayerIndex) || !isSeat(raw.trickLeader)) {
      return {
        ok: false,
        action: 'rejected',
        reason: 'mid_hand_missing_seat_index',
        migratedFrom
      };
    }
  }

  if (
    raw.dealerIndex !== undefined &&
    !isSeat(raw.dealerIndex)
  ) {
    return { ok: false, action: 'rejected', reason: 'invalid_dealerIndex', migratedFrom };
  }
  if (
    raw.currentPlayerIndex !== undefined &&
    !isSeat(raw.currentPlayerIndex)
  ) {
    return {
      ok: false,
      action: 'rejected',
      reason: 'invalid_currentPlayerIndex',
      migratedFrom
    };
  }
  if (raw.trickLeader !== undefined && !isSeat(raw.trickLeader)) {
    return { ok: false, action: 'rejected', reason: 'invalid_trickLeader', migratedFrom };
  }

  // Session playDirection: explicit left/right wins; missing → RIGHT (legacy fixed ACW play).
  const play: PlayDirection = isPlayDirection(raw.playDirection)
    ? raw.playDirection
    : 'right';

  const method = (raw.dealingMethod === 'B' ? 'B' : 'A') as DealingMethod;
  const dir = (raw.dealingDirection === 'left' ? 'left' : 'right') as DealingDirection;

  let alignment: DealAlignment | null = isDealAlignment(raw.dealAlignment)
    ? raw.dealAlignment
    : resolveLegacyDealAlignment(play, method, dir);

  const ambiguousLegacy =
    alignment === null &&
    !isDealAlignment(raw.dealAlignment) &&
    ((method === 'A' && dir !== play) || (method === 'B' && dir === play));

  if (ambiguousLegacy) {
    if (isMidHand(raw) && !isBetweenHands(raw)) {
      return {
        ok: false,
        action: 'rejected',
        reason: `ambiguous_legacy_mid_hand:${method}+${dir}`,
        migratedFrom
      };
    }
    // Between hands / safe boundary: reset to SAME packaging.
    alignment = 'same';
    const state = baseFromPartial(raw);
    state.playDirection = play;
    state.dealAlignment = 'same';
    if (!isSeat(raw.dealerIndex)) {
      return { ok: false, action: 'rejected', reason: 'ambiguous_missing_dealer', migratedFrom };
    }
    state.dealerIndex = raw.dealerIndex;
    applyResetHandBoundary(state);
    state.schemaVersion = SUECA_STATE_SCHEMA_VERSION;
    return {
      ok: true,
      action: 'reset-hand',
      reason: `ambiguous_legacy_reset_hand:${method}+${dir}`,
      migratedFrom,
      state
    };
  }

  if (alignment === null) {
    alignment = 'same';
  }

  const state = baseFromPartial(raw);
  state.playDirection = play;
  state.dealAlignment = alignment;
  state.schemaVersion = SUECA_STATE_SCHEMA_VERSION;

  // Preserve known seats when present; otherwise between-hands defaults from dealer.
  if (isSeat(raw.dealerIndex)) state.dealerIndex = raw.dealerIndex;
  if (isSeat(raw.trickLeader)) state.trickLeader = raw.trickLeader;
  if (isSeat(raw.currentPlayerIndex)) state.currentPlayerIndex = raw.currentPlayerIndex;

  // Missing waitingForRoundStart — intentional migration, never blindly false.
  if (raw.waitingForRoundStart === undefined) {
    if (isMidHand(raw)) {
      state.waitingForRoundStart = false;
    } else {
      state.waitingForRoundStart = true;
      applyResetHandBoundary(state);
      stripLegacyDealFields(state);
      return {
        ok: true,
        action: 'migrated',
        reason: 'legacy_missing_waitingForRoundStart_safe_boundary',
        migratedFrom,
        state
      };
    }
  } else {
    state.waitingForRoundStart = raw.waitingForRoundStart === true;
  }

  stripLegacyDealFields(state);

  // If seats were missing entirely on a between-hands save, align leader to playDirection.
  if (
    state.waitingForRoundStart &&
    (!isSeat(raw.currentPlayerIndex) || !isSeat(raw.trickLeader))
  ) {
    const leader = firstLeader(asSeat(state.dealerIndex), state.playDirection);
    state.currentPlayerIndex = leader;
    state.trickLeader = leader;
  }

  const seatErr = validateSeats(state);
  if (seatErr) {
    return { ok: false, action: 'rejected', reason: seatErr, migratedFrom };
  }

  if (!state.waitingForRoundStart) {
    const progErr = validateActiveTrickProgression(state);
    if (progErr) {
      return { ok: false, action: 'rejected', reason: progErr, migratedFrom };
    }
  }

  return {
    ok: true,
    action: 'migrated',
    reason: isPlayDirection(raw.playDirection)
      ? `legacy_keep_play_${play}_align_${alignment}`
      : `legacy_default_right_align_${alignment}`,
    migratedFrom,
    state
  };
}

/** Stamp canonical v2 fields onto a live Sueca state before persist. */
export function stampSuecaSchemaV2(state: GameState): GameState {
  const next = cloneGameState(state);
  next.schemaVersion = SUECA_STATE_SCHEMA_VERSION;
  next.variant = next.variant ?? 'sueca';
  next.playDirection = next.playDirection === 'left' ? 'left' : 'right';
  next.dealAlignment = next.dealAlignment === 'opposite' ? 'opposite' : 'same';
  stripLegacyDealFields(next);
  return next;
}
