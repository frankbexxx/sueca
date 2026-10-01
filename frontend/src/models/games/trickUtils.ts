import { Card, Suit } from '../../types/game';

/**
 * Standard 52-card rank. Spades, Hearts, and King trick motors use this.
 * Sueca does not — it keeps CARD_HIERARCHY (A > 7 > K > J > Q).
 */
export const STANDARD_52_RANK_ORDER: Record<string, number> = {
  '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8,
  '10': 9, 'J': 10, 'Q': 11, 'K': 12, 'A': 13
};

/** Rank strength for a 52-card game. Unknown ranks compare as 0, never as Sueca. */
export function standard52RankValue(rank: string): number {
  return STANDARD_52_RANK_ORDER[rank] ?? 0;
}

export function compareTrickCards(
  card1: Card,
  card2: Card,
  ledSuit: Suit,
  trump: Suit | null
): number {
  if (trump) {
    if (card1.suit === trump && card2.suit !== trump) return 1;
    if (card1.suit !== trump && card2.suit === trump) return -1;
  }
  if (card1.suit !== card2.suit) {
    return card1.suit === ledSuit ? 1 : -1;
  }
  return standard52RankValue(card1.rank) - standard52RankValue(card2.rank);
}

export function trickWinnerIndex(trick: Card[], trickLeader: number, trump: Suit | null): number {
  if (trick.length === 0) return trickLeader;
  const ledSuit = trick[0].suit;
  let highestCard = trick[0];
  let highestIndex = 0;
  for (let i = 1; i < trick.length; i++) {
    if (compareTrickCards(trick[i], highestCard, ledSuit, trump) > 0) {
      highestCard = trick[i];
      highestIndex = i;
    }
  }
  return (trickLeader + highestIndex) % 4;
}
