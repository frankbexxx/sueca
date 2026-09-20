/**
 * Stage 2 — Theme Contract v1 foundation checks (static file assertions).
 * Runtime source: design-tokens.css. JSON is metadata only.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const cssPath = join(here, 'design-tokens.css');
const jsonPath = join(here, 'design-tokens.json');

const APPROVED_SC_TOKENS = [
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

const REQUIRED_ALIASES: Record<string, string> = {
  '--sueca-color-primary': 'var(--sc-accent)',
  '--sueca-rgb-primary': 'var(--sc-accent-rgb)',
  '--color-primary': 'var(--sc-accent)',
  '--sueca-color-text': 'var(--sc-text)',
  '--color-text': 'var(--sc-text)',
  '--color-surface': 'var(--sc-surface)',
  '--theme-panel-modal': 'var(--sc-surface-modal)',
  '--theme-panel-shell': 'var(--sc-surface)',
  '--theme-turn-indicator': 'var(--sc-turn)',
  '--theme-player-box': 'var(--sc-seat)',
  '--theme-table-felt': 'var(--sc-felt)',
  '--theme-table-felt-dark': 'var(--sc-felt-dark)',
  '--theme-table-rail': 'var(--sc-rail)',
  '--theme-bg-game': 'var(--sc-game-bg)'
};

function declValue(css: string, prop: string): string | null {
  const re = new RegExp(`${prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*([^;]+);`);
  const m = css.match(re);
  return m ? m[1].trim() : null;
}

describe('Theme Contract v1 foundation (design-tokens.css)', () => {
  const css = readFileSync(cssPath, 'utf8');
  const json = JSON.parse(readFileSync(jsonPath, 'utf8')) as {
    semantic: Record<string, { css: string; value: string }>;
    color: { primary: { value: string } };
    gameSemantic: Record<string, { value: string }>;
  };

  it('defines all 16 approved --sc-* tokens exactly once each', () => {
    for (const token of APPROVED_SC_TOKENS) {
      const matches = css.match(new RegExp(`${token.replace(/-/g, '\\-')}\\s*:`, 'g'));
      expect(matches, token).toHaveLength(1);
      expect(declValue(css, token)).toBeTruthy();
    }
    expect(APPROVED_SC_TOKENS).toHaveLength(16);
  });

  it('uses brass/gold emergency accent — not purple legacy', () => {
    expect(declValue(css, '--sc-accent')?.toLowerCase()).toBe('#c5a45b');
    expect(declValue(css, '--sc-accent-rgb')).toBe('197, 164, 91');
    expect(css).not.toMatch(/--sc-accent:\s*#6c5ce7/i);
    expect(css).not.toMatch(/--sc-accent-rgb:\s*108,\s*92,\s*231/);
    expect(declValue(css, '--sueca-color-primary')).toBe('var(--sc-accent)');
    expect(declValue(css, '--sueca-rgb-primary')).toBe('var(--sc-accent-rgb)');
  });

  it('maps required legacy aliases to semantic tokens', () => {
    for (const [legacy, target] of Object.entries(REQUIRED_ALIASES)) {
      expect(declValue(css, legacy), legacy).toBe(target);
    }
  });

  it('keeps --sc-accent-rgb in rgba(var(...), α) channel form', () => {
    const rgb = declValue(css, '--sc-accent-rgb')!;
    expect(rgb).toMatch(/^\d{1,3},\s*\d{1,3},\s*\d{1,3}$/);
  });

  it('preserves fixed game-semantic globals (not theme-varying)', () => {
    expect(declValue(css, '--sueca-color-us')).toBe('#3484ea');
    expect(declValue(css, '--sueca-color-them')).toBe('#e25c5c');
    expect(declValue(css, '--sueca-color-danger')).toBe('#dc3545');
    expect(declValue(css, '--sc-game-us')).toBe('var(--sueca-color-us)');
    expect(declValue(css, '--sc-danger')).toBe('var(--sueca-color-danger)');
  });

  it('leaves Premium HUD tokens as intentional globals (unchanged values)', () => {
    expect(declValue(css, '--premium-hud-panel')).toBe('rgba(16, 25, 27, 0.72)');
    expect(declValue(css, '--premium-hud-panel-strong')).toBe('rgba(16, 25, 27, 0.82)');
    expect(declValue(css, '--premium-hud-border')).toBe('rgba(197, 164, 91, 0.22)');
    expect(declValue(css, '--premium-hud-text')).toBe('#e8e0d0');
    expect(declValue(css, '--premium-font')).toContain('Plus Jakarta Sans');
  });

  it('aligns design-tokens.json semantic.css keys with the 16 approved tokens', () => {
    const fromJson = Object.values(json.semantic).map((e) => e.css).sort();
    expect(fromJson).toEqual([...APPROVED_SC_TOKENS].sort());
    expect(json.color.primary.value.toLowerCase()).toBe('#c5a45b');
    expect(json.gameSemantic.us.value).toBe('#3484ea');
    expect(json.gameSemantic.them.value).toBe('#e25c5c');
    expect(json.gameSemantic.danger.value).toBe('#dc3545');
  });

  it('does not alias deferred bg-game-alt/mid to purple literals', () => {
    expect(declValue(css, '--theme-bg-game-alt')?.toLowerCase()).not.toBe('#6f5f98');
    expect(declValue(css, '--theme-bg-game-mid')?.toLowerCase()).not.toBe('#58679d');
  });
});
