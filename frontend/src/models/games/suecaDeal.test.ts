import { Game } from '../Game';
import { Card } from '../../types/game';
import {
  dealSuecaFromCardOrder,
  suecaDealOthersOrder,
  suecaDealSeatOrder,
  suecaPhysicalRightOf
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

describe('suecaDeal — block contract', () => {
  it('seat order: right = physical-right first; left = physical-left first', () => {
    expect(suecaDealSeatOrder(0, 'right')).toEqual([3, 2, 1, 0]);
    expect(suecaDealSeatOrder(0, 'left')).toEqual([1, 2, 3, 0]);
    expect(suecaDealOthersOrder(0, 'right')).toEqual([3, 2, 1]);
    expect(suecaDealOthersOrder(0, 'left')).toEqual([1, 2, 3]);
    expect(suecaPhysicalRightOf(0)).toBe(3);
  });

  it('Method A deals 10-card blocks (not round-robin)', () => {
    const deck = makeDeck40();
    const dealt = dealSuecaFromCardOrder(deck, 0, 'A', 'right');
    // First 10 consecutive → seat 3 (physical right of 0)
    expect(dealt.hands[3].map((c) => c.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `c${i}`)
    );
    expect(dealt.hands[2].map((c) => c.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `c${i + 10}`)
    );
    expect(dealt.hands[1].map((c) => c.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `c${i + 20}`)
    );
    expect(dealt.hands[0].map((c) => c.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `c${i + 30}`)
    );
    expect(dealt.trumpCard?.suit).toBe(deck[39].suit);
    expect(dealt.trumpCard?.rank).toBe(deck[39].rank);
  });

  it('Method B: dealer first 10-block; trump = top; others as blocks', () => {
    const deck = makeDeck40();
    const left = dealSuecaFromCardOrder(deck, 0, 'B', 'left');
    expect(left.hands[0].map((c) => c.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `c${i}`)
    );
    expect(left.trumpSuit).toBe(deck[0].suit);
    expect(left.hands[1].map((c) => c.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `c${i + 10}`)
    );
    expect(left.hands[2][0].id).toBe('c20');
    expect(left.hands[3][0].id).toBe('c30');

    const right = dealSuecaFromCardOrder(deck, 0, 'B', 'right');
    expect(right.hands[0][0].id).toBe('c0');
    expect(right.hands[3][0].id).toBe('c10');
  });

  it('Game setDealingDirection is applied on startRound (integration)', () => {
    const game = new Game(['A', 'B', 'C', 'D'], 'A');
    game.setDealingDirection('left');
    expect(game.getState().dealingDirection).toBe('left');
    game.setDealingMethod('A');
    game.startRound();
    const state = game.getState();
    state.players.forEach((p) => expect(p.hand).toHaveLength(10));
    expect(state.trumpSuit).not.toBeNull();
  });
});
