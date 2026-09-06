import { GameState } from '../../types/game';

/**
 * Canonical deep clone for engine ↔ UI snapshots.
 * Used by getCurrentState() so consumers never share mutable nested refs
 * (hands, tricks, variantState) with the engine source of truth.
 */
export function cloneGameState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}
