import { Game } from '../Game';
import { Card } from '../../types/game';
import { dealSuecaCanonical, suecaPhysicalRightOf } from './suecaDeal';
import { dealSeatOrder, nextSeat, seatAtOffset } from './suecaRules';

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

describe('suecaDeal — canonical block contract', () => {
  it('SAME right: physical-right first; dealer last; trump = last card', () => {
    expect(dealSeatOrder(0, 'right', 'same')).toEqual([3, 2, 1, 0]);
    expect(suecaPhysicalRightOf(0)).toBe(3);
    const deck = makeDeck40();
    const dealt = dealSuecaCanonical(deck, 0, 'right', 'same');
    expect(dealt.canonical).toBe(true);
    expect(dealt.hands[3].map((c) => c.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `c${i}`)
    );
    expect(dealt.hands[0].map((c) => c.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `c${i + 30}`)
    );
    expect(dealt.trumpCard?.suit).toBe(deck[39].suit);
    expect(dealt.trumpCard?.rank).toBe(deck[39].rank);
  });

  it('OPPOSITE right: dealer first block; trump = top', () => {
    const deck = makeDeck40();
    const dealt = dealSuecaCanonical(deck, 0, 'right', 'opposite');
    expect(dealt.hands[0].map((c) => c.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `c${i}`)
    );
    expect(dealt.trumpSuit).toBe(deck[0].suit);
  });

  it('seatAtOffset RIGHT matches historical ACW mapping', () => {
    expect([0, 1, 2, 3].map((i) => seatAtOffset(0, i, 'right'))).toEqual([0, 3, 2, 1]);
    expect([0, 1, 2, 3].map((i) => seatAtOffset(1, i, 'right'))).toEqual([1, 0, 3, 2]);
  });

  it('Game setDealAlignment is applied on startRound', () => {
    const game = new Game(['A', 'B', 'C', 'D']);
    game.setDealAlignment('opposite');
    expect(game.getState().dealAlignment).toBe('opposite');
    game.startRound();
    const state = game.getState();
    state.players.forEach((p) => expect(p.hand).toHaveLength(10));
    expect(state.trumpSuit).not.toBeNull();
  });

  it('nextSeat(right) is physical rightward', () => {
    expect(nextSeat(0, 'right')).toBe(3);
  });
});
