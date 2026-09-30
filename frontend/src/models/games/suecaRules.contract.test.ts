/**
 * Sueca rule regression — canonical playDirection + dealAlignment.
 * Geometry: 0 South, 1 West, 2 North, 3 East (tableLayout / UX-SEAT-01).
 */

import { describe, expect, it } from 'vitest';
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

const SEAT = ['South', 'West', 'North', 'East'] as const;

describe('Sueca physical seat mapping (UX-SEAT-01)', () => {
  it.each([0, 1, 2, 3] as const)(
    'dealer %s: physical right matches engine first recipient / leader helper',
    (dealer) => {
      const physicalRight = suecaPhysicalRightOf(dealer);
      expect(physicalRight).toBe((dealer + 3) % 4);
      expect(dealSeatOrder(dealer, 'right', 'same')[0]).toBe(physicalRight);
      if (dealer === 0) {
        expect(SEAT[physicalRight]).toBe('East');
      }
    }
  );

  it('RIGHT play progression is physical rightward', () => {
    expect(nextSeat(0, 'right')).toBe(3);
    expect(nextSeat(3, 'right')).toBe(2);
    expect(nextSeat(2, 'right')).toBe(1);
    expect(nextSeat(1, 'right')).toBe(0);
  });

  it('trick card index maps via playDirection, not clockwise +1', () => {
    expect(seatAtOffset(0, 0, 'right')).toBe(0);
    expect(seatAtOffset(0, 1, 'right')).toBe(3);
    expect(seatAtOffset(0, 2, 'right')).toBe(2);
    expect(seatAtOffset(0, 3, 'right')).toBe(1);
    expect(seatAtOffset(0, 1, 'right')).not.toBe((0 + 1) % 4);
    expect(seatAtOffset(0, 3, 'right')).not.toBe((0 + 3) % 4);
  });
});

describe('Sueca SAME alignment — block deal', () => {
  it.each([0, 1, 2, 3] as const)(
    'dealer %s RIGHT+SAME: 10 consecutive to physical right, …, dealer; trump=last',
    (dealer) => {
      const deck = makeDeck40();
      const dealt = dealSuecaCanonical(deck, dealer, 'right', 'same');
      const order = dealSeatOrder(dealer, 'right', 'same');
      expect(order[0]).toBe(suecaPhysicalRightOf(dealer));
      expect(order[3]).toBe(dealer);

      for (let block = 0; block < 4; block++) {
        const seat = order[block];
        const base = block * 10;
        expect(dealt.hands[seat].map((c) => c.id)).toEqual(
          Array.from({ length: 10 }, (_, i) => `c${base + i}`)
        );
      }
      expect(dealt.trumpCard?.suit).toBe(deck[39].suit);
      expect(dealt.trumpCard?.rank).toBe(deck[39].rank);
    }
  );

  it('new game defaults dealAlignment SAME and playDirection RIGHT', () => {
    const game = new Game(['A', 'B', 'C', 'D']);
    expect(game.getState().dealAlignment).toBe('same');
    expect(game.getState().playDirection).toBe('right');
  });

  it('first leader is physical right of dealer; dealAlignment does not change leader', () => {
    const game = new Game(['A', 'B', 'C', 'D']);
    const dealer = game.getState().dealerIndex;
    const expected = suecaPhysicalRightOf(dealer);

    game.setDealAlignment('same');
    game.startRound();
    expect(game.getState().trickLeader).toBe(expected);
    expect(game.getState().currentPlayerIndex).toBe(expected);

    const game2 = new Game(['A', 'B', 'C', 'D']);
    const d2 = game2.getState().dealerIndex;
    game2.setDealAlignment('opposite');
    game2.startRound();
    expect(game2.getState().trickLeader).toBe(suecaPhysicalRightOf(d2));
  });

  it('play progression stays RIGHT after lead', () => {
    const game = new Game(['A', 'B', 'C', 'D']);
    game.setDealAlignment('same');
    game.startRound();
    const leader = game.getState().trickLeader;
    expect(game.playCard(leader, 0)).toBe(true);
    expect(game.getState().currentPlayerIndex).toBe(nextSeat(leader as 0 | 1 | 2 | 3, 'right'));
  });
});

describe('Sueca OPPOSITE alignment — block deal', () => {
  it.each([0, 1, 2, 3] as const)(
    'dealer %s RIGHT+OPPOSITE: dealer first 10-block; trump=top; leader still physical right',
    (dealer) => {
      const deck = makeDeck40();
      const dealt = dealSuecaCanonical(deck, dealer, 'right', 'opposite');
      expect(dealt.hands[dealer].map((c) => c.id)).toEqual(
        Array.from({ length: 10 }, (_, i) => `c${i}`)
      );
      expect(dealt.trumpSuit).toBe(deck[0].suit);
      expect(dealt.trumpCard?.rank).toBe(deck[0].rank);

      const others = dealSeatOrder(dealer, 'right', 'opposite').filter((i) => i !== dealer);
      expect(dealt.hands[others[0]].map((c) => c.id)).toEqual(
        Array.from({ length: 10 }, (_, i) => `c${i + 10}`)
      );

      dealt.hands.forEach((h) => expect(h).toHaveLength(10));
    }
  );

  it('OPPOSITE does not change first leader or play sense', () => {
    const game = new Game(['A', 'B', 'C', 'D']);
    const d = game.getState().dealerIndex;
    game.setDealAlignment('opposite');
    game.startRound();
    expect(game.getState().trickLeader).toBe(suecaPhysicalRightOf(d));
    const leader = game.getState().trickLeader;
    expect(game.playCard(leader, 0)).toBe(true);
    expect(game.getState().currentPlayerIndex).toBe(nextSeat(leader as 0 | 1 | 2 | 3, 'right'));
  });
});

describe('Sueca round rotation', () => {
  it('next dealer is physical right of previous; first leader tracks new dealer', () => {
    const game = new Game(['A', 'B', 'C', 'D']);
    const d0 = game.getState().dealerIndex;
    game.startRound();
    const s = game.getState();
    s.waitingForRoundEnd = true;
    s.waitingForRoundStart = false;
    game.loadState(s);
    game.continueToNextRound();
    const s2 = game.getState();
    expect(s2.dealerIndex).toBe(suecaPhysicalRightOf(d0));
    expect(s2.trickLeader).toBe(suecaPhysicalRightOf(s2.dealerIndex));
  });
});
