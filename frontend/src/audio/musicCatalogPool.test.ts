import { afterEach, describe, expect, it } from 'vitest';
import {
  buildTrackPool,
  listAvailableMusicEntries,
  listContentIdTrackIds,
  resolveAdvancedTrackId
} from './musicCatalogPool';
import { clearRemoteMusicTrackOverlays } from './remoteMusicCatalog';

describe('musicCatalogPool', () => {
  afterEach(() => {
    clearRemoteMusicTrackOverlays();
  });

  it('lists core + remote catalog entries', () => {
    const entries = listAvailableMusicEntries();
    expect(entries.some((e) => e.id === 'casino-jazz' && e.source === 'core')).toBe(
      true
    );
    expect(entries.length).toBeGreaterThanOrEqual(6);
  });

  it('Random Streaming Safe excludes all Content ID tracks', () => {
    const cid = listContentIdTrackIds();
    expect(cid.length).toBeGreaterThanOrEqual(1);
    const pool = buildTrackPool('random-streaming-safe', {
      selectedFamily: null,
      selectedTrackId: null
    });
    for (const id of cid) {
      expect(pool).not.toContain(id);
    }
    expect(pool.length).toBeGreaterThan(0);
  });

  it('Random includes Content ID tracks', () => {
    const cid = listContentIdTrackIds();
    const pool = buildTrackPool('random', {
      selectedFamily: null,
      selectedTrackId: null
    });
    for (const id of cid) {
      expect(pool).toContain(id);
    }
  });

  it('Family empty falls back to family core', () => {
    const resolved = resolveAdvancedTrackId(
      'family',
      {
        mode: 'family',
        selectedFamily: 'Dark / Atmospheric',
        selectedTrackId: null
      },
      null,
      () => 0
    );
    // Dark / Atmospheric maps to nordic-kalte core; may also have remotes
    expect(resolved.fallbackCore).toBe('nordic-kalte');
    expect(resolved.trackId).toBeTruthy();
  });

  it('Specific missing track falls back to core', () => {
    const resolved = resolveAdvancedTrackId(
      'specific',
      {
        mode: 'specific',
        selectedFamily: null,
        selectedTrackId: 'does-not-exist'
      },
      null
    );
    expect(resolved.trackId).toBe('casino-jazz');
  });

  it('does not imply bulk download — pool is id list only', () => {
    const pool = buildTrackPool('random', {
      selectedFamily: null,
      selectedTrackId: null
    });
    expect(Array.isArray(pool)).toBe(true);
    expect(pool.every((id) => typeof id === 'string')).toBe(true);
  });
});
