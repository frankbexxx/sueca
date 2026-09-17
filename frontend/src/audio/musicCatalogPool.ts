import {
  CORE_MUSIC_TRACKS,
  FALLBACK_MUSIC_TRACK_ID,
  MusicFamily,
  MusicTrackId
} from '../constants/musicCatalog';
import { FAMILY_CORE_TRACK } from '../constants/musicThemeMap';
import { listRemoteMusicTracks } from './remoteMusicCatalog';
import type { MusicMode, MusicSettings } from './musicSettings';
import { pickNextTrackId, type RandomSource } from './musicRandomEngine';

export type MusicCatalogEntry = {
  id: string;
  title: string;
  artist: string;
  family: MusicFamily;
  contentId: boolean;
  streamingSafe: boolean;
  source: 'core' | 'remote';
};

/** All playable catalog entries: 6 core + remote overlays/mock. */
export function listAvailableMusicEntries(): MusicCatalogEntry[] {
  const core: MusicCatalogEntry[] = CORE_MUSIC_TRACKS.map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    family: t.family,
    contentId: t.contentId,
    streamingSafe: t.streamingSafe,
    source: 'core' as const
  }));

  const remotes: MusicCatalogEntry[] = listRemoteMusicTracks().map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    family: t.family,
    contentId: t.contentId,
    streamingSafe: t.streamingSafe,
    source: 'remote' as const
  }));

  // Prefer remote overlay when id collides (should not for current catalog).
  const byId = new Map<string, MusicCatalogEntry>();
  for (const e of core) byId.set(e.id, e);
  for (const e of remotes) byId.set(e.id, e);
  return Array.from(byId.values());
}

export function listMusicFamiliesPresent(): MusicFamily[] {
  const set = new Set<MusicFamily>();
  for (const e of listAvailableMusicEntries()) set.add(e.family);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function buildTrackPool(
  mode: MusicMode,
  settings: Pick<MusicSettings, 'selectedFamily' | 'selectedTrackId'>
): string[] {
  const entries = listAvailableMusicEntries();

  if (mode === 'specific') {
    const id = settings.selectedTrackId;
    if (id && entries.some((e) => e.id === id)) return [id];
    return [FALLBACK_MUSIC_TRACK_ID];
  }

  if (mode === 'family') {
    const family = settings.selectedFamily;
    if (!family) return [FALLBACK_MUSIC_TRACK_ID];
    const ids = entries.filter((e) => e.family === family).map((e) => e.id);
    if (ids.length === 0) {
      const core = FAMILY_CORE_TRACK[family] ?? FALLBACK_MUSIC_TRACK_ID;
      return [core];
    }
    return ids;
  }

  if (mode === 'random-streaming-safe') {
    return entries.filter((e) => !e.contentId).map((e) => e.id);
  }

  if (mode === 'random') {
    return entries.map((e) => e.id);
  }

  return [];
}

export function resolveAdvancedTrackId(
  mode: MusicMode,
  settings: MusicSettings,
  previousId: string | null,
  random?: RandomSource
): { trackId: string; fallbackCore: MusicTrackId } {
  const fallbackCore: MusicTrackId =
    mode === 'family' && settings.selectedFamily
      ? FAMILY_CORE_TRACK[settings.selectedFamily] ?? FALLBACK_MUSIC_TRACK_ID
      : FALLBACK_MUSIC_TRACK_ID;

  if (mode === 'specific') {
    const id = settings.selectedTrackId;
    if (id && listAvailableMusicEntries().some((e) => e.id === id)) {
      return { trackId: id, fallbackCore };
    }
    return { trackId: fallbackCore, fallbackCore };
  }

  const pool = buildTrackPool(mode, settings);
  const picked = pickNextTrackId(pool, previousId, random);
  return { trackId: picked ?? fallbackCore, fallbackCore };
}

/** Content ID ids currently in the combined catalog (for tests / UI). */
export function listContentIdTrackIds(): string[] {
  return listAvailableMusicEntries()
    .filter((e) => e.contentId)
    .map((e) => e.id);
}
