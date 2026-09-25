import type { GameVariant } from '../types/game';

/**
 * UX-KING-FINAL-01 — King keeps the final score sheet until an explicit CTA.
 * Other variants still use the delayed Home exit.
 */
export function shouldAutoExitAfterGameOver(variant: GameVariant): boolean {
  return variant !== 'king';
}

/**
 * Schedules a delayed game-over exit and allows cancelling so a stale
 * callback cannot leave the screen after "New Game" or manual exit.
 */
export function createGameOverExitController(
  onExit: () => void,
  delayMs: number
): {
  schedule: () => void;
  cancel: () => void;
  isPending: () => boolean;
} {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let generation = 0;

  const cancel = () => {
    generation += 1;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = null;
  };

  const schedule = () => {
    cancel();
    const scheduledGeneration = generation;
    timerId = setTimeout(() => {
      timerId = null;
      if (scheduledGeneration === generation) {
        onExit();
      }
    }, delayMs);
  };

  return {
    schedule,
    cancel,
    isPending: () => timerId !== null
  };
}
