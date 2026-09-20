/**
 * Stage 3 — built-in themes semantic contract (static CSS assertions).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { BuiltInThemeId } from '../services/billingService';
import { THEME_CARD_VISUALS } from '../constants/themeCardVisuals';
import { THEME_MUSIC_FAMILY } from '../constants/musicThemeMap';

const here = dirname(fileURLToPath(import.meta.url));
const themesCssPath = join(here, 'themes.css');
const tokensCssPath = join(here, 'design-tokens.css');

const BUILT_IN_THEME_IDS = [
  'classic', 'forest', 'midnight',
  'thebes', 'tikal', 'thule',
  'knossos', 'xanadu', 'yamatai',
  'shambhala', 'rapanui', 'babylon', 'ur', 'nanmadol',
  'hyperborea', 'skara-brae', 'avalon',
  'cartago', 'atlantida',
  'petra', 'persepolis',
  'axum', 'meroe', 'great-zimbabwe',
  'mohenjo-daro', 'angkor',
  'teotihuacan', 'tiwanaku', 'caral', 'el-dorado'
] as const satisfies readonly BuiltInThemeId[];

const CONTRACT_TOKENS = [
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

/** Emergency :root brass — built-ins must not equal this accent. */
const EMERGENCY_ACCENT = '#c5a45b';
const EMERGENCY_ACCENT_RGB = '197, 164, 91';

function themeBlock(css: string, id: string): string | null {
  const re = new RegExp(
    `\\.app-shell\\[data-theme="${id}"\\]\\s*\\{([^}]*)\\}`,
    'm'
  );
  const m = css.match(re);
  return m ? m[1] : null;
}

function declInBlock(block: string, prop: string): string | null {
  const re = new RegExp(`${prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*([^;]+);`);
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

function hexToRgbChannels(hex: string): string | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function countRules(css: string): { total: number; tokenOnly: number; selectorDriven: number } {
  // Strip comments
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  let total = 0;
  let tokenOnly = 0;
  let m: RegExpExecArray | null;
  while ((m = ruleRe.exec(stripped))) {
    const sel = m[1].trim();
    const body = m[2].trim();
    if (!sel || !body) continue;
    total += 1;
    // token-only: selector is only .app-shell[data-theme="…"] and body is only custom props
    const isThemeRoot =
      /^\.app-shell\[data-theme="[^"]+"\]$/.test(sel) ||
      /^\.app-shell\[data-theme\]$/.test(sel);
    const onlyCustomProps = body
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .every((line) => line.startsWith('--'));
    if (isThemeRoot && onlyCustomProps) tokenOnly += 1;
  }
  return { total, tokenOnly, selectorDriven: total - tokenOnly };
}

describe('Stage 3 built-in themes → semantic contract', () => {
  const css = readFileSync(themesCssPath, 'utf8');
  const rootCss = readFileSync(tokensCssPath, 'utf8');

  it('lists exactly 30 BuiltInThemeId values', () => {
    expect(BUILT_IN_THEME_IDS).toHaveLength(30);
  });

  it('defines exactly one semantic block per built-in theme', () => {
    for (const id of BUILT_IN_THEME_IDS) {
      const matches = css.match(
        new RegExp(`\\.app-shell\\[data-theme="${id}"\\]\\s*\\{`, 'g')
      );
      expect(matches, id).toHaveLength(1);
    }
  });

  it('makes Classic explicit (not relying on :root identity)', () => {
    const block = themeBlock(css, 'classic');
    expect(block).toBeTruthy();
    expect(declInBlock(block!, '--sc-accent')).toBe('#6c5ce7');
    expect(declInBlock(block!, '--sc-accent-rgb')).toBe('108, 92, 231');
    // :root emergency remains brass, distinct from classic
    expect(rootCss).toMatch(/--sc-accent:\s*#c5a45b/i);
    expect(declInBlock(block!, '--sc-accent')?.toLowerCase()).not.toBe(EMERGENCY_ACCENT);
  });

  it('gives every theme the same 16-token contract shape', () => {
    const shapes: string[][] = [];
    for (const id of BUILT_IN_THEME_IDS) {
      const block = themeBlock(css, id)!;
      const keys = CONTRACT_TOKENS.filter((t) => declInBlock(block, t) != null);
      expect(keys, id).toEqual([...CONTRACT_TOKENS]);
      shapes.push(keys);
    }
    for (let i = 1; i < shapes.length; i++) {
      expect(shapes[i]).toEqual(shapes[0]);
    }
  });

  it('keeps accent hex and accent-rgb consistent for all 30 themes', () => {
    for (const id of BUILT_IN_THEME_IDS) {
      const block = themeBlock(css, id)!;
      const hex = declInBlock(block, '--sc-accent')!;
      const rgb = declInBlock(block, '--sc-accent-rgb')!;
      expect(hexToRgbChannels(hex), id).toBe(rgb);
    }
  });

  it('does not leave built-ins on emergency brass accent fallback', () => {
    for (const id of BUILT_IN_THEME_IDS) {
      const block = themeBlock(css, id)!;
      expect(declInBlock(block, '--sc-accent')?.toLowerCase(), id).not.toBe(EMERGENCY_ACCENT);
      expect(declInBlock(block, '--sc-accent-rgb'), id).not.toBe(EMERGENCY_ACCENT_RGB);
    }
  });

  it('is predominantly token-driven (30 theme roots; alias bridge removed Stage 11)', () => {
    const metrics = countRules(css);
    expect(metrics.total).toBe(30);
    expect(metrics.tokenOnly).toBe(30);
    expect(metrics.selectorDriven).toBe(0);
    expect(css).not.toMatch(/\.app-shell\[data-theme\]\s*\{/);
    expect(css).not.toMatch(/--sueca-color-primary:/);
  });

  it('preserves theme→card-back mappings for all built-ins', () => {
    expect(Object.keys(THEME_CARD_VISUALS).sort()).toEqual([...BUILT_IN_THEME_IDS].sort());
  });

  it('preserves theme→music family mappings for all built-ins', () => {
    expect(Object.keys(THEME_MUSIC_FAMILY).sort()).toEqual([...BUILT_IN_THEME_IDS].sort());
  });

  it('does not reintroduce component selector overrides in themes.css', () => {
    expect(css).not.toMatch(/\.sueca-btn--primary/);
    expect(css).not.toMatch(/\.shell-panel/);
    expect(css).not.toMatch(/\.bottom-nav-item/);
    expect(css).not.toMatch(/\.game-board\s*\{/);
  });
});
