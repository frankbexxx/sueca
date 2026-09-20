/**
 * Stage 12 — Global Visual Validation (structural guards).
 * Proves Theme Architecture foundation readiness before Final Visual Passes.
 * Not a redesign stage — no visual language changes asserted beyond integrity.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

const CONTRACT = [
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

const REPRESENTATIVE = [
  'classic',
  'midnight',
  'thebes',
  'thule',
  'forest',
  'el-dorado'
] as const;

const EMERGENCY_ACCENT = '#c5a45b';

function themeBlock(css: string, id: string): string | null {
  const m = css.match(
    new RegExp(`\\.app-shell\\[data-theme="${id}"\\]\\s*\\{([^}]*)\\}`, 'm')
  );
  return m ? m[1] : null;
}

function declInBlock(block: string, prop: string): string | null {
  const m = block.match(
    new RegExp(`${prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*([^;]+);`)
  );
  return m ? m[1].trim() : null;
}

describe('Stage 12 global theme architecture validation', () => {
  const tokens = read('styles/design-tokens.css');
  const themes = read('styles/themes.css');
  const customHook = read('hooks/useCustomThemeCSS.ts');
  const phaserTheme = read('renderers/phaser/phaserTheme.ts');
  const phaserCss = read('renderers/phaser/SuecaPhaserRenderer.css');
  const landing = read('components/LandingPage.css');
  const shell = read('styles/app-shell.css');
  const buttons = read('styles/sueca-buttons.css');
  const variantModals = read('components/VariantModals.css');
  const gameBoard = read('components/GameBoard.css');
  const more = read('components/screens/MoreScreen.css');

  it('Theme Contract v1 — 16 tokens on :root emergency + every representative built-in', () => {
    for (const t of CONTRACT) {
      expect(tokens).toMatch(new RegExp(`${t.replace(/-/g, '\\-')}\\s*:`));
    }
    expect(tokens).toMatch(/--sc-accent:\s*#c5a45b/i);

    for (const id of REPRESENTATIVE) {
      const block = themeBlock(themes, id);
      expect(block, id).toBeTruthy();
      for (const t of CONTRACT) {
        expect(declInBlock(block!, t), `${id} ${t}`).toBeTruthy();
      }
      expect(declInBlock(block!, '--sc-accent')?.toLowerCase(), id).not.toBe(EMERGENCY_ACCENT);
    }
  });

  it('Classic keeps intentional purple; other representatives do not use Classic accent', () => {
    const classic = themeBlock(themes, 'classic')!;
    expect(declInBlock(classic, '--sc-accent')?.toLowerCase()).toBe('#6c5ce7');
    for (const id of REPRESENTATIVE.filter((x) => x !== 'classic')) {
      const block = themeBlock(themes, id)!;
      expect(declInBlock(block, '--sc-accent')?.toLowerCase(), id).not.toBe('#6c5ce7');
      expect(block, id).not.toMatch(/108,\s*92,\s*231/);
    }
  });

  it('custom theme generator emits full contract + GameBoard companions only', () => {
    expect(customHook).toMatch(/CUSTOM_THEME_CONTRACT_TOKENS/);
    expect(customHook).toMatch(/'--theme-bg-game-alt'/);
    expect(customHook).toMatch(/'--theme-bg-game-mid'/);
    expect(customHook).not.toMatch(/--sueca-color-primary-dark/);
    expect(customHook).toMatch(/lighten\(accent,\s*0\.35\)/); // turn derived
  });

  it('Landing / shell / shared / game DOM consume --sc-* (no legacy paint vars)', () => {
    for (const [name, css] of [
      ['landing', landing],
      ['shell', shell],
      ['buttons', buttons],
      ['variantModals', variantModals],
      ['gameBoard', gameBoard],
      ['more', more]
    ] as const) {
      expect(css, name).toMatch(/--sc-/);
      expect(css, name).not.toMatch(/--sueca-color-primary\b|--color-primary\b|--theme-panel-/);
    }
  });

  it('Us / Them / Danger remain fixed game semantics on :root', () => {
    expect(tokens).toMatch(/--sueca-color-us:\s*#3484ea/);
    expect(tokens).toMatch(/--sueca-color-them:\s*#e25c5c/);
    expect(tokens).toMatch(/--sueca-color-danger:\s*#dc3545/);
    expect(gameBoard).toMatch(/--sueca-rgb-us|--sc-game-us/);
    expect(gameBoard).toMatch(/--sueca-rgb-them|--sc-game-them/);
  });

  it('Phaser boundary: --sc-* reads + Premium Classic felt preserved', () => {
    expect(phaserTheme).toMatch(/getPropertyValue\('--sc-text'\)/);
    expect(phaserTheme).toMatch(/getPropertyValue\('--sc-turn'\)/);
    expect(phaserTheme).toMatch(/getPropertyValue\('--sc-accent'\)/);
    expect(phaserTheme).toMatch(/Premium Classic|PREMIUM_TABLE|keep Premium Classic/);
    expect(phaserCss).toMatch(/var\(--sc-felt-dark/);
  });

  it('dead architecture has not returned', () => {
    expect(existsSync(join(root, 'styles/dobo-ui.css'))).toBe(false);
    expect(themes).not.toMatch(/\.app-shell\[data-theme\]\s*\{/);
    expect(variantModals).not.toMatch(/\.dobo-btn\b|\.dobo-panel\b|\.variant-modal-primary\b/);
    expect(gameBoard).not.toMatch(/\.continue-button\b/);
    expect(buttons).toMatch(/\.sueca-btn--primary/);
  });

  it('responsive Stage 9 hardening still present', () => {
    expect(tokens).toMatch(/--sueca-touch-min:\s*48px/);
    expect(shell).toMatch(/safe-area-inset-bottom/);
    expect(gameBoard).toMatch(/max-height:\s*82dvh/);
    expect(landing).toMatch(/max-height:\s*100%/);
  });
});
