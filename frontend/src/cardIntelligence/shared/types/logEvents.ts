import {
  AIDifficulty,
  Card,
  GameVariant,
  PlayerType,
  Suit,
} from '../../../types/game';
import { VariantLogFields } from './variantLogFields';

export const LOG_SCHEMA_VERSION = '3.0.0' as const;

export type LogSource = 'live_game' | 'replay' | 'fixture' | 'test';

export type LogClassification = 'unknown';

export interface ScoreSnapshot {
  raw: Record<string, unknown>;
}

export interface RoundPlayEntry {
  roundIndex: number;
  trickIndex: number | null;
  turnIndex: number;
  playerIndex: number;
  card: Card;
}

export interface CardDecisionLogEvent {
  eventId: string;
  gameId: string;
  sessionId: string;
  timestamp: string;

  variant: GameVariant;
  mode: string | null;
  contract: string | null;
  roundIndex: number;
  trickIndex: number | null;
  turnIndex: number;

  playerIndex: number;
  playerType: PlayerType;
  difficulty: AIDifficulty | null;

  handBefore: Card[];
  legalMoves: Card[];
  chosenCard: Card;

  trickBefore: Card[];
  trickAfter: Card[];
  trumpSuit: Suit | null;
  ledSuit: Suit | null;
  currentWinnerBefore: number | null;
  currentWinnerAfter: number | null;

  roundPlayHistory: RoundPlayEntry[];

  scoreBefore: ScoreSnapshot;
  scoreAfter: ScoreSnapshot;

  metricsCandidateIds: string[];
  fixtureCandidateIds: string[];

  classification: LogClassification;
  reason: null;

  source: LogSource;
  aiSource: null;

  schemaVersion: typeof LOG_SCHEMA_VERSION;

  variantFields: VariantLogFields;
}

export interface LogSessionMeta {
  sessionId: string;
  gameId: string;
  variant: GameVariant;
  startedAt: string;
  endedAt: string | null;
  eventCount: number;
  schemaVersion: typeof LOG_SCHEMA_VERSION;
  source: LogSource;
  isMultiplayer: boolean;
}
