/**
 * Stage 6 — Shared Component System: buttons, modals, forms on `--sc-*`.
 * Stage 11: Dobo / continue-button / variant-modal-primary aliases removed.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

describe('Stage 6 shared component theming', () => {
  const buttons = read('styles/sueca-buttons.css');
  const variantModals = read('components/VariantModals.css');
  const gameBoard = read('components/GameBoard.css');
  const playSetup = read('components/screens/PlaySetup.css');
  const more = read('components/screens/MoreScreen.css');
  const themes = read('components/screens/ThemesScreen.css');
  const rulesSheet = read('components/RulesSheet.css');
  const credits = read('components/CreditsModal.css');

  it('primary button semantics use --sc-accent-rgb recipe', () => {
    expect(buttons).toMatch(/\.sueca-btn--primary\s*\{[\s\S]*?rgba\(var\(--sc-accent-rgb\),\s*0\.45\)/);
    expect(buttons).toMatch(/\.sueca-btn--primary[\s\S]*?rgba\(var\(--sc-accent-rgb\),\s*0\.65\)/);
    expect(buttons).toMatch(/\.sueca-btn--primary:hover:not\(:disabled\)[\s\S]*?0\.58/);
    expect(buttons).toMatch(/\.sueca-btn:disabled/);
    expect(buttons).toMatch(/\.sueca-btn:focus-visible/);
    expect(buttons).toMatch(/var\(--sc-focus-ring/);
  });

  it('legacy Dobo / variant-modal-primary / continue-button paths are gone', () => {
    expect(variantModals).not.toMatch(/\.variant-modal-primary\b/);
    expect(variantModals).not.toMatch(/\.dobo-btn\b|\.dobo-panel\b/);
    expect(gameBoard).not.toMatch(/\.continue-button\b/);
    expect(more).toMatch(/\.more-section\s*\{[\s\S]*?var\(--sc-surface-modal\)/);
  });

  it('variant-modal shells use semantic surface + overlay tokens', () => {
    expect(variantModals).toMatch(/accent-color:\s*var\(--sc-accent\)/);
    expect(variantModals).toMatch(/\.variant-modal\s*\{[\s\S]*?var\(--sc-surface-modal\)/);
    expect(variantModals).toMatch(/var\(--sc-overlay-scrim/);
  });

  it('Continue actions use shared sueca-btn primary (GameActions)', () => {
    const actions = read('components/GameActions.tsx');
    expect(actions).toMatch(/sueca-btn sueca-btn--primary[\s\S]*?action-continue-btn/);
    expect(actions).not.toMatch(/continue-button/);
  });

  it('toggle-on and selected states use theme accent', () => {
    expect(buttons).toMatch(/\.sueca-btn--toggle-on\s*\{[\s\S]*?rgba\(var\(--sc-accent-rgb\)/);
    expect(variantModals).toMatch(
      /\.king-festa-choice-btn--selected\s*\{[\s\S]*?rgba\(var\(--sc-accent-rgb\)/
    );
    expect(themes).toMatch(/\.themes-card--active[\s\S]*--sc-accent-rgb/);
    expect(more).toMatch(/\.lang-btn\.active[\s\S]*--sc-accent-rgb/);
  });

  it('modal shells consume semantic surface tokens', () => {
    expect(gameBoard).toMatch(/\.modal-container\s*\{[\s\S]*?var\(--sc-surface-modal\)/);
    expect(gameBoard).toMatch(/\.modal-container\s*\{[\s\S]*?var\(--sc-surface-border\)/);
    expect(rulesSheet).toMatch(/\.rules-sheet\s*\{[\s\S]*?var\(--sc-surface-modal\)/);
    expect(credits).toMatch(/\.credits-modal-card\s*\{[\s\S]*?var\(--sc-surface-modal\)/);
  });

  it('select/radio/toggle controls use semantic tokens', () => {
    expect(playSetup).toMatch(/\.form-input,\s*\n\.form-select\s*\{[\s\S]*?var\(--sc-surface\)/);
    expect(playSetup).toMatch(/\.form-input,\s*\n\.form-select\s*\{[\s\S]*?var\(--sc-surface-border\)/);
    expect(playSetup).toMatch(/accent-color:\s*var\(--sc-accent\)/);
    expect(playSetup).toMatch(/\.form-input:focus-visible/);
    expect(playSetup).toMatch(/\.form-input:disabled/);
    expect(playSetup).toMatch(/\.form-select option\s*\{[\s\S]*?background-color:\s*#f4f4f5/);
    expect(playSetup).toMatch(/\.form-select option\s*\{[\s\S]*?color:\s*#111827/);
    expect(more).toMatch(/\.more-select,\s*\n\.more-name-input\s*\{[\s\S]*?var\(--sc-surface\)/);
    expect(more).toMatch(/\.more-toggle input\[type='checkbox'\][\s\S]*?accent-color:\s*var\(--sc-accent\)/);
    expect(variantModals).toMatch(/\.variant-modal select[\s\S]*?var\(--sc-surface-border\)/);
  });

  it('shared component CSS has no direct legacy purple literals', () => {
    for (const [name, css] of [
      ['sueca-buttons', buttons],
      ['PlaySetup', playSetup],
      ['MoreScreen', more],
      ['ThemesScreen', themes],
      ['RulesSheet', rulesSheet]
    ] as const) {
      expect(css, name).not.toMatch(/#6c5ce7|#5a4fd6|#c4b5fd|#7c3aed|#9333ea|#7c4dff/i);
      expect(css, name).not.toMatch(/rgba\(108,\s*92,\s*231/);
    }
  });

  it('does not introduce theme-specific component selectors', () => {
    for (const css of [buttons, variantModals, playSetup, more, themes, rulesSheet]) {
      expect(css).not.toMatch(/\[data-theme="/);
    }
  });

  it('game-semantic Us/Them preserved on score boxes (not theme accent)', () => {
    const usBlock = gameBoard.match(/\.modal-score-us\s*\{[^}]+\}/)?.[0];
    const themBlock = gameBoard.match(/\.modal-score-them\s*\{[^}]+\}/)?.[0];
    expect(usBlock).toMatch(/--sueca-rgb-us/);
    expect(themBlock).toMatch(/--sueca-rgb-them/);
    expect(usBlock).not.toMatch(/--sc-accent/);
  });

  it('modal primary / new-game buttons share accent paint (no Material blue)', () => {
    expect(gameBoard).toMatch(/\.modal-button-primary\s*\{[\s\S]*?--sc-accent-rgb/);
    expect(gameBoard).toMatch(/\.modal-button-new-game\s*\{[\s\S]*?--sc-accent-rgb/);
    expect(gameBoard).not.toMatch(/#2196F3/i);
  });
});
