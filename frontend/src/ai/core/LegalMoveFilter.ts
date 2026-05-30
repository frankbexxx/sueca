import { GameAdapter } from '../../models/games/GameAdapter';
import { GameState } from '../../types/game';

/**
 * Returns the indices of all legal cards the player at playerIndex can play.
 * Delegates entirely to adapter.canPlayCard() — no duplicate rule logic here.
 */
export function getLegalIndices(
  adapter: GameAdapter,
  state: GameState,
  playerIndex: number
): number[] {
  const player = state.players[playerIndex];
  if (!player) return [];
  const indices: number[] = [];
  for (let i = 0; i < player.hand.length; i++) {
    if (adapter.canPlayCard(state, playerIndex, i)) {
      indices.push(i);
    }
  }
  return indices;
}
