import {
  cardWouldWinTrickKing,
  isKingHearts,
  isPenaltyCardForContract,
  partitionByWouldWin,
  pickHighestRankIndex,
  pickLowestRankIndex,
  playNoHeartsNegative,
  playToUnloadWhileLosing,
  tryPlayK02,
} from './kingTrickHelpers';
import { Card, GameState } from '../../../types/game';
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

function makeState(hand: Card[], trick: Card[] = [], trickLeader = 0): GameState {
  return {
    players: [{ hand, name: 'P0', score: 0 }],
    currentTrick: trick,
    trickLeader,
  } as unknown as GameState;
}

/** Player 0 is next to play when trick has `trick.length` cards. */
function leaderForPlayer0(trickLength: number): number {
  return (4 - trickLength) % 4;
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
  });

  describe('tryPlayK02', () => {
    it('forces K♥ on lead for no_king_hearts', () => {
      const hand = [makeCard('K', 'hearts'), makeCard('3', 'hearts')];
      const valid = [0, 1];
      const player = { hand } as { hand: Card[] };
      const idx = tryPlayK02(valid, hand, player, null, makeKing('no_king_hearts'));
      expect(idx).toBe(0);
    });
  });

  describe('cardWouldWinTrickKing', () => {
    it('detects winner on spade trick', () => {
      const trick = [makeCard('5', 'spades')];
      const leader = leaderForPlayer0(1);
      expect(cardWouldWinTrickKing(makeCard('A', 'spades'), trick, leader, 0)).toBe(true);
      expect(cardWouldWinTrickKing(makeCard('7', 'spades'), trick, leader, 0)).toBe(true);
    });

    it('detects loser when higher card already winning', () => {
      const trick = [makeCard('K', 'spades')];
      const leader = leaderForPlayer0(1);
      expect(cardWouldWinTrickKing(makeCard('7', 'spades'), trick, leader, 0)).toBe(false);
    });
  });

  describe('playToUnloadWhileLosing', () => {
    it('plays highest card among losers', () => {
      const hand = [makeCard('3', 'spades'), makeCard('7', 'spades')];
      const trick = [makeCard('K', 'spades')];
      const leader = leaderForPlayer0(1);
      const idx = playToUnloadWhileLosing([0, 1], hand, trick, leader, 0);
      expect(hand[idx].rank).toBe('7');
    });

    it('plays lowest winner when forced to win', () => {
      const hand = [makeCard('7', 'spades'), makeCard('A', 'spades')];
      const trick = [makeCard('5', 'spades')];
      const leader = leaderForPlayer0(1);
      const idx = playToUnloadWhileLosing([0, 1], hand, trick, leader, 0);
      expect(hand[idx].rank).toBe('7');
    });
  });

  describe('partitionByWouldWin', () => {
    it('splits winners and losers', () => {
      const hand = [makeCard('7', 'spades'), makeCard('A', 'spades')];
      const trick = [makeCard('K', 'spades')];
      const leader = leaderForPlayer0(1);
      const { winners, losers } = partitionByWouldWin([0, 1], hand, trick, leader, 0);
      expect(winners).toEqual([1]);
      expect(losers).toEqual([0]);
    });
  });

  describe('playNoHeartsNegative', () => {
    it('void on heartless trick dumps highest heart', () => {
      const hand = [makeCard('5', 'hearts'), makeCard('K', 'hearts'), makeCard('2', 'clubs')];
      const trick = [makeCard('A', 'spades')];
      const leader = leaderForPlayer0(1);
      const state = makeState(hand, trick, leader);
      const idx = playNoHeartsNegative([0, 1, 2], hand, state, 0, makeKing('no_hearts'));
      expect(hand[idx].suit).toBe('hearts');
      expect(hand[idx].rank).toBe('K');
    });
  });

  describe('pickHighestRankIndex / pickLowestRankIndex', () => {
    it('pick highest and lowest', () => {
      const hand = [makeCard('2', 'clubs'), makeCard('K', 'clubs')];
      expect(pickLowestRankIndex([0, 1], hand)).toBe(0);
      expect(pickHighestRankIndex([0, 1], hand)).toBe(1);
    });
  });
});
