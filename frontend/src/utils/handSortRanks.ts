import { GameVariant, Rank } from '../types/game';

const SUECA_HAND_SORT_RANK: Record<Rank, number> = {
  '2': 1,
  '3': 2,
  '4': 3,
  '5': 4,
  '6': 5,
  '7': 12,
  '8': 6,
  '9': 7,
  '10': 8,
  Q: 9,
  J: 10,
  K: 11,
  A: 13
};

const STANDARD_HAND_SORT_RANK: Record<Rank, number> = {
  '2': 1,
  '3': 2,
  '4': 3,
  '5': 4,
  '6': 5,
  '7': 6,
  '8': 7,
  '9': 8,
  '10': 9,
  Q: 11,
  J: 10,
  K: 12,
  A: 13
};

export function handSortRankValue(rank: Rank, variant: GameVariant): number {
  const table = variant === 'sueca' ? SUECA_HAND_SORT_RANK : STANDARD_HAND_SORT_RANK;
  return table[rank] ?? 0;
}
