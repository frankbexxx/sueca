import { chooseSpadesCard } from './SpadesPlayStrategy';
import { GameAdapter } from '../../../models/games/GameAdapter';
import { Card, GameState } from '../../../types/game';
import { SpadesVariantState } from '../../../models/games/SpadesGame';

function makeCard(rank: string, suit: string): Card {
  return { rank, suit } as Card;
}

function makeAdapter(allLegal = true): GameAdapter {
  return {
    canPlayCard: () => allLegal,
  } as unknown as GameAdapter;
}

function makeState(hand: Card[], trick: Card[] = [], team = 1): GameState {
  return {
    players: [{ hand, name: 'P0', score: 0, team }],
    currentTrick: trick,
  } as unknown as GameState;
}

function makeSpades(team1Bid = 3, team1Tricks = 0, team2Bid = 3, team2Tricks = 0): SpadesVariantState {
  return {
    team1Bid,
    team1Tricks,
    team2Bid,
    team2Tricks,
    playerBids: [null, null, null, null],
    playerBidTypes: ['normal', 'normal', 'normal', 'normal'],
    bidLeaderIndex: 0,
    currentBidderIndex: 0,
    playerTricks: [0, 0, 0, 0],
    team1Bags: 0,
    team2Bags: 0,
    waitingForBids: false,
    spadesbroken: false,
    nilEnabled: false,
    blindNilEnabled: false,
  } as unknown as SpadesVariantState;
}

describe('SpadesPlayStrategy', () => {
  describe('easy — returns a valid index', () => {
    it('returns an index present in the hand', () => {
      const hand = [makeCard('2', 'clubs'), makeCard('A', 'spades'), makeCard('K', 'hearts')];
      const state = makeState(hand);
      const idx = chooseSpadesCard(makeAdapter(), state, 0, makeSpades(), 'easy');
      expect(hand[idx]).toBeDefined();
    });
  });

  describe('medium — leading without needing tricks: does not lead ♠ when other suits available', () => {
    it('prefers non-spade when leading and team has enough tricks', () => {
      // team1Bid=2, team1Tricks=2 → needTricks=false → picks non-spade
      const hand = [makeCard('2', 'clubs'), makeCard('A', 'spades')];
      const state = makeState(hand, [], 1);
      const spades = makeSpades(2, 2);
      const idx = chooseSpadesCard(makeAdapter(), state, 0, spades, 'medium');
      expect(hand[idx].suit).toBe('clubs');
    });
  });

  describe('hard — following in-suit: prefers winning with minimum card', () => {
    it('picks the lowest card that beats current trick', () => {
      // Trick led with 5♠ — player has 7♠ and A♠ (both beat 5), should pick 7
      const hand = [makeCard('7', 'spades'), makeCard('A', 'spades')];
      const trick = [makeCard('5', 'spades')];
      const state = makeState(hand, trick, 1);
      const spades = makeSpades(3, 0); // needs tricks
      const idx = chooseSpadesCard(makeAdapter(), state, 0, spades, 'hard');
      expect(hand[idx].rank).toBe('7');
    });
  });

  describe('returns -1 when no legal moves', () => {
    it('returns -1 if adapter allows no cards', () => {
      const hand = [makeCard('2', 'clubs')];
      const state = makeState(hand);
      const idx = chooseSpadesCard(makeAdapter(false), state, 0, makeSpades(), 'medium');
      expect(idx).toBe(-1);
    });
  });
});
