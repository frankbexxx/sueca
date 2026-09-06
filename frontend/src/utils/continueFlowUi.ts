import { GameState } from '../types/game';

export interface ContinueFlowOverlayFlags {
  /** Hearts pass, Spades bid, King festa sheet, etc. */
  flowOverlayActive?: boolean;
}

/**
 * Whether the trick-end Continue action is allowed by engine waits.
 * Does not change when finishTrick may run — only reflects existing flags.
 */
export function isTrickContinueActionAllowed(gameState: GameState): boolean {
  return (
    gameState.waitingForTrickEnd &&
    !gameState.isGameOver &&
    !gameState.waitingForRoundEnd &&
    !gameState.waitingForRoundStart &&
    !gameState.waitingForGameStart
  );
}

/**
 * Whether the primary trick Continue CTA should be shown in the board chrome.
 * Hidden under higher-priority overlays so only one primary CTA is active.
 */
export function shouldShowTrickContinueCta(
  gameState: GameState,
  overlays: ContinueFlowOverlayFlags = {}
): boolean {
  if (overlays.flowOverlayActive) return false;
  return isTrickContinueActionAllowed(gameState);
}

/** Compact auto-pause control stays available unless a blocking overlay owns the UI. */
export function shouldShowTrickContinueChrome(
  gameState: GameState,
  overlays: ContinueFlowOverlayFlags = {}
): boolean {
  if (gameState.isGameOver) return false;
  if (overlays.flowOverlayActive) return false;
  if (gameState.waitingForRoundEnd) return false;
  if (gameState.waitingForRoundStart) return false;
  if (gameState.waitingForGameStart) return false;
  return true;
}
