import { isAceSeenInSuit, isSevenLeadBlocked, suecaTrickWinnerIndex } from './suecaTrickHelpers';
import { Card, GameState, Suit } from '../../../types/game';

function makeCard(rank: Card['rank'], suit: Suit): Card {
  return { rank, suit, id: `${suit}_${rank}` };
}

function makeState(playedCards: Card[] = []): GameState {
  return { playedCards } as GameState;
}

describe('suecaTrickHelpers', () => {
  it('isSevenLeadBlocked is true before ace seen', () => {
    const state = makeState();
    expect(isSevenLeadBlocked(state, makeCard('7', 'diamonds'))).toBe(true);
  });

  it('isSevenLeadBlocked is false after ace seen', () => {
    const state = makeState([makeCard('A', 'diamonds')]);
    expect(isAceSeenInSuit(state, 'diamonds')).toBe(true);
    expect(isSevenLeadBlocked(state, makeCard('7', 'diamonds'))).toBe(false);
  });

  it('suecaTrickWinnerIndex picks partner when they led high card', () => {
    const trick = [makeCard('A', 'hearts')];
    expect(suecaTrickWinnerIndex(trick, 2, 'clubs')).toBe(2);
  });
});
