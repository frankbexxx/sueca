/**
 * Custom theme CSS — Theme Contract v1 (Stage 4 + Stage 11 cleanup).
 *
 * Emits the same 16 `--sc-*` tokens as built-in themes, plus GameBoard
 * gradient companions. Consumers resolve `--sc-*` directly (alias bridge removed).
 * No per-component selector overrides.
 *
 * User inputs (unchanged): bgTop, bgBottom, accent, textTitle, felt.
 */

import { useEffect } from 'react';
import { getCustomTheme } from '../services/customThemeStorage';
import { CustomThemeColors } from '../types/theme';

const STYLE_ID = 'suecao-custom-theme-css';

/** Exact Theme Contract v1 token names (must match built-in themes.css). */
export const CUSTOM_THEME_CONTRACT_TOKENS = [
  '--sc-canvas-from',
  '--sc-canvas-to',
  '--sc-surface',
  '--sc-surface-border',
  '--sc-surface-modal',
  '--sc-text',
  '--sc-text-muted',
  '--sc-text-title',
  '--sc-accent',
  '--sc-accent-rgb',
  '--sc-turn',
  '--sc-seat',
  '--sc-felt',
  '--sc-felt-dark',
  '--sc-rail',
  '--sc-game-bg'
] as const;

export type CustomThemeContractToken = (typeof CUSTOM_THEME_CONTRACT_TOKENS)[number];

export type DerivedCustomThemeTokens = Record<CustomThemeContractToken, string> & {
  /** Transitional GameBoard companions (not contract; same as built-ins). */
  '--theme-bg-game-alt': string;
  '--theme-bg-game-mid': string;
};

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgbChannels(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

function clamp(v: number): number {
  return Math.min(255, Math.max(0, Math.round(v)));
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => clamp(c).toString(16).padStart(2, '0')).join('')}`;
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = 1 - amount;
  return toHex(r * f, g * f, b * f);
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return toHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

function normalizeHex(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return toHex(r, g, b);
}

/**
 * Safe custom theme id for CSS attribute selectors.
 * Accepts existing `custom_${Date.now()}` and rejects anything else.
 */
export function isSafeCustomThemeId(themeId: string): boolean {
  return /^custom_[A-Za-z0-9_-]+$/.test(themeId);
}

/**
 * Derive the full Theme Contract v1 token map from the 5 user fields.
 *
 * Mapping:
 * - canvas-from/to ← bgTop / bgBottom
 * - accent / accent-rgb ← accent
 * - text-title ← textTitle; text ← textTitle; muted ← textTitle @ 0.65
 * - felt ← felt
 * - surface / border ← accent @ 0.06 / 0.15 (prior custom panel tint)
 * - surface-modal ← darken(bgTop, 0.2) (prior --theme-panel-modal)
 * - turn ← lighten(accent, 0.35) (P5: derived from accent)
 * - seat ← darken(felt, 0.4) @ 0.45 alpha
 * - felt-dark ← darken(felt, 0.3)
 * - rail ← lighten(felt, 0.2)
 * - game-bg ← darken(felt, 0.1) (distinct from felt; prior custom behaviour)
 * - game-bg-alt/mid ← darken(felt, 0.05) / darken(felt, 0.15)
 */
export function deriveCustomThemeTokens(colors: CustomThemeColors): DerivedCustomThemeTokens {
  const bgTop = normalizeHex(colors.bgTop);
  const bgBottom = normalizeHex(colors.bgBottom);
  const accent = normalizeHex(colors.accent);
  const textTitle = normalizeHex(colors.textTitle);
  const felt = normalizeHex(colors.felt);

  const gameBg = darken(felt, 0.1);

  return {
    '--sc-canvas-from': bgTop,
    '--sc-canvas-to': bgBottom,
    '--sc-surface': hexToRgba(accent, 0.06),
    '--sc-surface-border': hexToRgba(accent, 0.15),
    '--sc-surface-modal': darken(bgTop, 0.2),
    '--sc-text': textTitle,
    '--sc-text-muted': hexToRgba(textTitle, 0.65),
    '--sc-text-title': textTitle,
    '--sc-accent': accent,
    '--sc-accent-rgb': hexToRgbChannels(accent),
    '--sc-turn': lighten(accent, 0.35),
    '--sc-seat': hexToRgba(darken(felt, 0.4), 0.45),
    '--sc-felt': felt,
    '--sc-felt-dark': darken(felt, 0.3),
    '--sc-rail': lighten(felt, 0.2),
    '--sc-game-bg': gameBg,
    '--theme-bg-game-alt': darken(felt, 0.05),
    '--theme-bg-game-mid': darken(felt, 0.15)
  };
}

/**
 * Generate token-only CSS for a custom theme id.
 * Throws if themeId is not a safe `custom_*` selector fragment.
 */
export function generateCSS(themeId: string, colors: CustomThemeColors): string {
  if (!isSafeCustomThemeId(themeId)) {
    throw new Error(`Unsafe custom theme id for CSS: ${themeId}`);
  }

  const tokens = deriveCustomThemeTokens(colors);
  const lines = [
    ...CUSTOM_THEME_CONTRACT_TOKENS.map((k) => `  ${k}: ${tokens[k]};`),
    `  --theme-bg-game-alt: ${tokens['--theme-bg-game-alt']};`,
    `  --theme-bg-game-mid: ${tokens['--theme-bg-game-mid']};`
  ];

  return `.app-shell[data-theme="${themeId}"] {\n${lines.join('\n')}\n}`;
}

function getOrCreateStyleTag(): HTMLStyleElement {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  return el;
}

export function useCustomThemeCSS(activeTheme: string): void {
  useEffect(() => {
    const style = getOrCreateStyleTag();
    if (!activeTheme.startsWith('custom_')) {
      style.textContent = '';
      return;
    }
    if (!isSafeCustomThemeId(activeTheme)) {
      style.textContent = '';
      return;
    }
    const data = getCustomTheme(activeTheme);
    if (!data) {
      style.textContent = '';
      return;
    }
    style.textContent = generateCSS(activeTheme, data.colors);
  }, [activeTheme]);
}
