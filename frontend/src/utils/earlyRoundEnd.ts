import { KingNegativeContract } from '../models/games/king/kingContracts';
import { KingRoundBreakdown } from '../models/games/king/kingBreakdown';

export function sumCounts(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function canKingEndRoundEarly(
  gameIndex: number,
  contract: KingNegativeContract | null,
  breakdown: KingRoundBreakdown
): boolean {
  if (gameIndex >= 6 || !contract) return false;

  switch (contract) {
    case 'no_king_hearts':
      return breakdown.kingTakenBy !== null;
    case 'no_hearts':
      return sumCounts(breakdown.heartsTaken) >= 13;
    case 'no_queens':
      return sumCounts(breakdown.queensTaken) >= 4;
    case 'no_men':
      return sumCounts(breakdown.menTaken) >= 8;
    default:
      return false;
  }
}

export function canHeartsEndRoundEarly(heartsTakenCount: number, queenSpadesTaken: boolean): boolean {
  return queenSpadesTaken && heartsTakenCount >= 13;
}

export function countHeartsInTrick(cards: { suit: string }[]): number {
  return cards.filter((c) => c.suit === 'hearts').length;
}

export function trickHasQueenSpades(cards: { rank: string; suit: string }[]): boolean {
  return cards.some((c) => c.rank === 'Q' && c.suit === 'spades');
}
