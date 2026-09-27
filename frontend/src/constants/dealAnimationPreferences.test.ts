import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEAL_ANIMATION_DELAY_MS,
  getDealDelayMs,
  loadDealAnimationSpeed,
  saveDealAnimationSpeed
} from './dealAnimationPreferences';
import { DEAL_DELAY_MS, STORAGE_KEYS } from './gameConstants';

describe('dealAnimationPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to normal (= DEAL_DELAY_MS)', () => {
    expect(loadDealAnimationSpeed()).toBe('normal');
    expect(getDealDelayMs()).toBe(DEAL_DELAY_MS);
  });

  it('persists discrete levels only', () => {
    saveDealAnimationSpeed('fast');
    expect(localStorage.getItem(STORAGE_KEYS.DEAL_ANIMATION_SPEED)).toBe('fast');
    expect(getDealDelayMs()).toBe(DEAL_ANIMATION_DELAY_MS.fast);
    saveDealAnimationSpeed('paused');
    expect(getDealDelayMs()).toBe(DEAL_ANIMATION_DELAY_MS.paused);
  });
});
