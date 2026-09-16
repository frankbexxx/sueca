import { vi } from 'vitest';
import { createMemoryMusicCacheFs } from './musicCacheFs';
import {
  __resetMusicCacheForTests,
  __setMusicCacheFsForTests,
  getCachedEntry,
  initMusicCache
} from './musicCacheService';
import {
  __resetRemotePlaybackForTests,
  __setRemotePlaybackPlatformForTests,
  ensureRemotePlayable,
  getRemoteDownloadState
} from './musicRemotePrepare';
import {
  clearRemotePlaybackUrlOverrides,
  resolveRemotePlaybackUrl,
  setRemotePlaybackUrlOverride
} from './musicRemoteUrlProvider';
import {
  clearRemoteMusicTrackOverlays,
  getRemoteMusicTrack,
  upsertRemoteMusicTrackOverlay
} from './remoteMusicCatalog';
import { convertNativeUriForTests } from './musicLocalUri';
import { sha256Hex } from './sha256';

async function fixtureBytes(label: string) {
  const bytes = new TextEncoder().encode(`remote-play:${label}`);
  return { bytes, sha256: await sha256Hex(bytes), size: bytes.length };
}

describe('musicRemotePrepare', () => {
  beforeEach(async () => {
    __setMusicCacheFsForTests(createMemoryMusicCacheFs());
    await initMusicCache();
    __setRemotePlaybackPlatformForTests('native');
    clearRemotePlaybackUrlOverrides();
    clearRemoteMusicTrackOverlays();
  });

  afterEach(() => {
    __resetRemotePlaybackForTests();
    __resetMusicCacheForTests();
    __setMusicCacheFsForTests(null);
    clearRemotePlaybackUrlOverrides();
    clearRemoteMusicTrackOverlays();
    vi.unstubAllGlobals();
  });

  it('blocks .invalid catalog URLs without override', () => {
    const track = getRemoteMusicTrack('celtic-traveler')!;
    expect(resolveRemotePlaybackUrl(track)).toBeNull();
  });

  it('first download caches and returns playable url', async () => {
    const { bytes, sha256, size } = await fixtureBytes('dl1');
    const base = getRemoteMusicTrack('celtic-traveler')!;
    upsertRemoteMusicTrackOverlay({ ...base, sha256, size, url: 'https://cdn.test/a.ogg' });
    setRemotePlaybackUrlOverride('celtic-traveler', 'https://cdn.test/a.ogg');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
      }))
    );

    const first = await ensureRemotePlayable('celtic-traveler');
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.fromCache).toBe(false);
    expect(getRemoteDownloadState('celtic-traveler')).toBe('READY');
    expect(getCachedEntry('celtic-traveler')?.sha256).toBe(sha256);
  });

  it('second prepare is cache hit (no extra fetch)', async () => {
    const { bytes, sha256, size } = await fixtureBytes('hit');
    const base = getRemoteMusicTrack('ethiopia-groove')!;
    upsertRemoteMusicTrackOverlay({ ...base, sha256, size });
    setRemotePlaybackUrlOverride('ethiopia-groove', 'https://cdn.test/b.ogg');
    const fetchMock = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () =>
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    }));
    vi.stubGlobal('fetch', fetchMock);

    await ensureRemotePlayable('ethiopia-groove');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const second = await ensureRemotePlayable('ethiopia-groove');
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.fromCache).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('dedupes concurrent prepares for same track', async () => {
    const { bytes, sha256, size } = await fixtureBytes('dedup');
    const base = getRemoteMusicTrack('khmer-roneat')!;
    upsertRemoteMusicTrackOverlay({ ...base, sha256, size });
    setRemotePlaybackUrlOverride('khmer-roneat', 'https://cdn.test/c.ogg');
    let resolveFetch!: (v: unknown) => void;
    const gate = new Promise((r) => {
      resolveFetch = r;
    });
    const fetchMock = vi.fn(async () => {
      await gate;
      return {
        ok: true,
        arrayBuffer: async () =>
          bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const p1 = ensureRemotePlayable('khmer-roneat');
    const p2 = ensureRemotePlayable('khmer-roneat');
    resolveFetch(undefined);
    const [a, b] = await Promise.all([p1, p2]);
    expect(a.ok && b.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('SHA failure falls back (no cache) when no stale', async () => {
    const { bytes, size } = await fixtureBytes('badhash');
    const base = getRemoteMusicTrack('tibet-ocean')!;
    upsertRemoteMusicTrackOverlay({ ...base, sha256: 'b'.repeat(64), size });
    setRemotePlaybackUrlOverride('tibet-ocean', 'https://cdn.test/d.ogg');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        arrayBuffer: async () =>
          bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
      }))
    );
    const result = await ensureRemotePlayable('tibet-ocean');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('hash_mismatch');
    expect(getRemoteDownloadState('tibet-ocean')).toBe('FAILED');
  });

  it('network failure returns failed', async () => {
    const base = getRemoteMusicTrack('southern-mara')!;
    upsertRemoteMusicTrackOverlay({ ...base, sha256: 'c'.repeat(64), size: 4 });
    setRemotePlaybackUrlOverride('southern-mara', 'https://cdn.test/e.ogg');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
    const result = await ensureRemotePlayable('southern-mara');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/http_404|prepare_failed/);
  });

  it('preserves stale old version when update fails', async () => {
    const v1 = await fixtureBytes('stale-old');
    const base = getRemoteMusicTrack('mongolia-atlas')!;
    upsertRemoteMusicTrackOverlay({
      ...base,
      version: 1,
      sha256: v1.sha256,
      size: v1.size
    });
    setRemotePlaybackUrlOverride('mongolia-atlas', 'https://cdn.test/v1.ogg');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        arrayBuffer: async () =>
          v1.bytes.buffer.slice(
            v1.bytes.byteOffset,
            v1.bytes.byteOffset + v1.bytes.byteLength
          )
      }))
    );
    expect((await ensureRemotePlayable('mongolia-atlas')).ok).toBe(true);

    // Catalog advances; update bytes wrong hash → keep v1 playable
    upsertRemoteMusicTrackOverlay({
      ...base,
      version: 2,
      sha256: 'd'.repeat(64),
      size: 10
    });
    setRemotePlaybackUrlOverride('mongolia-atlas', 'https://cdn.test/v2.ogg');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer
      }))
    );
    const result = await ensureRemotePlayable('mongolia-atlas');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fromCache).toBe(true);
    expect(getCachedEntry('mongolia-atlas')?.version).toBe(1);
  });

  it('web path streams override URL without filesystem', async () => {
    __setRemotePlaybackPlatformForTests('web');
    const base = getRemoteMusicTrack('hawaii-relax')!;
    setRemotePlaybackUrlOverride('hawaii-relax', 'https://cdn.test/stream.ogg');
    upsertRemoteMusicTrackOverlay({ ...base, url: 'https://cdn.test/stream.ogg' });
    const result = await ensureRemotePlayable('hawaii-relax');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.url).toBe('https://cdn.test/stream.ogg');
    expect(result.fromCache).toBe(false);
  });

  it('local URI helper converts file:// for WebView', () => {
    expect(convertNativeUriForTests('file:///data/music/x.ogg')).toContain(
      '_capacitor_file_'
    );
  });
});
