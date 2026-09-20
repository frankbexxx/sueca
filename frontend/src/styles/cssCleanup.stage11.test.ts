/**
 * Stage 11 — Dead / superseded CSS cleanup structural guards.
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

describe('Stage 11 dead / superseded CSS cleanup', () => {
  const tokens = read('styles/design-tokens.css');
  const themes = read('styles/themes.css');
  const phaserTheme = read('renderers/phaser/phaserTheme.ts');
  const phaserCss = read('renderers/phaser/SuecaPhaserRenderer.css');
  const buttons = read('styles/sueca-buttons.css');
  const variantModals = read('components/VariantModals.css');
  const gameBoard = read('components/GameBoard.css');
  const more = read('components/screens/MoreScreen.css');
  const indexTsx = read('index.tsx');
  const customHook = read('hooks/useCustomThemeCSS.ts');

  it('deletes dobo-ui.css and stops importing it', () => {
    expect(existsSync(join(root, 'styles/dobo-ui.css'))).toBe(false);
    expect(indexTsx).not.toMatch(/dobo-ui\.css/);
  });

  it('has zero runtime class usage of dobo / variant-modal-primary / continue-button', () => {
    const runtimeFiles = [
      'App.tsx',
      'components/LandingPage.tsx',
      'components/RulesSheet.tsx',
      'components/CreditsModal.tsx',
      'components/common/ConfirmDialog.tsx',
      'components/EarlyRoundEndModal.tsx',
      'components/KingFestaFlowModal.tsx',
      'components/KingScoreModal.tsx',
      'components/KingScoreSheetModal.tsx',
      'components/KingKohRevealModal.tsx',
      'components/SuecaDealingModal.tsx',
      'components/GameBoard.tsx',
      'components/GameOverModal.tsx',
      'components/RoundEndModal.tsx',
      'components/screens/MoreScreen.tsx',
      'components/GameActions.tsx'
    ];
    for (const rel of runtimeFiles) {
      const src = read(rel);
      expect(src, rel).not.toMatch(/\bdobo-btn\b|\bdobo-panel\b|\bvariant-modal-primary\b|\bcontinue-button\b/);
    }
    expect(variantModals).not.toMatch(/\.dobo-btn\b|\.dobo-panel\b|\.variant-modal-primary\b/);
    expect(gameBoard).not.toMatch(/\.continue-button\b/);
  });

  it('removes Stage 3 alias bridge; themes.css is 30 token blocks only', () => {
    expect(themes).not.toMatch(/\.app-shell\[data-theme\]\s*\{/);
    const themeBlocks = themes.match(/\.app-shell\[data-theme="[^"]+"\]\s*\{/g) ?? [];
    expect(themeBlocks).toHaveLength(30);
    expect(themes).not.toMatch(/--sueca-color-primary-dark:/);
  });

  it('Phaser reads Theme Contract --sc-* directly', () => {
    expect(phaserTheme).toMatch(/getPropertyValue\('--sc-text'\)/);
    expect(phaserTheme).toMatch(/getPropertyValue\('--sc-turn'\)/);
    expect(phaserTheme).toMatch(/getPropertyValue\('--sc-accent'\)/);
    expect(phaserTheme).not.toMatch(/--sueca-color-primary|--color-primary|--theme-turn-indicator/);
    expect(phaserCss).toMatch(/var\(--sc-felt-dark/);
    expect(phaserCss).not.toMatch(/--theme-table-felt-dark/);
  });

  it('retains GameBoard companions and contract tokens', () => {
    expect(tokens).toMatch(/--theme-bg-game-alt:/);
    expect(tokens).toMatch(/--theme-bg-game-mid:/);
    expect(gameBoard).toMatch(/--theme-bg-game-alt/);
    expect(gameBoard).toMatch(/--theme-bg-game-mid/);
    expect(customHook).toMatch(/'--theme-bg-game-alt'/);
    expect(customHook).not.toMatch(/--sueca-color-primary-dark/);
    for (const t of [
      '--sc-canvas-from',
      '--sc-accent',
      '--sc-felt',
      '--sc-game-bg'
    ]) {
      expect(tokens).toMatch(new RegExp(`${t}:`));
    }
  });

  it('shared primary button system remains the paint path', () => {
    expect(buttons).toMatch(/\.sueca-btn--primary\s*\{[\s\S]*?--sc-accent-rgb/);
    expect(more).toMatch(/\.more-section\s*\{[\s\S]*?--sc-surface-modal/);
    expect(variantModals).toMatch(/\.king-koh-controls\s*\{[\s\S]*?--sc-surface-modal/);
  });

  it('does not reintroduce [data-theme] component selectors', () => {
    for (const css of [buttons, variantModals, gameBoard, more]) {
      expect(css).not.toMatch(/\[data-theme="/);
    }
  });
});
