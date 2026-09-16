import { getMusicRemoteBaseUrl } from './musicRemoteConfig';
import { bootstrapMusicRemoteCatalog } from './musicRemoteCatalogFetch';
import { bootstrapMusicRemoteSmokeIfEnabled } from './musicRemoteSmoke';

/**
 * Startup remote music bootstrap.
 * Prefer real catalog when `VITE_MUSIC_REMOTE_BASE_URL` is set;
 * otherwise optional same-origin smoke (`VITE_MUSIC_REMOTE_SMOKE`).
 * Never throws / never blocks the app.
 */
export async function bootstrapMusicRemoteAtStartup(): Promise<void> {
  try {
    if (getMusicRemoteBaseUrl()) {
      await bootstrapMusicRemoteCatalog();
      return;
    }
    await bootstrapMusicRemoteSmokeIfEnabled();
  } catch {
    /* keep core fallback */
  }
}
