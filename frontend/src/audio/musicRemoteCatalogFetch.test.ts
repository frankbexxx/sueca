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
  MUSIC_REMOTE_SMOKE_TRACK_IDS,
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
import {
  createMemoryMusicCacheFs
} from './musicCacheFs';
import {
  __resetMusicCacheForTests,
  __setMusicCacheFsForTests,
  initMusicCache,
  lookupCachedTrack
} from './musicCacheService';
import { sha256Hex } from './sha256';

const BASE = 'https://pub-smoke-test.example';

const CELTIC_REL = 'music/v1/tracks/celtic-traveler/1/celtic-traveler.ogg';
const ETH_REL = 'music/v1/tracks/ethiopia-groove/1/ethiopia-groove.ogg';

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

  it('applies only approved smoke tracks with resolved absolute URLs', () => {
    const extra = {
      id: 'jazz-orchestra',
      title: 'Jazz',
      artist: 'A',
      family: 'Casino Jazz / Lounge',
      url: 'music/v1/tracks/jazz-orchestra/1/jazz-orchestra.ogg',
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
    expect(result.applied).toBe(2);
    expect(MUSIC_REMOTE_SMOKE_TRACK_IDS.size).toBe(2);

    const celtic = getRemoteMusicTrack('celtic-traveler')!;
    expect(celtic.url).toBe(`${BASE}/${CELTIC_REL}`);
    expect(resolveRemotePlaybackUrl(celtic)).toBe(`${BASE}/${CELTIC_REL}`);

    const eth = getRemoteMusicTrack('ethiopia-groove')!;
    expect(eth.url).toBe(`${BASE}/${ETH_REL}`);

    // Non-approved remote stays on mock .invalid (no invented URL).
    const jazz = getRemoteMusicTrack('jazz-orchestra')!;
    expect(jazz.url).toMatch(/\.invalid/);
    expect(resolveRemotePlaybackUrl(jazz)).toBeNull();
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

  it('FAIL: leaves overlays untouched when fetch fails', async () => {
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
    // Second call may fetch again (new prepare), but not an automatic loop inside one call.
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
