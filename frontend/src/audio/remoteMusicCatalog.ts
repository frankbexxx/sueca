import type { MusicFamily } from '../constants/musicCatalog';
import { MOCK_REMOTE_MUSIC_CATALOG } from './remoteMusicCatalog.mock';
import type { RemoteMusicCatalog, RemoteMusicTrack } from './remoteMusicTypes';

const MUSIC_FAMILIES = new Set<string>([
  'Casino Jazz / Lounge',
  'Nordic / Arctic',
  'Dark / Atmospheric',
  'Forest / Organic',
  'Celtic',
  'Mediterranean / Aegean',
  'Maghreb / Middle Eastern',
  'Horn of Africa / Ethiopic',
  'Nubian / Nile',
  'Southern African',
  'Indus / South Asian ancient',
  'Central Asian / Mongolia',
  'Himalayan / Tibet',
  'Japanese / Yamatai',
  'Khmer / SE Asian temple',
  'Mesoamerican',
  'Andes / Latin',
  'Mythic tropical gold',
  'Polynesian / Pacific'
]);

const SHA256_RE = /^[0-9a-f]{64}$/;

function isAbsoluteHttpUrl(url: unknown): url is string {
  if (typeof url !== 'string' || !url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Defensive check — returns false for malformed items; never throws. */
export function isValidRemoteMusicTrack(item: unknown): item is RemoteMusicTrack {
  if (!item || typeof item !== 'object') return false;
  const t = item as Record<string, unknown>;
  if (typeof t.id !== 'string' || !t.id.trim()) return false;
  if (typeof t.title !== 'string' || !t.title.trim()) return false;
  if (typeof t.artist !== 'string' || !t.artist.trim()) return false;
  if (typeof t.family !== 'string' || !MUSIC_FAMILIES.has(t.family)) return false;
  if (!isAbsoluteHttpUrl(t.url)) return false;
  if (typeof t.duration !== 'number' || !Number.isFinite(t.duration) || t.duration <= 0) {
    return false;
  }
  if (typeof t.size !== 'number' || !Number.isFinite(t.size) || t.size <= 0) return false;
  if (typeof t.sha256 !== 'string' || !SHA256_RE.test(t.sha256)) return false;
  if (typeof t.streamingSafe !== 'boolean') return false;
  if (typeof t.contentId !== 'boolean') return false;
  if (t.bundled !== false) return false;
  if (typeof t.version !== 'number' || !Number.isInteger(t.version) || t.version < 1) {
    return false;
  }
  return true;
}

export type SanitizeRemoteCatalogResult = {
  catalog: RemoteMusicCatalog;
  dropped: number;
  duplicateIds: string[];
};

/**
 * Sanitize a raw catalog: drop malformed / duplicate ids.
 * Never throws.
 */
export function sanitizeRemoteMusicCatalog(
  raw: unknown
): SanitizeRemoteCatalogResult {
  const empty: SanitizeRemoteCatalogResult = {
    catalog: { catalogVersion: 0, tracks: [] },
    dropped: 0,
    duplicateIds: []
  };

  try {
    if (!raw || typeof raw !== 'object') return empty;
    const r = raw as Record<string, unknown>;
    const catalogVersion =
      typeof r.catalogVersion === 'number' &&
      Number.isInteger(r.catalogVersion) &&
      r.catalogVersion >= 0
        ? r.catalogVersion
        : 0;

    const list = Array.isArray(r.tracks) ? r.tracks : [];
    const seen = new Set<string>();
    const tracks: RemoteMusicTrack[] = [];
    const duplicateIds: string[] = [];
    let dropped = 0;

    for (const item of list) {
      if (!isValidRemoteMusicTrack(item)) {
        dropped += 1;
        continue;
      }
      if (seen.has(item.id)) {
        duplicateIds.push(item.id);
        dropped += 1;
        continue;
      }
      seen.add(item.id);
      tracks.push({
        ...item,
        family: item.family as MusicFamily
      });
    }

    return {
      catalog: { catalogVersion, tracks },
      dropped,
      duplicateIds
    };
  } catch {
    return empty;
  }
}

const sanitized = sanitizeRemoteMusicCatalog(MOCK_REMOTE_MUSIC_CATALOG);

/** Validated mock catalog used at runtime (no network). */
export const REMOTE_MUSIC_CATALOG: RemoteMusicCatalog = sanitized.catalog;

const byId = new Map<string, RemoteMusicTrack>(
  REMOTE_MUSIC_CATALOG.tracks.map((t) => [t.id, t])
);

/** Runtime overlays (tests / controlled smoke) — never ship production CDN here. */
const overlays = new Map<string, RemoteMusicTrack>();

export function upsertRemoteMusicTrackOverlay(track: RemoteMusicTrack): void {
  if (!isValidRemoteMusicTrack(track)) return;
  overlays.set(track.id, track);
  byId.set(track.id, track);
}

export function clearRemoteMusicTrackOverlays(): void {
  for (const id of overlays.keys()) {
    const original = REMOTE_MUSIC_CATALOG.tracks.find((t) => t.id === id);
    if (original) byId.set(id, original);
    else byId.delete(id);
  }
  overlays.clear();
}

export function getRemoteMusicTrack(id: string | null | undefined): RemoteMusicTrack | null {
  if (!id) return null;
  return byId.get(id) ?? null;
}

export function isRemoteMusicTrackId(id: string): boolean {
  return byId.has(id);
}

export function listRemoteMusicTracks(): readonly RemoteMusicTrack[] {
  return Array.from(byId.values());
}

export function getRemoteCatalogVersion(): number {
  return REMOTE_MUSIC_CATALOG.catalogVersion;
}
