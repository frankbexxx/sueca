import { Card, Suit } from '../types/game';
import { DiagnosticCardRef } from './types';

export function toCardRef(card: Card): DiagnosticCardRef {
  return {
    suit: card.suit,
    rank: card.rank,
    ...(card.id ? { id: card.id } : {})
  };
}

export function toCardRefs(cards: Card[]): DiagnosticCardRef[] {
  return cards.map(toCardRef);
}

export function handsFromPlayers(
  players: Array<{ hand?: Card[] }>
): DiagnosticCardRef[][] {
  return players.map((p) => toCardRefs(p.hand ?? []));
}

export function createDiagnosticLogId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `diag-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isSuit(value: unknown): value is Suit {
  return (
    value === 'clubs' ||
    value === 'diamonds' ||
    value === 'hearts' ||
    value === 'spades'
  );
}
