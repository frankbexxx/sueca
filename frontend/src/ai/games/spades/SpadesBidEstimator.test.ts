import { chooseSpadesBid, estimateHandBid } from './SpadesBidEstimator';
import { Card } from '../../../types/game';

function makeCard(rank: string, suit: string): Card {
  return { rank, suit } as Card;
}

describe('SpadesBidEstimator', () => {
  describe('easy — bid is always between 1 and 4', () => {
    it('returns bid in [1, 4] over 100 iterations', () => {
      const hand = [
        makeCard('2', 'clubs'),
        makeCard('3', 'hearts'),
        makeCard('4', 'diamonds'),
      ];
      for (let i = 0; i < 100; i++) {
        const { bid, bidType } = chooseSpadesBid(hand, false, false, 'easy');
        expect(bid).toBeGreaterThanOrEqual(1);
        expect(bid).toBeLessThanOrEqual(4);
        expect(bidType).toBe('normal');
      }
    });
  });

  describe('medium — A♠ + K♠ in hand → bid ≥ 2', () => {
    it('bids at least 2 with A♠ and K♠', () => {
      const hand = [
        makeCard('A', 'spades'),
        makeCard('K', 'spades'),
        makeCard('2', 'clubs'),
        makeCard('3', 'hearts'),
      ];
      const { bid } = chooseSpadesBid(hand, false, false, 'medium');
      expect(bid).toBeGreaterThanOrEqual(2);
    });
  });

  describe('hard — 4+ spades gives long-suit bonus over medium estimate', () => {
    it('bids at least as much as medium with long spade suit', () => {
      const hand = [
        makeCard('2', 'spades'),
        makeCard('3', 'spades'),
        makeCard('4', 'spades'),
        makeCard('5', 'spades'),
        makeCard('2', 'clubs'),
      ];
      const mediumBid = estimateHandBid(hand);
      const { bid: hardBid } = chooseSpadesBid(hand, false, false, 'hard');
      expect(hardBid).toBeGreaterThanOrEqual(Math.max(1, mediumBid));
    });
  });

  describe('estimateHandBid', () => {
    it('counts A♠ and K♠ as 1 each', () => {
      const hand = [makeCard('A', 'spades'), makeCard('K', 'spades')];
      expect(estimateHandBid(hand)).toBe(2);
    });

    it('counts A of other suits as 1', () => {
      const hand = [makeCard('A', 'hearts'), makeCard('A', 'clubs')];
      expect(estimateHandBid(hand)).toBe(2);
    });
  });
});
