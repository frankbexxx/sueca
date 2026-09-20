/**
 * Stage 4 — custom themes emit the same Theme Contract v1 as built-ins.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CUSTOM_THEME_CONTRACT_TOKENS,
  deriveCustomThemeTokens,
  generateCSS,
  isSafeCustomThemeId
} from './useCustomThemeCSS';
import type { CustomThemeColors } from '../types/theme';
import { resolveCardBackForTheme, DEFAULT_CARD_BACK_ID } from '../constants/cardDeckRegistry';
import { FALLBACK_MUSIC_TRACK_ID } from '../constants/musicCatalog';
import { resolveMusicTrackIdForTheme } from '../constants/musicThemeMap';

const here = dirname(fileURLToPath(import.meta.url));
const themesCssPath = join(here, '../styles/themes.css');

const SAMPLE: CustomThemeColors = {
  bgTop: '#1a2a4a',
  bgBottom: '#0d1a30',
  accent: '#6a9fd8',
  textTitle: '#e8f0f8',
  felt: '#1a4a2a'
};

const WARM: CustomThemeColors = {
  bgTop: '#5a2810',
  bgBottom: '#2a1008',
  accent: '#e09040',
  textTitle: '#f8e8d0',
  felt: '#3a4820'
};

function hexToRgbChannels(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(hex);
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function declsInCss(css: string): string[] {
  return [...css.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]);
}

describe('Stage 4 custom theme contract parity', () => {
  it('accepts safe custom ids and rejects unsafe interpolation', () => {
    expect(isSafeCustomThemeId('custom_1710000000000')).toBe(true);
    expect(isSafeCustomThemeId('custom_preview')).toBe(true);
    expect(isSafeCustomThemeId('classic')).toBe(false);
    expect(isSafeCustomThemeId('custom_";} body{background:red')).toBe(false);
    expect(() => generateCSS('classic', SAMPLE)).toThrow(/Unsafe/);
  });

  it('derives exact 16 contract tokens (same names as built-ins)', () => {
    const tokens = deriveCustomThemeTokens(SAMPLE);
    expect(Object.keys(tokens).filter((k) => k.startsWith('--sc-')).sort()).toEqual(
      [...CUSTOM_THEME_CONTRACT_TOKENS].sort()
    );
    expect(CUSTOM_THEME_CONTRACT_TOKENS).toHaveLength(16);
  });

  it('maps the 5 user fields into the contract', () => {
    const t = deriveCustomThemeTokens(SAMPLE);
    expect(t['--sc-canvas-from']).toBe('#1a2a4a');
    expect(t['--sc-canvas-to']).toBe('#0d1a30');
    expect(t['--sc-accent']).toBe('#6a9fd8');
    expect(t['--sc-text-title']).toBe('#e8f0f8');
    expect(t['--sc-text']).toBe('#e8f0f8');
    expect(t['--sc-felt']).toBe('#1a4a2a');
  });

  it('keeps accent hex and accent-rgb consistent', () => {
    for (const colors of [SAMPLE, WARM]) {
      const t = deriveCustomThemeTokens(colors);
      expect(t['--sc-accent-rgb']).toBe(hexToRgbChannels(t['--sc-accent']));
    }
  });

  it('derives turn from accent, seat/felt-dark/rail/game-bg from felt', () => {
    const t = deriveCustomThemeTokens(SAMPLE);
    expect(t['--sc-turn']).not.toBe(t['--sc-accent']);
    expect(t['--sc-turn']).toMatch(/^#[0-9a-f]{6}$/i);
    expect(t['--sc-seat']).toMatch(/^rgba\(/);
    expect(t['--sc-felt-dark']).not.toBe(t['--sc-felt']);
    expect(t['--sc-rail']).not.toBe(t['--sc-felt']);
    expect(t['--sc-game-bg']).not.toBe(t['--sc-felt']);
    expect(t['--sc-surface-modal']).toMatch(/^#[0-9a-f]{6}$/i);
    expect(t['--sc-text-muted']).toMatch(/^rgba\(/);
  });

  it('emits token-only CSS — no component selectors', () => {
    const css = generateCSS('custom_1710000000000', SAMPLE);
    expect(css).toMatch(/^\.app-shell\[data-theme="custom_1710000000000"\] \{/);
    expect(css).not.toMatch(/\.shell-panel/);
    expect(css).not.toMatch(/\.sueca-btn/);
    expect(css).not.toMatch(/\.bottom-nav/);
    expect(css).not.toMatch(/\.game-board/);
    expect(css).not.toMatch(/background:\s*linear-gradient/);
    for (const token of CUSTOM_THEME_CONTRACT_TOKENS) {
      expect(css).toContain(`${token}:`);
    }
    // Only contract + 2 GameBoard companions
    const decls = declsInCss(css);
    expect(decls.filter((d) => d.startsWith('--sc-'))).toHaveLength(16);
    expect(decls).toContain('--theme-bg-game-alt');
    expect(decls).toContain('--theme-bg-game-mid');
    expect(decls).not.toContain('--sueca-color-primary-dark');
  });

  it('matches built-in contract token key set', () => {
    const themesCss = readFileSync(themesCssPath, 'utf8');
    const classicBlock = themesCss.match(
      /\.app-shell\[data-theme="classic"\]\s*\{([^}]*)\}/
    )?.[1];
    expect(classicBlock).toBeTruthy();
    const builtInSc = [...classicBlock!.matchAll(/(--sc-[a-z0-9-]+)\s*:/g)].map((m) => m[1]);
    expect([...builtInSc].sort()).toEqual([...CUSTOM_THEME_CONTRACT_TOKENS].sort());
  });

  it('accepts the existing 5-field saved theme schema', () => {
    const saved: CustomThemeColors = {
      bgTop: '#112233',
      bgBottom: '#010203',
      accent: '#aabbcc',
      textTitle: '#eeeeee',
      felt: '#224433'
    };
    expect(() => generateCSS('custom_old_save', saved)).not.toThrow();
    const css = generateCSS('custom_old_save', saved);
    expect(css).toContain('--sc-accent: #aabbcc');
  });

  it('does not break custom card-back / music fallbacks', () => {
    expect(resolveCardBackForTheme('custom_unmapped').id).toBe(DEFAULT_CARD_BACK_ID);
    expect(resolveMusicTrackIdForTheme('custom_xyz')).toBe(FALLBACK_MUSIC_TRACK_ID);
  });

  it('does not use emergency brass or classic purple as custom defaults', () => {
    const t = deriveCustomThemeTokens(SAMPLE);
    expect(t['--sc-accent'].toLowerCase()).not.toBe('#c5a45b');
    expect(t['--sc-accent'].toLowerCase()).not.toBe('#6c5ce7');
  });
});
