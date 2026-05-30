import { playFirstLegal } from './FallbackMoveSelector';
import { GameAdapter } from '../../models/games/GameAdapter';
import { GameState, Card } from '../../types/game';

function makeCard(rank: string, suit: string): Card {
  return { rank, suit } as Card;
}

function makeState(hand: Card[]): GameState {
  return {
    players: [{ hand, name: 'P0', score: 0 }],
  } as unknown as GameState;
}

/**
 * Builds an adapter where playCard succeeds only for indices in acceptSet.
 * getCurrentState() returns the same state passed in.
 */
function makeAdapter(state: GameState, acceptSet: Set<number>): GameAdapter {
  return {
    getCurrentState: () => state,
    playCard: (_s: GameState, _p: number, cardIndex: number) =>
      acceptSet.has(cardIndex),
  } as unknown as GameAdapter;
}

describe('playFirstLegal', () => {
  it('returns 0 when playCard accepts the first card', () => {
    const hand = [makeCard('A', 'spades'), makeCard('2', 'hearts'), makeCard('K', 'clubs')];
    const state = makeState(hand);
    const adapter = makeAdapter(state, new Set([0, 1, 2]));
    expect(playFirstLegal(adapter, state, 0)).toBe(0);
  });

  it('returns 2 when playCard rejects indices 0 and 1 but accepts 2', () => {
    const hand = [makeCard('A', 'spades'), makeCard('2', 'hearts'), makeCard('K', 'clubs')];
    const state = makeState(hand);
    const adapter = makeAdapter(state, new Set([2]));
    expect(playFirstLegal(adapter, state, 0)).toBe(2);
  });

  it('returns -1 when playCard rejects all cards', () => {
    const hand = [makeCard('A', 'spades'), makeCard('2', 'hearts')];
    const state = makeState(hand);
    const adapter = makeAdapter(state, new Set());
    expect(playFirstLegal(adapter, state, 0)).toBe(-1);
  });

  it('returns -1 when playerIndex does not exist in state', () => {
    const state = makeState([makeCard('A', 'spades')]);
    const adapter = makeAdapter(state, new Set([0]));
    expect(playFirstLegal(adapter, state, 99)).toBe(-1);
  });
});
