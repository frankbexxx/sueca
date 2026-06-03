import { Card, GameVariant } from '../../../types/game';
import { LOG_SCHEMA_VERSION } from './logEvents';

/** Types only — persistence in IMPLEMENTATION_2_ROUND_HISTORY */
export interface TrickEndEvent {
  eventType: 'trick_end';
  eventId: string;
  gameId: string;
  sessionId: string;
  timestamp: string;
  variant: GameVariant;
  roundIndex: number;
  trickIndex: number;
  trickCards: Card[];
  trickWinner: number;
  trickPoints: number;
  schemaVersion: typeof LOG_SCHEMA_VERSION;
}
