import { BuiltInThemeId } from '../services/billingService';
import {
  CORE_MUSIC_TRACKS,
  FALLBACK_MUSIC_TRACK_ID,
  getMusicTrackUrl,
  isMusicTrackId
} from '../constants/musicCatalog';
import {
  THEME_MUSIC_FAMILY,
  THEME_PREFERRED_TRACK_ID,
  getThemeMusicPreference,
  resolveMusicTrackIdForTheme
} from '../constants/musicThemeMap';
import { getMusicAvailability } from './musicAvailability';
import { createMemoryMusicCacheFs } from './musicCacheFs';
import {
  __resetMusicCacheForTests,
  __setMusicCacheFsForTests,
  cacheRemoteTrack,
  initMusicCache
} from './musicCacheService';
import {
  MOCK_MUSIC_CDN_ORIGIN,
  MOCK_REMOTE_MUSIC_CATALOG
} from './remoteMusicCatalog.mock';
import {
  REMOTE_MUSIC_CATALOG,
  getRemoteMusicTrack,
  isRemoteMusicTrackId,
  listRemoteMusicTracks,
  sanitizeRemoteMusicCatalog
} from './remoteMusicCatalog';
import {
  resolveMusicTrack,
  resolveThemeMusic
} from './musicResolver';
import { sha256Hex } from './sha256';

const BUILT_IN_THEMES = Object.keys(THEME_MUSIC_FAMILY) as BuiltInThemeId[];

describe('remoteMusicCatalog mock', () => {
  it('loads 23 unique remote entries', () => {
    expect(MOCK_REMOTE_MUSIC_CATALOG.tracks).toHaveLength(23);
    expect(listRemoteMusicTracks()).toHaveLength(23);
    expect(REMOTE_MUSIC_CATALOG.tracks).toHaveLength(23);
    const ids = listRemoteMusicTracks().map((t) => t.id);
    expect(new Set(ids).size).toBe(23);
  });

  it('uses predictable mock URLs and does not collide with core ids', () => {
    for (const t of listRemoteMusicTracks()) {
      expect(t.url).toMatch(
        new RegExp(
          `^${MOCK_MUSIC_CDN_ORIGIN.replace(/\./g, '\\.')}/music/v1/tracks/${t.id}/1/${t.id}\\.ogg$`
        )
      );
      expect(t.bundled).toBe(false);
      expect(t.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(isMusicTrackId(t.id)).toBe(false);
      expect(isRemoteMusicTrackId(t.id)).toBe(true);
    }
  });

  it('drops malformed and duplicate catalog items without throwing', () => {
    const result = sanitizeRemoteMusicCatalog({
      catalogVersion: 2,
      tracks: [
        listRemoteMusicTracks()[0],
        listRemoteMusicTracks()[0],
        { id: 'bad', title: 'x' },
        {
          id: 'bad-sha',
          title: 'Bad',
          artist: 'A',
          family: 'Celtic',
          url: 'https://music.example.invalid/x.ogg',
          duration: 10,
          size: 100,
          sha256: 'not-a-hash',
          streamingSafe: true,
          contentId: false,
          bundled: false,
          version: 1
        },
        {
          id: 'neg-size',
          title: 'Neg',
          artist: 'A',
          family: 'Celtic',
          url: 'https://music.example.invalid/y.ogg',
          duration: 10,
          size: -1,
          sha256: 'a'.repeat(64),
          streamingSafe: true,
          contentId: false,
          bundled: false,
          version: 1
        },
        {
          id: 'bad-version',
          title: 'Ver',
          artist: 'A',
          family: 'Celtic',
          url: 'https://music.example.invalid/z.ogg',
          duration: 10,
          size: 1,
          sha256: 'b'.repeat(64),
          streamingSafe: true,
          contentId: false,
          bundled: false,
          version: 0
        },
        null,
        'garbage'
      ]
    });
    expect(result.catalog.tracks).toHaveLength(1);
    expect(result.dropped).toBeGreaterThanOrEqual(5);
    expect(result.duplicateIds).toContain(listRemoteMusicTracks()[0].id);
    expect(() => sanitizeRemoteMusicCatalog(undefined)).not.toThrow();
    expect(sanitizeRemoteMusicCatalog(undefined).catalog.tracks).toEqual([]);
  });
});

describe('musicAvailability', () => {
  beforeEach(async () => {
    __setMusicCacheFsForTests(createMemoryMusicCacheFs());
    await initMusicCache();
  });

  afterEach(() => {
    __resetMusicCacheForTests();
    __setMusicCacheFsForTests(null);
  });

  it('classifies core, remote, cache, and unknown', async () => {
    expect(getMusicAvailability('casino-jazz')).toBe('AVAILABLE_LOCAL_CORE');
    expect(getMusicAvailability('celtic-traveler')).toBe('REMOTE_AVAILABLE');
    expect(getMusicAvailability('no-such-track')).toBe('UNAVAILABLE');
    expect(getMusicAvailability(null)).toBe('UNAVAILABLE');

    const bytes = new TextEncoder().encode('cache-avail');
    const hash = await sha256Hex(bytes);
    const remote = getRemoteMusicTrack('celtic-traveler')!;
    const result = await cacheRemoteTrack(
      { ...remote, size: bytes.length, sha256: hash },
      { kind: 'bytes', data: bytes }
    );
    expect(result.ok).toBe(true);
    expect(getMusicAvailability('celtic-traveler')).toBe('AVAILABLE_LOCAL_CACHE');
  });
});

describe('musicResolver', () => {
  it('resolves core tracks to local assets', () => {
    const resolved = resolveMusicTrack('yamatai-shizima');
    expect(resolved.source).toBe('core');
    expect(resolved.id).toBe('yamatai-shizima');
    expect(resolved.availability).toBe('AVAILABLE_LOCAL_CORE');
    expect(resolved.readyForPlayback).toBe(true);
    expect(resolved.playableUrl).toBe(getMusicTrackUrl('yamatai-shizima'));
    expect(resolved.fallbackTrackId).toBe(FALLBACK_MUSIC_TRACK_ID);
  });

  it('promotes cached remote to LOCAL_CACHE with readyForPlayback', async () => {
    __setMusicCacheFsForTests(createMemoryMusicCacheFs());
    await initMusicCache();
    try {
      const bytes = new TextEncoder().encode('resolver-cache');
      const hash = await sha256Hex(bytes);
      const remote = getRemoteMusicTrack('khmer-roneat')!;
      expect(
        (
          await cacheRemoteTrack(
            { ...remote, size: bytes.length, sha256: hash },
            { kind: 'bytes', data: bytes }
          )
        ).ok
      ).toBe(true);

      const resolved = resolveMusicTrack('khmer-roneat', {
        fallbackTrackId: 'yamatai-shizima'
      });
      expect(resolved.source).toBe('remote');
      expect(resolved.availability).toBe('AVAILABLE_LOCAL_CACHE');
      expect(resolved.readyForPlayback).toBe(true);
      expect(resolved.cacheStale).toBe(false);
      expect(resolved.fallbackTrackId).toBe('yamatai-shizima');
    } finally {
      __resetMusicCacheForTests();
      __setMusicCacheFsForTests(null);
    }
  });

  it('resolves remote tracks to mock metadata without marking ready', () => {
    const resolved = resolveMusicTrack('celtic-traveler');
    expect(resolved.source).toBe('remote');
    expect(resolved.id).toBe('celtic-traveler');
    expect(resolved.availability).toBe('REMOTE_AVAILABLE');
    expect(resolved.readyForPlayback).toBe(false);
    expect(resolved.playableUrl).toContain('celtic-traveler');
    expect(resolved.playableUrl).toContain(MOCK_MUSIC_CDN_ORIGIN);
    expect(getRemoteMusicTrack('celtic-traveler')).not.toBeNull();
  });

  it('falls back to core for unknown track ids', () => {
    const resolved = resolveMusicTrack('totally-unknown');
    expect(resolved.source).toBe('core');
    expect(resolved.id).toBe(FALLBACK_MUSIC_TRACK_ID);
    expect(resolved.readyForPlayback).toBe(true);
  });

  it('uses theme preferred remote with core fallback metadata', () => {
    const pref = getThemeMusicPreference('angkor');
    expect(pref.preferredTrackId).toBe('khmer-roneat');
    expect(pref.fallbackCoreTrackId).toBe('yamatai-shizima');

    const hybrid = resolveThemeMusic('angkor');
    expect(hybrid.source).toBe('remote');
    expect(hybrid.id).toBe('khmer-roneat');
    expect(hybrid.fallbackTrackId).toBe('yamatai-shizima');
    expect(hybrid.readyForPlayback).toBe(false);

    // Theme Default play path still core (no regression)
    expect(resolveMusicTrackIdForTheme('angkor')).toBe('yamatai-shizima');
  });

  it('keeps core preferred themes as core in hybrid resolve', () => {
    const classic = resolveThemeMusic('classic');
    expect(classic.source).toBe('core');
    expect(classic.id).toBe('casino-jazz');
    expect(classic.readyForPlayback).toBe(true);
    expect(resolveMusicTrackIdForTheme('classic')).toBe('casino-jazz');
  });

  it('maps unknown theme preferred/fallback to casino-jazz', () => {
    const pref = getThemeMusicPreference('custom_xyz');
    expect(pref.preferredTrackId).toBe(FALLBACK_MUSIC_TRACK_ID);
    expect(pref.fallbackCoreTrackId).toBe(FALLBACK_MUSIC_TRACK_ID);
    const hybrid = resolveThemeMusic('not-a-theme');
    expect(hybrid.id).toBe(FALLBACK_MUSIC_TRACK_ID);
    expect(resolveMusicTrackIdForTheme('not-a-theme')).toBe(FALLBACK_MUSIC_TRACK_ID);
  });

  it('resolves all 30 themes via hybrid + core play path', () => {
    expect(BUILT_IN_THEMES).toHaveLength(30);
    expect(Object.keys(THEME_PREFERRED_TRACK_ID)).toHaveLength(30);
    const coreIds = new Set(CORE_MUSIC_TRACKS.map((t) => t.id));

    for (const theme of BUILT_IN_THEMES) {
      const hybrid = resolveThemeMusic(theme);
      expect(hybrid.id).toBeTruthy();
      expect(hybrid.fallbackTrackId).toBeTruthy();
      expect(coreIds.has(hybrid.fallbackTrackId)).toBe(true);

      if (hybrid.source === 'remote') {
        expect(hybrid.readyForPlayback).toBe(false);
        expect(isRemoteMusicTrackId(hybrid.id)).toBe(true);
      } else {
        expect(hybrid.readyForPlayback).toBe(true);
        expect(coreIds.has(hybrid.id as typeof FALLBACK_MUSIC_TRACK_ID)).toBe(true);
      }

      const playId = resolveMusicTrackIdForTheme(theme);
      expect(coreIds.has(playId)).toBe(true);
    }
  });

  it('falls back when preferred is forced unavailable', () => {
    const resolved = resolveMusicTrack('missing-remote-bed', {
      fallbackTrackId: 'maghreb-oud'
    });
    expect(resolved.source).toBe('core');
    expect(resolved.id).toBe('maghreb-oud');
  });
});
