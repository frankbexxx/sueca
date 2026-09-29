import {
  Card,
  DealAlignment,
  DealingDirection,
  DealingMethod,
  PlayDirection
} from '../../types/game';
import {
  asSeat,
  dealDirectionFor,
  dealSeatOrder,
  inferTrickLeader,
  nextSeat,
  oppositeDirection,
  physicalRightOf,
  seatAtOffset,
  trumpPlacementFor,
  type Seat,
  type SuecaTrumpPlacement
} from './suecaRules';

/**
 * Sueca seat geometry (UX-SEAT-01 / tableLayout):
 *   index 0 = South, 1 = West, 2 = North, 3 = East
 *
 * ARCH-SUECA-05: canonical deal is {@link dealSuecaCanonical} (playDirection + dealAlignment).
 * Legacy Method A/B × absolute DealingDirection remains as a TEMPORARY UI/persistence bridge.
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
 * under Sueca anti-clockwise play.
 */
export function suecaSeatAtTrickOffset(trickLeader: number, trickOffset: number): number {
  return seatAtOffset(asSeat(trickLeader), trickOffset, 'right');
}

/** Infer trick leader under Sueca anti-clockwise order. */
export function suecaInferTrickLeader(playerIndex: number, turnIndex: number): number {
  return inferTrickLeader(asSeat(playerIndex), turnIndex, 'right');
}

/** Clockwise seat at trick offset (Hearts / Spades / King). */
export function clockwiseSeatAtTrickOffset(trickLeader: number, trickOffset: number): number {
  return seatAtOffset(asSeat(trickLeader), trickOffset, 'left');
}

/**
 * Seat order for one full deal pass (4 seats).
 * Legacy absolute direction — prefer {@link dealSeatOrder} with play + alignment.
 */
export function suecaDealSeatOrder(
  dealerIndex: number,
  direction: DealingDirection = 'right'
): number[] {
  const dealer = asSeat(dealerIndex);
  const dir = direction === 'left' ? 'left' : 'right';
  return dealSeatOrder(dealer, dir, 'same');
}

/** Non-dealer seats in dealing direction (legacy Method B remainder). */
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
  /** Canonical deal order (block recipients). Present for canonical deals. */
  dealOrder?: Seat[];
  trumpPlacement?: SuecaTrumpPlacement;
  /** True when deal used playDirection + dealAlignment (not unsupported legacy absolute). */
  canonical?: boolean;
}

/**
 * Map legacy Method × absolute DealingDirection → DealAlignment when unambiguous.
 *
 * Supported (product):
 * - Method A + dealingDir === playDirection → same
 * - Method B + dealingDir === opposite(play) → opposite
 *
 * Unsupported (UI still reachable; no product meaning invented):
 * - A + left when play is right
 * - B + right when play is right
 * - and the LEFT-play mirrors
 *
 * Returns null for unsupported combinations.
 */
export function resolveLegacyDealAlignment(
  playDirection: PlayDirection,
  method: DealingMethod,
  dealingDirection: DealingDirection
): DealAlignment | null {
  const play = playDirection === 'left' ? 'left' : 'right';
  const dir = dealingDirection === 'left' ? 'left' : 'right';
  if (method === 'A' && dir === play) return 'same';
  if (method === 'B' && dir === oppositeDirection(play)) return 'opposite';
  return null;
}

/** Legacy UI fields that express a canonical alignment for the current play direction. */
export function legacyFieldsForAlignment(
  playDirection: PlayDirection,
  alignment: DealAlignment
): { dealingMethod: DealingMethod; dealingDirection: DealingDirection } {
  const play = playDirection === 'left' ? 'left' : 'right';
  if (alignment === 'same') {
    return { dealingMethod: 'A', dealingDirection: play };
  }
  return { dealingMethod: 'B', dealingDirection: oppositeDirection(play) };
}

function makeTrumpCard(card: Card): Card {
  return {
    suit: card.suit,
    rank: card.rank,
    id: `trump_${card.suit}_${card.rank}`
  };
}

/**
 * Canonical Sueca block deal (ARCH-SUECA-05).
 * Index 0 of `cards` is dealt first. Does not shuffle.
 *
 * SAME: opponents get 10-card blocks in play direction; dealer gets 9 + face-up trump (10th).
 * OPPOSITE: dealer face-up first (trump) + 9; then three 10-blocks opposite to play.
 */
export function dealSuecaCanonical(
  cards: Card[],
  dealerIndex: number,
  playDirection: PlayDirection,
  alignment: DealAlignment
): SuecaDealResult {
  if (cards.length !== 40) {
    throw new Error(`Sueca deal expects 40 cards, got ${cards.length}`);
  }
  const dealer = asSeat(dealerIndex);
  const play = playDirection === 'left' ? 'left' : 'right';
  const align: DealAlignment = alignment === 'opposite' ? 'opposite' : 'same';
  const order = dealSeatOrder(dealer, play, align);
  const hands: Card[][] = [[], [], [], []];
  const deck = [...cards];
  const take = (): Card => {
    const card = deck.shift();
    if (!card) throw new Error('Deck exhausted during Sueca deal');
    return card;
  };
  const giveBlock = (playerIndex: number, count: number): void => {
    for (let i = 0; i < count; i++) {
      hands[playerIndex].push(take());
    }
  };

  let trumpCard: Card;

  if (align === 'same') {
    // Three full blocks to non-dealer seats (order ends with dealer).
    for (let i = 0; i < 3; i++) {
      giveBlock(order[i], 10);
    }
    // Dealer: 9 + final face-up trump as 10th card.
    giveBlock(dealer, 9);
    const faceUp = take();
    hands[dealer].push(faceUp);
    trumpCard = makeTrumpCard(faceUp);
  } else {
    // Dealer first: face-up trump + 9 more; then others in opposite deal direction.
    const faceUp = take();
    hands[dealer].push(faceUp);
    trumpCard = makeTrumpCard(faceUp);
    giveBlock(dealer, 9);
    for (let i = 1; i < 4; i++) {
      giveBlock(order[i], 10);
    }
  }

  if (deck.length !== 0) {
    throw new Error(`Sueca deal left ${deck.length} undealt cards`);
  }

  return {
    hands,
    trumpSuit: trumpCard.suit,
    trumpCard,
    dealOrder: order,
    trumpPlacement: trumpPlacementFor(align),
    canonical: true
  };
}

/**
 * Legacy absolute Method A/B × DealingDirection (UNSUPPORTED product combinations).
 * Preserves pre-Phase-3 behaviour without inventing PlayDirection+alignment semantics.
 */
export function dealSuecaLegacyAbsolute(
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
    const trumpCard = lastCard ? makeTrumpCard(lastCard) : null;
    return {
      hands,
      trumpSuit: trumpCard?.suit ?? null,
      trumpCard,
      canonical: false
    };
  }

  const trumpOriginal = take();
  hands[dealerIndex].push(trumpOriginal);
  const trumpCard = makeTrumpCard(trumpOriginal);
  for (let i = 0; i < 9; i++) {
    hands[dealerIndex].push(take());
  }
  const others = suecaDealOthersOrder(dealerIndex, direction);
  for (const playerIndex of others) {
    giveBlock(playerIndex, 10);
  }
  return { hands, trumpSuit: trumpCard.suit, trumpCard, canonical: false };
}

/**
 * Bridge entry: prefer canonical policy when legacy Method×Direction is unambiguous
 * for `playDirection`; otherwise fall back to legacy absolute deal (non-product).
 *
 * @deprecated Prefer {@link dealSuecaCanonical} with explicit dealAlignment.
 */
export function dealSuecaFromCardOrder(
  cards: Card[],
  dealerIndex: number,
  method: DealingMethod,
  direction: DealingDirection = 'right',
  playDirection: PlayDirection = 'right'
): SuecaDealResult {
  const alignment = resolveLegacyDealAlignment(playDirection, method, direction);
  if (alignment) {
    return dealSuecaCanonical(cards, dealerIndex, playDirection, alignment);
  }
  return dealSuecaLegacyAbsolute(cards, dealerIndex, method, direction);
}

/** Re-export for callers that need derived absolute deal rotation. */
export { dealDirectionFor };
