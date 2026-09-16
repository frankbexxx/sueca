/** Local Android music cache manifest (Directory.Data / music/). */

export type CachedMusicEntry = {
  trackId: string;
  version: number;
  sha256: string;
  /** Relative path under Directory.Data, e.g. music/{id}/{version}/{id}.ogg */
  filePath: string;
  size: number;
  cachedAt: string;
};

export type MusicCacheManifest = {
  version: 1;
  entries: Record<string, CachedMusicEntry>;
};

export const MUSIC_CACHE_ROOT = 'music';
export const MUSIC_CACHE_MANIFEST_PATH = `${MUSIC_CACHE_ROOT}/manifest.json`;

export function musicTrackRelativePath(trackId: string, version: number): string {
  return `${MUSIC_CACHE_ROOT}/${trackId}/${version}/${trackId}.ogg`;
}

export function musicTrackPartPath(trackId: string, version: number): string {
  return `${MUSIC_CACHE_ROOT}/${trackId}/${version}/${trackId}.ogg.part`;
}

export function emptyMusicCacheManifest(): MusicCacheManifest {
  return { version: 1, entries: {} };
}
