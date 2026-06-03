import { Card, GameVariant, Suit } from '../../../types/game';
import { LOG_SCHEMA_VERSION, LogSource, RoundPlayEntry } from './logEvents';
import { TrickPlayRecord, TrickEndVariantFields } from '../../history/types';

/** Persisted trick-end event — schema final Impl 2 (replaces Impl 1 stub) */
export interface TrickEndEvent {
  eventType: 'trick_end';
  eventId: string;
  gameId: string;
  sessionId: string;
  timestamp: string;
  schemaVersion: typeof LOG_SCHEMA_VERSION;

  variant: GameVariant;
  roundIndex: number;
  trickIndex: number;

  trickLeader: number;
  trickCards: Card[];
  plays: TrickPlayRecord[];
  winnerIndex: number;

  ledSuit: Suit | null;
  trumpSuit: Suit | null;
  pointsInTrick: number | null;
  penaltiesInTrick: number | null;
  contractId: string | null;
  contractType: string | null;

  roundPlayHistory: RoundPlayEntry[];
  variantFields: TrickEndVariantFields;

  source: LogSource;
}
