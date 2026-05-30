import { GameAdapter } from '../../models/games/GameAdapter';
import { GameState } from '../../types/game';

/**
 * Last-resort move selector: tries each card in the player's hand in order
 * until one is accepted by adapter.playCard().
 *
 * Returns the index of the card that was successfully played, or -1 if none.
 * This is the same loop that previously lived inline in GameBoard.tsx.
 */
export function playFirstLegal(
  adapter: GameAdapter,
  state: GameState,
  playerIndex: number
): number {
  const player = state.players[playerIndex];
  if (!player) return -1;
  for (let i = 0; i < player.hand.length; i++) {
    if (adapter.playCard(adapter.getCurrentState(), playerIndex, i)) {
      return i;
    }
  }
  return -1;
}
