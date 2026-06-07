import { chooseKingPtCard, chooseKingSimplifiedCard } from './KingPlayStrategy';
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

function makeState(hand: Card[], trick: Card[] = [], trickLeader = 0): GameState {
  return {
    players: [{ hand, name: 'P0', score: 0 }],
    currentTrick: trick,
    trickLeader,
  } as unknown as GameState;
}

/** Player 0 is next when trick has `trick.length` cards already played. */
function leaderForPlayer0(trickLength: number): number {
  return (4 - trickLength) % 4;
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
  describe('T7 — easy returns a valid index', () => {
    it('returns an index present in the hand', () => {
      const hand = [makeCard('2', 'clubs'), makeCard('A', 'hearts'), makeCard('K', 'spades')];
      const state = makeState(hand);
      const idx = chooseKingPtCard(makeAdapter(), state, 0, makeKing(), 'easy');
      expect(hand[idx]).toBeDefined();
    });
  });

  describe('T1 — K02 leads K♥ on first legal opportunity (medium + hard)', () => {
    it.each(['medium', 'hard'] as const)('%s plays K♥ over 3♥ on lead', (difficulty) => {
      const hand = [makeCard('K', 'hearts'), makeCard('3', 'hearts')];
      const state = makeState(hand, []);
      const king = makeKing(0, 'no_king_hearts');
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king, difficulty);
      expect(hand[idx].rank).toBe('K');
      expect(hand[idx].suit).toBe('hearts');
    });
  });

  describe('T2 — K02 plays K♥ when void off-suit', () => {
    it('medium plays K♥ on spade lead when void', () => {
      const hand = [makeCard('K', 'hearts'), makeCard('2', 'clubs')];
      const trick = [makeCard('5', 'spades')];
      const state = makeState(hand, trick, leaderForPlayer0(1));
      const king = makeKing(0, 'no_king_hearts');
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king, 'medium');
      expect(hand[idx].rank).toBe('K');
      expect(hand[idx].suit).toBe('hearts');
    });
  });

  describe('T3 — K03 does not lead ♥ when alternative exists (medium + hard)', () => {
    it.each(['medium', 'hard'] as const)('%s leads 2♣ over K♥', (difficulty) => {
      const hand = [makeCard('K', 'hearts'), makeCard('2', 'clubs')];
      const state = makeState(hand, []);
      const king = makeKing(0, 'no_hearts');
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king, difficulty);
      expect(hand[idx].suit).not.toBe('hearts');
      expect(hand[idx].rank).toBe('2');
    });
  });

  describe('T4 — K01 sloughs safe lowest off-suit when no penalty to dump', () => {
    it('plays 4♣ not K♠ when void under no_queens', () => {
      const hand = [makeCard('K', 'spades'), makeCard('4', 'clubs')];
      const trick = [makeCard('5', 'diamonds')];
      const state = makeState(hand, trick, leaderForPlayer0(1));
      const king = makeKing(0, 'no_queens');
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king, 'medium');
      expect(hand[idx].rank).toBe('4');
      expect(hand[idx].suit).toBe('clubs');
    });
  });

  describe('T5 — K00 dumps heart when void on losing heartless trick (16.1)', () => {
    it('plays K♥ over 2♣ under no_hearts', () => {
      const hand = [makeCard('K', 'hearts'), makeCard('2', 'clubs')];
      const trick = [makeCard('A', 'spades')];
      const state = makeState(hand, trick, leaderForPlayer0(1));
      const king = makeKing(0, 'no_hearts');
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king, 'medium');
      expect(hand[idx].suit).toBe('hearts');
    });
  });

  describe('T6 — no_tricks avoids winning when possible', () => {
    it('plays 7♠ not A♠ when following spade lead', () => {
      const hand = [makeCard('A', 'spades'), makeCard('7', 'spades')];
      const trick = [makeCard('5', 'spades')];
      const state = makeState(hand, trick, leaderForPlayer0(1));
      const king = makeKing(0, 'no_tricks');
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king, 'medium');
      expect(hand[idx].rank).toBe('7');
    });
  });

  describe('T8 — K09 positive hard min winner regression', () => {
    it('wins trick with lowest winning card', () => {
      const hand = [makeCard('7', 'spades'), makeCard('A', 'spades')];
      const trick = [makeCard('5', 'spades')];
      const state = makeState(hand, trick, leaderForPlayer0(1));
      const king = makeKing(6, null);
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king, 'hard');
      expect(hand[idx].rank).toBe('7');
    });
  });

  describe('T9 — returns -1 when no legal moves', () => {
    it('returns -1 if adapter allows no cards', () => {
      const hand = [makeCard('2', 'clubs')];
      const state = makeState(hand);
      const idx = chooseKingPtCard(makeAdapter(false), state, 0, makeKing(), 'medium');
      expect(idx).toBe(-1);
    });
  });

  describe('T10 — K03 medium/hard negative lead avoids hearts', () => {
    it.each(['medium', 'hard'] as const)('%s does not lead ♥ when club available', (difficulty) => {
      const hand = [makeCard('A', 'hearts'), makeCard('2', 'clubs')];
      const state = makeState(hand, []);
      const king = makeKing(0, 'no_hearts');
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king, difficulty);
      expect(hand[idx].suit).not.toBe('hearts');
    });
  });

  describe('IMPLEMENTATION_16.1 — no_tricks unload while losing', () => {
    it('16.1-1 dumps highest in-suit loser when both lose', () => {
      const hand = [makeCard('3', 'spades'), makeCard('7', 'spades')];
      const trick = [makeCard('K', 'spades')];
      const state = makeState(hand, trick, leaderForPlayer0(1));
      const king = makeKing(0, 'no_tricks');
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king, 'medium');
      expect(hand[idx].rank).toBe('7');
    });

    it('16.1-3 void dumps high card not low useless card', () => {
      const hand = [makeCard('2', 'diamonds'), makeCard('A', 'clubs')];
      const trick = [makeCard('K', 'spades')];
      const state = makeState(hand, trick, leaderForPlayer0(1));
      const king = makeKing(0, 'no_tricks');
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king, 'medium');
      expect(hand[idx].rank).toBe('A');
    });

    it('16.1-4 returns legal index', () => {
      const hand = [makeCard('2', 'clubs'), makeCard('5', 'diamonds')];
      const trick = [makeCard('K', 'hearts')];
      const state = makeState(hand, trick, leaderForPlayer0(1));
      const king = makeKing(0, 'no_tricks');
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king, 'medium');
      expect(hand[idx]).toBeDefined();
    });
  });

  describe('IMPLEMENTATION_16.1 — no_hearts follow', () => {
    it('16.1-6 in-suit unload highest loser', () => {
      const hand = [makeCard('3', 'spades'), makeCard('9', 'spades')];
      const trick = [makeCard('K', 'spades')];
      const state = makeState(hand, trick, leaderForPlayer0(1));
      const king = makeKing(0, 'no_hearts');
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king, 'medium');
      expect(hand[idx].rank).toBe('9');
    });

    it('16.1-7 avoids winning when lower card loses', () => {
      const hand = [makeCard('7', 'spades'), makeCard('A', 'spades')];
      const trick = [makeCard('5', 'spades')];
      const state = makeState(hand, trick, leaderForPlayer0(1));
      const king = makeKing(0, 'no_hearts');
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king, 'medium');
      expect(hand[idx].rank).toBe('7');
    });
  });

  describe('IMPLEMENTATION_16.1 — regressions', () => {
    it('16.1-11 Simplified negative unchanged', () => {
      const hand = [makeCard('K', 'clubs'), makeCard('2', 'clubs')];
      const state = makeState(hand, []);
      const idx = chooseKingSimplifiedCard(makeAdapter(), state, 0, true, 'medium');
      expect(hand[idx].rank).toBe('2');
    });
  });

  describe('medium — positive phase when leading: chooses highest card', () => {
    it('leads with A over 2 in positive game', () => {
      const hand = [makeCard('2', 'clubs'), makeCard('A', 'clubs')];
      const state = makeState(hand, []);
      const king = makeKing(6, null);
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
      expect(hand[idx].suit).not.toBe('hearts');
      expect(hand[idx].rank).toBe('2');
    });

    it('trick 9 (trickNumber=8): switches to defensive — avoids winning in-suit', () => {
      const hand = [makeCard('K', 'hearts'), makeCard('3', 'hearts')];
      const trick = [makeCard('4', 'hearts')];
      const state = makeState(hand, trick, leaderForPlayer0(1));
      const king = { ...makeKing(0, 'no_last_two'), trickNumber: 8 };
      const idx = chooseKingPtCard(makeAdapter(), state, 0, king as KingPtVariantState, 'medium');
      expect(hand[idx].rank).toBe('3');
    });
  });
});
