import { pickAIPassCards } from './HeartsPassStrategy';
import { Card } from '../../../types/game';

function makeCard(rank: string, suit: string): Card {
  return { rank, suit } as Card;
}

const Q_SPADES = makeCard('Q', 'spades');
const K_HEARTS = makeCard('K', 'hearts');
const A_HEARTS = makeCard('A', 'hearts');
const TWO_CLUBS = makeCard('2', 'clubs');
const THREE_CLUBS = makeCard('3', 'clubs');
const FOUR_CLUBS = makeCard('4', 'clubs');
const FIVE_CLUBS = makeCard('5', 'clubs');

describe('HeartsPassStrategy', () => {
  describe('easy — always passes exactly 3 cards', () => {
    it('returns exactly 3 cards from a 7-card hand', () => {
      const hand = [Q_SPADES, K_HEARTS, A_HEARTS, TWO_CLUBS, THREE_CLUBS, FOUR_CLUBS, FIVE_CLUBS];
      const passed = pickAIPassCards(hand, 'easy');
      expect(passed).toHaveLength(3);
    });

    it('all returned cards are from the original hand', () => {
      const hand = [Q_SPADES, K_HEARTS, A_HEARTS, TWO_CLUBS, THREE_CLUBS, FOUR_CLUBS, FIVE_CLUBS];
      const passed = pickAIPassCards(hand, 'easy');
      passed.forEach((c) => expect(hand).toContain(c));
    });
  });

  describe('medium — Q♠ is always included when present', () => {
    it('passes Q♠ when it is in the hand', () => {
      const hand = [Q_SPADES, TWO_CLUBS, THREE_CLUBS, FOUR_CLUBS, FIVE_CLUBS, K_HEARTS, A_HEARTS];
      const passed = pickAIPassCards(hand, 'medium');
      expect(passed).toContain(Q_SPADES);
    });

    it('passes exactly 3 cards', () => {
      const hand = [Q_SPADES, TWO_CLUBS, THREE_CLUBS, FOUR_CLUBS, FIVE_CLUBS, K_HEARTS, A_HEARTS];
      const passed = pickAIPassCards(hand, 'medium');
      expect(passed).toHaveLength(3);
    });
  });

  describe('hard — passes all ♠ when ≤ 3 ♠ without Q♠ to create void', () => {
    it('passes all spades if ≤ 3 spades and no Q♠', () => {
      const twoSpades = makeCard('2', 'spades');
      const threeSpades = makeCard('3', 'spades');
      const hand = [twoSpades, threeSpades, TWO_CLUBS, THREE_CLUBS, FOUR_CLUBS, FIVE_CLUBS, K_HEARTS];
      const passed = pickAIPassCards(hand, 'hard');
      expect(passed).toContain(twoSpades);
      expect(passed).toContain(threeSpades);
    });

    it('falls back to medium (passes Q♠) when hand has Q♠', () => {
      const hand = [Q_SPADES, TWO_CLUBS, THREE_CLUBS, FOUR_CLUBS, FIVE_CLUBS, K_HEARTS, A_HEARTS];
      const passed = pickAIPassCards(hand, 'hard');
      expect(passed).toContain(Q_SPADES);
    });

    it('returns exactly 3 cards', () => {
      const twoSpades = makeCard('2', 'spades');
      const hand = [twoSpades, TWO_CLUBS, THREE_CLUBS, FOUR_CLUBS, FIVE_CLUBS, K_HEARTS, A_HEARTS];
      const passed = pickAIPassCards(hand, 'hard');
      expect(passed).toHaveLength(3);
    });
  });
});
