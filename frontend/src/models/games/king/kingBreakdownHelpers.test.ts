import { Card } from '../../../types/game';
import { emptyBreakdown } from './kingBreakdown';
import { accumulateTrickBreakdown } from './kingBreakdownHelpers';

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
});
