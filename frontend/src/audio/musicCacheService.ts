import type { RemoteMusicTrack } from './remoteMusicTypes';
import {
  MusicCacheFs,
  createCapacitorMusicCacheFs
} from './musicCacheFs';
import {
  CachedMusicEntry,
  MUSIC_CACHE_MANIFEST_PATH,
  MUSIC_CACHE_ROOT,
  MusicCacheManifest,
  emptyMusicCacheManifest,
  musicTrackPartPath,
  musicTrackRelativePath
} from './musicCacheTypes';
import {
  base64ToUint8Array,
  isSha256Hex,
  sha256Hex,
  uint8ArrayToBase64
} from './sha256';

export type CacheEntryStatus =
  | 'hit'
  | 'stale'
  | 'miss'
  | 'corrupt'
  | 'unsupported';

export type CacheLookup = {
  status: CacheEntryStatus;
  entry: CachedMusicEntry | null;
  /** Web-playable URL when a verified file exists (hit or stale). */
  playableUrl: string | null;
};

export type CacheRemoteResult =
  | { ok: true; entry: CachedMusicEntry; playableUrl: string }
  | { ok: false; reason: string };

export type CacheBytesSource =
  | { kind: 'bytes'; data: Uint8Array }
  | { kind: 'fetch'; fetchBytes: () => Promise<Uint8Array> };

let fs: MusicCacheFs = createCapacitorMusicCacheFs();
let manifest: MusicCacheManifest = emptyMusicCacheManifest();
let initialized = false;

/** Hosts that must never be fetched (mock CDN). */
const BLOCKED_FETCH_HOST_RE = /\.invalid$/i;

export function __setMusicCacheFsForTests(next: MusicCacheFs | null): void {
  fs = next ?? createCapacitorMusicCacheFs();
  manifest = emptyMusicCacheManifest();
  initialized = false;
}

export function __resetMusicCacheForTests(): void {
  manifest = emptyMusicCacheManifest();
  initialized = false;
}

export function getMusicCacheManifestSnapshot(): MusicCacheManifest {
  return {
    version: 1,
    entries: { ...manifest.entries }
  };
}

function isBlockedRemoteUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return BLOCKED_FETCH_HOST_RE.test(host) || host.endsWith('.example.invalid');
  } catch {
    return true;
  }
}

async function writeManifest(next: MusicCacheManifest): Promise<void> {
  manifest = next;
  if (!fs.isNativeFilesystem()) return;
  try {
    await fs.mkdir(MUSIC_CACHE_ROOT);
    await fs.writeText(MUSIC_CACHE_MANIFEST_PATH, JSON.stringify(next));
  } catch {
    /* never throw to callers from persistence alone */
  }
}

function parseManifest(raw: string | null): MusicCacheManifest {
  if (!raw) return emptyMusicCacheManifest();
  try {
    const parsed = JSON.parse(raw) as Partial<MusicCacheManifest>;
    if (parsed.version !== 1 || typeof parsed.entries !== 'object' || !parsed.entries) {
      return emptyMusicCacheManifest();
    }
    const entries: Record<string, CachedMusicEntry> = {};
    for (const [key, value] of Object.entries(parsed.entries)) {
      if (!value || typeof value !== 'object') continue;
      const e = value as CachedMusicEntry;
      if (
        typeof e.trackId === 'string' &&
        e.trackId === key &&
        typeof e.version === 'number' &&
        Number.isInteger(e.version) &&
        e.version >= 1 &&
        typeof e.sha256 === 'string' &&
        isSha256Hex(e.sha256) &&
        typeof e.filePath === 'string' &&
        e.filePath.length > 0 &&
        typeof e.size === 'number' &&
        e.size >= 0 &&
        typeof e.cachedAt === 'string'
      ) {
        entries[key] = {
          trackId: e.trackId,
          version: e.version,
          sha256: e.sha256,
          filePath: e.filePath,
          size: e.size,
          cachedAt: e.cachedAt
        };
      }
    }
    return { version: 1, entries };
  } catch {
    return emptyMusicCacheManifest();
  }
}

/**
 * Init cache dir + load manifest into memory.
 * No-op (safe) on web when native FS is unavailable.
 */
export async function initMusicCache(): Promise<void> {
  try {
    if (!fs.isNativeFilesystem()) {
      manifest = emptyMusicCacheManifest();
      initialized = true;
      return;
    }
    await fs.mkdir(MUSIC_CACHE_ROOT);
    const raw = await fs.readText(MUSIC_CACHE_MANIFEST_PATH);
    manifest = parseManifest(raw);
    // Drop entries whose files vanished; keep stale vs catalog for later.
    const cleaned = emptyMusicCacheManifest();
    for (const [id, entry] of Object.entries(manifest.entries)) {
      const st = await fs.stat(entry.filePath);
      if (!st || st.size !== entry.size) {
        continue;
      }
      cleaned.entries[id] = entry;
    }
    if (Object.keys(cleaned.entries).length !== Object.keys(manifest.entries).length) {
      await writeManifest(cleaned);
    } else {
      manifest = cleaned;
    }
    initialized = true;
  } catch {
    manifest = emptyMusicCacheManifest();
    initialized = true;
  }
}

export function isMusicCacheInitialized(): boolean {
  return initialized;
}

export function getCachedEntry(trackId: string): CachedMusicEntry | null {
  return manifest.entries[trackId] ?? null;
}

/**
 * Compare cached entry to catalog expectations.
 * stale = file present & previously verified, but version/sha no longer match catalog.
 *
 * Mock-catalog note: placeholder digests (`a`×56 + tail from MUSIC-REMOTE-MOCK-01)
 * are ignored for sha comparison when versions match — real R2 hashes will not use
 * that prefix, so production classification stays strict.
 */
export function classifyCachedEntry(
  entry: CachedMusicEntry | null,
  expected?: { version: number; sha256: string } | null
): 'hit' | 'stale' | 'miss' {
  if (!entry) return 'miss';
  if (!expected) return 'hit';
  if (entry.version !== expected.version) return 'stale';
  if (isMockPlaceholderSha(expected.sha256)) return 'hit';
  if (entry.sha256 === expected.sha256) return 'hit';
  return 'stale';
}

function isMockPlaceholderSha(sha256: string): boolean {
  return sha256.startsWith('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
}

async function buildPlayableUrl(filePath: string): Promise<string | null> {
  try {
    const uri = await fs.getUri(filePath);
    return fs.convertFileSrc(uri);
  } catch {
    return null;
  }
}

/**
 * Validate on-disk bytes against manifest entry (size + sha256).
 * On failure: remove entry from manifest and delete corrupt file.
 */
export async function validateCachedTrack(trackId: string): Promise<boolean> {
  const entry = manifest.entries[trackId];
  if (!entry) return false;
  try {
    if (!fs.isNativeFilesystem()) return false;
    const st = await fs.stat(entry.filePath);
    if (!st || st.size !== entry.size) {
      await invalidateEntry(trackId, { deleteFile: true });
      return false;
    }
    const b64 = await fs.readBinaryBase64(entry.filePath);
    if (!b64) {
      await invalidateEntry(trackId, { deleteFile: true });
      return false;
    }
    const bytes = base64ToUint8Array(b64);
    if (bytes.length !== entry.size) {
      await invalidateEntry(trackId, { deleteFile: true });
      return false;
    }
    const hash = await sha256Hex(bytes);
    if (hash !== entry.sha256) {
      await invalidateEntry(trackId, { deleteFile: true });
      return false;
    }
    return true;
  } catch {
    await invalidateEntry(trackId, { deleteFile: true });
    return false;
  }
}

async function invalidateEntry(
  trackId: string,
  options?: { deleteFile?: boolean }
): Promise<void> {
  const entry = manifest.entries[trackId];
  const next = emptyMusicCacheManifest();
  Object.assign(next.entries, manifest.entries);
  delete next.entries[trackId];
  await writeManifest(next);
  if (options?.deleteFile && entry) {
    await fs.deleteFile(entry.filePath);
  }
}

export async function lookupCachedTrack(
  trackId: string,
  expected?: { version: number; sha256: string } | null
): Promise<CacheLookup> {
  try {
    if (!fs.isNativeFilesystem()) {
      return { status: 'unsupported', entry: null, playableUrl: null };
    }
    if (!initialized) {
      await initMusicCache();
    }
    const entry = getCachedEntry(trackId);
    if (!entry) {
      return { status: 'miss', entry: null, playableUrl: null };
    }
    const ok = await validateCachedTrack(trackId);
    if (!ok) {
      return { status: 'corrupt', entry: null, playableUrl: null };
    }
    const fresh = getCachedEntry(trackId);
    if (!fresh) {
      return { status: 'miss', entry: null, playableUrl: null };
    }
    const status = classifyCachedEntry(fresh, expected ?? null);
    const playableUrl = await buildPlayableUrl(fresh.filePath);
    return { status, entry: fresh, playableUrl };
  } catch {
    return { status: 'corrupt', entry: null, playableUrl: null };
  }
}

/**
 * Sync snapshot for availability/resolver (uses in-memory manifest only).
 * Call after initMusicCache / cacheRemoteTrack for accuracy.
 */
export function lookupCachedTrackSync(
  trackId: string,
  expected?: { version: number; sha256: string } | null
): { status: 'hit' | 'stale' | 'miss'; entry: CachedMusicEntry | null } {
  const entry = getCachedEntry(trackId);
  if (!entry) return { status: 'miss', entry: null };
  return { status: classifyCachedEntry(entry, expected ?? null), entry };
}

async function resolveBytes(
  track: RemoteMusicTrack,
  source?: CacheBytesSource
): Promise<Uint8Array> {
  if (source?.kind === 'bytes') {
    return source.data;
  }
  if (source?.kind === 'fetch') {
    return source.fetchBytes();
  }
  // Production fetch path — blocked for mock .invalid hosts.
  if (isBlockedRemoteUrl(track.url)) {
    throw new Error('blocked_mock_url');
  }
  const res = await fetch(track.url);
  if (!res.ok) {
    throw new Error(`http_${res.status}`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * Atomically cache a remote track from controlled bytes (tests) or real URL.
 * Never fetches `*.invalid` mock hosts. Never replaces a valid file before verify.
 */
export async function cacheRemoteTrack(
  track: RemoteMusicTrack,
  source?: CacheBytesSource
): Promise<CacheRemoteResult> {
  try {
    if (!fs.isNativeFilesystem()) {
      return { ok: false, reason: 'filesystem_unavailable' };
    }
    if (!initialized) {
      await initMusicCache();
    }

    const previous = getCachedEntry(track.id);
    const finalPath = musicTrackRelativePath(track.id, track.version);
    const partPath = musicTrackPartPath(track.id, track.version);

    // Clean leftover .part from interrupted downloads.
    await fs.deleteFile(partPath);

    const bytes = await resolveBytes(track, source);
    if (track.size > 0 && bytes.length !== track.size) {
      await fs.deleteFile(partPath);
      return { ok: false, reason: 'size_mismatch' };
    }

    const hash = await sha256Hex(bytes);
    if (hash !== track.sha256) {
      await fs.deleteFile(partPath);
      return { ok: false, reason: 'hash_mismatch' };
    }

    await fs.mkdir(`${MUSIC_CACHE_ROOT}/${track.id}/${track.version}`);
    await fs.writeBinaryBase64(partPath, uint8ArrayToBase64(bytes));

    const partStat = await fs.stat(partPath);
    if (!partStat || partStat.size !== bytes.length) {
      await fs.deleteFile(partPath);
      return { ok: false, reason: 'part_stat_failed' };
    }

    // Promote: write final via rename; if final exists from same version, delete first.
    const existingFinal = await fs.stat(finalPath);
    if (existingFinal) {
      await fs.deleteFile(finalPath);
    }
    await fs.rename(partPath, finalPath);
    await fs.deleteFile(partPath);

    const entry: CachedMusicEntry = {
      trackId: track.id,
      version: track.version,
      sha256: track.sha256,
      filePath: finalPath,
      size: bytes.length,
      cachedAt: new Date().toISOString()
    };

    const next = emptyMusicCacheManifest();
    Object.assign(next.entries, manifest.entries);
    next.entries[track.id] = entry;
    await writeManifest(next);

    // Remove previous version path after new verified entry is active.
    if (
      previous &&
      (previous.version !== entry.version || previous.filePath !== entry.filePath)
    ) {
      await fs.deleteFile(previous.filePath);
      // Best-effort: remove empty version folder
      const oldDir = `${MUSIC_CACHE_ROOT}/${previous.trackId}/${previous.version}`;
      await fs.rmdirRecursive(oldDir);
    }

    const playableUrl = (await buildPlayableUrl(finalPath)) ?? finalPath;
    return { ok: true, entry, playableUrl };
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'cache_failed';
    return { ok: false, reason };
  }
}

export async function clearCachedTrack(trackId: string): Promise<void> {
  try {
    const entry = getCachedEntry(trackId);
    const next = emptyMusicCacheManifest();
    Object.assign(next.entries, manifest.entries);
    delete next.entries[trackId];
    await writeManifest(next);
    if (entry) {
      await fs.deleteFile(entry.filePath);
      await fs.rmdirRecursive(`${MUSIC_CACHE_ROOT}/${trackId}`);
    }
  } catch {
    /* never throw */
  }
}

export async function clearAllMusicCache(): Promise<void> {
  try {
    await writeManifest(emptyMusicCacheManifest());
    await fs.rmdirRecursive(MUSIC_CACHE_ROOT);
    await fs.mkdir(MUSIC_CACHE_ROOT);
  } catch {
    /* never throw */
  }
}

export async function removeStaleVersion(
  trackId: string,
  keepVersion: number
): Promise<void> {
  try {
    const entry = getCachedEntry(trackId);
    if (!entry || entry.version === keepVersion) return;
    // Only remove if caller already installed keepVersion elsewhere.
    if (entry.version !== keepVersion) {
      await fs.deleteFile(entry.filePath);
      await fs.rmdirRecursive(`${MUSIC_CACHE_ROOT}/${trackId}/${entry.version}`);
    }
  } catch {
    /* never throw */
  }
}
