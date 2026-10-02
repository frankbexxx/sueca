import { GameState } from '../types/game';
import { clearGameSession } from './gameSessionStorage';

/**
 * Spades resume only. A rejected restore must not stay available to Continue.
 * Other variants keep their own failure policy.
 */
export function resumeSpadesOrClearSession(restore: () => GameState): GameState {
  try {
    return restore();
  } catch (error) {
    try {
      clearGameSession('spades');
    } catch {
      /* the restore rejection still has to surface */
    }
    throw error;
  }
}
