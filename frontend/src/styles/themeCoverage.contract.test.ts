/**
 * Personalização 01B — global theme coverage / propagation contracts.
 * Static + lightweight DOM checks; no visual snapshots.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUILT_IN_THEME_IDS } from '../constants/themeRegistry';
import { resolveCardBackForTheme } from '../constants/cardDeckRegistry';
import {
  CUSTOM_THEME_CONTRACT_TOKENS,
  deriveCustomThemeTokens,
  generateCSS,
  isSafeCustomThemeId
} from '../hooks/useCustomThemeCSS';
import {
  DEFAULT_THEME,
  resolvePhaserThemeFromDom,
  cssColorToHex
} from '../renderers/phaser/phaserTheme';
import { PREMIUM_TABLE } from '../renderers/phaser/phaserPremiumLayout';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

describe('theme coverage — app shell propagation', () => {
  const app = read('App.tsx');

  it('applies data-theme={activeTheme} on landing, game, and shell shells', () => {
    expect(app).toMatch(
      /app-shell--landing"[\s\S]*?data-theme=\{activeTheme\}/
    );
    expect(app).toMatch(
      /app-shell--game"[\s\S]*?data-theme=\{activeTheme\}/
    );
    expect(app).toMatch(/data-theme=\{activeTheme\}/);
    expect(app).toMatch(/useCustomThemeCSS\(activeTheme\)/);
  });
});

describe('theme coverage — shell / personalize surfaces use tokens', () => {
  it('shell screens consume --sc-* surfaces and text', () => {
    const css = read('styles/shell-screens.css');
    expect(css).toMatch(/--sc-surface/);
    expect(css).toMatch(/--sc-text-title/);
    expect(css).toMatch(/--sc-text-muted/);
  });

  it('ThemesScreen a11y uses muted/text tokens (not ultra-low opacity alone)', () => {
    const css = read('components/screens/ThemesScreen.css');
    const sub = css.match(/\.themes-subzone-header\s*\{[^}]+\}/)?.[0] ?? '';
    const lore = css.match(/\.themes-card-lore\s*\{[^}]+\}/)?.[0] ?? '';
    expect(sub).toMatch(/--sc-text-muted/);
    expect(sub).not.toMatch(/opacity:\s*0\.3[0-9]/);
    expect(lore).toMatch(/--sc-text/);
    expect(lore).not.toMatch(/opacity:\s*0\.7[0-5]/);
  });

  it('tokenizes Online / Music / ThemeEditor chrome that previously bypassed themes', () => {
    expect(read('components/screens/OnlineScreen.css')).toMatch(/--sc-surface/);
    expect(read('components/screens/OnlineScreen.css')).toMatch(/--sc-accent/);
    expect(read('components/screens/MusicSettingsControls.css')).toMatch(
      /--sc-text/
    );
    expect(read('components/screens/AudioVolumeControl.css')).toMatch(
      /--sc-text/
    );
    expect(read('components/screens/AudioVolumeControl.css')).toMatch(
      /--sc-accent-rgb/
    );
    expect(read('components/screens/ThemeEditorScreen.css')).toMatch(
      /--sc-surface/
    );
    expect(read('components/screens/ThemeEditorScreen.css')).toMatch(
      /--sc-danger/
    );
  });
});

describe('theme coverage — DOM gameplay + Phaser adapter', () => {
  it('GameBoard DOM wash stays on --sc-* (renderer=dom path)', () => {
    const css = read('components/GameBoard.css');
    expect(css).toMatch(/var\(--sc-game-bg\)/);
    expect(css).toMatch(/var\(--sc-felt\)/);
    expect(css).toMatch(/var\(--sc-turn\)/);
    expect(css).toMatch(/\.card-back-small[\s\S]*?--sc-surface-modal/);
  });

  it('Phaser keeps Premium Classic felt; accents follow CSS when DOM present', () => {
    expect(DEFAULT_THEME.felt).toBe(PREMIUM_TABLE.felt);
    expect(DEFAULT_THEME.exterior).toBe(PREMIUM_TABLE.exterior);

    const resolved = resolvePhaserThemeFromDom(null);
    expect(resolved.felt).toBe(PREMIUM_TABLE.felt);
    expect(resolved.cardBackId).toBeTruthy();

    for (const id of BUILT_IN_THEME_IDS) {
      const back = resolveCardBackForTheme(id);
      expect(back.id, id).toBeTruthy();
      expect(back.assetPathBase, id).toMatch(/^\/assets\//);
    }
  });

  it('cssColorToHex parses theme accent formats used by Phaser', () => {
    expect(cssColorToHex('#c5a45b')).toBe(0xc5a45b);
    expect(cssColorToHex('rgb(197, 164, 91)')).toBe(0xc5a45b);
  });
});

describe('theme coverage — custom themes', () => {
  it('custom ids are sanitized and emit the full 16-token contract', () => {
    expect(isSafeCustomThemeId('custom_1710000000000')).toBe(true);
    expect(isSafeCustomThemeId('classic')).toBe(false);
    expect(isSafeCustomThemeId('custom_;drop')).toBe(false);

    const tokens = deriveCustomThemeTokens({
      bgTop: '#1a2438',
      bgBottom: '#121820',
      accent: '#c5a45b',
      textTitle: '#e8e0d0',
      felt: '#173c3b'
    });
    for (const key of CUSTOM_THEME_CONTRACT_TOKENS) {
      expect(tokens[key], key).toBeTruthy();
    }
    const css = generateCSS('custom_1710000000000', {
      bgTop: '#1a2438',
      bgBottom: '#121820',
      accent: '#c5a45b',
      textTitle: '#e8e0d0',
      felt: '#173c3b'
    });
    expect(css).toMatch(
      /^\.app-shell\[data-theme="custom_1710000000000"\] \{/
    );
    expect(css).toMatch(/--sc-felt:/);
    expect(css).toMatch(/--sc-accent:/);
  });
});
