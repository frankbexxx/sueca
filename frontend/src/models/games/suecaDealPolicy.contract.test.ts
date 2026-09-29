/**
 * ARCH-SUECA-05 — canonical deal policy (playDirection × dealAlignment).
 */

import { describe, expect, it } from 'vitest';
import { Card } from '../../types/game';
import { Game } from '../Game';
import {
  dealSuecaCanonical,
  legacyFieldsForAlignment,
  resolveLegacyDealAlignment
} from './suecaDeal';
import {
  asSeat,
  cutterForDealer,
  dealSeatOrder,
  firstLeader,
  partnerOf,
  physicalRightOf,
  shufflerForDealer,
  type DealAlignment,
  type PlayDirection,
  type Seat
} from './suecaRules';

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

function ids(hand: Card[]): string[] {
  return hand.map((c) => c.id);
}

const PLAYS: PlayDirection[] = ['right', 'left'];
const ALIGNS: DealAlignment[] = ['same', 'opposite'];
const SEATS: Seat[] = [0, 1, 2, 3];

describe('ARCH-SUECA-05 resolveLegacyDealAlignment', () => {
  it('maps unambiguous production combos', () => {
    expect(resolveLegacyDealAlignment('right', 'A', 'right')).toBe('same');
    expect(resolveLegacyDealAlignment('right', 'B', 'left')).toBe('opposite');
    expect(resolveLegacyDealAlignment('left', 'A', 'left')).toBe('same');
    expect(resolveLegacyDealAlignment('left', 'B', 'right')).toBe('opposite');
  });

  it('rejects unsupported Method×Direction (reachable in UI — no invented semantics)', () => {
    expect(resolveLegacyDealAlignment('right', 'A', 'left')).toBeNull();
    expect(resolveLegacyDealAlignment('right', 'B', 'right')).toBeNull();
    expect(resolveLegacyDealAlignment('left', 'A', 'right')).toBeNull();
    expect(resolveLegacyDealAlignment('left', 'B', 'left')).toBeNull();
  });

  it('legacyFieldsForAlignment round-trips', () => {
    for (const play of PLAYS) {
      for (const align of ALIGNS) {
        const fields = legacyFieldsForAlignment(play, align);
        expect(resolveLegacyDealAlignment(play, fields.dealingMethod, fields.dealingDirection)).toBe(
          align
        );
      }
    }
  });
});

describe('ARCH-SUECA-05 dealSuecaCanonical — dealer 0 card identity', () => {
  const deck = makeDeck40();

  it('RIGHT + SAME: order 3,2,1,0; trump = last dealer card', () => {
    const dealt = dealSuecaCanonical(deck, 0, 'right', 'same');
    expect(dealt.dealOrder).toEqual([3, 2, 1, 0]);
    expect(dealt.trumpPlacement).toBe('dealer-last-card');
    expect(ids(dealt.hands[3])).toEqual(Array.from({ length: 10 }, (_, i) => `c${i}`));
    expect(ids(dealt.hands[2])).toEqual(Array.from({ length: 10 }, (_, i) => `c${i + 10}`));
    expect(ids(dealt.hands[1])).toEqual(Array.from({ length: 10 }, (_, i) => `c${i + 20}`));
    expect(ids(dealt.hands[0])).toEqual(Array.from({ length: 10 }, (_, i) => `c${i + 30}`));
    expect(dealt.trumpCard?.id).toBe(`trump_${deck[39].suit}_${deck[39].rank}`);
    expect(dealt.hands[0][9].id).toBe(deck[39].id);
    dealt.hands.forEach((h) => expect(h).toHaveLength(10));
  });

  it('RIGHT + OPPOSITE: order 0,1,2,3; trump = first dealer card', () => {
    const dealt = dealSuecaCanonical(deck, 0, 'right', 'opposite');
    expect(dealt.dealOrder).toEqual([0, 1, 2, 3]);
    expect(dealt.trumpPlacement).toBe('dealer-first-card');
    expect(ids(dealt.hands[0])).toEqual(Array.from({ length: 10 }, (_, i) => `c${i}`));
    expect(dealt.trumpCard?.id).toBe(`trump_${deck[0].suit}_${deck[0].rank}`);
    expect(dealt.hands[0][0].id).toBe(deck[0].id);
    expect(ids(dealt.hands[1])).toEqual(Array.from({ length: 10 }, (_, i) => `c${i + 10}`));
    expect(ids(dealt.hands[2])).toEqual(Array.from({ length: 10 }, (_, i) => `c${i + 20}`));
    expect(ids(dealt.hands[3])).toEqual(Array.from({ length: 10 }, (_, i) => `c${i + 30}`));
  });

  it('LEFT + SAME: order 1,2,3,0; trump = last', () => {
    const dealt = dealSuecaCanonical(deck, 0, 'left', 'same');
    expect(dealt.dealOrder).toEqual([1, 2, 3, 0]);
    expect(ids(dealt.hands[1])).toEqual(Array.from({ length: 10 }, (_, i) => `c${i}`));
    expect(ids(dealt.hands[2])).toEqual(Array.from({ length: 10 }, (_, i) => `c${i + 10}`));
    expect(ids(dealt.hands[3])).toEqual(Array.from({ length: 10 }, (_, i) => `c${i + 20}`));
    expect(ids(dealt.hands[0])).toEqual(Array.from({ length: 10 }, (_, i) => `c${i + 30}`));
    expect(dealt.hands[0][9].id).toBe(deck[39].id);
  });

  it('LEFT + OPPOSITE: order 0,3,2,1; trump = first', () => {
    const dealt = dealSuecaCanonical(deck, 0, 'left', 'opposite');
    expect(dealt.dealOrder).toEqual([0, 3, 2, 1]);
    expect(ids(dealt.hands[0])).toEqual(Array.from({ length: 10 }, (_, i) => `c${i}`));
    expect(ids(dealt.hands[3])).toEqual(Array.from({ length: 10 }, (_, i) => `c${i + 10}`));
    expect(ids(dealt.hands[2])).toEqual(Array.from({ length: 10 }, (_, i) => `c${i + 20}`));
    expect(ids(dealt.hands[1])).toEqual(Array.from({ length: 10 }, (_, i) => `c${i + 30}`));
    expect(dealt.hands[0][0].id).toBe(deck[0].id);
  });
});

describe('ARCH-SUECA-05 four scenarios — first leader independent of deal', () => {
  it.each(
    PLAYS.flatMap((play) =>
      ALIGNS.map((align) => ({ play, align }))
    )
  )('play=$play alignment=$align: leader = firstLeader(dealer, play)', ({ play, align }) => {
    const game = new Game(['A', 'B', 'C', 'D'], 'A', 'medium', undefined, undefined, play);
    const s = game.getState();
    s.dealerIndex = 0;
    const leader = firstLeader(0, play);
    s.trickLeader = leader;
    s.currentPlayerIndex = leader;
    game.loadState(s);
    game.setDealAlignment(align);
    expect(game.getState().dealAlignment).toBe(align);
    expect(game.getState().playDirection).toBe(play);
    expect(game.getState().trickLeader).toBe(leader);
    game.startRound();
    expect(game.getState().trickLeader).toBe(leader);
    expect(game.getState().currentPlayerIndex).toBe(leader);
    expect(game.getState().playDirection).toBe(play);
    expect(game.getState().dealAlignment).toBe(align);
    game.getState().players.forEach((p) => expect(p.hand).toHaveLength(10));
    expect(game.getState().trumpCard).not.toBeNull();
  });

  it('spot-check dealer 2 RIGHT+SAME and LEFT+OPPOSITE', () => {
    for (const { play, align } of [
      { play: 'right' as const, align: 'same' as const },
      { play: 'left' as const, align: 'opposite' as const }
    ]) {
      const deck = makeDeck40();
      const dealt = dealSuecaCanonical(deck, 2, play, align);
      expect(dealt.dealOrder).toEqual(dealSeatOrder(2, play, align));
      expect(dealt.hands.every((h) => h.length === 10)).toBe(true);
      expect(firstLeader(2, play)).toBe(play === 'right' ? 1 : 3);
    }
  });
});

describe('ARCH-SUECA-05 shuffler/cutter independence', () => {
  it.each(SEATS)('dealer %s: shuffler/cutter ignore play and alignment', (dealer) => {
    const shuffler = shufflerForDealer(dealer);
    const cutter = cutterForDealer(dealer);
    expect(shuffler).toBe(physicalRightOf(dealer));
    expect(cutter).toBe(partnerOf(shuffler));
    for (const play of PLAYS) {
      for (const align of ALIGNS) {
        void play;
        void align;
        expect(shufflerForDealer(dealer)).toBe(shuffler);
        expect(cutterForDealer(dealer)).toBe(cutter);
      }
    }
  });
});

describe('ARCH-SUECA-05 production path via legacy setters', () => {
  it('A+right → same; B+left → opposite under play RIGHT', () => {
    const game = new Game(['A', 'B', 'C', 'D'], 'A');
    expect(game.getState().playDirection).toBe('right');
    expect(game.getState().dealAlignment).toBe('same');

    game.setDealingMethod('B');
    game.setDealingDirection('left');
    expect(game.getState().dealAlignment).toBe('opposite');
    game.setDealAlignment('same');
    expect(game.getState().dealingMethod).toBe('A');
    expect(game.getState().dealingDirection).toBe('right');
  });
});
