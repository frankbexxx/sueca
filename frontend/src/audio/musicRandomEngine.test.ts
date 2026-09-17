import { describe, expect, it } from 'vitest';
import { pickNextTrackId } from './musicRandomEngine';

describe('musicRandomEngine', () => {
  it('returns null for empty pool', () => {
    expect(pickNextTrackId([], 'a', () => 0)).toBeNull();
  });

  it('returns the only track when pool size is 1', () => {
    expect(pickNextTrackId(['only'], 'only', () => 0.99)).toBe('only');
    expect(pickNextTrackId(['only'], null, () => 0)).toBe('only');
  });

  it('avoids immediate repeat when pool > 1', () => {
    const pool = ['a', 'b', 'c'];
    // Always pick index 0 of candidates → after filtering out 'a', candidates=['b','c'] → 'b'
    expect(pickNextTrackId(pool, 'a', () => 0)).toBe('b');
    expect(pickNextTrackId(pool, 'c', () => 0)).toBe('a');
  });

  it('uses injected random for deterministic index', () => {
    const pool = ['a', 'b', 'c'];
    // previous null → full pool; r=0.99 → idx 2 → c
    expect(pickNextTrackId(pool, null, () => 0.99)).toBe('c');
  });
});
