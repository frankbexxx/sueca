import { Card } from '../../../types/game';

export function formatCard(card: Card | null | undefined): string {
  if (!card) return '(none)';
  return card.id || `${card.rank}${card.suit[0]}`;
}

export function formatCardList(cards: Card[]): string {
  return cards.map((c) => formatCard(c)).join(', ');
}
