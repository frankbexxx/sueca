import { chooseHeartsCard } from './HeartsPlayStrategy';
import { GameAdapter } from '../../../models/games/GameAdapter';
import { Card, GameState } from '../../../types/game';

function makeCard(rank: string, suit: string): Card {
  return { rank, suit } as Card;
}

function makeAdapter(allLegal = true): GameAdapter {
  return {
    canPlayCard: () => allLegal,
  } as unknown as GameAdapter;
}

function makeState(
  hand: Card[],
  trick: Card[] = [],
  trickLeader = 0
): GameState {
  return {
    players: [{ hand, name: 'P0', score: 0 }],
    currentTrick: trick,
    trickLeader,
  } as unknown as GameState;
}

const HEARTS_HAND = [
  makeCard('2', 'clubs'),
  makeCard('A', 'hearts'),
  makeCard('Q', 'spades'),
];

describe('HeartsPlayStrategy', () => {
  describe('T7 — easy returns a valid index', () => {
    it('returns an index present in the hand', () => {
      const state = makeState(HEARTS_HAND);
      const idx = chooseHeartsCard(makeAdapter(), state, 0, 'easy');
      expect(HEARTS_HAND[idx]).toBeDefined();
    });
  });

  describe('T5 — lead lowest penalty (medium + hard)', () => {
    it.each(['medium', 'hard'] as const)('%s leads 2♣ over K♥ when both legal', (difficulty) => {
      const hand = [makeCard('2', 'clubs'), makeCard('K', 'hearts')];
      const state = makeState(hand, []);
      const idx = chooseHeartsCard(makeAdapter(), state, 0, difficulty);
      expect(hand[idx].rank).toBe('2');
    });
  });

  describe('medium — when leading, avoids penalty cards if possible', () => {
    it('leads with non-penalty card when available', () => {
      const state = makeState(HEARTS_HAND, []);
      const idx = chooseHeartsCard(makeAdapter(), state, 0, 'medium');
      expect(idx).toBe(0);
    });
  });

  describe('T1 — H07 avoid winning penalizing trick (medium + hard)', () => {
    it.each(['medium', 'hard'] as const)('%s sloughs 2♣ instead of winning with A♥', (difficulty) => {
      const hand = [makeCard('A', 'hearts'), makeCard('2', 'clubs')];
      const trick = [makeCard('K', 'hearts')];
      const state = makeState(hand, trick, 1);
      const idx = chooseHeartsCard(makeAdapter(), state, 0, difficulty);
      expect(hand[idx].rank).toBe('2');
    });
  });

  describe('T2 — H13 clean dangerous as 4th player (medium + hard)', () => {
    it.each(['medium', 'hard'] as const)('%s sloughs Q♠ on 0-point trick', (difficulty) => {
      const hand = [makeCard('Q', 'spades'), makeCard('2', 'diamonds')];
      const trick = [makeCard('A', 'clubs'), makeCard('4', 'clubs'), makeCard('5', 'clubs')];
      const state = makeState(hand, trick, 0);
      const idx = chooseHeartsCard(makeAdapter(), state, 0, difficulty);
      expect(hand[idx].rank).toBe('Q');
      expect(hand[idx].suit).toBe('spades');
    });
  });

  describe('T3 — H11 follow spades low (medium + hard)', () => {
    it.each(['medium', 'hard'] as const)('%s plays 2♠ not Q♠ when spades led', (difficulty) => {
      const hand = [makeCard('Q', 'spades'), makeCard('2', 'spades')];
      const trick = [makeCard('A', 'spades')];
      const state = makeState(hand, trick, 1);
      const idx = chooseHeartsCard(makeAdapter(), state, 0, difficulty);
      expect(hand[idx].rank).toBe('2');
    });
  });

  describe('T4 — H02 dump Q♠ off-suit on club lead (regression)', () => {
    it('discards Q♠ when following club lead with void', () => {
      const trick = [makeCard('3', 'clubs')];
      const state = makeState(HEARTS_HAND, trick, 2);
      const idx = chooseHeartsCard(makeAdapter(), state, 0, 'medium');
      expect(HEARTS_HAND[idx]).toEqual(makeCard('Q', 'spades'));
    });
  });

  describe('T6 — H07 do not win with K♥ if 2♠ loses', () => {
    it.each(['medium', 'hard'] as const)('%s avoids K♥ when trick has hearts', (difficulty) => {
      const hand = [makeCard('K', 'hearts'), makeCard('2', 'spades')];
      const trick = [makeCard('4', 'hearts'), makeCard('5', 'hearts')];
      const state = makeState(hand, trick, 0);
      const idx = chooseHeartsCard(makeAdapter(), state, 0, difficulty);
      expect(hand[idx].suit).toBe('spades');
    });
  });

  describe('T8 — hard lead non-hearts smoke', () => {
    it('prefers non-heart lead when available', () => {
      const hand = [makeCard('2', 'clubs'), makeCard('3', 'hearts')];
      const state = makeState(hand, []);
      const idx = chooseHeartsCard(makeAdapter(), state, 0, 'hard');
      expect(hand[idx].suit).toBe('clubs');
    });
  });

  describe('T9 — returns -1 when no legal moves', () => {
    it('returns -1 if adapter allows no cards', () => {
      const state = makeState(HEARTS_HAND);
      const idx = chooseHeartsCard(makeAdapter(false), state, 0, 'medium');
      expect(idx).toBe(-1);
    });
  });

  describe('T10 — medium/hard always return legal index', () => {
    it.each(['medium', 'hard'] as const)('%s picks from valid indices', (difficulty) => {
      const hand = [
        makeCard('2', 'clubs'),
        makeCard('5', 'hearts'),
        makeCard('9', 'diamonds'),
        makeCard('J', 'spades'),
      ];
      const state = makeState(hand, [makeCard('3', 'clubs')], 0);
      const idx = chooseHeartsCard(makeAdapter(), state, 0, difficulty);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(hand.length);
      expect(hand[idx]).toBeDefined();
    });
  });
});
