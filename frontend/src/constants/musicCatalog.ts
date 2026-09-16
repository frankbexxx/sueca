import { coreTrackPath } from './musicAssets';

export type MusicTrackId =
  | 'casino-jazz'
  | 'nordic-kalte'
  | 'maghreb-oud'
  | 'yamatai-shizima'
  | 'meso-aztec-relic'
  | 'andes-peruvian';

export type MusicFamily =
  | 'Casino Jazz / Lounge'
  | 'Nordic / Arctic'
  | 'Dark / Atmospheric'
  | 'Forest / Organic'
  | 'Celtic'
  | 'Mediterranean / Aegean'
  | 'Maghreb / Middle Eastern'
  | 'Horn of Africa / Ethiopic'
  | 'Nubian / Nile'
  | 'Southern African'
  | 'Indus / South Asian ancient'
  | 'Central Asian / Mongolia'
  | 'Himalayan / Tibet'
  | 'Japanese / Yamatai'
  | 'Khmer / SE Asian temple'
  | 'Mesoamerican'
  | 'Andes / Latin'
  | 'Mythic tropical gold'
  | 'Polynesian / Pacific';

export type MusicTrack = {
  id: MusicTrackId;
  title: string;
  artist: string;
  family: MusicFamily;
  file: string;
  duration: number;
  streamingSafe: boolean;
  contentId: boolean;
  bundled: true;
};

export const FALLBACK_MUSIC_TRACK_ID: MusicTrackId = 'casino-jazz';

export const MUSIC_VOLUME = 0.28;

/** Bundled core catalog (MUSIC-CORE-PREP-01) — do not load `_temp` JSON at runtime. */
export const CORE_MUSIC_TRACKS: readonly MusicTrack[] = [
  {
    id: 'casino-jazz',
    title: 'Mafia Casino Jazz 2',
    artist: 'Casino VIP Music',
    family: 'Casino Jazz / Lounge',
    file: 'casino-jazz.ogg',
    duration: 284.408,
    streamingSafe: true,
    contentId: false,
    bundled: true
  },
  {
    id: 'nordic-kalte',
    title: 'Kalte',
    artist: 'Samuel F. Johanns',
    family: 'Nordic / Arctic',
    file: 'nordic-kalte.ogg',
    duration: 87.167,
    streamingSafe: true,
    contentId: false,
    bundled: true
  },
  {
    id: 'maghreb-oud',
    title: 'Mystic Maghreb Oud & Desert Wind',
    artist: 'Djovan',
    family: 'Maghreb / Middle Eastern',
    file: 'maghreb-oud.ogg',
    duration: 227.132,
    streamingSafe: true,
    contentId: false,
    bundled: true
  },
  {
    id: 'yamatai-shizima',
    title: 'Shizima3 Piano',
    artist: 'PeriTune',
    family: 'Japanese / Yamatai',
    file: 'yamatai-shizima.ogg',
    duration: 275.447,
    streamingSafe: true,
    contentId: false,
    bundled: true
  },
  {
    id: 'meso-aztec-relic',
    title: 'Aztec Relic',
    artist: 'StockTune',
    family: 'Mesoamerican',
    file: 'meso-aztec-relic.ogg',
    duration: 118.001,
    streamingSafe: true,
    contentId: false,
    bundled: true
  },
  {
    id: 'andes-peruvian',
    title: 'Peruvian Train',
    artist: 'Abydos Music',
    family: 'Andes / Latin',
    file: 'andes-peruvian.ogg',
    duration: 146.797,
    streamingSafe: true,
    contentId: false,
    bundled: true
  }
] as const;

const byId = new Map<MusicTrackId, MusicTrack>(
  CORE_MUSIC_TRACKS.map((t) => [t.id, t])
);

export function getMusicTrack(id: string | null | undefined): MusicTrack {
  if (id && byId.has(id as MusicTrackId)) {
    return byId.get(id as MusicTrackId)!;
  }
  return byId.get(FALLBACK_MUSIC_TRACK_ID)!;
}

export function getMusicTrackUrl(id: string | null | undefined): string {
  const track = getMusicTrack(id);
  return coreTrackPath(track.file);
}

export function isMusicTrackId(id: string): id is MusicTrackId {
  return byId.has(id as MusicTrackId);
}
