import type { RemoteMusicTrack } from './remoteMusicTypes';

/**
 * Resolves a real fetch/stream URL for a remote track.
 * Mock catalog `.invalid` URLs are never returned (no production fake CDN).
 * Tests / controlled smoke inject overrides via setters below.
 */

const BLOCKED_HOST_RE = /\.invalid$/i;

const urlOverrides = new Map<string, string>();

export function isBlockedRemotePlaybackUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return BLOCKED_HOST_RE.test(host) || host.endsWith('.example.invalid');
  } catch {
    return true;
  }
}

/** Test / controlled smoke only — not used by production catalog. */
export function setRemotePlaybackUrlOverride(trackId: string, url: string): void {
  urlOverrides.set(trackId, url);
}

export function clearRemotePlaybackUrlOverrides(): void {
  urlOverrides.clear();
}

export function getRemotePlaybackUrlOverride(trackId: string): string | null {
  return urlOverrides.get(trackId) ?? null;
}

/**
 * URL to fetch (Android) or stream (Web).
 * Returns null when no safe playable URL exists → caller falls back to core.
 */
export function resolveRemotePlaybackUrl(track: RemoteMusicTrack): string | null {
  const override = urlOverrides.get(track.id);
  if (override) {
    if (isBlockedRemotePlaybackUrl(override)) return null;
    return override;
  }
  if (!track.url || isBlockedRemotePlaybackUrl(track.url)) return null;
  return track.url;
}
