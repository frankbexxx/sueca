import {
  FALLBACK_MUSIC_TRACK_ID,
  MusicFamily,
  MusicTrackId,
  getMusicTrack,
  getMusicTrackUrl,
  isMusicTrackId
} from '../constants/musicCatalog';
import {
  getThemeMusicPreference,
  resolveMusicTrackIdForTheme
} from '../constants/musicThemeMap';
import type { ThemeId } from '../services/billingService';
import {
  MusicAvailability,
  getMusicAvailability
} from './musicAvailability';
import {
  getCachedEntry,
  lookupCachedTrackSync
} from './musicCacheService';
import { getRemoteMusicTrack } from './remoteMusicCatalog';

export type MusicTrackSource = 'core' | 'remote';

export type ResolvedMusicTrack = {
  source: MusicTrackSource;
  id: string;
  title: string;
  artist: string;
  family: MusicFamily;
  playableUrl: string;
  fallbackTrackId: MusicTrackId;
  availability: MusicAvailability;
  streamingSafe: boolean;
  contentId: boolean;
  version: number | null;
  /**
   * True for core, or remote with verified local cache.
   * Mock remote URLs alone are never ready for production playback.
   */
  readyForPlayback: boolean;
  /** True when cached file exists but catalog version/sha differs. */
  cacheStale: boolean;
};

function resolveCore(
  id: MusicTrackId,
  fallbackTrackId: MusicTrackId
): ResolvedMusicTrack {
  const track = getMusicTrack(id);
  return {
    source: 'core',
    id: track.id,
    title: track.title,
    artist: track.artist,
    family: track.family,
    playableUrl: getMusicTrackUrl(track.id),
    fallbackTrackId,
    availability: 'AVAILABLE_LOCAL_CORE',
    streamingSafe: track.streamingSafe,
    contentId: track.contentId,
    version: null,
    readyForPlayback: true,
    cacheStale: false
  };
}

function cachedPlayableUrl(filePath: string): string {
  // Sync path: Capacitor convertFileSrc needs async getUri in production.
  // Resolver uses a stable relative marker; callers that need a web URL should
  // prefer lookupCachedTrack() async. For sync resolve we expose filePath;
  // audioService still plays core only in this phase.
  return `capacitor-cache://${filePath}`;
}

function resolveRemoteOrFallback(
  trackId: string,
  fallbackTrackId: MusicTrackId
): ResolvedMusicTrack {
  if (isMusicTrackId(trackId)) {
    return resolveCore(trackId, fallbackTrackId);
  }

  const remote = getRemoteMusicTrack(trackId);
  const expected = remote
    ? { version: remote.version, sha256: remote.sha256 }
    : null;
  const cached = lookupCachedTrackSync(trackId, expected);
  const availability = getMusicAvailability(trackId);

  // 1) Remote with verified cache (hit or stale file still on disk)
  if (
    remote &&
    (cached.status === 'hit' || cached.status === 'stale') &&
    cached.entry
  ) {
    return {
      source: 'remote',
      id: remote.id,
      title: remote.title,
      artist: remote.artist,
      family: remote.family,
      playableUrl: cachedPlayableUrl(cached.entry.filePath),
      fallbackTrackId,
      availability: 'AVAILABLE_LOCAL_CACHE',
      streamingSafe: remote.streamingSafe,
      contentId: remote.contentId,
      version: cached.entry.version,
      readyForPlayback: true,
      cacheStale: cached.status === 'stale'
    };
  }

  // Orphan cache without catalog metadata
  if (!remote && cached.entry && (cached.status === 'hit' || cached.status === 'stale')) {
    const entry = getCachedEntry(trackId)!;
    return {
      source: 'remote',
      id: entry.trackId,
      title: entry.trackId,
      artist: 'cached',
      family: 'Casino Jazz / Lounge',
      playableUrl: cachedPlayableUrl(entry.filePath),
      fallbackTrackId,
      availability: 'AVAILABLE_LOCAL_CACHE',
      streamingSafe: true,
      contentId: false,
      version: entry.version,
      readyForPlayback: true,
      cacheStale: cached.status === 'stale'
    };
  }

  // 2) Remote catalog metadata (not downloaded / not playable yet)
  if (remote && availability === 'REMOTE_AVAILABLE') {
    return {
      source: 'remote',
      id: remote.id,
      title: remote.title,
      artist: remote.artist,
      family: remote.family,
      playableUrl: remote.url,
      fallbackTrackId,
      availability: 'REMOTE_AVAILABLE',
      streamingSafe: remote.streamingSafe,
      contentId: remote.contentId,
      version: remote.version,
      readyForPlayback: false,
      cacheStale: false
    };
  }

  // 3) Core fallback
  return resolveCore(fallbackTrackId, FALLBACK_MUSIC_TRACK_ID);
}

/**
 * Resolve any track id to core, cached remote, remote metadata, or core fallback.
 * Never throws. Does not auto-play remotes in production (audioService still uses core).
 */
export function resolveMusicTrack(
  trackId: string | null | undefined,
  options?: { fallbackTrackId?: MusicTrackId }
): ResolvedMusicTrack {
  try {
    const fallback = options?.fallbackTrackId ?? FALLBACK_MUSIC_TRACK_ID;
    if (!trackId) {
      return resolveCore(fallback, FALLBACK_MUSIC_TRACK_ID);
    }
    return resolveRemoteOrFallback(trackId, fallback);
  } catch {
    return resolveCore(FALLBACK_MUSIC_TRACK_ID, FALLBACK_MUSIC_TRACK_ID);
  }
}

/**
 * Theme resolution: preferred → cache → remote metadata → core fallback.
 * Never throws.
 */
export function resolveThemeMusic(themeId: ThemeId): ResolvedMusicTrack {
  try {
    const { preferredTrackId, fallbackCoreTrackId } =
      getThemeMusicPreference(themeId);
    return resolveMusicTrack(preferredTrackId, {
      fallbackTrackId: fallbackCoreTrackId
    });
  } catch {
    return resolveCore(FALLBACK_MUSIC_TRACK_ID, FALLBACK_MUSIC_TRACK_ID);
  }
}

export { resolveMusicTrackIdForTheme };
