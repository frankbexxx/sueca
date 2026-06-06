import {
  cardWouldWinTrickHearts,
  heartsTrickPoints,
  isDangerousCard,
  penaltyScore,
  pickHighestPenaltyIndex,
  pickLowestPenaltyIndex,
  pickLowestRankIndex,
  playFollow,
  playLead,
} from './heartsTrickHelpers';
import { Card } from '../../../types/game';

function makeCard(rank: string, suit: string): Card {
  return { rank, suit } as Card;
}

describe('heartsTrickHelpers', () => {
  describe('heartsTrickPoints', () => {
    it('counts hearts and Q spades', () => {
      expect(heartsTrickPoints([makeCard('4', 'hearts'), makeCard('Q', 'spades')])).toBe(14);
      expect(heartsTrickPoints([makeCard('A', 'clubs'), makeCard('4', 'clubs')])).toBe(0);
    });
  });

  describe('cardWouldWinTrickHearts', () => {
    it('detects winner on club trick', () => {
      const trick = [makeCard('3', 'clubs')];
      expect(cardWouldWinTrickHearts(makeCard('A', 'clubs'), trick, 0)).toBe(true);
      expect(cardWouldWinTrickHearts(makeCard('2', 'clubs'), trick, 0)).toBe(false);
    });
  });

  describe('playFollow H11', () => {
    it('follows spades with lowest spade', () => {
      const hand = [makeCard('Q', 'spades'), makeCard('2', 'spades')];
      const valid = [0, 1];
      const state = {
        currentTrick: [makeCard('A', 'spades')],
        trickLeader: 1,
      } as { currentTrick: Card[]; trickLeader: number };
      expect(playFollow(valid, hand, state as never)).toBe(1);
    });
  });

  describe('playFollow H13', () => {
    it('cleans dangerous card as 4th player on 0-point trick', () => {
      const hand = [makeCard('Q', 'spades'), makeCard('2', 'diamonds')];
      const valid = [0, 1];
      const state = {
        currentTrick: [makeCard('A', 'clubs'), makeCard('4', 'clubs'), makeCard('5', 'clubs')],
        trickLeader: 0,
      } as { currentTrick: Card[]; trickLeader: number };
      expect(playFollow(valid, hand, state as never)).toBe(0);
    });
  });

  describe('playFollow H07', () => {
    it('sloughs off-suit when trick has points', () => {
      const hand = [makeCard('A', 'hearts'), makeCard('2', 'clubs')];
      const valid = [0, 1];
      const state = {
        currentTrick: [makeCard('K', 'hearts')],
        trickLeader: 1,
      } as { currentTrick: Card[]; trickLeader: number };
      expect(playFollow(valid, hand, state as never)).toBe(1);
    });
  });

  describe('playFollow H02', () => {
    it('dumps highest penalty off-suit on safe trick', () => {
      const hand = [makeCard('Q', 'spades'), makeCard('2', 'diamonds'), makeCard('A', 'hearts')];
      const valid = [0, 1, 2];
      const state = {
        currentTrick: [makeCard('3', 'clubs')],
        trickLeader: 2,
      } as { currentTrick: Card[]; trickLeader: number };
      expect(playFollow(valid, hand, state as never)).toBe(0);
    });
  });

  describe('penaltyScore and isDangerousCard', () => {
    it('ranks Q spades highest', () => {
      expect(penaltyScore(makeCard('Q', 'spades'))).toBeGreaterThan(penaltyScore(makeCard('A', 'hearts')));
      expect(isDangerousCard(makeCard('Q', 'spades'))).toBe(true);
      expect(isDangerousCard(makeCard('2', 'clubs'))).toBe(false);
    });
  });

  describe('playLead', () => {
    it('leads lowest penalty', () => {
      const hand = [makeCard('2', 'clubs'), makeCard('A', 'hearts')];
      expect(playLead([0, 1], hand, false)).toBe(0);
    });
  });

  describe('pick helpers', () => {
    const hand = [makeCard('K', 'spades'), makeCard('2', 'spades')];
    it('pickLowestRankIndex', () => {
      expect(pickLowestRankIndex([0, 1], hand)).toBe(1);
    });
    it('pickHighestPenaltyIndex', () => {
      const h = [makeCard('2', 'clubs'), makeCard('Q', 'spades')];
      expect(pickHighestPenaltyIndex([0, 1], h)).toBe(1);
    });
  });
});
