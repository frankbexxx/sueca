import { AIDifficulty, Card } from '../../../types/game';

const penaltyScore = (c: Card): number =>
  (c.suit === 'hearts' ? 10 : 0) + (c.rank === 'Q' && c.suit === 'spades' ? 20 : 0);

/**
 * Easy: passes 3 random cards from hand.
 */
function pickPassEasy(hand: Card[]): Card[] {
  const shuffled = [...hand].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

/**
 * Medium: passes the 3 highest-penalty cards (Q♠ > hearts > others).
 */
function pickPassMedium(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => penaltyScore(b) - penaltyScore(a)).slice(0, 3);
}

/**
 * Hard: same as medium but also tries to create a void in spades
 * (pass all spades if ≤ 3 spades and no Q♠, giving freedom to dump later).
 * Falls back to medium if no spade-void opportunity.
 */
function pickPassHard(hand: Card[]): Card[] {
  const spades = hand.filter((c) => c.suit === 'spades');
  const hasQueenSpades = spades.some((c) => c.rank === 'Q');

  if (!hasQueenSpades && spades.length > 0 && spades.length <= 3) {
    const remaining = hand.filter((c) => c.suit !== 'spades');
    const extra = [...remaining]
      .sort((a, b) => penaltyScore(b) - penaltyScore(a))
      .slice(0, 3 - spades.length);
    return [...spades, ...extra];
  }

  return pickPassMedium(hand);
}

/**
 * Chooses 3 cards to pass, adapting to difficulty level.
 */
export function pickAIPassCards(hand: Card[], difficulty: AIDifficulty = 'medium'): Card[] {
  if (difficulty === 'easy') return pickPassEasy(hand);
  if (difficulty === 'hard') return pickPassHard(hand);
  return pickPassMedium(hand);
}
