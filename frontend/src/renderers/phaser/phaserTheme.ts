/**
 * Minimal Phaser table theme tokens from the active CSS theme (or defaults).
 * UX-P3.1 Premium Classic Table defaults; CSS theme can still tint accents.
 * Card back follows theme via cardDeckRegistry (fallback suecao-navy).
 */

import { getCardBackPath } from '../../constants/cardAssets';
import {
  DEFAULT_CARD_BACK_ID,
  readActiveThemeIdFromDom,
  resolveCardBackForTheme
} from '../../constants/cardDeckRegistry';
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
  /** Numeric --sc-turn for Phaser Graphics strokes/fills. */
  activeHex: number;
  accent: string;
  seatBg: string;
  illegalAlpha: number;
  inactiveAlpha: number;
  /** Resolved card back id for opponent / face-down sprites. */
  cardBackId: string;
  /** Relative public path including extension. */
  cardBackPath: string;
}

const DEFAULT_ACTIVE_HEX = 0xe8c56a;

/** Parse CSS color (#rrggbb / rgb) to Phaser hex int. */
export function cssColorToHex(
  color: string | null | undefined,
  fallback = DEFAULT_ACTIVE_HEX
): number {
  if (!color) return fallback;
  const trimmed = color.trim();
  const hex = trimmed.match(/^#([0-9a-fA-F]{6})$/);
  if (hex) return parseInt(hex[1], 16);
  const short = trimmed.match(/^#([0-9a-fA-F]{3})$/);
  if (short) {
    const [r, g, b] = short[1].split('');
    return parseInt(`${r}${r}${g}${g}${b}${b}`, 16);
  }
  const rgb = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) {
    return (
      ((Number(rgb[1]) & 255) << 16) +
      ((Number(rgb[2]) & 255) << 8) +
      (Number(rgb[3]) & 255)
    );
  }
  return fallback;
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
  active: '#e8c56a',
  activeHex: DEFAULT_ACTIVE_HEX,
  accent: '#C5A45B',
  seatBg: '#182426ee',
  /** Kept for theme parity; scene uses `phaserHandVisual` as source of truth. */
  illegalAlpha: 0.9,
  inactiveAlpha: 0.94,
  cardBackId: DEFAULT_CARD_BACK_ID,
  cardBackPath: getCardBackPath(null)
};

/** Read tokens from `.app-shell` / `:root` when available. */
export function resolvePhaserThemeFromDom(
  root: Element | null = typeof document !== 'undefined'
    ? document.querySelector('.app-shell') || document.documentElement
    : null
): PhaserThemeView {
  const themeId = readActiveThemeIdFromDom(root);
  const back = resolveCardBackForTheme(themeId);
  const cardBackPath = getCardBackPath(themeId);

  if (!root || typeof window === 'undefined' || !window.getComputedStyle) {
    return {
      ...DEFAULT_THEME,
      cardBackId: back.id,
      cardBackPath
    };
  }
  const cs = window.getComputedStyle(root as Element);
  const text =
    cs.getPropertyValue('--sc-text').trim() || DEFAULT_THEME.text;
  const active =
    cs.getPropertyValue('--sc-turn').trim() || DEFAULT_THEME.active;
  const accent =
    cs.getPropertyValue('--sc-accent').trim() || DEFAULT_THEME.accent;

  // UX-P3.1: keep Premium Classic felt/exterior as the table identity.
  // Accents/text may still follow the active app theme.
  return {
    ...DEFAULT_THEME,
    text,
    active,
    activeHex: cssColorToHex(active, DEFAULT_ACTIVE_HEX),
    accent,
    cardBackId: back.id,
    cardBackPath
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
    a.activeHex === b.activeHex &&
    a.accent === b.accent &&
    a.cardBackId === b.cardBackId &&
    a.cardBackPath === b.cardBackPath
  );
}

export { DEFAULT_THEME };
