/**
 * ARCH-SUECA-03 — exhaustive pure contract for canonical Sueca geometry.
 * No engine / UI wiring — vocabulary + helpers only.
 */

import { describe, expect, it } from 'vitest';
import {
  allSeats,
  asSeat,
  cutterForDealer,
  dealDirectionFor,
  dealSeatOrder,
  firstLeader,
  inferTrickLeader,
  nextDealer,
  nextSeat,
  oppositeDirection,
  partnerOf,
  physicalLeftOf,
  physicalRightOf,
  seatAtOffset,
  shufflerForDealer,
  trumpPlacementFor,
  type DealAlignment,
  type PlayDirection,
  type Seat
} from './suecaRules';
import {
  suecaInferTrickLeader,
  suecaNextAntiClockwise,
  suecaPhysicalRightOf,
  suecaSeatAtTrickOffset
} from './suecaDeal';

const SEATS = allSeats();
const PLAY_DIRS: PlayDirection[] = ['right', 'left'];
const ALIGNMENTS: DealAlignment[] = ['same', 'opposite'];

describe('suecaRules — seat geometry', () => {
  it.each(SEATS)('seat %s: physical right/left/partner', (seat) => {
    expect(physicalRightOf(seat)).toBe(asSeat(seat + 3));
    expect(physicalLeftOf(seat)).toBe(asSeat(seat + 1));
    expect(partnerOf(seat)).toBe(asSeat(seat + 2));
    expect(partnerOf(partnerOf(seat))).toBe(seat);
  });

  it('partners are 0↔2 and 1↔3', () => {
    expect(partnerOf(0)).toBe(2);
    expect(partnerOf(2)).toBe(0);
    expect(partnerOf(1)).toBe(3);
    expect(partnerOf(3)).toBe(1);
  });

  it('seat 0 RIGHT offsets', () => {
    expect(nextSeat(0, 'right')).toBe(3);
    expect([0, 1, 2, 3].map((o) => seatAtOffset(0, o, 'right'))).toEqual([0, 3, 2, 1]);
  });

  it('seat 0 LEFT offsets', () => {
    expect(nextSeat(0, 'left')).toBe(1);
    expect([0, 1, 2, 3].map((o) => seatAtOffset(0, o, 'left'))).toEqual([0, 1, 2, 3]);
  });

  it.each(SEATS)('seat %s: full RIGHT/LEFT offset table', (seat) => {
    for (const dir of PLAY_DIRS) {
      expect(seatAtOffset(seat, 0, dir)).toBe(seat);
      expect(seatAtOffset(seat, 1, dir)).toBe(nextSeat(seat, dir));
      expect(seatAtOffset(seat, 2, dir)).toBe(partnerOf(seat));
      expect(seatAtOffset(seat, 4, dir)).toBe(seat);
    }
  });

  it('oppositeDirection swaps', () => {
    expect(oppositeDirection('right')).toBe('left');
    expect(oppositeDirection('left')).toBe('right');
  });
});

describe('suecaRules — first leader & dealer rotation', () => {
  it.each(SEATS)('dealer %s × play directions', (dealer) => {
    expect(firstLeader(dealer, 'right')).toBe(physicalRightOf(dealer));
    expect(firstLeader(dealer, 'left')).toBe(physicalLeftOf(dealer));
    expect(nextDealer(dealer, 'right')).toBe(physicalRightOf(dealer));
    expect(nextDealer(dealer, 'left')).toBe(physicalLeftOf(dealer));
    expect(nextDealer(dealer, 'right')).toBe(firstLeader(dealer, 'right'));
    expect(nextDealer(dealer, 'left')).toBe(firstLeader(dealer, 'left'));
  });
});

describe('suecaRules — shuffler / cutter (independent of play/deal)', () => {
  it.each(SEATS)('dealer %s: shuffler = physical right; cutter = partner of shuffler', (dealer) => {
    const shuffler = shufflerForDealer(dealer);
    const cutter = cutterForDealer(dealer);
    expect(shuffler).toBe(physicalRightOf(dealer));
    expect(cutter).toBe(partnerOf(shuffler));
    expect(cutter).toBe(physicalLeftOf(dealer));
  });

  it('dealer 0 → shuffler 3, cutter 1', () => {
    expect(shufflerForDealer(0)).toBe(3);
    expect(cutterForDealer(0)).toBe(1);
  });

  it('shuffler/cutter ignore PlayDirection and DealAlignment', () => {
    for (const dealer of SEATS) {
      const baseS = shufflerForDealer(dealer);
      const baseC = cutterForDealer(dealer);
      for (const _dir of PLAY_DIRS) {
        for (const _align of ALIGNMENTS) {
          expect(shufflerForDealer(dealer)).toBe(baseS);
          expect(cutterForDealer(dealer)).toBe(baseC);
        }
      }
    }
  });
});

describe('suecaRules — deal alignment & order', () => {
  it('dealDirectionFor matrix', () => {
    expect(dealDirectionFor('right', 'same')).toBe('right');
    expect(dealDirectionFor('right', 'opposite')).toBe('left');
    expect(dealDirectionFor('left', 'same')).toBe('left');
    expect(dealDirectionFor('left', 'opposite')).toBe('right');
  });

  it('trumpPlacementFor', () => {
    expect(trumpPlacementFor('same')).toBe('dealer-last-card');
    expect(trumpPlacementFor('opposite')).toBe('dealer-first-card');
  });

  it('dealer 0 canonical dealSeatOrder skeletons', () => {
    expect(dealSeatOrder(0, 'right', 'same')).toEqual([3, 2, 1, 0]);
    expect(dealSeatOrder(0, 'right', 'opposite')).toEqual([0, 1, 2, 3]);
    expect(dealSeatOrder(0, 'left', 'same')).toEqual([1, 2, 3, 0]);
    expect(dealSeatOrder(0, 'left', 'opposite')).toEqual([0, 3, 2, 1]);
  });

  it.each(SEATS)('dealer %s: same ends with dealer; opposite starts with dealer', (dealer) => {
    for (const play of PLAY_DIRS) {
      const same = dealSeatOrder(dealer, play, 'same');
      const opp = dealSeatOrder(dealer, play, 'opposite');
      expect(same).toHaveLength(4);
      expect(opp).toHaveLength(4);
      expect(new Set(same).size).toBe(4);
      expect(new Set(opp).size).toBe(4);
      expect(same[3]).toBe(dealer);
      expect(opp[0]).toBe(dealer);
      expect(same[0]).toBe(firstLeader(dealer, dealDirectionFor(play, 'same')));
    }
  });
});

describe('suecaRules — inferTrickLeader inverts seatAtOffset', () => {
  it.each(SEATS)('round-trip for seat %s', (leader) => {
    for (const dir of PLAY_DIRS) {
      for (let turn = 0; turn < 4; turn++) {
        const seat = seatAtOffset(leader, turn, dir);
        expect(inferTrickLeader(seat, turn, dir)).toBe(leader);
      }
    }
  });
});

describe('suecaRules — legacy bridge preserves RIGHT/ACW outputs', () => {
  it.each(SEATS)('suecaPhysicalRightOf(%s) === physicalRightOf', (s) => {
    expect(suecaPhysicalRightOf(s)).toBe(physicalRightOf(s));
  });

  it.each(SEATS)('suecaNextAntiClockwise(%s) === nextSeat(right)', (s) => {
    expect(suecaNextAntiClockwise(s)).toBe(nextSeat(s, 'right'));
  });

  it('suecaSeatAtTrickOffset matches seatAtOffset(..., right)', () => {
    for (const leader of SEATS) {
      for (let o = 0; o < 4; o++) {
        expect(suecaSeatAtTrickOffset(leader, o)).toBe(seatAtOffset(leader, o, 'right'));
      }
    }
  });

  it('suecaInferTrickLeader matches inferTrickLeader(..., right)', () => {
    for (const seat of SEATS) {
      for (let t = 0; t < 4; t++) {
        expect(suecaInferTrickLeader(seat, t)).toBe(inferTrickLeader(seat, t, 'right'));
      }
    }
  });
});
