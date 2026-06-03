import { CARD_POINTS, Card, Rank, Suit } from '../../types/game';
import { TrickPlayRecord } from './types';

export function clonePlayRecord(entry: TrickPlayRecord): TrickPlayRecord {
  return {
    ...entry,
    card: { ...entry.card },
  };
}

export function snapshotPlayRecords(plays: TrickPlayRecord[]): TrickPlayRecord[] {
  return plays.map(clonePlayRecord);
}

export function acesSeenFromPlays(plays: TrickPlayRecord[]): Record<Suit, boolean> {
  const seen: Record<Suit, boolean> = {
    clubs: false,
    diamonds: false,
    hearts: false,
    spades: false,
  };
  for (const play of plays) {
    if (play.card.rank === 'A') {
      seen[play.card.suit] = true;
    }
  }
  return seen;
}

export function countSuitInPlays(plays: TrickPlayRecord[], suit: Suit): number {
  return plays.filter((p) => p.card.suit === suit).length;
}

export function countTrumpInPlays(plays: TrickPlayRecord[], trumpSuit: Suit | null): number {
  if (!trumpSuit) return 0;
  return countSuitInPlays(plays, trumpSuit);
}

export function hasQueenSpadesInTrick(trick: Card[]): boolean {
  return trick.some((c) => c.rank === 'Q' && c.suit === 'spades');
}

export function suecaTrickPoints(trick: Card[]): number {
  return trick.reduce((sum, card) => sum + CARD_POINTS[card.rank], 0);
}

/** Mirror HeartsGame private trickPoints — read-only duplicate */
export function heartsTrickPoints(trick: Card[]): number {
  return trick.reduce((sum, card) => {
    if (card.suit === 'hearts') return sum + 1;
    if (card.rank === 'Q' && card.suit === 'spades') return sum + 13;
    return sum;
  }, 0);
}

export function isManilha(card: Card, trumpSuit: Suit | null): boolean {
  if (!trumpSuit || card.suit !== trumpSuit) return false;
  const manilhaRanks: Rank[] = ['Q', 'J', '7', 'A'];
  return manilhaRanks.includes(card.rank);
}

export function importantCardsFromPlays(plays: TrickPlayRecord[], trumpSuit: Suit | null): Card[] {
  return plays
    .filter(
      (p) =>
        p.card.rank === 'A' ||
        CARD_POINTS[p.card.rank] > 0 ||
        isManilha(p.card, trumpSuit)
    )
    .map((p) => ({ ...p.card }));
}
