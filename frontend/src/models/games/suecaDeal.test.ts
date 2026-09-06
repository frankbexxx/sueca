import { Game } from '../Game';
import { Card } from '../../types/game';
import {
  dealSuecaFromCardOrder,
  suecaDealOthersOrder,
  suecaDealSeatOrder
} from './suecaDeal';

function makeDeck40(): Card[] {
  const suits: Card['suit'][] = ['clubs', 'diamonds', 'hearts', 'spades'];
  const ranks: Card['rank'][] = ['2', '3', '4', '5', '6', 'Q', 'J', 'K', '7', 'A'];
  const cards: Card[] = [];
  let n = 0;
  for (const suit of suits) {
    for (const rank of ranks) {
      cards.push({ suit, rank, id: `c${n++}` });
    }
  }
  return cards;
}

describe('suecaDeal', () => {
  it('seat order left starts at dealer+1; right at dealer-1', () => {
    expect(suecaDealSeatOrder(0, 'left')).toEqual([1, 2, 3, 0]);
    expect(suecaDealSeatOrder(0, 'right')).toEqual([3, 2, 1, 0]);
    expect(suecaDealOthersOrder(0, 'left')).toEqual([1, 2, 3]);
    expect(suecaDealOthersOrder(0, 'right')).toEqual([3, 2, 1]);
  });

  it('Method A left vs right invert assignment for the same deck', () => {
    const deck = makeDeck40();
    const dealer = 0;
    const left = dealSuecaFromCardOrder(deck, dealer, 'A', 'left');
    const right = dealSuecaFromCardOrder(deck, dealer, 'A', 'right');

    // First card of the deck goes to first seat in order
    expect(left.hands[1][0].id).toBe('c0');
    expect(right.hands[3][0].id).toBe('c0');

    // Same cards overall, different owners
    const leftIds = left.hands.flat().map((c) => c.id).sort();
    const rightIds = right.hands.flat().map((c) => c.id).sort();
    expect(leftIds).toEqual(rightIds);
    expect(left.hands[1].map((c) => c.id)).not.toEqual(right.hands[1].map((c) => c.id));

    left.hands.forEach((h) => expect(h).toHaveLength(10));
    right.hands.forEach((h) => expect(h).toHaveLength(10));
    expect(left.hands.flat()).toHaveLength(40);
    expect(new Set(leftIds).size).toBe(40);

    // Method A trump = last dealt card (40th) — display copy keeps suit/rank
    expect(left.trumpCard?.suit).toBe('spades');
    expect(left.trumpCard?.rank).toBe('A');
    expect(right.trumpCard?.suit).toBe(left.trumpCard?.suit);
    expect(right.trumpCard?.rank).toBe(left.trumpCard?.rank);
    expect(left.hands.flat().some((c) => c.id === 'c39')).toBe(true);
  });

  it('Method B: dealer keeps trump; others order flips with direction', () => {
    const deck = makeDeck40();
    const left = dealSuecaFromCardOrder(deck, 0, 'B', 'left');
    const right = dealSuecaFromCardOrder(deck, 0, 'B', 'right');

    expect(left.hands[0][0].id).toBe('c0'); // trump to dealer
    expect(right.hands[0][0].id).toBe('c0');
    expect(left.trumpSuit).toBe(deck[0].suit);

    // After dealer took 10 cards (c0–c9), next is c10
    expect(left.hands[1][0].id).toBe('c10');
    expect(right.hands[3][0].id).toBe('c10');

    left.hands.forEach((h) => expect(h).toHaveLength(10));
    right.hands.forEach((h) => expect(h).toHaveLength(10));
  });

  it('Game setDealingDirection is applied on startRound (integration)', () => {
    const game = new Game(['A', 'B', 'C', 'D'], 'A');
    game.setDealingDirection('right');
    expect(game.getState().dealingDirection).toBe('right');
    game.setDealingMethod('A');
    game.startRound();
    const state = game.getState();
    state.players.forEach((p) => expect(p.hand).toHaveLength(10));
    expect(state.trumpSuit).not.toBeNull();
  });
});
