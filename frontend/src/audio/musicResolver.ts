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
  /** True when bytes are local core; remotes stay false until download/stream is wired. */
  readyForPlayback: boolean;
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
    availability: 'AVAILABLE_LOCAL',
    streamingSafe: track.streamingSafe,
    contentId: track.contentId,
    version: null,
    readyForPlayback: true
  };
}

function resolveRemoteOrFallback(
  trackId: string,
  fallbackTrackId: MusicTrackId
): ResolvedMusicTrack {
  const availability = getMusicAvailability(trackId);
  if (availability === 'UNAVAILABLE') {
    return resolveCore(fallbackTrackId, FALLBACK_MUSIC_TRACK_ID);
  }

  if (isMusicTrackId(trackId)) {
    return resolveCore(trackId, fallbackTrackId);
  }

  const remote = getRemoteMusicTrack(trackId);
  if (!remote || availability !== 'REMOTE_AVAILABLE') {
    return resolveCore(fallbackTrackId, FALLBACK_MUSIC_TRACK_ID);
  }

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
    // MOCK phase: do not treat mock URLs as playable audio sources.
    readyForPlayback: false
  };
}

/**
 * Resolve any track id to core or remote metadata.
 * Unknown / unavailable → core fallback (`casino-jazz` unless overridden).
 * Never throws.
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
 * Theme resolution using preferred + core fallback from THEME_DEFAULTS_PLAN.
 * Preferred remote resolves as remote metadata; playback readiness stays false for remotes.
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

/**
 * Track id that Theme Default / audioService should play today (always core).
 * Re-export for callers that need the playable core without hybrid metadata.
 */
export { resolveMusicTrackIdForTheme };
