import { DealingMethod } from './game';
import { SpadesBidType } from '../models/games/spades/spadesRules';

/** Player intent pushed to Firebase; host validates and applies. */
export type GameAction =
  | { type: 'playCard'; playerIndex: number; cardIndex: number; clientId: string; at: number }
  | { type: 'finishTrick'; playerIndex: number; clientId: string; at: number }
  | { type: 'startRound'; dealingMethod: DealingMethod; clientId: string; at: number }
  | { type: 'continueRound'; clientId: string; at: number }
  | { type: 'confirmPass'; playerIndex: number; clientId: string; at: number }
  | {
      type: 'submitBid';
      playerIndex: number;
      bid: number;
      bidType: SpadesBidType;
      clientId: string;
      at: number;
    };

export function createClientId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Intent payload before host adds clientId/at (union-safe omit). */
export type GameActionInput = {
  [K in GameAction['type']]: Omit<Extract<GameAction, { type: K }>, 'clientId' | 'at'>;
}[GameAction['type']];
