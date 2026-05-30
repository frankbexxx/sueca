import { AIDifficulty, Card } from '../../../types/game';
import { SpadesBidType } from '../../../models/games/spades/spadesRules';

/**
 * Estimates how many tricks this hand can expect to win.
 * Counts A/K/Q of spades and A/K of other suits.
 */
export function estimateHandBid(hand: Card[]): number {
  let bid = 0;
  for (const card of hand) {
    if (card.suit === 'spades') {
      if (card.rank === 'A') bid += 1;
      else if (card.rank === 'K') bid += 1;
      else if (card.rank === 'Q') bid += 0.5;
    } else if (card.rank === 'A') {
      bid += 1;
    } else if (card.rank === 'K') {
      bid += 0.5;
    }
  }
  return Math.max(0, Math.min(13, Math.round(bid)));
}

/**
 * Hard: same as medium estimate but adds small credit for long spade suits
 * (≥ 4 spades gives one extra expected trick from suit establishment).
 */
function estimateHandBidHard(hand: Card[]): number {
  const base = estimateHandBid(hand);
  const spadeCount = hand.filter((c) => c.suit === 'spades').length;
  const longSuiteBonus = spadeCount >= 4 ? 1 : 0;
  return Math.max(0, Math.min(13, base + longSuiteBonus));
}

/**
 * Chooses an AI bid for Spades, adapting to difficulty level.
 *
 * Easy: random bid between 1 and 4.
 * Medium: estimate-based (original behaviour).
 * Hard: tighter estimate + long-suit bonus; less likely to bid nil randomly.
 */
export function chooseSpadesBid(
  hand: Card[],
  nilEnabled: boolean,
  blindNilEnabled: boolean,
  difficulty: AIDifficulty = 'medium'
): { bid: number; bidType: SpadesBidType } {
  if (difficulty === 'easy') {
    return { bid: Math.floor(Math.random() * 4) + 1, bidType: 'normal' };
  }

  if (difficulty === 'hard') {
    const estimate = estimateHandBidHard(hand);
    if (nilEnabled && estimate === 0 && Math.random() < 0.3) {
      return { bid: 0, bidType: 'nil' };
    }
    return { bid: Math.max(1, estimate), bidType: 'normal' };
  }

  // Medium (original)
  const estimate = estimateHandBid(hand);
  if (nilEnabled && estimate <= 1 && Math.random() < 0.15) {
    return { bid: 0, bidType: 'nil' };
  }
  if (blindNilEnabled && estimate === 0 && Math.random() < 0.05) {
    return { bid: 0, bidType: 'blindNil' };
  }
  return { bid: Math.max(1, estimate), bidType: 'normal' };
}
