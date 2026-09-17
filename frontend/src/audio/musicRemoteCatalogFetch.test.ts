import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetMusicRemoteConfigForTests,
  __setMusicRemoteBaseUrlForTests,
  getMusicRemoteBaseUrl,
  isMusicRemoteCatalogEnabled,
  isMusicRemoteSmokeDevEndpoint
} from './musicRemoteConfig';
import {
  applyRemoteCatalogFromRaw,
  bootstrapMusicRemoteCatalog,
  teardownMusicRemoteCatalogOverlays
} from './musicRemoteCatalogFetch';
import {
  resolveRemoteAssetUrl,
  rewriteRemoteCatalogUrls
} from './musicRemoteUrlResolve';
import {
  clearRemoteMusicTrackOverlays,
  getRemoteMusicTrack,
  sanitizeRemoteMusicCatalog
} from './remoteMusicCatalog';
import {
  clearRemotePlaybackUrlOverrides,
  resolveRemotePlaybackUrl
} from './musicRemoteUrlProvider';
import {
  __resetRemotePlaybackForTests,
  __setRemotePlaybackPlatformForTests,
  ensureRemotePlayable
} from './musicRemotePrepare';
import { createMemoryMusicCacheFs } from './musicCacheFs';
import {
  __resetMusicCacheForTests,
  __setMusicCacheFsForTests,
  initMusicCache,
  lookupCachedTrack
} from './musicCacheService';
import { sha256Hex } from './sha256';
import { resolveThemeMusic } from './musicResolver';
import {
  THEME_MUSIC_FAMILY,
  THEME_PREFERRED_TRACK_ID,
  getThemeMusicPreference
} from '../constants/musicThemeMap';
import { CORE_MUSIC_TRACKS, isMusicTrackId } from '../constants/musicCatalog';
import { BuiltInThemeId } from '../services/billingService';
import { MOCK_REMOTE_MUSIC_CATALOG } from './remoteMusicCatalog.mock';

const BASE = 'https://pub-smoke-test.example';

const CELTIC_REL = 'music/v1/tracks/celtic-traveler/1/celtic-traveler.ogg';
const ETH_REL = 'music/v1/tracks/ethiopia-groove/1/ethiopia-groove.ogg';
const JAZZ_REL = 'music/v1/tracks/jazz-orchestra/1/jazz-orchestra.ogg';

function sampleCatalog(overrides?: {
  celticUrl?: string;
  ethUrl?: string;
  extra?: unknown[];
}): unknown {
  return {
    catalogVersion: 1,
    tracks: [
      {
        id: 'celtic-traveler',
        title: 'Old Celtic Traveler',
        artist: 'Sounova Music',
        family: 'Celtic',
        url: overrides?.celticUrl ?? CELTIC_REL,
        duration: 165,
        size: 100,
        sha256: 'a'.repeat(64),
        streamingSafe: true,
        contentId: false,
        bundled: false,
        version: 1
      },
      {
        id: 'ethiopia-groove',
        title: 'Ethiopia Groove',
        artist: 'Pixabay',
        family: 'Horn of Africa / Ethiopic',
        url: overrides?.ethUrl ?? ETH_REL,
        duration: 108,
        size: 100,
        sha256: 'b'.repeat(64),
        streamingSafe: true,
        contentId: false,
        bundled: false,
        version: 1
      },
      ...(overrides?.extra ?? [])
    ]
  };
}

/** Build a full 23-entry relative catalog mirroring mock ids. */
function fullRelativeCatalogFromMock(): unknown {
  return {
    catalogVersion: 1,
    tracks: MOCK_REMOTE_MUSIC_CATALOG.tracks.map((t) => ({
      ...t,
      url: `music/v1/tracks/${t.id}/1/${t.id}.ogg`,
      size: Math.max(1, t.size),
      duration: Math.max(0.1, t.duration)
    }))
  };
}

describe('musicRemoteConfig', () => {
  afterEach(() => {
    __resetMusicRemoteConfigForTests();
  });

  it('disables remote when base URL missing', () => {
    __setMusicRemoteBaseUrlForTests(null);
    expect(getMusicRemoteBaseUrl()).toBeNull();
    expect(isMusicRemoteCatalogEnabled()).toBe(false);
  });

  it('normalizes and accepts a valid base URL', () => {
    __setMusicRemoteBaseUrlForTests(`${BASE}/`);
    expect(getMusicRemoteBaseUrl()).toBe(BASE);
    expect(isMusicRemoteCatalogEnabled()).toBe(true);
  });

  it('marks r2.dev as smoke/dev endpoint', () => {
    expect(
      isMusicRemoteSmokeDevEndpoint(
        'https://pub-a9a75d44da0145bc9552086ca57df0e5.r2.dev'
      )
    ).toBe(true);
    expect(isMusicRemoteSmokeDevEndpoint('https://cdn.example.com')).toBe(false);
  });
});

describe('resolveRemoteAssetUrl', () => {
  it('resolves relative music/v1 paths against base', () => {
    expect(resolveRemoteAssetUrl(BASE, CELTIC_REL)).toBe(`${BASE}/${CELTIC_REL}`);
  });

  it('rejects path traversal and non-music paths', () => {
    expect(resolveRemoteAssetUrl(BASE, 'music/v1/../secret')).toBeNull();
    expect(resolveRemoteAssetUrl(BASE, 'other/path.ogg')).toBeNull();
  });

  it('only accepts absolute URLs under the same base origin + music/v1', () => {
    expect(
      resolveRemoteAssetUrl(BASE, `https://evil.example/${CELTIC_REL}`)
    ).toBeNull();
    expect(resolveRemoteAssetUrl(BASE, `${BASE}/${CELTIC_REL}`)).toBe(
      `${BASE}/${CELTIC_REL}`
    );
  });
});

describe('applyRemoteCatalogFromRaw', () => {
  afterEach(() => {
    teardownMusicRemoteCatalogOverlays();
    clearRemoteMusicTrackOverlays();
    clearRemotePlaybackUrlOverrides();
  });

  it('applies all valid catalog tracks (full remote set)', () => {
    const extra = {
      id: 'jazz-orchestra',
      title: 'Jazz',
      artist: 'A',
      family: 'Casino Jazz / Lounge',
      url: JAZZ_REL,
      duration: 10,
      size: 10,
      sha256: 'c'.repeat(64),
      streamingSafe: true,
      contentId: false,
      bundled: false,
      version: 1
    };
    const result = applyRemoteCatalogFromRaw(
      sampleCatalog({ extra: [extra] }),
      BASE
    );
    expect(result.ok).toBe(true);
    expect(result.applied).toBe(3);

    const celtic = getRemoteMusicTrack('celtic-traveler')!;
    expect(celtic.url).toBe(`${BASE}/${CELTIC_REL}`);
    expect(resolveRemotePlaybackUrl(celtic)).toBe(`${BASE}/${CELTIC_REL}`);

    const jazz = getRemoteMusicTrack('jazz-orchestra')!;
    expect(jazz.url).toBe(`${BASE}/${JAZZ_REL}`);
    expect(resolveRemotePlaybackUrl(jazz)).toBe(`${BASE}/${JAZZ_REL}`);
  });

  it('loads all 23 RELEASE OK remotes from relative catalog', () => {
    const result = applyRemoteCatalogFromRaw(fullRelativeCatalogFromMock(), BASE);
    expect(result.ok).toBe(true);
    expect(result.applied).toBe(23);
    expect(MOCK_REMOTE_MUSIC_CATALOG.tracks).toHaveLength(23);

    for (const t of MOCK_REMOTE_MUSIC_CATALOG.tracks) {
      const live = getRemoteMusicTrack(t.id)!;
      expect(live.url).toBe(`${BASE}/music/v1/tracks/${t.id}/1/${t.id}.ogg`);
      expect(resolveRemotePlaybackUrl(live)).not.toBeNull();
    }

    const cid = ['whiskey-jazz', 'northern-glow', 'hawaii-relax'];
    for (const id of cid) {
      expect(getRemoteMusicTrack(id)!.contentId).toBe(true);
      expect(getRemoteMusicTrack(id)!.streamingSafe).toBe(false);
    }
  });

  it('ignores malformed single entries without rejecting the catalog', () => {
    const result = applyRemoteCatalogFromRaw(
      sampleCatalog({
        extra: [
          { id: 'bad', title: 'x' },
          {
            id: 'zero-size',
            title: 'Z',
            artist: 'A',
            family: 'Celtic',
            url: 'music/v1/tracks/zero-size/1/zero-size.ogg',
            duration: 10,
            size: 0,
            sha256: 'd'.repeat(64),
            streamingSafe: true,
            contentId: false,
            bundled: false,
            version: 1
          }
        ]
      }),
      BASE
    );
    expect(result.ok).toBe(true);
    expect(result.applied).toBe(2);
    expect(result.dropped).toBeGreaterThanOrEqual(2);
    expect(getRemoteMusicTrack('zero-size')).toBeNull();
  });

  it('rejects malformed catalog without applying overlays', () => {
    const before = getRemoteMusicTrack('celtic-traveler')!.url;
    const result = applyRemoteCatalogFromRaw({ tracks: 'nope' }, BASE);
    expect(result.ok).toBe(false);
    expect(getRemoteMusicTrack('celtic-traveler')!.url).toBe(before);
  });

  it('rewrites then sanitizes relative catalog entries', () => {
    const rewritten = rewriteRemoteCatalogUrls(sampleCatalog(), BASE);
    const { catalog, dropped } = sanitizeRemoteMusicCatalog(rewritten);
    expect(dropped).toBe(0);
    expect(catalog.tracks).toHaveLength(2);
    expect(catalog.tracks[0].url.startsWith('https://')).toBe(true);
  });

  it('does not prefetch / download tracks when applying catalog', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    applyRemoteCatalogFromRaw(fullRelativeCatalogFromMock(), BASE);
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('bootstrapMusicRemoteCatalog fetch', () => {
  afterEach(() => {
    __resetMusicRemoteConfigForTests();
    teardownMusicRemoteCatalogOverlays();
    clearRemoteMusicTrackOverlays();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('PASS: loads catalog when fetch succeeds', async () => {
    __setMusicRemoteBaseUrlForTests(BASE);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => sampleCatalog()
      }))
    );
    const result = await bootstrapMusicRemoteCatalog();
    expect(result.ok).toBe(true);
    expect(result.applied).toBe(2);
    expect(fetch).toHaveBeenCalledWith(`${BASE}/music/v1/catalog.json`);
  });

  it('FAIL: catalog failure → core-only (mock .invalid remains)', async () => {
    __setMusicRemoteBaseUrlForTests(BASE);
    const before = getRemoteMusicTrack('celtic-traveler')!.url;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500
      }))
    );
    const result = await bootstrapMusicRemoteCatalog();
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('http_500');
    expect(getRemoteMusicTrack('celtic-traveler')!.url).toBe(before);
    expect(resolveRemotePlaybackUrl(getRemoteMusicTrack('celtic-traveler')!)).toBeNull();
    // Themes still resolve (remote metadata / core fallback path)
    expect(resolveThemeMusic('classic').source).toBe('core');
  });

  it('FAIL: invalid base disables bootstrap', async () => {
    __setMusicRemoteBaseUrlForTests(null);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const result = await bootstrapMusicRemoteCatalog();
    expect(result.reason).toBe('disabled');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('theme preferred mapping (full remote)', () => {
  afterEach(() => {
    teardownMusicRemoteCatalogOverlays();
    clearRemoteMusicTrackOverlays();
  });

  it('resolves 30/30 themes with core fallback always valid', () => {
    applyRemoteCatalogFromRaw(fullRelativeCatalogFromMock(), BASE);
    const themes = Object.keys(THEME_MUSIC_FAMILY) as BuiltInThemeId[];
    expect(themes).toHaveLength(30);
    const coreIds = new Set(CORE_MUSIC_TRACKS.map((t) => t.id));

    let remotePreferred = 0;
    let corePreferred = 0;

    for (const theme of themes) {
      const pref = getThemeMusicPreference(theme);
      expect(coreIds.has(pref.fallbackCoreTrackId)).toBe(true);
      const resolved = resolveThemeMusic(theme);
      expect(resolved.id).toBeTruthy();
      expect(coreIds.has(resolved.fallbackTrackId)).toBe(true);

      if (isMusicTrackId(pref.preferredTrackId)) {
        corePreferred += 1;
        expect(resolved.source).toBe('core');
        expect(resolved.id).toBe(pref.preferredTrackId);
      } else {
        remotePreferred += 1;
        expect(resolved.source).toBe('remote');
        expect(resolved.id).toBe(pref.preferredTrackId);
        expect(resolveRemotePlaybackUrl(getRemoteMusicTrack(resolved.id)!)).not.toBeNull();
      }
    }

    expect(remotePreferred + corePreferred).toBe(30);
    expect(remotePreferred).toBeGreaterThan(0);
    expect(corePreferred).toBeGreaterThan(0);
    expect(Object.keys(THEME_PREFERRED_TRACK_ID)).toHaveLength(30);
  });
});

describe('remote prepare with R2 overlays', () => {
  beforeEach(async () => {
    __setMusicCacheFsForTests(createMemoryMusicCacheFs());
    await initMusicCache();
    __setRemotePlaybackPlatformForTests('native');
  });

  afterEach(() => {
    teardownMusicRemoteCatalogOverlays();
    clearRemoteMusicTrackOverlays();
    clearRemotePlaybackUrlOverrides();
    __resetRemotePlaybackForTests();
    __resetMusicCacheForTests();
    __setMusicCacheFsForTests(null);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('Android downloads once then cache-hits; SHA validated', async () => {
    const bytes = new TextEncoder().encode('celtic-r2-bytes');
    const hash = await sha256Hex(bytes);
    applyRemoteCatalogFromRaw(
      {
        catalogVersion: 1,
        tracks: [
          {
            id: 'celtic-traveler',
            title: 'Old Celtic Traveler',
            artist: 'Sounova Music',
            family: 'Celtic',
            url: CELTIC_REL,
            duration: 10,
            size: bytes.length,
            sha256: hash,
            streamingSafe: true,
            contentId: false,
            bundled: false,
            version: 1
          }
        ]
      },
      BASE
    );

    const fetchMock = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () =>
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    }));
    vi.stubGlobal('fetch', fetchMock);

    const first = await ensureRemotePlayable('celtic-traveler');
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.fromCache).toBe(false);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const second = await ensureRemotePlayable('celtic-traveler');
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.fromCache).toBe(true);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const cached = await lookupCachedTrack('celtic-traveler', {
      version: 1,
      sha256: hash
    });
    expect(cached.status).toBe('hit');
  });

  it('Web streams absolute R2 URL directly', async () => {
    __setRemotePlaybackPlatformForTests('web');
    applyRemoteCatalogFromRaw(sampleCatalog(), BASE);
    const result = await ensureRemotePlayable('ethiopia-groove');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url).toBe(`${BASE}/${ETH_REL}`);
      expect(result.fromCache).toBe(false);
    }
  });

  it('remote failure → prepare fails once (no retry loop)', async () => {
    applyRemoteCatalogFromRaw(sampleCatalog(), BASE);
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 404
    }));
    vi.stubGlobal('fetch', fetchMock);

    const first = await ensureRemotePlayable('celtic-traveler');
    expect(first.ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const second = await ensureRemotePlayable('celtic-traveler');
    expect(second.ok).toBe(false);
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
