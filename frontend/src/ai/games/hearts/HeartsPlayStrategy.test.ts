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

function makeState(hand: Card[], trick: Card[] = []): GameState {
  return {
    players: [{ hand, name: 'P0', score: 0 }],
    currentTrick: trick,
  } as unknown as GameState;
}

const HEARTS_HAND = [
  makeCard('2', 'clubs'),
  makeCard('A', 'hearts'),
  makeCard('Q', 'spades'),
];

describe('HeartsPlayStrategy', () => {
  describe('easy — returns a valid index', () => {
    it('returns an index present in the hand', () => {
      const state = makeState(HEARTS_HAND);
      const idx = chooseHeartsCard(makeAdapter(), state, 0, 'easy');
      expect(HEARTS_HAND[idx]).toBeDefined();
    });
  });

  describe('medium — when leading, avoids penalty cards if possible', () => {
    it('leads with non-penalty card when available', () => {
      // Hand: club (0 penalty), heart (penalty), Q♠ (big penalty)
      const state = makeState(HEARTS_HAND, []);
      const idx = chooseHeartsCard(makeAdapter(), state, 0, 'medium');
      // Lowest penalty card is index 0 (clubs)
      expect(idx).toBe(0);
    });
  });

  describe('medium — when following, dumps the highest-penalty card', () => {
    it('discards Q♠ (highest penalty) when following and all cards legal', () => {
      // Trick has already started with a clubs lead — following
      const trick = [makeCard('3', 'clubs')];
      const state = makeState(HEARTS_HAND, trick);
      const idx = chooseHeartsCard(makeAdapter(), state, 0, 'medium');
      // Q♠ has penalty 20, should be discarded first
      expect(HEARTS_HAND[idx]).toEqual(makeCard('Q', 'spades'));
    });
  });

  describe('returns -1 when no legal moves', () => {
    it('returns -1 if adapter allows no cards', () => {
      const state = makeState(HEARTS_HAND);
      const idx = chooseHeartsCard(makeAdapter(false), state, 0, 'medium');
      expect(idx).toBe(-1);
    });
  });
});
