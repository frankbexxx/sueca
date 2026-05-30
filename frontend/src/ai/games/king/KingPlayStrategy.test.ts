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
});
