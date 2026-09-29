import { Card, DealingDirection, DealingMethod } from '../../types/game';
import {
  asSeat,
  dealSeatOrder,
  inferTrickLeader,
  nextSeat,
  physicalRightOf,
  seatAtOffset
} from './suecaRules';

/**
 * Sueca seat geometry (UX-SEAT-01 / tableLayout):
 *   index 0 = South, 1 = West, 2 = North, 3 = East
 *
 * From a seated dealer facing the table centre:
 *   physical RIGHT = East when dealer is South = (dealer + 3) % 4
 *   physical LEFT  = West when dealer is South = (dealer + 1) % 4
 *
 * Anti-clockwise around the table (viewed from above) = to the dealer's right
 * = index steps of -1 / +3.
 *
 * DealingDirection storage (legacy names — do not flip without migration):
 *   'right' = anti-clockwise / to the right — traditional default (dealer+3 first)
 *   'left'  = clockwise / to the left — alternative deal sense (dealer+1 first)
 *
 * ARCH-SUECA-03: pure ACW geometry below delegates to canonical suecaRules
 * with PlayDirection 'right' so current runtime behaviour is unchanged.
 * Prefer suecaRules for new direction-aware code.
 */

/** Player physically to the dealer's right (Sueca first recipient / first leader). */
export function suecaPhysicalRightOf(dealerIndex: number): number {
  return physicalRightOf(asSeat(dealerIndex));
}

/** Next seat anti-clockwise (play progression / "to the right"). */
export function suecaNextAntiClockwise(playerIndex: number): number {
  return nextSeat(asSeat(playerIndex), 'right');
}

/**
 * Seat that played card at trick position `trickOffset` (0 = leader)
 * under Sueca anti-clockwise play. Equivalent to applying
 * {@link suecaNextAntiClockwise} `trickOffset` times from the leader.
 *
 * Formula: `(trickLeader + 3 * trickOffset) % 4`
 * — NOT `(trickLeader + trickOffset) % 4` (that is clockwise / Hearts-Spades-King).
 */
export function suecaSeatAtTrickOffset(trickLeader: number, trickOffset: number): number {
  return seatAtOffset(asSeat(trickLeader), trickOffset, 'right');
}

/**
 * Infer trick leader from a seat that played at `turnIndex` (0 = lead)
 * under Sueca anti-clockwise order.
 * Inverse of {@link suecaSeatAtTrickOffset}.
 */
export function suecaInferTrickLeader(playerIndex: number, turnIndex: number): number {
  return inferTrickLeader(asSeat(playerIndex), turnIndex, 'right');
}

/**
 * Clockwise seat at trick offset (Hearts / Spades / King): `(leader + offset) % 4`.
 * Not Sueca play — kept for other variants.
 */
export function clockwiseSeatAtTrickOffset(trickLeader: number, trickOffset: number): number {
  return seatAtOffset(asSeat(trickLeader), trickOffset, 'left');
}

/**
 * Seat order for one full deal pass (4 seats).
 * - right (anti-clockwise, traditional): physical-right first → … → dealer last
 * - left (clockwise, alternative sense): physical-left first → … → dealer last
 */
export function suecaDealSeatOrder(
  dealerIndex: number,
  direction: DealingDirection = 'right'
): number[] {
  const dealer = asSeat(dealerIndex);
  const dir = direction === 'left' ? 'left' : 'right';
  // Legacy Method A order = canonical same-alignment order for that absolute deal dir.
  return dealSeatOrder(dealer, dir, 'same');
}

/** Non-dealer seats in dealing direction (Method B remainder). */
export function suecaDealOthersOrder(
  dealerIndex: number,
  direction: DealingDirection = 'right'
): number[] {
  return suecaDealSeatOrder(dealerIndex, direction).filter((i) => i !== dealerIndex);
}

export interface SuecaDealResult {
  hands: Card[][];
  trumpSuit: Card['suit'] | null;
  trumpCard: Card | null;
}

/**
 * Pure Sueca deal from a fixed 40-card sequence (index 0 dealt first).
 * BLOCK dealing: each player receives 10 consecutive cards before the next seat.
 * Does not shuffle — caller supplies the post-cut order.
 *
 * Legacy Method A/B × DealingDirection — unchanged in Phase 1.
 * Future: SuecaHandDealPolicy alignment (same/opposite) via suecaRules.
 */
export function dealSuecaFromCardOrder(
  cards: Card[],
  dealerIndex: number,
  method: DealingMethod,
  direction: DealingDirection = 'right'
): SuecaDealResult {
  if (cards.length !== 40) {
    throw new Error(`Sueca deal expects 40 cards, got ${cards.length}`);
  }
  const hands: Card[][] = [[], [], [], []];
  const deck = [...cards];
  const take = (): Card => {
    const card = deck.shift();
    if (!card) throw new Error('Deck exhausted during Sueca deal');
    return card;
  };

  const giveBlock = (playerIndex: number, count: number): Card | null => {
    let last: Card | null = null;
    for (let i = 0; i < count; i++) {
      const card = take();
      hands[playerIndex].push(card);
      last = card;
    }
    return last;
  };

  if (method === 'A') {
    const order = suecaDealSeatOrder(dealerIndex, direction);
    let lastCard: Card | null = null;
    for (const playerIndex of order) {
      lastCard = giveBlock(playerIndex, 10);
    }
    const trumpCard = lastCard
      ? {
          suit: lastCard.suit,
          rank: lastCard.rank,
          id: `trump_${lastCard.suit}_${lastCard.rank}`
        }
      : null;
    return { hands, trumpSuit: trumpCard?.suit ?? null, trumpCard };
  }

  // Method B (alternative): dealer receives first 10-card block; trump = first/top card.
  // Remaining seats get 10-card blocks in the configured deal direction.
  const trumpOriginal = take();
  hands[dealerIndex].push(trumpOriginal);
  const trumpCard: Card = {
    suit: trumpOriginal.suit,
    rank: trumpOriginal.rank,
    id: `trump_${trumpOriginal.suit}_${trumpOriginal.rank}`
  };
  for (let i = 0; i < 9; i++) {
    hands[dealerIndex].push(take());
  }
  const others = suecaDealOthersOrder(dealerIndex, direction);
  for (const playerIndex of others) {
    giveBlock(playerIndex, 10);
  }
  return { hands, trumpSuit: trumpCard.suit, trumpCard };
}
