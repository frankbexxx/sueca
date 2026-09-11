/**
 * Minimal Phaser table theme tokens from the active CSS theme (or defaults).
 * UX-P3.1 Premium Classic Table defaults; CSS theme can still tint accents.
 */

import { PREMIUM_TABLE } from './phaserPremiumLayout';

export interface PhaserThemeView {
  felt: number;
  feltDark: number;
  feltCenter: number;
  feltEdge: number;
  exterior: number;
  seatPanel: number;
  brass: number;
  text: string;
  textMuted: string;
  active: string;
  accent: string;
  seatBg: string;
  illegalAlpha: number;
  inactiveAlpha: number;
}

const DEFAULT_THEME: PhaserThemeView = {
  felt: PREMIUM_TABLE.felt,
  feltDark: PREMIUM_TABLE.exterior,
  feltCenter: PREMIUM_TABLE.feltCenter,
  feltEdge: PREMIUM_TABLE.feltEdge,
  exterior: PREMIUM_TABLE.exterior,
  seatPanel: PREMIUM_TABLE.seatPanel,
  brass: PREMIUM_TABLE.brass,
  text: '#f5f5f0',
  textMuted: '#c8c8c0',
  active: '#C5A45B',
  accent: '#C5A45B',
  seatBg: '#182426ee',
  /** Kept for theme parity; scene uses `phaserHandVisual` as source of truth. */
  illegalAlpha: 0.9,
  inactiveAlpha: 0.94
};

/** Read tokens from `.app-shell` / `:root` when available. */
export function resolvePhaserThemeFromDom(
  root: Element | null = typeof document !== 'undefined'
    ? document.querySelector('.app-shell') || document.documentElement
    : null
): PhaserThemeView {
  if (!root || typeof window === 'undefined' || !window.getComputedStyle) {
    return { ...DEFAULT_THEME };
  }
  const cs = window.getComputedStyle(root as Element);
  const text =
    cs.getPropertyValue('--sueca-color-text').trim() ||
    cs.getPropertyValue('--color-text').trim() ||
    DEFAULT_THEME.text;
  const active =
    cs.getPropertyValue('--theme-turn-indicator').trim() || DEFAULT_THEME.active;
  const accent =
    cs.getPropertyValue('--sueca-color-primary').trim() ||
    cs.getPropertyValue('--color-primary').trim() ||
    DEFAULT_THEME.accent;

  // UX-P3.1: keep Premium Classic felt/exterior as the table identity.
  // Accents/text may still follow the active app theme.
  return {
    ...DEFAULT_THEME,
    text,
    active,
    accent
  };
}

export function themesEqual(a: PhaserThemeView, b: PhaserThemeView): boolean {
  return (
    a.felt === b.felt &&
    a.feltDark === b.feltDark &&
    a.feltCenter === b.feltCenter &&
    a.exterior === b.exterior &&
    a.text === b.text &&
    a.active === b.active &&
    a.accent === b.accent
  );
}

export { DEFAULT_THEME };
