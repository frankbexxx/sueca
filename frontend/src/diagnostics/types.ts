/**
 * REL-REPLAY-01 — diagnostic match-log schema (product history ≠ this).
 *
 * Capability target: LEVEL 1 (reconstruct sequence). Seeded RNG is prepared
 * but production shuffle/AI still use Math.random — do not claim LEVEL 2.
 */

import { RulesPresetId } from '../constants/rulesPresets';
import { AIDifficulty, Card, GameVariant, PlayerType, Suit } from '../types/game';

export const DIAGNOSTIC_SCHEMA_VERSION = 1 as const;
export const DIAGNOSTIC_EXPORT_KIND = 'suecao-diagnostic-match-logs' as const;

/** Soft retention for completed diagnostic logs (newest kept). */
export const MAX_DIAGNOSTIC_MATCH_LOGS = 50;

export type DiagnosticEventType =
  | 'MATCH_STARTED'
  | 'DEAL_COMPLETED'
  | 'AUCTION_ACTION'
  | 'FESTA_DECISION'
  | 'HEARTS_PASS'
  | 'SPADES_BID'
  | 'SUBGAME_STARTED'
  | 'SUBGAME_COMPLETED'
  | 'CARD_PLAYED'
  | 'TRICK_COMPLETED'
  | 'SCORE_UPDATED'
  | 'AI_DECISION'
  | 'MATCH_COMPLETED';

export interface DiagnosticPlayerSnapshot {
  index: number;
  name: string;
  type?: PlayerType;
  team?: 1 | 2;
}

export interface DiagnosticRngInfo {
  /** Declared algorithm for future LEVEL-2. Production today: Math.random. */
  algorithm: 'math-random' | 'mulberry32';
  seed: string;
  deterministic: boolean;
}

export interface DiagnosticCardRef {
  suit: Suit;
  rank: Card['rank'];
  id?: string;
}

export interface DiagnosticEventBase {
  seq: number;
  type: DiagnosticEventType;
  at: string;
}

export interface MatchStartedEvent extends DiagnosticEventBase {
  type: 'MATCH_STARTED';
  payload: {
    gameVariant: GameVariant;
    rulesPresetId: RulesPresetId | string;
    difficulty?: AIDifficulty;
  };
}

export interface DealCompletedEvent extends DiagnosticEventBase {
  type: 'DEAL_COMPLETED';
  payload: {
    hands: DiagnosticCardRef[][];
    trumpSuit?: Suit | null;
    trumpCard?: DiagnosticCardRef | null;
    dealerIndex?: number;
    roundIndex?: number;
  };
}

export interface AuctionActionEvent extends DiagnosticEventBase {
  type: 'AUCTION_ACTION';
  payload: {
    seat: number;
    action: string;
    bidType?: string;
    bidAmount?: number;
    minBidToBeat?: number;
    details?: Record<string, unknown>;
  };
}

export interface FestaDecisionEvent extends DiagnosticEventBase {
  type: 'FESTA_DECISION';
  payload: {
    action: string;
    seat?: number;
    details?: Record<string, unknown>;
  };
}

export interface HeartsPassEvent extends DiagnosticEventBase {
  type: 'HEARTS_PASS';
  payload: {
    passDirection: string;
    sourceSeat: number;
    destinationSeat: number;
    cards: DiagnosticCardRef[];
    roundIndex?: number;
  };
}

export interface SpadesBidEvent extends DiagnosticEventBase {
  type: 'SPADES_BID';
  payload: {
    seat: number;
    bid: number;
    bidType: string;
    nil: boolean;
    blindNil?: boolean;
    nilEnabled?: boolean;
    currentBidderAfter?: number;
    bidsComplete?: boolean;
    team1Bid?: number | null;
    team2Bid?: number | null;
    roundIndex?: number;
  };
}

export interface SubgameEvent extends DiagnosticEventBase {
  type: 'SUBGAME_STARTED' | 'SUBGAME_COMPLETED';
  payload: {
    subgameIndex?: number;
    kind?: string;
    scoreDelta?: number[];
    details?: Record<string, unknown>;
  };
}

export interface CardPlayedEvent extends DiagnosticEventBase {
  type: 'CARD_PLAYED';
  payload: {
    seat: number;
    card: DiagnosticCardRef;
    trickIndex: number | null;
    playerType?: PlayerType;
    legalCards?: DiagnosticCardRef[];
    aiDecisionSeq?: number;
  };
}

export interface TrickCompletedEvent extends DiagnosticEventBase {
  type: 'TRICK_COMPLETED';
  payload: {
    trickIndex: number | null;
    winnerSeat?: number | null;
    cards?: DiagnosticCardRef[];
  };
}

export interface ScoreUpdatedEvent extends DiagnosticEventBase {
  type: 'SCORE_UPDATED';
  payload: {
    scores: Record<string, unknown>;
  };
}

export interface AiDecisionEvent extends DiagnosticEventBase {
  type: 'AI_DECISION';
  payload: {
    seat: number;
    difficulty?: AIDifficulty | null;
    legalCards: DiagnosticCardRef[];
    chosenCard: DiagnosticCardRef;
    trickIndex: number | null;
    gameVariant: GameVariant;
    rulesPresetId?: string;
    /** Only fields the engine/AI actually exposed — never invented reasons. */
    context?: Record<string, unknown>;
  };
}

export interface MatchCompletedEvent extends DiagnosticEventBase {
  type: 'MATCH_COMPLETED';
  payload: {
    playerWon?: boolean;
    winner?: number | null;
    finalScores?: Record<string, unknown>;
    summary?: string;
  };
}

export type DiagnosticEvent =
  | MatchStartedEvent
  | DealCompletedEvent
  | AuctionActionEvent
  | FestaDecisionEvent
  | HeartsPassEvent
  | SpadesBidEvent
  | SubgameEvent
  | CardPlayedEvent
  | TrickCompletedEvent
  | ScoreUpdatedEvent
  | AiDecisionEvent
  | MatchCompletedEvent;

export interface DiagnosticFinalResult {
  playerWon?: boolean;
  winner?: number | null;
  finalScores?: Record<string, unknown>;
  summary?: string;
}

export interface DiagnosticMatchLog {
  schemaVersion: typeof DIAGNOSTIC_SCHEMA_VERSION;
  logId: string;
  startedAt: string;
  completedAt?: string;
  buildVersion?: string;
  gameVariant: GameVariant;
  rulesPresetId: string;
  difficulty?: AIDifficulty;
  rng: DiagnosticRngInfo;
  players: DiagnosticPlayerSnapshot[];
  localPlayerIndex?: number;
  /** Dealt hands at DEAL_COMPLETED (canonical seats 0–3). */
  initialHands?: DiagnosticCardRef[][];
  trumpSuit?: Suit | null;
  events: DiagnosticEvent[];
  finalResult?: DiagnosticFinalResult;
  /** Honest capability tag for consumers. */
  replayLevel: 0 | 1 | 2 | 3;
}

export interface DiagnosticExportEnvelope {
  kind: typeof DIAGNOSTIC_EXPORT_KIND;
  schemaVersion: typeof DIAGNOSTIC_SCHEMA_VERSION;
  exportedAt: string;
  buildVersion?: string;
  anonymizePlayers: boolean;
  logCount: number;
  logs: DiagnosticMatchLog[];
  /** Documented capability — do not overclaim. */
  replayLevelClaim: 0 | 1 | 2 | 3;
  notes?: string[];
}
