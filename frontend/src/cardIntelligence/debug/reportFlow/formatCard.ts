import { Card } from '../../../types/game';
import { RoundPlayEntry } from '../../shared/types/logEvents';

export function formatCard(card: Card | null | undefined): string {
  if (!card) return '(none)';
  return card.id || `${card.rank}${card.suit[0]}`;
}

export function formatCardList(cards: Card[]): string {
  if (cards.length === 0) return '';
  return cards.map((c) => formatCard(c)).join(', ');
}

export function formatPlayedCardsHistory(entries: RoundPlayEntry[]): string {
  if (entries.length === 0) return '';
  return entries.map((e) => `P${e.playerIndex}:${formatCard(e.card)}`).join(', ');
}
