/**
 * Small generation guard helpers for Phaser model sync (pure / testable).
 */

export function nextSyncGeneration(current: number): number {
  return current + 1;
}

export function isStaleGeneration(expected: number, current: number): boolean {
  return expected !== current;
}

/** Debounce / click-lock window in ms after a play attempt. */
export const PLAY_CLICK_LOCK_MS = 180;
