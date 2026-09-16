import { isMusicTrackId } from '../constants/musicCatalog';
import { getRemoteMusicTrack, isRemoteMusicTrackId } from './remoteMusicCatalog';
import { lookupCachedTrackSync } from './musicCacheService';

/** Local / remote availability for a track id. */
export type MusicAvailability =
  | 'AVAILABLE_LOCAL_CORE'
  | 'AVAILABLE_LOCAL_CACHE'
  | 'REMOTE_AVAILABLE'
  | 'UNAVAILABLE';

/** @deprecated Use AVAILABLE_LOCAL_CORE — kept for transitional imports. */
export type LegacyMusicAvailability = 'AVAILABLE_LOCAL';

/**
 * Sync availability from core / in-memory cache index / remote catalog.
 * Call `initMusicCache()` on native startup so cache hits are visible.
 */
export function getMusicAvailability(trackId: string | null | undefined): MusicAvailability {
  if (!trackId) return 'UNAVAILABLE';
  if (isMusicTrackId(trackId)) return 'AVAILABLE_LOCAL_CORE';

  const remote = getRemoteMusicTrack(trackId);
  if (remote) {
    const cached = lookupCachedTrackSync(trackId, {
      version: remote.version,
      sha256: remote.sha256
    });
    // Valid match OR stale-but-present verified entry → local cache.
    if (cached.status === 'hit' || cached.status === 'stale') {
      return 'AVAILABLE_LOCAL_CACHE';
    }
    return 'REMOTE_AVAILABLE';
  }

  if (isRemoteMusicTrackId(trackId)) {
    return 'REMOTE_AVAILABLE';
  }

  // Unknown id — still check orphan cache entry
  const orphan = lookupCachedTrackSync(trackId);
  if (orphan.status === 'hit' || orphan.status === 'stale') {
    return 'AVAILABLE_LOCAL_CACHE';
  }

  return 'UNAVAILABLE';
}
