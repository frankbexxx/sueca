import { CARD_HIERARCHY, Card, GameState } from '../../../types/game';
import { trickWinnerIndex } from '../../../models/games/trickUtils';

const SPADES_TRUMP = 'spades' as const;

export function spadesTrickLeader(state: GameState): number {
  return state.trickLeader ?? 0;
}

/** SP06 — partner seat (0&2 vs 1&3) is currently winning the trick. */
export function partnerIsWinning(playerIndex: number, state: GameState): boolean {
  const trick = state.currentTrick;
  if (trick.length === 0) return false;
  const leader = spadesTrickLeader(state);
  const winner = trickWinnerIndex(trick, leader, SPADES_TRUMP);
  return winner === (playerIndex + 2) % 4;
}

export function cardWouldWinTrickSpades(
  card: Card,
  trickBefore: Card[],
  trickLeader: number
): boolean {
  const trick = [...trickBefore, card];
  const cardIndex = trick.length - 1;
  const winner = trickWinnerIndex(trick, trickLeader, SPADES_TRUMP);
  return winner === (trickLeader + cardIndex) % 4;
}

export function lowestCardIndex(indices: number[], hand: Card[]): number {
  return indices.reduce(
    (best, i) =>
      CARD_HIERARCHY[hand[i].rank] < CARD_HIERARCHY[hand[best].rank] ? i : best,
    indices[0]
  );
}

export function highestCardIndex(indices: number[], hand: Card[]): number {
  return indices.reduce(
    (best, i) =>
      CARD_HIERARCHY[hand[i].rank] > CARD_HIERARCHY[hand[best].rank] ? i : best,
    indices[0]
  );
}

export function pickMinimumWinningIndex(
  valid: number[],
  hand: Card[],
  trick: Card[],
  trickLeader: number
): number | null {
  const winners = valid.filter((i) =>
    cardWouldWinTrickSpades(hand[i], trick, trickLeader)
  );
  if (winners.length === 0) return null;
  return lowestCardIndex(winners, hand);
}

/** SP08 — lowest spade that still wins the trick. */
export function pickLowestWinningSpadeIndex(
  valid: number[],
  hand: Card[],
  trick: Card[],
  trickLeader: number
): number | null {
  const spades = valid.filter((i) => hand[i].suit === 'spades');
  const winners = spades.filter((i) =>
    cardWouldWinTrickSpades(hand[i], trick, trickLeader)
  );
  if (winners.length === 0) return null;
  return lowestCardIndex(winners, hand);
}

/** SP06 — do not steal from partner; forced win uses minimum winner. */
export function playWhenPartnerWinning(
  valid: number[],
  hand: Card[],
  state: GameState
): number {
  const trick = state.currentTrick;
  const leader = spadesTrickLeader(state);
  const nonWinners = valid.filter(
    (i) => !cardWouldWinTrickSpades(hand[i], trick, leader)
  );
  if (nonWinners.length > 0) {
    return lowestCardIndex(nonWinners, hand);
  }
  const forced = pickMinimumWinningIndex(valid, hand, trick, leader);
  return forced ?? lowestCardIndex(valid, hand);
}

/** SP09 — bid met: slough when possible; else minimum winner. */
export function playAvoidWinning(
  valid: number[],
  hand: Card[],
  state: GameState
): number {
  const trick = state.currentTrick;
  const leader = spadesTrickLeader(state);
  const nonWinners = valid.filter(
    (i) => !cardWouldWinTrickSpades(hand[i], trick, leader)
  );
  if (nonWinners.length > 0) {
    return lowestCardIndex(nonWinners, hand);
  }
  const forced = pickMinimumWinningIndex(valid, hand, trick, leader);
  return forced ?? lowestCardIndex(valid, hand);
}
