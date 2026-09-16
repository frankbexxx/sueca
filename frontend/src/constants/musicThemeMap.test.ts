import { BuiltInThemeId } from '../services/billingService';
import { CORE_MUSIC_TRACKS, FALLBACK_MUSIC_TRACK_ID } from './musicCatalog';
import {
  FAMILY_CORE_TRACK,
  THEME_MUSIC_FAMILY,
  THEME_PREFERRED_TRACK_ID,
  getThemeMusicPreference,
  resolveMusicTrackIdForTheme
} from './musicThemeMap';

const BUILT_IN_THEMES = Object.keys(THEME_MUSIC_FAMILY) as BuiltInThemeId[];

describe('musicThemeMap', () => {
  it('resolves all 30 built-in themes to a bundled core track', () => {
    expect(BUILT_IN_THEMES).toHaveLength(30);
    const coreIds = new Set(CORE_MUSIC_TRACKS.map((t) => t.id));
    for (const theme of BUILT_IN_THEMES) {
      const id = resolveMusicTrackIdForTheme(theme);
      expect(coreIds.has(id)).toBe(true);
    }
  });

  it('maps unknown / custom themes to casino-jazz fallback', () => {
    expect(resolveMusicTrackIdForTheme('custom_xyz')).toBe(FALLBACK_MUSIC_TRACK_ID);
    expect(resolveMusicTrackIdForTheme('not-a-theme')).toBe(FALLBACK_MUSIC_TRACK_ID);
  });

  it('keeps dedicated core mappings for the six families', () => {
    expect(resolveMusicTrackIdForTheme('classic')).toBe('casino-jazz');
    expect(resolveMusicTrackIdForTheme('thule')).toBe('nordic-kalte');
    expect(resolveMusicTrackIdForTheme('babylon')).toBe('maghreb-oud');
    expect(resolveMusicTrackIdForTheme('yamatai')).toBe('yamatai-shizima');
    expect(resolveMusicTrackIdForTheme('tikal')).toBe('meso-aztec-relic');
    expect(resolveMusicTrackIdForTheme('tiwanaku')).toBe('andes-peruvian');
  });

  it('does not restart mapping when themes share a family bed', () => {
    expect(resolveMusicTrackIdForTheme('thule')).toBe(resolveMusicTrackIdForTheme('midnight'));
    expect(resolveMusicTrackIdForTheme('tikal')).toBe(resolveMusicTrackIdForTheme('teotihuacan'));
  });

  it('every family has a core fallback', () => {
    for (const family of Object.values(THEME_MUSIC_FAMILY)) {
      expect(FAMILY_CORE_TRACK[family]).toBeTruthy();
    }
  });

  it('exposes preferred + fallbackCore for all 30 themes', () => {
    expect(Object.keys(THEME_PREFERRED_TRACK_ID)).toHaveLength(30);
    const coreIds = new Set(CORE_MUSIC_TRACKS.map((t) => t.id));
    for (const theme of BUILT_IN_THEMES) {
      const pref = getThemeMusicPreference(theme);
      expect(pref.preferredTrackId).toBe(THEME_PREFERRED_TRACK_ID[theme]);
      expect(coreIds.has(pref.fallbackCoreTrackId)).toBe(true);
      expect(pref.fallbackCoreTrackId).toBe(resolveMusicTrackIdForTheme(theme));
    }
  });
});
