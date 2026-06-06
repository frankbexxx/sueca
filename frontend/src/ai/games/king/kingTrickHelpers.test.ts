import {
  isKingHearts,
  isPenaltyCardForContract,
  pickLowestRankIndex,
  pickPenaltyDumpVoid,
  pickSafeSlough,
  playKingPtNegativeFollow,
  playKingPtNegativeLead,
  tryPlayK02,
} from './kingTrickHelpers';
import { Card } from '../../../types/game';
import { KingPtVariantState } from '../../../models/games/KingPtGame';

function makeCard(rank: string, suit: string): Card {
  return { rank, suit } as Card;
}

function makeKing(contract: string | null = 'no_king_hearts'): KingPtVariantState {
  return {
    gameIndex: 0,
    contract,
  } as KingPtVariantState;
}

describe('kingTrickHelpers', () => {
  describe('isKingHearts', () => {
    it('identifies K♥', () => {
      expect(isKingHearts(makeCard('K', 'hearts'))).toBe(true);
      expect(isKingHearts(makeCard('K', 'spades'))).toBe(false);
    });
  });

  describe('isPenaltyCardForContract', () => {
    it('flags hearts under no_hearts', () => {
      expect(isPenaltyCardForContract(makeCard('5', 'hearts'), 'no_hearts')).toBe(true);
      expect(isPenaltyCardForContract(makeCard('2', 'clubs'), 'no_hearts')).toBe(false);
    });

    it('flags queens under no_queens', () => {
      expect(isPenaltyCardForContract(makeCard('Q', 'spades'), 'no_queens')).toBe(true);
      expect(isPenaltyCardForContract(makeCard('J', 'spades'), 'no_queens')).toBe(false);
    });
  });

  describe('tryPlayK02', () => {
    it('forces K♥ on lead for no_king_hearts', () => {
      const hand = [makeCard('K', 'hearts'), makeCard('3', 'hearts')];
      const valid = [0, 1];
      const player = { hand } as { hand: Card[] };
      const idx = tryPlayK02(valid, hand, player, null, makeKing('no_king_hearts'));
      expect(idx).toBe(0);
    });

    it('forces K♥ when void off-suit', () => {
      const hand = [makeCard('K', 'hearts'), makeCard('2', 'clubs')];
      const valid = [0, 1];
      const player = { hand } as { hand: Card[] };
      const idx = tryPlayK02(valid, hand, player, 'spades', makeKing('no_king_hearts'));
      expect(idx).toBe(0);
    });

    it('returns null when in-suit follow is required', () => {
      const hand = [makeCard('K', 'hearts'), makeCard('5', 'spades')];
      const valid = [0, 1];
      const player = { hand } as { hand: Card[] };
      expect(tryPlayK02(valid, hand, player, 'spades', makeKing('no_king_hearts'))).toBeNull();
    });
  });

  describe('playKingPtNegativeLead', () => {
    it('K03 — leads non-♥ when available', () => {
      const hand = [makeCard('K', 'hearts'), makeCard('2', 'clubs')];
      const valid = [0, 1];
      const idx = playKingPtNegativeLead(valid, hand, 'no_hearts');
      expect(hand[idx].suit).toBe('clubs');
    });
  });

  describe('pickSafeSlough', () => {
    it('prefers non-penalty lowest rank', () => {
      const hand = [makeCard('Q', 'spades'), makeCard('4', 'clubs')];
      const valid = [0, 1];
      const idx = pickSafeSlough(valid, hand, 'no_queens');
      expect(hand[idx].rank).toBe('4');
    });
  });

  describe('pickPenaltyDumpVoid', () => {
    it('dumps penalty card when void', () => {
      const hand = [makeCard('5', 'hearts'), makeCard('2', 'clubs')];
      const valid = [0, 1];
      const idx = pickPenaltyDumpVoid(valid, hand, 'no_hearts');
      expect(hand[idx].suit).toBe('hearts');
    });

    it('falls back to safe slough when no penalty', () => {
      const hand = [makeCard('10', 'spades'), makeCard('4', 'clubs')];
      const valid = [0, 1];
      const idx = pickPenaltyDumpVoid(valid, hand, 'no_queens');
      expect(hand[idx].rank).toBe('4');
    });
  });

  describe('playKingPtNegativeFollow', () => {
    it('in-suit uses safe slough', () => {
      const hand = [makeCard('Q', 'hearts'), makeCard('5', 'hearts')];
      const valid = [0, 1];
      const idx = playKingPtNegativeFollow(valid, hand, 'no_queens', 'hearts');
      expect(hand[idx].rank).toBe('5');
    });

    it('void dumps heart penalty under no_hearts', () => {
      const hand = [makeCard('5', 'hearts'), makeCard('2', 'clubs')];
      const valid = [0, 1];
      const idx = playKingPtNegativeFollow(valid, hand, 'no_hearts', 'spades');
      expect(hand[idx].suit).toBe('hearts');
    });
  });

  describe('pickLowestRankIndex', () => {
    it('picks lowest rank', () => {
      const hand = [makeCard('K', 'clubs'), makeCard('2', 'clubs')];
      expect(pickLowestRankIndex([0, 1], hand)).toBe(1);
    });
  });
});
