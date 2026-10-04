import { DealAlignment, DealingMethod } from './game';
import { SpadesBidType } from '../models/games/spades/spadesRules';

/**
 * Common transport metadata on every multiplayer action.
 * `seatIndex` / `uid` are Step 1B identity fields (optional for legacy peers).
 * Gameplay semantics remain in the discriminant fields below.
 */
type GameActionMeta = {
  clientId: string;
  at: number;
  /** Bound human seat from server-side seat↔uid claim. */
  seatIndex?: number;
  /** Firebase Anonymous Auth uid of the submitting client. */
  uid?: string;
};

/** Player intent pushed to Firebase; host validates and applies. */
export type GameAction =
  | ({ type: 'playCard'; playerIndex: number; cardIndex: number } & GameActionMeta)
  | ({ type: 'finishTrick'; playerIndex: number } & GameActionMeta)
  | ({
      type: 'startRound';
      /** Canonical per-hand packaging (preferred). */
      dealAlignment?: DealAlignment;
      /**
       * Compatibility-only incoming: legacy peers may still send Method A/B.
       * Outgoing Sueca must use dealAlignment. Host maps unambiguous Method at boundary.
       */
      dealingMethod?: DealingMethod;
    } & GameActionMeta)
  | ({ type: 'continueRound' } & GameActionMeta)
  | ({ type: 'confirmPass'; playerIndex: number } & GameActionMeta)
  | ({
      type: 'submitBid';
      playerIndex: number;
      bid: number;
      bidType: SpadesBidType;
    } & GameActionMeta)
  | ({ type: 'declineBlindNil'; playerIndex: number } & GameActionMeta);

export function createClientId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Intent payload before host adds clientId/at/identity (union-safe omit). */
export type GameActionInput = {
  [K in GameAction['type']]: Omit<
    Extract<GameAction, { type: K }>,
    'clientId' | 'at' | 'seatIndex' | 'uid'
  >;
}[GameAction['type']];
