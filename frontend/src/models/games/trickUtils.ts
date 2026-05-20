import { Card, Suit } from '../../types/game';

const STANDARD_HIERARCHY: Record<string, number> = {
  '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8,
  '10': 9, 'J': 10, 'Q': 11, 'K': 12, 'A': 13
};

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
  return (STANDARD_HIERARCHY[card1.rank] || 0) - (STANDARD_HIERARCHY[card2.rank] || 0);
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
