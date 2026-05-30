import { GameAdapter } from '../../../models/games/GameAdapter';
import { AIDifficulty, Card, GameState } from '../../../types/game';
import { getLegalIndices } from '../../core/LegalMoveFilter';

const penaltyScore = (c: Card): number =>
  (c.suit === 'hearts' ? 10 : 0) + (c.rank === 'Q' && c.suit === 'spades' ? 20 : 0);

/**
 * Easy: play a random legal card.
 */
function playEasy(valid: number[]): number {
  return valid[Math.floor(Math.random() * valid.length)];
}

/**
 * Medium (original behaviour):
 * Leading → play lowest-penalty card.
 * Following → dump highest-penalty card we legally can.
 */
function playMedium(
  valid: number[],
  player: GameState['players'][number],
  isLeading: boolean
): number {
  const sorted = [...valid].sort((a, b) => penaltyScore(player.hand[b]) - penaltyScore(player.hand[a]));
  return isLeading ? sorted[sorted.length - 1] : sorted[0];
}

/**
 * Hard: same as medium, but when following and off-suit, prefers to dump
 * Q♠ before hearts (higher value = get rid of it first).
 * When leading, avoids leading hearts unless all remaining cards are hearts.
 */
function playHard(
  valid: number[],
  player: GameState['players'][number],
  state: GameState,
  isLeading: boolean
): number {
  if (isLeading) {
    const nonHeartsValid = valid.filter((i) => player.hand[i].suit !== 'hearts');
    const pool = nonHeartsValid.length > 0 ? nonHeartsValid : valid;
    const sorted = [...pool].sort(
      (a, b) => penaltyScore(player.hand[a]) - penaltyScore(player.hand[b])
    );
    return sorted[0];
  }

  const ledSuit = state.currentTrick[0].suit;
  const inSuit = valid.filter((i) => player.hand[i].suit === ledSuit);
  if (inSuit.length > 0) {
    return inSuit.reduce((best, i) =>
      penaltyScore(player.hand[i]) > penaltyScore(player.hand[best]) ? i : best,
      inSuit[0]
    );
  }

  const sorted = [...valid].sort(
    (a, b) => penaltyScore(player.hand[b]) - penaltyScore(player.hand[a])
  );
  return sorted[0];
}

/**
 * Hearts card-play strategy, adapting to difficulty level.
 */
export function chooseHeartsCard(
  adapter: GameAdapter,
  state: GameState,
  playerIndex: number,
  difficulty: AIDifficulty = 'medium'
): number {
  const player = state.players[playerIndex];
  if (!player) return -1;

  const valid = getLegalIndices(adapter, state, playerIndex);
  if (valid.length === 0) return -1;

  const isLeading = state.currentTrick.length === 0;

  if (difficulty === 'easy') return playEasy(valid);
  if (difficulty === 'hard') return playHard(valid, player, state, isLeading);
  return playMedium(valid, player, isLeading);
}
