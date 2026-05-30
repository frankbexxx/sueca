import { getLegalIndices } from './LegalMoveFilter';
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

function makeAdapter(legalSet: Set<number>): GameAdapter {
  return {
    canPlayCard: (_state: GameState, _playerIndex: number, cardIndex: number) =>
      legalSet.has(cardIndex),
  } as unknown as GameAdapter;
}

describe('getLegalIndices', () => {
  it('returns only indices that canPlayCard accepts', () => {
    const hand = [makeCard('A', 'spades'), makeCard('2', 'hearts'), makeCard('K', 'clubs')];
    const state = makeState(hand);
    const adapter = makeAdapter(new Set([0, 2]));
    expect(getLegalIndices(adapter, state, 0)).toEqual([0, 2]);
  });

  it('returns all indices when every card is legal', () => {
    const hand = [makeCard('A', 'spades'), makeCard('2', 'hearts')];
    const state = makeState(hand);
    const adapter = makeAdapter(new Set([0, 1]));
    expect(getLegalIndices(adapter, state, 0)).toEqual([0, 1]);
  });

  it('returns empty array when no card is legal', () => {
    const hand = [makeCard('A', 'spades'), makeCard('2', 'hearts')];
    const state = makeState(hand);
    const adapter = makeAdapter(new Set());
    expect(getLegalIndices(adapter, state, 0)).toEqual([]);
  });

  it('returns empty array for unknown player', () => {
    const state = makeState([]);
    const adapter = makeAdapter(new Set([0]));
    expect(getLegalIndices(adapter, state, 99)).toEqual([]);
  });
});
