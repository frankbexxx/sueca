import type { BuiltInThemeId, ThemeId } from '../services/billingService';
import {
  FALLBACK_MUSIC_TRACK_ID,
  MusicFamily,
  MusicTrackId,
  getMusicTrack
} from './musicCatalog';

/**
 * Theme → family → core track (MUSIC-THEME-DEFAULTS-PLAN + hybrid core fallbacks).
 * Families without a bundled bed map to the nearest of the 6 core tracks.
 */
export const THEME_MUSIC_FAMILY: Record<BuiltInThemeId, MusicFamily> = {
  classic: 'Casino Jazz / Lounge',
  forest: 'Forest / Organic',
  midnight: 'Dark / Atmospheric',
  thule: 'Nordic / Arctic',
  hyperborea: 'Nordic / Arctic',
  'skara-brae': 'Celtic',
  avalon: 'Celtic',
  knossos: 'Mediterranean / Aegean',
  thebes: 'Mediterranean / Aegean',
  cartago: 'Mediterranean / Aegean',
  atlantida: 'Dark / Atmospheric',
  babylon: 'Maghreb / Middle Eastern',
  ur: 'Maghreb / Middle Eastern',
  petra: 'Maghreb / Middle Eastern',
  persepolis: 'Maghreb / Middle Eastern',
  axum: 'Horn of Africa / Ethiopic',
  meroe: 'Nubian / Nile',
  'great-zimbabwe': 'Southern African',
  xanadu: 'Central Asian / Mongolia',
  shambhala: 'Himalayan / Tibet',
  'mohenjo-daro': 'Indus / South Asian ancient',
  yamatai: 'Japanese / Yamatai',
  angkor: 'Khmer / SE Asian temple',
  tikal: 'Mesoamerican',
  teotihuacan: 'Mesoamerican',
  tiwanaku: 'Andes / Latin',
  caral: 'Andes / Latin',
  'el-dorado': 'Mythic tropical gold',
  rapanui: 'Polynesian / Pacific',
  nanmadol: 'Polynesian / Pacific'
};

/** Core fallback track per family (always playable from APK/web bundle). */
export const FAMILY_CORE_TRACK: Record<MusicFamily, MusicTrackId> = {
  'Casino Jazz / Lounge': 'casino-jazz',
  'Nordic / Arctic': 'nordic-kalte',
  'Dark / Atmospheric': 'nordic-kalte',
  'Forest / Organic': 'nordic-kalte',
  Celtic: 'nordic-kalte',
  'Mediterranean / Aegean': 'maghreb-oud',
  'Maghreb / Middle Eastern': 'maghreb-oud',
  'Horn of Africa / Ethiopic': 'maghreb-oud',
  'Nubian / Nile': 'maghreb-oud',
  'Southern African': 'maghreb-oud',
  'Indus / South Asian ancient': 'maghreb-oud',
  'Central Asian / Mongolia': 'yamatai-shizima',
  'Himalayan / Tibet': 'yamatai-shizima',
  'Japanese / Yamatai': 'yamatai-shizima',
  'Khmer / SE Asian temple': 'yamatai-shizima',
  Mesoamerican: 'meso-aztec-relic',
  'Andes / Latin': 'andes-peruvian',
  'Mythic tropical gold': 'andes-peruvian',
  'Polynesian / Pacific': 'nordic-kalte'
};

/**
 * Preferred bed per theme (MUSIC_THEME_DEFAULTS_PLAN) — may be core or remote id.
 * Hybrid resolve uses preferred when remote catalog is live; else core fallback.
 */
export const THEME_PREFERRED_TRACK_ID: Record<BuiltInThemeId, string> = {
  classic: 'casino-jazz',
  forest: 'celtic-nature',
  midnight: 'nordic-kalte',
  thule: 'nordic-kalte',
  hyperborea: 'nordic-kalte',
  'skara-brae': 'celtic-traveler',
  avalon: 'celtic-traveler',
  knossos: 'ancient-temple',
  thebes: 'ancient-temple',
  cartago: 'andalusian-perc',
  atlantida: 'nordic-kalte',
  babylon: 'maghreb-oud',
  ur: 'maghreb-oud',
  petra: 'sahara-sunset',
  persepolis: 'andalusian-dreams',
  axum: 'ethiopia-groove',
  meroe: 'ethiopia-groove',
  'great-zimbabwe': 'southern-mara',
  xanadu: 'mongolia-atlas',
  shambhala: 'tibet-ocean',
  'mohenjo-daro': 'ancient-echoes',
  yamatai: 'yamatai-shizima',
  angkor: 'khmer-roneat',
  tikal: 'meso-aztec-relic',
  teotihuacan: 'meso-aztec-relic',
  tiwanaku: 'andes-peruvian',
  caral: 'andes-peruvian',
  'el-dorado': 'andes-peruvian',
  rapanui: 'hawaii-relax',
  nanmadol: 'hawaii-relax'
};

export type ThemeMusicPreference = {
  preferredTrackId: string;
  fallbackCoreTrackId: MusicTrackId;
};

const BUILT_IN = new Set<string>(Object.keys(THEME_MUSIC_FAMILY));

export function getMusicFamilyForTheme(themeId: ThemeId): MusicFamily {
  if (BUILT_IN.has(themeId as string)) {
    return THEME_MUSIC_FAMILY[themeId as BuiltInThemeId];
  }
  return 'Casino Jazz / Lounge';
}

/** Preferred + core fallback for a theme (unknown → casino-jazz / casino-jazz). */
export function getThemeMusicPreference(themeId: ThemeId): ThemeMusicPreference {
  try {
    if (BUILT_IN.has(themeId as string)) {
      const builtIn = themeId as BuiltInThemeId;
      const family = THEME_MUSIC_FAMILY[builtIn];
      const fallbackCoreTrackId =
        FAMILY_CORE_TRACK[family] ?? FALLBACK_MUSIC_TRACK_ID;
      return {
        preferredTrackId: THEME_PREFERRED_TRACK_ID[builtIn] ?? fallbackCoreTrackId,
        fallbackCoreTrackId
      };
    }
  } catch {
    /* fall through */
  }
  return {
    preferredTrackId: FALLBACK_MUSIC_TRACK_ID,
    fallbackCoreTrackId: FALLBACK_MUSIC_TRACK_ID
  };
}

/**
 * Playable core track for Theme Default (unchanged behaviour).
 * Always returns a bundled id — remotes are not auto-played yet.
 */
export function resolveMusicTrackIdForTheme(themeId: ThemeId): MusicTrackId {
  try {
    const family = getMusicFamilyForTheme(themeId);
    const id = FAMILY_CORE_TRACK[family] ?? FALLBACK_MUSIC_TRACK_ID;
    return getMusicTrack(id).id;
  } catch {
    return FALLBACK_MUSIC_TRACK_ID;
  }
}
