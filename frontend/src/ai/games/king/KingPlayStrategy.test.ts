import { chooseKingPtCard } from './KingPlayStrategy';
import { GameAdapter } from '../../../models/games/GameAdapter';
import { Card, GameState } from '../../../types/game';
import { KingPtVariantState } from '../../../models/games/KingPtGame';

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

function makeKing(gameIndex = 0, contract: string | null = 'no_hearts'): KingPtVariantState {
  return {
    phase: 'negative',
    gameIndex,
    kohPlayerIndex: 0,
    contract,
    playerScores: [0, 0, 0, 0],
    lastRoundDeltas: [0, 0, 0, 0],
    trickNumber: 0,
    tricksWonThisGame: [0, 0, 0, 0],
    festaOwnerIndex: 0,
    festaMode: null,
    festaPhase: null,
    auctionOrder: [],
    auctionTurnIndex: 0,
    bestBid: null,
    requestedBid: null,
  } as unknown as KingPtVariantState;
}

describe('KingPlayStrategy — chooseKingPtCard', () => {
  describe('easy — returns a valid index', () => {
    it('returns an index present in the hand', () => {
      const hand = [makeCard('2', 'clubs'), makeCard('A', 'hearts'), makeCard('K', 'spades')];
      const state = makeState(hand);
      const idx = chooseKingPtCard(makeAdapter(), state, 0, makeKing(), 'easy');
      expect(hand[idx]).toBeDefined();
    });
  });

  describe('medium — negative game when leading: avoids ♥ if alternatives exist', () => {
    it('does not lead ♥ when a non-heart is available', () => {
      // gameIndex=0 → negative phase; hand has one heart and one club
      const hand = [makeCard('A', 'hearts'), makeCard('2', 'clubs')];
      const state = makeState(hand, []);
      const king = makeKing(0, 'no_hearts');
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king, 'medium');
      expect(hand[idx].suit).not.toBe('hearts');
    });
  });

  describe('hard — positive game when following: wins with minimum card', () => {
    it('wins trick with lowest winning card', () => {
      // gameIndex=6 → positive phase; led 5♠, player has 7♠ and A♠ — picks 7
      const hand = [makeCard('7', 'spades'), makeCard('A', 'spades')];
      const trick = [makeCard('5', 'spades')];
      const state = makeState(hand, trick);
      const king = makeKing(6, null); // gameIndex >= 6 → positive
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king, 'hard');
      expect(hand[idx].rank).toBe('7');
    });
  });

  describe('returns -1 when no legal moves', () => {
    it('returns -1 if adapter allows no cards', () => {
      const hand = [makeCard('2', 'clubs')];
      const state = makeState(hand);
      const idx = chooseKingPtCard(makeAdapter(false), state, 0, makeKing(), 'medium');
      expect(idx).toBe(-1);
    });
  });

  describe('medium — positive phase when leading: chooses highest card', () => {
    it('leads with A over 2 in positive game', () => {
      const hand = [makeCard('2', 'clubs'), makeCard('A', 'clubs')];
      const state = makeState(hand, []);
      const king = makeKing(6, null); // positive phase
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king, 'medium');
      expect(hand[idx].rank).toBe('A');
    });
  });

  describe('medium — no_last_two: tricks 1-8 play freely, tricks 9-10 defensive', () => {
    it('trick 8 (trickNumber=7): leads low non-heart without full defensive', () => {
      const hand = [makeCard('K', 'clubs'), makeCard('2', 'clubs'), makeCard('A', 'hearts')];
      const state = makeState(hand, []);
      const king = { ...makeKing(0, 'no_last_two'), trickNumber: 7 };
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king as KingPtVariantState, 'medium');
      // Should avoid hearts and lead lowest non-heart (2♣ not K♣)
      expect(hand[idx].suit).not.toBe('hearts');
      expect(hand[idx].rank).toBe('2');
    });

    it('trick 9 (trickNumber=8): switches to defensive — avoids winning in-suit', () => {
      // Following with 3♥ and K♥ against a led 4♥ trick; defensive → plays 3♥ (lowest)
      const hand = [makeCard('K', 'hearts'), makeCard('3', 'hearts')];
      const trick = [makeCard('4', 'hearts')];
      const state = makeState(hand, trick);
      const king = { ...makeKing(0, 'no_last_two'), trickNumber: 8 };
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king as KingPtVariantState, 'medium');
      expect(hand[idx].rank).toBe('3');
    });
  });

  describe('medium — no_tricks: follows in-suit with lowest card', () => {
    it('plays lowest in-suit card to avoid winning trick', () => {
      // Led 5♠; player has 7♠ and A♠ — should play 7 (lowest), not A
      const hand = [makeCard('A', 'spades'), makeCard('7', 'spades')];
      const trick = [makeCard('5', 'spades')];
      const state = makeState(hand, trick);
      const king = makeKing(0, 'no_tricks');
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king, 'medium');
      expect(hand[idx].rank).toBe('7');
    });
  });
});
