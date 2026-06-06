import { GameAdapter } from '../../../models/games/GameAdapter';
import { AIDifficulty, GameState } from '../../../types/game';
import { getLegalIndices } from '../../core/LegalMoveFilter';
import { shouldPlayRandom } from '../../core/DifficultyProfile';
import { playFollow, playLead } from './heartsTrickHelpers';

/**
 * Easy: play a random legal card.
 */
function playEasy(valid: number[]): number {
  return valid[Math.floor(Math.random() * valid.length)];
}

function playMedium(
  valid: number[],
  player: GameState['players'][number],
  state: GameState,
  isLeading: boolean
): number {
  const hand = player.hand;
  if (isLeading) return playLead(valid, hand, false);
  return playFollow(valid, hand, state);
}

function playHard(
  valid: number[],
  player: GameState['players'][number],
  state: GameState,
  isLeading: boolean
): number {
  const hand = player.hand;
  if (isLeading) return playLead(valid, hand, true);
  return playFollow(valid, hand, state);
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

  if (shouldPlayRandom(difficulty)) return playEasy(valid);
  if (difficulty === 'hard') return playHard(valid, player, state, isLeading);
  return playMedium(valid, player, state, isLeading);
}
