import { createMemoryMusicCacheFs } from './musicCacheFs';
import {
  __resetMusicCacheForTests,
  __setMusicCacheFsForTests,
  cacheRemoteTrack,
  clearAllMusicCache,
  clearCachedTrack,
  classifyCachedEntry,
  getCachedEntry,
  getMusicCacheManifestSnapshot,
  initMusicCache,
  lookupCachedTrack,
  lookupCachedTrackSync,
  validateCachedTrack
} from './musicCacheService';
import {
  MUSIC_CACHE_MANIFEST_PATH,
  musicTrackPartPath,
  musicTrackRelativePath
} from './musicCacheTypes';
import type { RemoteMusicTrack } from './remoteMusicTypes';
import { sha256Hex, uint8ArrayToBase64 } from './sha256';

function trackFixture(
  overrides: Partial<RemoteMusicTrack> & { id: string }
): RemoteMusicTrack {
  return {
    id: overrides.id,
    title: overrides.title ?? overrides.id,
    artist: overrides.artist ?? 'Test',
    family: overrides.family ?? 'Celtic',
    url:
      overrides.url ??
      `https://music.example.invalid/music/v1/tracks/${overrides.id}/1/${overrides.id}.ogg`,
    duration: overrides.duration ?? 10,
    size: overrides.size ?? 0,
    sha256: overrides.sha256 ?? 'a'.repeat(64),
    streamingSafe: overrides.streamingSafe ?? true,
    contentId: overrides.contentId ?? false,
    bundled: false,
    version: overrides.version ?? 1
  };
}

async function makeBytes(label: string): Promise<{
  bytes: Uint8Array;
  sha256: string;
  size: number;
}> {
  const bytes = new TextEncoder().encode(`ogg-fixture:${label}`);
  const hash = await sha256Hex(bytes);
  return { bytes, sha256: hash, size: bytes.length };
}

describe('musicCacheService', () => {
  beforeEach(async () => {
    __setMusicCacheFsForTests(createMemoryMusicCacheFs());
    await initMusicCache();
  });

  afterEach(() => {
    __resetMusicCacheForTests();
    __setMusicCacheFsForTests(null);
  });

  it('starts with an empty manifest', () => {
    const snap = getMusicCacheManifestSnapshot();
    expect(snap.version).toBe(1);
    expect(Object.keys(snap.entries)).toHaveLength(0);
  });

  it('reads and writes manifest across init', async () => {
    const { bytes, sha256, size } = await makeBytes('persist');
    const track = trackFixture({
      id: 'celtic-traveler',
      size,
      sha256
    });
    const result = await cacheRemoteTrack(track, { kind: 'bytes', data: bytes });
    expect(result.ok).toBe(true);

    // Simulate process restart with same Directory.Data
    __resetMusicCacheForTests();
    await initMusicCache();
    expect(getCachedEntry('celtic-traveler')?.sha256).toBe(sha256);
    expect(getCachedEntry('celtic-traveler')?.size).toBe(size);
  });

  it('caches a valid track (hash + size success)', async () => {
    const { bytes, sha256, size } = await makeBytes('hit');
    const track = trackFixture({ id: 'ethiopia-groove', size, sha256, version: 1 });
    const result = await cacheRemoteTrack(track, { kind: 'bytes', data: bytes });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry.filePath).toBe(musicTrackRelativePath('ethiopia-groove', 1));
    expect(lookupCachedTrackSync('ethiopia-groove', { version: 1, sha256 }).status).toBe(
      'hit'
    );
    const lookup = await lookupCachedTrack('ethiopia-groove', { version: 1, sha256 });
    expect(lookup.status).toBe('hit');
    expect(lookup.playableUrl).toBeTruthy();
    expect(await validateCachedTrack('ethiopia-groove')).toBe(true);
  });

  it('rejects hash mismatch and preserves previous valid version', async () => {
    const v1 = await makeBytes('v1');
    const trackV1 = trackFixture({
      id: 'khmer-roneat',
      size: v1.size,
      sha256: v1.sha256,
      version: 1
    });
    expect((await cacheRemoteTrack(trackV1, { kind: 'bytes', data: v1.bytes })).ok).toBe(
      true
    );

    const v2 = await makeBytes('v2-bad');
    const trackV2 = trackFixture({
      id: 'khmer-roneat',
      size: v2.size,
      sha256: 'b'.repeat(64), // wrong expected hash
      version: 2
    });
    const fail = await cacheRemoteTrack(trackV2, { kind: 'bytes', data: v2.bytes });
    expect(fail.ok).toBe(false);
    if (fail.ok) return;
    expect(fail.reason).toBe('hash_mismatch');

    const kept = getCachedEntry('khmer-roneat');
    expect(kept?.version).toBe(1);
    expect(kept?.sha256).toBe(v1.sha256);
    expect(await validateCachedTrack('khmer-roneat')).toBe(true);
  });

  it('rejects size mismatch', async () => {
    const { bytes, sha256 } = await makeBytes('size');
    const track = trackFixture({
      id: 'southern-mara',
      size: bytes.length + 10,
      sha256
    });
    const fail = await cacheRemoteTrack(track, { kind: 'bytes', data: bytes });
    expect(fail.ok).toBe(false);
    if (fail.ok) return;
    expect(fail.reason).toBe('size_mismatch');
    expect(getCachedEntry('southern-mara')).toBeNull();
  });

  it('cleans interrupted .part leftovers before write', async () => {
    const mem = createMemoryMusicCacheFs();
    __setMusicCacheFsForTests(mem);
    await initMusicCache();

    const part = musicTrackPartPath('tibet-ocean', 1);
    await mem.writeBinaryBase64(part, uint8ArrayToBase64(new Uint8Array([1, 2, 3])));

    const { bytes, sha256, size } = await makeBytes('part');
    const track = trackFixture({ id: 'tibet-ocean', size, sha256 });
    const result = await cacheRemoteTrack(track, { kind: 'bytes', data: bytes });
    expect(result.ok).toBe(true);
    expect(await mem.stat(part)).toBeNull();
  });

  it('marks stale when catalog version advances but keeps old file', async () => {
    const v1 = await makeBytes('stale-v1');
    const track = trackFixture({
      id: 'mongolia-atlas',
      size: v1.size,
      sha256: v1.sha256,
      version: 1
    });
    expect((await cacheRemoteTrack(track, { kind: 'bytes', data: v1.bytes })).ok).toBe(
      true
    );

    const status = classifyCachedEntry(getCachedEntry('mongolia-atlas'), {
      version: 2,
      sha256: v1.sha256
    });
    expect(status).toBe('stale');
    expect(getCachedEntry('mongolia-atlas')?.version).toBe(1);
    expect(await validateCachedTrack('mongolia-atlas')).toBe(true);
  });

  it('marks stale when real catalog sha differs at same version', async () => {
    const v1 = await makeBytes('sha-stale');
    const track = trackFixture({
      id: 'royal-angkor',
      size: v1.size,
      sha256: v1.sha256,
      version: 1
    });
    expect((await cacheRemoteTrack(track, { kind: 'bytes', data: v1.bytes })).ok).toBe(
      true
    );
    expect(
      classifyCachedEntry(getCachedEntry('royal-angkor'), {
        version: 1,
        sha256: 'b'.repeat(64)
      })
    ).toBe('stale');
  });

  it('after successful new version, removes previous path', async () => {
    const mem = createMemoryMusicCacheFs();
    __setMusicCacheFsForTests(mem);
    await initMusicCache();

    const v1 = await makeBytes('upgrade-1');
    const t1 = trackFixture({
      id: 'andes-patagonia',
      size: v1.size,
      sha256: v1.sha256,
      version: 1
    });
    expect((await cacheRemoteTrack(t1, { kind: 'bytes', data: v1.bytes })).ok).toBe(true);
    const oldPath = musicTrackRelativePath('andes-patagonia', 1);

    const v2 = await makeBytes('upgrade-2');
    const t2 = trackFixture({
      id: 'andes-patagonia',
      size: v2.size,
      sha256: v2.sha256,
      version: 2
    });
    expect((await cacheRemoteTrack(t2, { kind: 'bytes', data: v2.bytes })).ok).toBe(true);

    expect(getCachedEntry('andes-patagonia')?.version).toBe(2);
    expect(await mem.stat(oldPath)).toBeNull();
    expect(await mem.stat(musicTrackRelativePath('andes-patagonia', 2))).not.toBeNull();
  });

  it('handles corrupted manifest without throwing', async () => {
    const mem = createMemoryMusicCacheFs();
    __setMusicCacheFsForTests(mem);
    await mem.mkdir('music');
    await mem.writeText(MUSIC_CACHE_MANIFEST_PATH, '{not-json');
    await expect(initMusicCache()).resolves.toBeUndefined();
    expect(getMusicCacheManifestSnapshot().entries).toEqual({});
  });

  it('invalidates missing cached file', async () => {
    const mem = createMemoryMusicCacheFs();
    __setMusicCacheFsForTests(mem);
    await initMusicCache();
    const { bytes, sha256, size } = await makeBytes('missing');
    const track = trackFixture({ id: 'kathmandu', size, sha256 });
    expect((await cacheRemoteTrack(track, { kind: 'bytes', data: bytes })).ok).toBe(true);
    await mem.deleteFile(musicTrackRelativePath('kathmandu', 1));
    expect(await validateCachedTrack('kathmandu')).toBe(false);
    expect(getCachedEntry('kathmandu')).toBeNull();
  });

  it('clear one and clear all', async () => {
    const a = await makeBytes('a');
    const b = await makeBytes('b');
    const ta = trackFixture({ id: 'jazz-orchestra', size: a.size, sha256: a.sha256 });
    const tb = trackFixture({ id: 'whiskey-jazz', size: b.size, sha256: b.sha256 });
    expect((await cacheRemoteTrack(ta, { kind: 'bytes', data: a.bytes })).ok).toBe(true);
    expect((await cacheRemoteTrack(tb, { kind: 'bytes', data: b.bytes })).ok).toBe(true);

    await clearCachedTrack('jazz-orchestra');
    expect(getCachedEntry('jazz-orchestra')).toBeNull();
    expect(getCachedEntry('whiskey-jazz')).not.toBeNull();

    await clearAllMusicCache();
    expect(Object.keys(getMusicCacheManifestSnapshot().entries)).toHaveLength(0);
  });

  it('refuses to fetch mock .invalid URLs without injected bytes', async () => {
    const track = trackFixture({
      id: 'hawaii-relax',
      size: 4,
      sha256: 'd'.repeat(64)
    });
    const fail = await cacheRemoteTrack(track);
    expect(fail.ok).toBe(false);
    if (fail.ok) return;
    expect(fail.reason).toBe('blocked_mock_url');
  });

  it('accepts controlled fetchBytes double', async () => {
    const { bytes, sha256, size } = await makeBytes('fetch-double');
    const track = trackFixture({ id: 'ancient-temple', size, sha256 });
    const result = await cacheRemoteTrack(track, {
      kind: 'fetch',
      fetchBytes: async () => bytes
    });
    expect(result.ok).toBe(true);
  });
});
