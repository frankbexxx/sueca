import { Card } from '../../../types/game';
import { emptyBreakdown } from './kingBreakdown';
import {
  accumulateSyntheticAllNegativesBreakdown,
  accumulateTrickBreakdown
} from './kingBreakdownHelpers';

const c = (rank: Card['rank'], suit: Card['suit'], id: string): Card => ({
  rank,
  suit,
  id
});

describe('kingBreakdownHelpers penalty cards', () => {
  it('stores hearts taken by winner in no_hearts', () => {
    const breakdown = emptyBreakdown();
    const trick = [c('3', 'hearts', 'h3'), c('5', 'clubs', 'c5')];
    accumulateTrickBreakdown(breakdown, 'no_hearts', trick, 1, 2);
    expect(breakdown.heartsTaken[2]).toBe(1);
    expect(breakdown.penaltyCardsTaken[2]).toHaveLength(1);
    expect(breakdown.penaltyCardsTaken[2][0].suit).toBe('hearts');
  });

  it('stores only K♥ in no_king_hearts', () => {
    const breakdown = emptyBreakdown();
    const trick = [c('K', 'hearts', 'kh'), c('3', 'hearts', 'h3')];
    accumulateTrickBreakdown(breakdown, 'no_king_hearts', trick, 1, 1);
    expect(breakdown.kingTakenBy).toBe(1);
    expect(breakdown.penaltyCardsTaken[1]).toHaveLength(1);
    expect(breakdown.penaltyCardsTaken[1][0].rank).toBe('K');
  });

  it('synthetic accumulator attributes multiple specials to the trick winner', () => {
    const breakdown = emptyBreakdown();
    const trick = [
      c('Q', 'spades', 'qs'),
      c('K', 'clubs', 'kc'),
      c('5', 'hearts', 'h5'),
      c('2', 'diamonds', 'd2')
    ];
    accumulateSyntheticAllNegativesBreakdown(breakdown, trick, 5, 3);
    const taken = breakdown.penaltyCardsTaken[3];
    expect(taken.some((card) => card.suit === 'hearts' && card.rank === '5')).toBe(true);
    expect(taken.some((card) => card.rank === 'Q' && card.suit === 'spades')).toBe(true);
    expect(taken.some((card) => card.rank === 'K' && card.suit === 'clubs')).toBe(true);
    expect(taken.length).toBeGreaterThanOrEqual(3);
    expect(breakdown.penaltyCardsTaken[0]).toHaveLength(0);
    expect(breakdown.penaltyCardsTaken[1]).toHaveLength(0);
    expect(breakdown.penaltyCardsTaken[2]).toHaveLength(0);
    expect(breakdown.heartsTaken[3]).toBe(1);
    expect(breakdown.queensTaken[3]).toBe(1);
    expect(breakdown.menTaken[3]).toBe(1);
    expect(breakdown.kingTakenBy).toBeNull();
  });
});
