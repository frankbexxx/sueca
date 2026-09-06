import { Card, DealingDirection, DealingMethod } from '../../types/game';

/**
 * Seat order for one full pass around the table (4 seats), starting after the dealer.
 * - left (anti-horário): dealer+1, +2, +3, dealer
 * - right (horário): dealer-1, -2, -3, dealer
 */
export function suecaDealSeatOrder(
  dealerIndex: number,
  direction: DealingDirection = 'left'
): number[] {
  if (direction === 'right') {
    return [0, 1, 2, 3].map((i) => (dealerIndex - 1 - i + 8) % 4);
  }
  return [0, 1, 2, 3].map((i) => (dealerIndex + 1 + i) % 4);
}

/** Non-dealer seats in dealing direction (Method B remainder). */
export function suecaDealOthersOrder(
  dealerIndex: number,
  direction: DealingDirection = 'left'
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
 * Does not shuffle — caller supplies the post-cut order.
 */
export function dealSuecaFromCardOrder(
  cards: Card[],
  dealerIndex: number,
  method: DealingMethod,
  direction: DealingDirection = 'left'
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

  if (method === 'A') {
    const order = suecaDealSeatOrder(dealerIndex, direction);
    let lastCard: Card | null = null;
    for (let round = 0; round < 10; round++) {
      for (const playerIndex of order) {
        const card = take();
        hands[playerIndex].push(card);
        lastCard = card;
      }
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

  // Method B: dealer gets trump first, then 9 more; others by direction
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
  for (let round = 0; round < 10; round++) {
    for (const playerIndex of others) {
      hands[playerIndex].push(take());
    }
  }
  return { hands, trumpSuit: trumpCard.suit, trumpCard };
}
