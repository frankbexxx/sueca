import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

/**
 * Convert a Directory.Data-relative music cache path into a WebView-playable URL.
 * Capacitor 6: getUri → convertFileSrc (do not use raw file://).
 */
export async function cachedMusicPathToPlayableUrl(
  relativePath: string
): Promise<string | null> {
  try {
    if (!relativePath) return null;
    if (!Capacitor.isNativePlatform()) {
      // Web has no Filesystem music cache.
      return null;
    }
    const { uri } = await Filesystem.getUri({
      path: relativePath,
      directory: Directory.Data
    });
    return Capacitor.convertFileSrc(uri);
  } catch {
    return null;
  }
}

/** Pure helper for tests — mirrors Capacitor.convertFileSrc shape without native bridge. */
export function convertNativeUriForTests(uri: string): string {
  if (uri.startsWith('file://')) {
    return uri.replace('file://', 'https://localhost/_capacitor_file_');
  }
  return uri;
}
