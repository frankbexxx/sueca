/**
 * Canonical Sueca domain vocabulary + pure geometry (ARCH-SUECA-03 / Phase 0 freeze).
 *
 * Seat geometry (UX-SEAT-01):
 *   0 = South, 1 = West, 2 = North, 3 = East
 *
 * PlayDirection physical meaning (stable — do not overload):
 *   'right' = physical right = anti-clockwise = step +3 mod 4
 *   'left'  = physical left  = clockwise      = step +1 mod 4
 *
 * Runtime migration status:
 *   Phase 1: vocabulary + helpers
 *   Phase 2: Game engine uses playDirection (default RIGHT)
 *   AI/CI/render still hard-code RIGHT/ACW until later phases
 */

import type { PlayDirection } from '../../types/game';

export type { PlayDirection };

export type Seat = 0 | 1 | 2 | 3;

/**
 * Per-hand deal packaging relative to session {@link PlayDirection}.
 * - same: distribute in play direction (normal / trump = dealer last card)
 * - opposite: distribute opposite to play (trump = dealer first card)
 */
export type DealAlignment = 'same' | 'opposite';

export interface SuecaSessionRules {
  playDirection: PlayDirection;
}

export interface SuecaHandDealPolicy {
  alignment: DealAlignment;
}

/** Where the trump-defining card sits in the dealer's hand block. */
export type SuecaTrumpPlacement = 'dealer-last-card' | 'dealer-first-card';

const SEATS: readonly Seat[] = [0, 1, 2, 3];

export function asSeat(index: number): Seat {
  return (((index % 4) + 4) % 4) as Seat;
}

/** Physical right of a seat (independent of PlayDirection). */
export function physicalRightOf(seat: Seat): Seat {
  return asSeat(seat + 3);
}

/** Physical left of a seat (independent of PlayDirection). */
export function physicalLeftOf(seat: Seat): Seat {
  return asSeat(seat + 1);
}

/** Partner (opposite seat). */
export function partnerOf(seat: Seat): Seat {
  return asSeat(seat + 2);
}

export function oppositeDirection(dir: PlayDirection): PlayDirection {
  return dir === 'right' ? 'left' : 'right';
}

function stepFor(dir: PlayDirection): 1 | 3 {
  return dir === 'right' ? 3 : 1;
}

/** Next seat in play (or deal-rotation) direction. */
export function nextSeat(seat: Seat, playDirection: PlayDirection): Seat {
  return asSeat(seat + stepFor(playDirection));
}

/**
 * Seat at trick/deal offset from `start` (offset 0 = start).
 * RIGHT: start, right, partner, left
 * LEFT:  start, left, partner, right
 */
export function seatAtOffset(
  start: Seat,
  offset: number,
  playDirection: PlayDirection
): Seat {
  const steps = ((offset % 4) + 4) % 4;
  return asSeat(start + stepFor(playDirection) * steps);
}

/** First trick leader for a hand — depends only on PlayDirection. */
export function firstLeader(dealer: Seat, playDirection: PlayDirection): Seat {
  return nextSeat(dealer, playDirection);
}

/** Next-hand dealer — follows PlayDirection (same step as firstLeader). */
export function nextDealer(dealer: Seat, playDirection: PlayDirection): Seat {
  return nextSeat(dealer, playDirection);
}

/**
 * Infer trick leader from a seat that played at `turnIndex` (0 = lead)
 * under the given play direction. Inverse of {@link seatAtOffset}.
 */
export function inferTrickLeader(
  playerSeat: Seat,
  turnIndex: number,
  playDirection: PlayDirection
): Seat {
  const steps = ((turnIndex % 4) + 4) % 4;
  if (playDirection === 'right') {
    // Inverse of +3*steps: +1*steps
    return asSeat(playerSeat + steps);
  }
  return asSeat(playerSeat - steps);
}

/**
 * Absolute deal rotation derived from session play + hand alignment.
 * RIGHT+same→right, RIGHT+opposite→left, LEFT+same→left, LEFT+opposite→right.
 */
export function dealDirectionFor(
  playDirection: PlayDirection,
  alignment: DealAlignment
): PlayDirection {
  return alignment === 'same' ? playDirection : oppositeDirection(playDirection);
}

/**
 * Block deal seat order (4 seats). Does not deal cards.
 *
 * - same: starts at first recipient in deal direction, ends with dealer
 * - opposite: starts with dealer, then three seats in opposite deal direction
 */
export function dealSeatOrder(
  dealer: Seat,
  playDirection: PlayDirection,
  alignment: DealAlignment
): Seat[] {
  const dealDir = dealDirectionFor(playDirection, alignment);
  if (alignment === 'same') {
    return [
      seatAtOffset(dealer, 1, dealDir),
      seatAtOffset(dealer, 2, dealDir),
      seatAtOffset(dealer, 3, dealDir),
      dealer
    ];
  }
  return [
    dealer,
    seatAtOffset(dealer, 1, dealDir),
    seatAtOffset(dealer, 2, dealDir),
    seatAtOffset(dealer, 3, dealDir)
  ];
}

export function trumpPlacementFor(alignment: DealAlignment): SuecaTrumpPlacement {
  return alignment === 'same' ? 'dealer-last-card' : 'dealer-first-card';
}

/**
 * Shuffler is always the player physically to the dealer's RIGHT.
 * Independent of PlayDirection and DealAlignment.
 */
export function shufflerForDealer(dealer: Seat): Seat {
  return physicalRightOf(dealer);
}

/**
 * Cutter is the partner of the shuffler (= physical LEFT of dealer).
 * Independent of PlayDirection and DealAlignment.
 */
export function cutterForDealer(dealer: Seat): Seat {
  return partnerOf(shufflerForDealer(dealer));
}

/** All seats — useful for table-driven tests. */
export function allSeats(): readonly Seat[] {
  return SEATS;
}
