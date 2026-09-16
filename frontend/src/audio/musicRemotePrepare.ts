import { Capacitor } from '@capacitor/core';
import {
  cacheRemoteTrack,
  lookupCachedTrack
} from './musicCacheService';
import { resolveRemotePlaybackUrl } from './musicRemoteUrlProvider';
import { getRemoteMusicTrack } from './remoteMusicCatalog';
import type { RemoteMusicTrack } from './remoteMusicTypes';

export type RemoteDownloadState = 'IDLE' | 'DOWNLOADING' | 'READY' | 'FAILED';

export type RemotePrepareResult =
  | {
      ok: true;
      url: string;
      fromCache: boolean;
      updated: boolean;
      trackId: string;
    }
  | {
      ok: false;
      reason: string;
      trackId: string;
    };

const downloadState = new Map<string, RemoteDownloadState>();
const inflight = new Map<string, Promise<RemotePrepareResult>>();

let platformOverride: 'native' | 'web' | null = null;

export function __setRemotePlaybackPlatformForTests(
  platform: 'native' | 'web' | null
): void {
  platformOverride = platform;
}

export function __resetRemotePlaybackForTests(): void {
  downloadState.clear();
  inflight.clear();
  platformOverride = null;
}

export function getRemoteDownloadState(trackId: string): RemoteDownloadState {
  return downloadState.get(trackId) ?? 'IDLE';
}

function isNativePlayback(): boolean {
  if (platformOverride) return platformOverride === 'native';
  return Capacitor.isNativePlatform();
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`http_${res.status}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

async function prepareNative(
  track: RemoteMusicTrack,
  playbackUrl: string
): Promise<RemotePrepareResult> {
  const expected = { version: track.version, sha256: track.sha256 };
  const cached = await lookupCachedTrack(track.id, expected);

  if (cached.status === 'hit' && cached.playableUrl) {
    downloadState.set(track.id, 'READY');
    return {
      ok: true,
      url: cached.playableUrl,
      fromCache: true,
      updated: false,
      trackId: track.id
    };
  }

  // Stale but valid: keep playing old while attempting update.
  const staleUrl =
    cached.status === 'stale' && cached.playableUrl ? cached.playableUrl : null;

  downloadState.set(track.id, 'DOWNLOADING');
  const result = await cacheRemoteTrack(track, {
    kind: 'fetch',
    fetchBytes: () => fetchBytes(playbackUrl)
  });

  if (result.ok) {
    downloadState.set(track.id, 'READY');
    return {
      ok: true,
      url: result.playableUrl,
      fromCache: false,
      updated: Boolean(staleUrl),
      trackId: track.id
    };
  }

  if (staleUrl) {
    // Requirement: keep old valid cache if update fails.
    downloadState.set(track.id, 'READY');
    return {
      ok: true,
      url: staleUrl,
      fromCache: true,
      updated: false,
      trackId: track.id
    };
  }

  downloadState.set(track.id, 'FAILED');
  return { ok: false, reason: result.reason, trackId: track.id };
}

async function prepareWeb(
  track: RemoteMusicTrack,
  playbackUrl: string
): Promise<RemotePrepareResult> {
  // Stream-direct; browser HTTP cache handles repeat loads.
  downloadState.set(track.id, 'READY');
  return {
    ok: true,
    url: playbackUrl,
    fromCache: false,
    updated: false,
    trackId: track.id
  };
}

async function prepareOnce(trackId: string): Promise<RemotePrepareResult> {
  const track = getRemoteMusicTrack(trackId);
  if (!track) {
    downloadState.set(trackId, 'FAILED');
    return { ok: false, reason: 'unknown_remote', trackId };
  }

  const playbackUrl = resolveRemotePlaybackUrl(track);
  if (!playbackUrl) {
    downloadState.set(trackId, 'FAILED');
    return { ok: false, reason: 'no_playback_url', trackId };
  }

  try {
    if (isNativePlayback()) {
      return await prepareNative(track, playbackUrl);
    }
    return await prepareWeb(track, playbackUrl);
  } catch (err) {
    downloadState.set(trackId, 'FAILED');
    const reason = err instanceof Error ? err.message : 'prepare_failed';
    return { ok: false, reason, trackId };
  }
}

/**
 * Ensure a remote track is playable (Android cache-first / Web stream).
 * Deduplicates concurrent prepares for the same trackId.
 */
export function ensureRemotePlayable(trackId: string): Promise<RemotePrepareResult> {
  const existing = inflight.get(trackId);
  if (existing) return existing;

  const pending = prepareOnce(trackId).finally(() => {
    inflight.delete(trackId);
  });
  inflight.set(trackId, pending);
  return pending;
}
