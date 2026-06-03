import { GameAdapter } from '../../models/games/GameAdapter';
import { Card, GameState } from '../../types/game';
import { cloneCard } from '../shared/clone';

export function extractLegalMoves(
  adapter: GameAdapter,
  state: GameState,
  playerIndex: number
): Card[] {
  const player = state.players[playerIndex];
  if (!player) return [];

  const moves: Card[] = [];
  for (let i = 0; i < player.hand.length; i++) {
    if (adapter.canPlayCard(state, playerIndex, i)) {
      moves.push(cloneCard(player.hand[i]));
    }
  }
  return moves;
}
