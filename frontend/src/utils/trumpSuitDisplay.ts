import { Suit } from '../types/game';
import { SUIT_TO_EMOJI } from './cardMappings';

export type TrumpSuitTone = 'red' | 'black';

export interface TrumpSuitBadgeModel {
  suit: Suit;
  symbol: string;
  tone: TrumpSuitTone;
}

export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

export function getSuitSymbol(suit: Suit | null | undefined): string | null {
  if (!suit) return null;
  return SUIT_TO_EMOJI[suit] ?? null;
}

/**
 * Presentation model for the Sueca trump badge.
 * Returns null when trump is not yet defined (no false suit).
 */
export function resolveTrumpSuitBadge(
  trumpSuit: Suit | null | undefined
): TrumpSuitBadgeModel | null {
  if (!trumpSuit) return null;
  const symbol = getSuitSymbol(trumpSuit);
  if (!symbol) return null;
  return {
    suit: trumpSuit,
    symbol,
    tone: isRedSuit(trumpSuit) ? 'red' : 'black'
  };
}
