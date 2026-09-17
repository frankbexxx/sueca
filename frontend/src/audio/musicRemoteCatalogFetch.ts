import {
  getMusicRemoteBaseUrl,
  isMusicRemoteSmokeDevEndpoint,
  musicRemoteDevLog
} from './musicRemoteConfig';
import {
  clearRemoteMusicTrackOverlays,
  sanitizeRemoteMusicCatalog,
  upsertRemoteMusicTrackOverlay
} from './remoteMusicCatalog';
import { rewriteRemoteCatalogUrls } from './musicRemoteUrlResolve';

export type MusicRemoteCatalogBootstrapResult = {
  ok: boolean;
  applied: number;
  catalogVersion: number;
  dropped?: number;
  reason?: string;
};

/**
 * Apply a fetched/raw catalog: resolve relative URLs, sanitize, overlay all
 * valid remote tracks. Malformed entries are dropped individually.
 * Never throws; empty/invalid catalog → no overlays (core-only).
 */
export function applyRemoteCatalogFromRaw(
  raw: unknown,
  baseUrl: string
): MusicRemoteCatalogBootstrapResult {
  try {
    const rewritten = rewriteRemoteCatalogUrls(raw, baseUrl);
    const { catalog, dropped } = sanitizeRemoteMusicCatalog(rewritten);

    if (catalog.tracks.length === 0) {
      musicRemoteDevLog('catalog empty or invalid', { dropped });
      return {
        ok: false,
        applied: 0,
        catalogVersion: catalog.catalogVersion,
        dropped,
        reason: 'empty_or_invalid'
      };
    }

    // Replace prior remote overlays with this catalog snapshot.
    clearRemoteMusicTrackOverlays();

    let applied = 0;
    for (const track of catalog.tracks) {
      upsertRemoteMusicTrackOverlay(track);
      applied += 1;
    }

    musicRemoteDevLog('catalog loaded', {
      applied,
      catalogVersion: catalog.catalogVersion,
      dropped,
      smokeDevEndpoint: isMusicRemoteSmokeDevEndpoint(baseUrl)
    });

    return {
      ok: true,
      applied,
      catalogVersion: catalog.catalogVersion,
      dropped
    };
  } catch {
    return { ok: false, applied: 0, catalogVersion: 0, reason: 'apply_error' };
  }
}

/**
 * Fetch `{base}/music/v1/catalog.json` and overlay all valid remotes.
 * Failures leave mock/local catalog unchanged (core fallback).
 */
export async function bootstrapMusicRemoteCatalog(): Promise<MusicRemoteCatalogBootstrapResult> {
  const base = getMusicRemoteBaseUrl();
  if (!base) {
    return { ok: false, applied: 0, catalogVersion: 0, reason: 'disabled' };
  }

  const catalogUrl = `${base.replace(/\/+$/, '')}/music/v1/catalog.json`;

  try {
    const res = await fetch(catalogUrl);
    if (!res.ok) {
      musicRemoteDevLog('catalog fetch fail', { status: res.status });
      return {
        ok: false,
        applied: 0,
        catalogVersion: 0,
        reason: `http_${res.status}`
      };
    }

    let raw: unknown;
    try {
      raw = await res.json();
    } catch {
      musicRemoteDevLog('catalog JSON invalid');
      return {
        ok: false,
        applied: 0,
        catalogVersion: 0,
        reason: 'invalid_json'
      };
    }

    return applyRemoteCatalogFromRaw(raw, base);
  } catch (err) {
    musicRemoteDevLog('catalog fetch error', err);
    return {
      ok: false,
      applied: 0,
      catalogVersion: 0,
      reason: 'fetch_error'
    };
  }
}

/** Clear R2/smoke overlays (tests / failure restore). */
export function teardownMusicRemoteCatalogOverlays(): void {
  clearRemoteMusicTrackOverlays();
}
