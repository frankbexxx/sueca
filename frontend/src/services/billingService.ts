/**
 * Google Play Billing stub — themes / tip jar (non pay-to-win).
 * Implement with @capacitor-community/in-app-purchases or native plugin.
 */

export type ThemeId =
  | 'classic' | 'forest' | 'midnight'
  | 'thebes' | 'tikal' | 'thule'
  | 'knossos' | 'xanadu' | 'yamatai'
  | 'shambhala' | 'rapanui' | 'babylon' | 'ur' | 'nanmadol';

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
  { id: 'tip_small',       theme: 'classic',   label: 'Support developer ☕' }
];

export async function purchaseProduct(_productId: string): Promise<boolean> {
  console.info('[billing] IAP not wired — enable in Capacitor build');
  return false;
}

export function getActiveTheme(): ThemeId {
  return (localStorage.getItem('suecao-theme') as ThemeId) || 'classic';
}

export function setActiveTheme(theme: ThemeId): void {
  localStorage.setItem('suecao-theme', theme);
}
