/**
 * Sueca mid-trick AI pacing (presentation delay only).
 * Does not change AI decision logic, ritual timings, or other games.
 */

import type { GameVariant } from '../../types/game';
import { AI_PLAY_DELAY_MS } from '../../constants/gameConstants';

/** Empty trick — AI leads. */
export const SUECA_AI_LEAD_DELAY_MS = 1000;

/** Trick already has card(s) — AI follows. */
export const SUECA_AI_FOLLOW_DELAY_MS = 800;

/** Lead when trick is empty; follow otherwise. */
export function suecaAiPlayDelayMs(trickLength: number): number {
  const len = Number.isFinite(trickLength) ? Math.max(0, Math.floor(trickLength)) : 0;
  return len === 0 ? SUECA_AI_LEAD_DELAY_MS : SUECA_AI_FOLLOW_DELAY_MS;
}

/**
 * Resolve auto-play delay for the current variant.
 * Sueca uses lead/follow pacing; all other variants keep AI_PLAY_DELAY_MS.
 */
export function resolveAiPlayDelayMs(opts: {
  variant: GameVariant;
  trickLength: number;
}): number {
  if (opts.variant === 'sueca') {
    return suecaAiPlayDelayMs(opts.trickLength);
  }
  return AI_PLAY_DELAY_MS;
}
