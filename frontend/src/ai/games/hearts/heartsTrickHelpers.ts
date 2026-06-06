import { CARD_HIERARCHY, Card, GameState } from '../../../types/game';
import { trickWinnerIndex } from '../../../models/games/trickUtils';

export function penaltyScore(card: Card): number {
  return (card.suit === 'hearts' ? 10 : 0) + (card.rank === 'Q' && card.suit === 'spades' ? 20 : 0);
}

export function isDangerousCard(card: Card): boolean {
  return card.suit === 'hearts' || (card.rank === 'Q' && card.suit === 'spades');
}

/** Mirror HeartsGame scoring — do not import cardIntelligence. */
export function heartsTrickPoints(trick: Card[]): number {
  return trick.reduce((sum, card) => {
    if (card.suit === 'hearts') return sum + 1;
    if (card.rank === 'Q' && card.suit === 'spades') return sum + 13;
    return sum;
  }, 0);
}

export function heartsTrickLeader(state: GameState): number {
  return state.trickLeader ?? 0;
}

export function cardWouldWinTrickHearts(
  card: Card,
  trickBefore: Card[],
  trickLeader: number
): boolean {
  const trick = [...trickBefore, card];
  const cardIndex = trick.length - 1;
  const winner = trickWinnerIndex(trick, trickLeader, null);
  return winner === (trickLeader + cardIndex) % 4;
}

export function pickLowestPenaltyIndex(indices: number[], hand: Card[]): number {
  return indices.reduce(
    (best, i) => (penaltyScore(hand[i]) < penaltyScore(hand[best]) ? i : best),
    indices[0]
  );
}

export function pickHighestPenaltyIndex(indices: number[], hand: Card[]): number {
  return indices.reduce(
    (best, i) => (penaltyScore(hand[i]) > penaltyScore(hand[best]) ? i : best),
    indices[0]
  );
}

export function pickLowestRankIndex(indices: number[], hand: Card[]): number {
  return indices.reduce(
    (best, i) =>
      CARD_HIERARCHY[hand[i].rank] < CARD_HIERARCHY[hand[best].rank] ? i : best,
    indices[0]
  );
}

function pickLowestPenaltyAmongWinners(
  valid: number[],
  hand: Card[],
  trick: Card[],
  trickLeader: number
): number {
  const winners = valid.filter((i) => cardWouldWinTrickHearts(hand[i], trick, trickLeader));
  if (winners.length === 0) return pickHighestPenaltyIndex(valid, hand);
  return pickLowestPenaltyIndex(winners, hand);
}

function shouldAvoidWinningPenalizingTrick(trick: Card[]): boolean {
  if (trick.length === 0) return false;
  return heartsTrickPoints(trick) > 0 || trick[0].suit === 'hearts';
}

/** H13 → H07 → H11 → H02 pipeline for medium/hard follow. */
export function playFollow(
  valid: number[],
  hand: Card[],
  state: GameState
): number {
  const trick = state.currentTrick;
  const leader = heartsTrickLeader(state);
  const ledSuit = trick[0].suit;

  // H13 — clean danger on our 0-point trick (4th player)
  if (trick.length === 3 && heartsTrickPoints(trick) === 0) {
    const dangerous = valid.filter((i) => isDangerousCard(hand[i]));
    if (dangerous.length > 0) {
      return pickHighestPenaltyIndex(dangerous, hand);
    }
  }

  // H07 — avoid winning penalizing tricks
  if (shouldAvoidWinningPenalizingTrick(trick)) {
    const nonWinners = valid.filter((i) => !cardWouldWinTrickHearts(hand[i], trick, leader));
    if (nonWinners.length > 0) {
      return pickLowestPenaltyIndex(nonWinners, hand);
    }
    return pickLowestPenaltyAmongWinners(valid, hand, trick, leader);
  }

  // H11 — spades led in-suit: lowest spade, not Q♠ by default
  if (ledSuit === 'spades') {
    const inSuitSpades = valid.filter((i) => hand[i].suit === 'spades');
    if (inSuitSpades.length > 0) {
      return pickLowestRankIndex(inSuitSpades, hand);
    }
  }

  // H02 — default dump highest penalty (off-suit slough)
  return pickHighestPenaltyIndex(valid, hand);
}

export function playLead(valid: number[], hand: Card[], hard: boolean): number {
  const pool =
    hard && valid.some((i) => hand[i].suit !== 'hearts')
      ? valid.filter((i) => hand[i].suit !== 'hearts')
      : valid;
  return pickLowestPenaltyIndex(pool, hand);
}
