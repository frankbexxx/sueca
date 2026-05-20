/**
 * Google Play Billing stub — themes / tip jar (non pay-to-win).
 * Implement with @capacitor-community/in-app-purchases or native plugin.
 */

export type ThemeId = 'classic' | 'forest' | 'midnight';

export const THEME_PRODUCTS: { id: string; theme: ThemeId; label: string }[] = [
  { id: 'theme_forest', theme: 'forest', label: 'Forest theme' },
  { id: 'theme_midnight', theme: 'midnight', label: 'Midnight theme' },
  { id: 'tip_small', theme: 'classic', label: 'Support developer ☕' }
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
