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
import {
  isMusicRemoteSmokeTrackId,
  rewriteRemoteCatalogUrls
} from './musicRemoteUrlResolve';

export type MusicRemoteCatalogBootstrapResult = {
  ok: boolean;
  applied: number;
  catalogVersion: number;
  reason?: string;
};

/**
 * Apply a fetched/raw catalog: resolve relative URLs, sanitize, overlay only
 * smoke-approved track ids. Never throws; empty/invalid → no overlays.
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
        reason: 'empty_or_invalid'
      };
    }

    let applied = 0;
    for (const track of catalog.tracks) {
      if (!isMusicRemoteSmokeTrackId(track.id)) continue;
      upsertRemoteMusicTrackOverlay(track);
      applied += 1;
    }

    if (applied === 0) {
      musicRemoteDevLog('catalog had no approved smoke tracks', {
        total: catalog.tracks.length
      });
      return {
        ok: false,
        applied: 0,
        catalogVersion: catalog.catalogVersion,
        reason: 'no_approved_tracks'
      };
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
      catalogVersion: catalog.catalogVersion
    };
  } catch {
    return { ok: false, applied: 0, catalogVersion: 0, reason: 'apply_error' };
  }
}

/**
 * Fetch `{base}/music/v1/catalog.json` and overlay approved remotes.
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
