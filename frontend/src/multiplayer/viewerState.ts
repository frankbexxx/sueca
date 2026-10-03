/**
 * Multiplayer viewer transport DTO (Security Step 1A).
 *
 * Separate from engine {@link GameState}. One snapshot is safe for exactly one seat:
 * own held-card identities + opponent hand counts + public table state.
 *
 * Not a GameState subtype — do not pass to GameAdapter.restoreState.
 */

import type {
  AIDifficulty,
  Card,
  DealAlignment,
  GameState,
  GameVariant,
  PlayDirection,
  PlayerType,
  Suit
} from '../types/game';
import type { MatchResult } from '../types/matchResult';

/** Transport schema id for RTDB / clients. */
export const MULTIPLAYER_VIEWER_SCHEMA = 'mp-viewer-v1' as const;

export type MultiplayerViewerSchema = typeof MULTIPLAYER_VIEWER_SCHEMA;

/**
 * Per-seat public player row in a viewer snapshot.
 * `hand` is present only for the viewer's own seat.
 */
export interface MultiplayerViewerPlayer {
  id: string;
  name: string;
  team: 1 | 2;
  type?: PlayerType;
  /** Remaining cards in hand (count only for opponents). */
  handCount: number;
  /** Held-card identities — only for `viewerSeat`. Omitted for all other seats. */
  hand?: Card[];
}

/**
 * Sueca-only viewer-safe snapshot for one authenticated seat.
 * Allow-listed fields only — never a passthrough of {@link GameState}.
 */
export interface MultiplayerViewerState {
  schema: MultiplayerViewerSchema;
  variant: 'sueca';
  viewerSeat: number;

  players: MultiplayerViewerPlayer[];

  currentPlayerIndex: number;
  dealerIndex: number;
  trickLeader: number;
  trumpSuit: Suit | null;
  trumpCard: Card | null;
  currentTrick: Card[];
  lastTrickWinner: number | null;
  nextTrickLeader: number | null;

  scores: { team1: number; team2: number };
  gameScore: { team1: number; team2: number };
  completedPentes: Array<{ team1: number; team2: number }>;
  round: number;

  isGameOver: boolean;
  winner: 1 | 2 | null;
  matchResult?: MatchResult | null;

  waitingForTrickEnd: boolean;
  waitingForRoundStart: boolean;
  waitingForRoundEnd: boolean;
  waitingForGameStart: boolean;
  isFirstTrick: boolean;
  isPaused: boolean;

  playDirection: PlayDirection;
  dealAlignment: DealAlignment;
  schemaVersion?: number;

  /** Public cards already played this round. */
  playedCards: Card[];
  partnerSignals: Array<{ playerIndex: number; signal: string; trick: number }>;
  pendingRoundMultiplier?: number;
}

/**
 * Runtime structural guard: viewer DTO is not a GameState-shaped object.
 * Opponents must not carry `hand`; GameState always does for every player.
 */
export function isMultiplayerViewerState(value: unknown): value is MultiplayerViewerState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<MultiplayerViewerState> & { aiDifficulty?: AIDifficulty };
  if (v.schema !== MULTIPLAYER_VIEWER_SCHEMA) return false;
  if (v.variant !== 'sueca') return false;
  if (typeof v.viewerSeat !== 'number') return false;
  if (!Array.isArray(v.players) || v.players.length !== 4) return false;
  // GameState requires aiDifficulty; viewer DTO must not carry it.
  if ('aiDifficulty' in v) return false;
  for (let i = 0; i < 4; i++) {
    const p = v.players[i];
    if (!p || typeof p.handCount !== 'number') return false;
    if (i === v.viewerSeat) {
      if (!Array.isArray(p.hand)) return false;
    } else if ('hand' in p) {
      return false;
    }
  }
  return true;
}

/** Compile-time / structural: GameState is not assignable as viewer transport. */
export type AssertViewerNotGameState = GameState extends MultiplayerViewerState ? never : true;
