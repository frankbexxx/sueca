import {
  cardWouldWinTrickSpades,
  lowestCardIndex,
  partnerIsWinning,
  pickLowestWinningSpadeIndex,
  pickMinimumWinningIndex,
  playAvoidWinning,
  playWhenPartnerWinning,
} from './spadesTrickHelpers';
import { Card } from '../../../types/game';

function makeCard(rank: string, suit: string): Card {
  return { rank, suit } as Card;
}

describe('spadesTrickHelpers', () => {
  describe('cardWouldWinTrickSpades', () => {
    it('7♠ beats led 5♠', () => {
      const trick = [makeCard('5', 'spades')];
      expect(cardWouldWinTrickSpades(makeCard('7', 'spades'), trick, 0)).toBe(true);
      expect(cardWouldWinTrickSpades(makeCard('4', 'spades'), trick, 0)).toBe(false);
    });

    it('7♠ trumps led ♥', () => {
      const trick = [makeCard('A', 'hearts')];
      expect(cardWouldWinTrickSpades(makeCard('7', 'spades'), trick, 0)).toBe(true);
      expect(cardWouldWinTrickSpades(makeCard('2', 'hearts'), trick, 0)).toBe(false);
    });
  });

  describe('pickLowestWinningSpadeIndex', () => {
    it('returns lowest spade that wins', () => {
      const hand = [makeCard('7', 'spades'), makeCard('A', 'spades')];
      const valid = [0, 1];
      const trick = [makeCard('5', 'spades')];
      expect(pickLowestWinningSpadeIndex(valid, hand, trick, 0)).toBe(0);
    });
  });

  describe('playWhenPartnerWinning', () => {
    it('feeds low when possible', () => {
      const hand = [makeCard('K', 'hearts'), makeCard('2', 'hearts')];
      const valid = [0, 1];
      const state = {
        currentTrick: [makeCard('A', 'hearts')],
        trickLeader: 2,
      } as { currentTrick: Card[]; trickLeader: number };
      expect(playWhenPartnerWinning(valid, hand, state as never)).toBe(1);
    });

    it('forced win uses minimum winner', () => {
      const hand = [makeCard('7', 'spades'), makeCard('A', 'spades')];
      const valid = [0, 1];
      const state = {
        currentTrick: [makeCard('A', 'hearts')],
        trickLeader: 2,
      } as { currentTrick: Card[]; trickLeader: number };
      expect(playWhenPartnerWinning(valid, hand, state as never)).toBe(0);
    });
  });

  describe('playAvoidWinning', () => {
    it('sloughs non-winning card when bid met', () => {
      const hand = [makeCard('A', 'spades'), makeCard('2', 'clubs')];
      const valid = [0, 1];
      const trick = [makeCard('K', 'hearts')];
      const state = { currentTrick: trick, trickLeader: 1 } as never;
      expect(playAvoidWinning(valid, hand, state)).toBe(1);
    });
  });

  describe('partnerIsWinning', () => {
    it('true when partner seat wins trick', () => {
      const state = {
        currentTrick: [makeCard('A', 'hearts')],
        trickLeader: 2,
      } as never;
      expect(partnerIsWinning(0, state)).toBe(true);
      expect(partnerIsWinning(1, state)).toBe(false);
    });
  });

  describe('pickMinimumWinningIndex', () => {
    it('picks cheapest winner among all suits', () => {
      const hand = [makeCard('7', 'spades'), makeCard('A', 'spades')];
      const valid = [0, 1];
      const trick = [makeCard('K', 'hearts')];
      expect(pickMinimumWinningIndex(valid, hand, trick, 1)).toBe(0);
    });
  });

  describe('lowestCardIndex', () => {
    it('returns lowest rank index', () => {
      const hand = [makeCard('K', 'clubs'), makeCard('2', 'clubs')];
      expect(lowestCardIndex([0, 1], hand)).toBe(1);
    });
  });
});
