import {
  Card,
  DealAlignment,
  PlayDirection
} from '../../types/game';
import {
  asSeat,
  dealDirectionFor,
  dealSeatOrder,
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
 * Canonical deal: {@link dealSuecaCanonical}(playDirection, dealAlignment).
 */

/** Player physically to the dealer's right (Sueca first recipient / first leader). */
export function suecaPhysicalRightOf(dealerIndex: number): number {
  return physicalRightOf(asSeat(dealerIndex));
}

/** Clockwise seat at trick offset (Hearts / Spades / King). */
export function clockwiseSeatAtTrickOffset(trickLeader: number, trickOffset: number): number {
  return seatAtOffset(asSeat(trickLeader), trickOffset, 'left');
}

export interface SuecaDealResult {
  hands: Card[][];
  trumpSuit: Card['suit'] | null;
  trumpCard: Card | null;
  /** Canonical deal order (block recipients). */
  dealOrder?: Seat[];
  trumpPlacement?: SuecaTrumpPlacement;
  /** Always true for {@link dealSuecaCanonical}. */
  canonical?: boolean;
}

function makeTrumpCard(card: Card): Card {
  return {
    suit: card.suit,
    rank: card.rank,
    id: `trump_${card.suit}_${card.rank}`
  };
}

/**
 * Canonical Sueca block deal.
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
    for (let i = 0; i < 3; i++) {
      giveBlock(order[i], 10);
    }
    giveBlock(dealer, 9);
    const faceUp = take();
    hands[dealer].push(faceUp);
    trumpCard = makeTrumpCard(faceUp);
  } else {
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

/** Re-export for callers that need derived absolute deal rotation. */
export { dealDirectionFor };
