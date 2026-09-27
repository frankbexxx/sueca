/**
 * Global dealing animation cadence — presentation only.
 * Must never affect deal order, direction, trump, or first leader.
 */

import { DEAL_DELAY_MS, STORAGE_KEYS } from './gameConstants';

export type DealAnimationSpeed = 'fast' | 'normal' | 'paused';

export const DEAL_ANIMATION_SPEEDS: readonly DealAnimationSpeed[] = [
  'fast',
  'normal',
  'paused'
] as const;

/** Base DEAL_DELAY_MS (=600) is "normal". */
export const DEAL_ANIMATION_DELAY_MS: Record<DealAnimationSpeed, number> = {
  fast: Math.round(DEAL_DELAY_MS * 0.5),
  normal: DEAL_DELAY_MS,
  paused: Math.round(DEAL_DELAY_MS * 1.75)
};

export function loadDealAnimationSpeed(): DealAnimationSpeed {
  const raw = localStorage.getItem(STORAGE_KEYS.DEAL_ANIMATION_SPEED);
  if (raw === 'fast' || raw === 'normal' || raw === 'paused') return raw;
  return 'normal';
}

export function saveDealAnimationSpeed(speed: DealAnimationSpeed): void {
  localStorage.setItem(STORAGE_KEYS.DEAL_ANIMATION_SPEED, speed);
}

/** Effective deal SFX / cadence delay from user preference. */
export function getDealDelayMs(): number {
  return DEAL_ANIMATION_DELAY_MS[loadDealAnimationSpeed()];
}
