import { readViteEnv } from '../config/runtimeEnv';
import { publicUrl } from '../config/runtimeEnv';
import {
  clearRemoteMusicTrackOverlays,
  getRemoteMusicTrack,
  upsertRemoteMusicTrackOverlay
} from './remoteMusicCatalog';
import {
  clearRemotePlaybackUrlOverrides,
  setRemotePlaybackUrlOverride
} from './musicRemoteUrlProvider';
import { sha256Hex } from './sha256';
import type { RemoteMusicTrack } from './remoteMusicTypes';

const SMOKE_TRACK_ID = 'celtic-traveler';

/**
 * Optional controlled smoke (VITE_MUSIC_REMOTE_SMOKE=true at build time).
 * Maps one remote id → bundled core OGG (same-origin), with real sha/size.
 * Never enables `.invalid` mock CDN.
 */
export async function bootstrapMusicRemoteSmokeIfEnabled(): Promise<boolean> {
  if (readViteEnv('VITE_MUSIC_REMOTE_SMOKE') !== 'true') {
    return false;
  }
  if (typeof window === 'undefined') return false;

  try {
    const base = publicUrl();
    const assetPath = `${base}/assets/music/core/nordic-kalte.ogg`.replace(
      /\/{2,}/g,
      '/'
    );
    // Prefer absolute URL from current origin for fetch on Android WebView.
    const url = new URL(
      assetPath.startsWith('.') ? assetPath.replace(/^\.\//, '') : assetPath,
      window.location.href
    ).href;

    const res = await fetch(url);
    if (!res.ok) return false;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const hash = await sha256Hex(bytes);
    const baseTrack = getRemoteMusicTrack(SMOKE_TRACK_ID);
    if (!baseTrack) return false;

    const overlay: RemoteMusicTrack = {
      ...baseTrack,
      url,
      size: bytes.length,
      sha256: hash,
      version: baseTrack.version,
      bundled: false
    };
    upsertRemoteMusicTrackOverlay(overlay);
    setRemotePlaybackUrlOverride(SMOKE_TRACK_ID, url);
    return true;
  } catch {
    return false;
  }
}

export function teardownMusicRemoteSmoke(): void {
  clearRemotePlaybackUrlOverrides();
  clearRemoteMusicTrackOverlays();
}

export function getMusicRemoteSmokeTrackId(): string {
  return SMOKE_TRACK_ID;
}
