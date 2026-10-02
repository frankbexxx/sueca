/**
 * Sueca mid-trick AI pacing (presentation delay only).
 * Cross-game resolution lives in gamePacingPolicy. Ritual timings stay in suecaHandRitual.
 */

import type { GameVariant } from '../../types/game';
import { cardPlayDelayMs, getGamePacingPolicy } from './gamePacingPolicy';

/** Empty trick — AI leads. */
export const SUECA_AI_LEAD_DELAY_MS = getGamePacingPolicy('sueca').cardPlay.aiLeadMs;

/** Trick already has card(s) — AI follows. */
export const SUECA_AI_FOLLOW_DELAY_MS = getGamePacingPolicy('sueca').cardPlay.aiFollowMs;

/** Lead when trick is empty; follow otherwise. */
export function suecaAiPlayDelayMs(trickLength: number): number {
  return cardPlayDelayMs('sueca', trickLength);
}

/** Resolve auto-play delay from that variant's pacing policy. */
export function resolveAiPlayDelayMs(opts: {
  variant: GameVariant;
  trickLength: number;
}): number {
  return cardPlayDelayMs(opts.variant, opts.trickLength);
}
