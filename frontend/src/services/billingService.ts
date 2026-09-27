/**
 * Google Play Billing stub — themes / tip jar (non pay-to-win).
 * Implement with @capacitor-community/in-app-purchases or native plugin.
 */

import { bumpSyncablePrefsRevision } from './syncablePrefsRevision';
import { isBuiltInThemeId, type BuiltInThemeId } from '../constants/themeRegistry';
import { getCustomTheme } from './customThemeStorage';

export type { BuiltInThemeId };

// Allow custom theme IDs (prefixed 'custom_') alongside built-in ones.
// The `string & {}` trick preserves autocomplete for BuiltInThemeId values.
export type ThemeId = BuiltInThemeId | (string & {});

const CUSTOM_THEME_ID_RE = /^custom_[A-Za-z0-9_-]+$/;

export function isCustomThemeId(id: string): boolean {
  return CUSTOM_THEME_ID_RE.test(id);
}

/** Resolve saved theme; invalid / missing custom falls back to classic. */
export function resolveActiveTheme(raw?: string | null): ThemeId {
  const id = (raw ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('suecao-theme') : null) ?? 'classic').trim();
  if (isBuiltInThemeId(id)) return id;
  if (isCustomThemeId(id) && getCustomTheme(id)) return id;
  return 'classic';
}

export const THEME_PRODUCTS: { id: string; theme: ThemeId; label: string }[] = [
  { id: 'theme_forest',    theme: 'forest',    label: 'Forest' },
  { id: 'theme_midnight',  theme: 'midnight',  label: 'Midnight' },
  { id: 'theme_thebes',    theme: 'thebes',    label: 'Thebes' },
  { id: 'theme_tikal',     theme: 'tikal',     label: 'Tikal' },
  { id: 'theme_thule',     theme: 'thule',     label: 'Thule' },
  { id: 'theme_knossos',   theme: 'knossos',   label: 'Knossos' },
  { id: 'theme_xanadu',    theme: 'xanadu',    label: 'Xanadu' },
  { id: 'theme_yamatai',   theme: 'yamatai',   label: 'Yamatai' },
  { id: 'theme_shambhala', theme: 'shambhala', label: 'Shambhala' },
  { id: 'theme_rapanui',   theme: 'rapanui',   label: 'Rapanui' },
  { id: 'theme_babylon',   theme: 'babylon',   label: 'Babylon' },
  { id: 'theme_ur',        theme: 'ur',        label: 'Ur' },
  { id: 'theme_nanmadol',  theme: 'nanmadol',  label: 'Nanmadol' },
  { id: 'tip_small',          theme: 'classic',       label: 'Support developer ☕' },
  { id: 'theme_hyperborea',   theme: 'hyperborea',    label: 'Hyperborea' },
  { id: 'theme_skara_brae',   theme: 'skara-brae',    label: 'Skara Brae' },
  { id: 'theme_avalon',       theme: 'avalon',        label: 'Avalon' },
  { id: 'theme_cartago',      theme: 'cartago',       label: 'Cartago' },
  { id: 'theme_atlantida',    theme: 'atlantida',     label: 'Atlântida' },
  { id: 'theme_petra',        theme: 'petra',         label: 'Petra' },
  { id: 'theme_persepolis',   theme: 'persepolis',    label: 'Persépolis' },
  { id: 'theme_axum',         theme: 'axum',          label: 'Axum' },
  { id: 'theme_meroe',        theme: 'meroe',         label: 'Meroë' },
  { id: 'theme_great_zimbabwe', theme: 'great-zimbabwe', label: 'Great Zimbabwe' },
  { id: 'theme_mohenjo_daro', theme: 'mohenjo-daro',  label: 'Mohenjo-daro' },
  { id: 'theme_angkor',       theme: 'angkor',        label: 'Angkor' },
  { id: 'theme_teotihuacan',  theme: 'teotihuacan',   label: 'Teotihuacan' },
  { id: 'theme_tiwanaku',     theme: 'tiwanaku',      label: 'Tiwanaku' },
  { id: 'theme_caral',        theme: 'caral',         label: 'Caral' },
  { id: 'theme_el_dorado',    theme: 'el-dorado',     label: 'El Dorado' },
];

export async function purchaseProduct(_productId: string): Promise<boolean> {
  console.info('[billing] IAP not wired — enable in Capacitor build');
  return false;
}

export function getActiveTheme(): ThemeId {
  return resolveActiveTheme();
}

export function setActiveTheme(theme: ThemeId): void {
  const id = String(theme);
  const next: ThemeId =
    isBuiltInThemeId(id) || (isCustomThemeId(id) && Boolean(getCustomTheme(id)))
      ? id
      : 'classic';
  localStorage.setItem('suecao-theme', next as string);
  // SYNC-01A — local prefs mutation counter (not cross-device authority).
  bumpSyncablePrefsRevision();
}
