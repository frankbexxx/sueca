/**
 * Sueca rule regression — block deal + physical-right play, decoupled from deal sense.
 * Geometry: 0 South, 1 West, 2 North, 3 East (tableLayout / UX-SEAT-01).
 */

import { describe, expect, it } from 'vitest';
import { Game } from '../Game';
import { Card } from '../../types/game';
import {
  dealSuecaFromCardOrder,
  suecaDealSeatOrder,
  suecaNextAntiClockwise,
  suecaPhysicalRightOf,
  suecaSeatAtTrickOffset
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

const SEAT = ['South', 'West', 'North', 'East'] as const;

describe('Sueca physical seat mapping (UX-SEAT-01)', () => {
  it.each([0, 1, 2, 3] as const)(
    'dealer %s: physical right matches engine first recipient / leader helper',
    (dealer) => {
      const physicalRight = suecaPhysicalRightOf(dealer);
      // From dealer facing centre: right = previous index in S→W→N→E ring
      expect(physicalRight).toBe((dealer + 3) % 4);
      expect(suecaDealSeatOrder(dealer, 'right')[0]).toBe(physicalRight);
      // Visual: east is screen-right of south local — seatsAroundLocal south→east = +3
      if (dealer === 0) {
        expect(SEAT[physicalRight]).toBe('East');
      }
    }
  );

  it('play progression is anti-clockwise (physical rightward)', () => {
    expect(suecaNextAntiClockwise(0)).toBe(3); // South → East
    expect(suecaNextAntiClockwise(3)).toBe(2); // East → North
    expect(suecaNextAntiClockwise(2)).toBe(1); // North → West
    expect(suecaNextAntiClockwise(1)).toBe(0); // West → South
  });

  it('REL-SUECA-REG-02: trick card index maps via ACW, not clockwise', () => {
    // leader 0 play order seats: 0 → 3 → 2 → 1
    expect(suecaSeatAtTrickOffset(0, 0)).toBe(0);
    expect(suecaSeatAtTrickOffset(0, 1)).toBe(3);
    expect(suecaSeatAtTrickOffset(0, 2)).toBe(2);
    expect(suecaSeatAtTrickOffset(0, 3)).toBe(1);
    // wi=1/3 diverge from clockwise
    expect(suecaSeatAtTrickOffset(0, 1)).not.toBe((0 + 1) % 4);
    expect(suecaSeatAtTrickOffset(0, 3)).not.toBe((0 + 3) % 4);
  });
});

describe('Sueca traditional Method A — block deal', () => {
  it.each([0, 1, 2, 3] as const)(
    'dealer %s: 10 consecutive cards to physical right, then next, …, dealer; trump=last',
    (dealer) => {
      const deck = makeDeck40();
      const dealt = dealSuecaFromCardOrder(deck, dealer, 'A', 'right');
      const order = suecaDealSeatOrder(dealer, 'right');
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

  it('default dealing direction is right (anti-clockwise / physical right first)', () => {
    const game = new Game(['A', 'B', 'C', 'D'], 'A');
    expect(game.getState().dealingDirection).toBe('right');
  });

  it('first leader is physical right of dealer; deal direction does not change leader', () => {
    const game = new Game(['A', 'B', 'C', 'D'], 'A');
    const dealer = game.getState().dealerIndex;
    const expected = suecaPhysicalRightOf(dealer);

    game.setDealingDirection('right');
    game.setDealingMethod('A');
    game.startRound();
    expect(game.getState().trickLeader).toBe(expected);
    expect(game.getState().currentPlayerIndex).toBe(expected);

    const game2 = new Game(['A', 'B', 'C', 'D'], 'A');
    const d2 = game2.getState().dealerIndex;
    game2.setDealingDirection('left');
    game2.setDealingMethod('A');
    game2.startRound();
    expect(game2.getState().trickLeader).toBe(suecaPhysicalRightOf(d2));
  });

  it('play progression stays anti-clockwise after lead', () => {
    const game = new Game(['A', 'B', 'C', 'D'], 'A');
    game.setDealingMethod('A');
    game.setDealingDirection('right');
    game.startRound();
    const leader = game.getState().trickLeader;
    expect(game.playCard(leader, 0)).toBe(true);
    expect(game.getState().currentPlayerIndex).toBe(suecaNextAntiClockwise(leader));
  });
});

describe('Sueca alternative Method B — block deal', () => {
  it.each([0, 1, 2, 3] as const)(
    'dealer %s: dealer gets first 10-block; trump=top; leader still physical right',
    (dealer) => {
      const deck = makeDeck40();
      // Alternative sense: clockwise for remaining seats
      const dealt = dealSuecaFromCardOrder(deck, dealer, 'B', 'left');
      expect(dealt.hands[dealer].map((c) => c.id)).toEqual(
        Array.from({ length: 10 }, (_, i) => `c${i}`)
      );
      expect(dealt.trumpSuit).toBe(deck[0].suit);
      expect(dealt.trumpCard?.rank).toBe(deck[0].rank);

      const others = suecaDealSeatOrder(dealer, 'left').filter((i) => i !== dealer);
      expect(dealt.hands[others[0]].map((c) => c.id)).toEqual(
        Array.from({ length: 10 }, (_, i) => `c${i + 10}`)
      );

      dealt.hands.forEach((h) => expect(h).toHaveLength(10));
    }
  );

  it('Method B + clockwise deal does not change first leader or play sense', () => {
    const game = new Game(['A', 'B', 'C', 'D'], 'B');
    const d = game.getState().dealerIndex;
    game.setDealingMethod('B');
    game.setDealingDirection('left');
    game.startRound();
    expect(game.getState().trickLeader).toBe(suecaPhysicalRightOf(d));
    const leader = game.getState().trickLeader;
    expect(game.playCard(leader, 0)).toBe(true);
    expect(game.getState().currentPlayerIndex).toBe(suecaNextAntiClockwise(leader));
  });
});

describe('Sueca round rotation', () => {
  it('next dealer is physical right of previous; first leader tracks new dealer', () => {
    const game = new Game(['A', 'B', 'C', 'D'], 'A');
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
