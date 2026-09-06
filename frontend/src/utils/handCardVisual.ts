import { GameState } from '../types/game';

/** Whether the local hand may accept a play action (UI gate; not a rules change). */
export function isHandPlayActionAllowed(gameState: GameState): boolean {
  return (
    !gameState.isGameOver &&
    !gameState.isPaused &&
    !gameState.waitingForTrickEnd &&
    !gameState.waitingForRoundStart &&
    !gameState.waitingForRoundEnd &&
    !gameState.waitingForGameStart
  );
}

export type HandCardVisualState = 'playable' | 'illegal' | 'hand-inactive';

/**
 * Map engine playability into hand card visual state.
 * When no card is playable (not your turn / waits), use uniform hand-inactive
 * instead of per-card "illegal" styling.
 */
export function resolveHandCardVisualState(options: {
  readOnly: boolean;
  isPlayable: boolean;
  handHasPlayable: boolean;
  isPassSelected?: boolean;
}): HandCardVisualState {
  if (options.isPassSelected) return 'playable';
  if (options.readOnly || !options.handHasPlayable) return 'hand-inactive';
  return options.isPlayable ? 'playable' : 'illegal';
}

export function handCardVisualClassName(state: HandCardVisualState): string {
  switch (state) {
    case 'playable':
      return 'card-hand--playable';
    case 'illegal':
      return 'card-hand--illegal';
    case 'hand-inactive':
      return 'card-hand--hand-inactive';
  }
}
