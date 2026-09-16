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

/** Core fallback track per family (remote beds not shipped yet). */
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

const BUILT_IN = new Set<string>(Object.keys(THEME_MUSIC_FAMILY));

export function getMusicFamilyForTheme(themeId: ThemeId): MusicFamily {
  if (BUILT_IN.has(themeId as string)) {
    return THEME_MUSIC_FAMILY[themeId as BuiltInThemeId];
  }
  return 'Casino Jazz / Lounge';
}

export function resolveMusicTrackIdForTheme(themeId: ThemeId): MusicTrackId {
  try {
    const family = getMusicFamilyForTheme(themeId);
    const id = FAMILY_CORE_TRACK[family] ?? FALLBACK_MUSIC_TRACK_ID;
    return getMusicTrack(id).id;
  } catch {
    return FALLBACK_MUSIC_TRACK_ID;
  }
}
