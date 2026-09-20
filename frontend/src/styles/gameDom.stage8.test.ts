/**
 * Stage 8 — Game-specific DOM theming (Sueca / Hearts / Spades / King).
 * Architecture migration only — not Final Visual Pass / Phaser / rules.
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

const GAME_CSS = [
  'components/GameBoard.css',
  'components/VariantModals.css',
  'components/navigation/InGameBar.css',
  'components/PenteVisualization.css'
] as const;

const FORBIDDEN_PURPLE =
  /#6c5ce7|#5a4fd6|#7c4dff|#c4b5fd|#e9d5ff|#667eea|#764ba2|108,\s*92,\s*231|196,\s*181,\s*253/i;

const LEGACY_PRIMARY =
  /--sueca-color-primary|--sueca-rgb-primary|--color-primary(?!-)|--theme-panel-|--theme-turn-|--theme-player-|--theme-table-/;

describe('Stage 8 game DOM semantic theming', () => {
  const gameBoard = read('components/GameBoard.css');
  const variantModals = read('components/VariantModals.css');
  const inGameBar = read('components/navigation/InGameBar.css');
  const tokens = read('styles/design-tokens.css');

  it('game-owned CSS has no [data-theme="…"] component overrides', () => {
    for (const rel of GAME_CSS) {
      expect(read(rel), rel).not.toMatch(/\[data-theme="/);
    }
  });

  it('migrated game DOM does not consume legacy primary / theme-chrome aliases', () => {
    for (const rel of GAME_CSS) {
      const css = read(rel);
      expect(css, rel).not.toMatch(LEGACY_PRIMARY);
    }
  });

  it('game DOM has no accidental legacy purple literals', () => {
    for (const rel of GAME_CSS) {
      expect(read(rel), rel).not.toMatch(FORBIDDEN_PURPLE);
    }
  });

  it('GameBoard board wash / turn / seat / table use --sc-*', () => {
    expect(gameBoard).toMatch(/var\(--sc-game-bg\)/);
    expect(gameBoard).toMatch(/var\(--sc-turn\)/);
    expect(gameBoard).toMatch(/var\(--sc-seat\)/);
    expect(gameBoard).toMatch(/var\(--sc-felt\)/);
    expect(gameBoard).toMatch(/var\(--sc-felt-dark\)/);
    expect(gameBoard).toMatch(/var\(--sc-rail\)/);
    expect(gameBoard).toMatch(/color:\s*var\(--sc-text\)/);
  });

  it('Us/Them remain game-semantic (not theme accent)', () => {
    expect(gameBoard).toMatch(/\.modal-score-us[\s\S]*?--sueca-rgb-us/);
    expect(gameBoard).toMatch(/\.modal-score-them[\s\S]*?--sueca-rgb-them/);
    expect(gameBoard).toMatch(/team-us[\s\S]*?--sc-game-us/);
    expect(gameBoard).toMatch(/team-them[\s\S]*?--sc-game-them/);
    const usBlock = gameBoard.match(/\.modal-score-us\s*\{[^}]+\}/)?.[0];
    expect(usBlock).not.toMatch(/--sc-accent/);
  });

  it('selection chrome uses accent semantics (Hearts pass / hand select)', () => {
    expect(gameBoard).toMatch(/\.card-hand\.selected\s*\{[\s\S]*?--sc-accent/);
    expect(gameBoard).toMatch(/\.card-hand--pass-selected\s*\{[\s\S]*?--sc-accent-rgb/);
    expect(variantModals).toMatch(/\.pass-card-btn\.selected\s*\{[\s\S]*?--sc-accent-rgb/);
  });

  it('King KOH mini-table and Spades/King controls use semantic paint', () => {
    expect(variantModals).toMatch(/king-koh-table[\s\S]*?--sc-felt/);
    expect(variantModals).toMatch(/king-koh-table[\s\S]*?--sc-rail/);
    expect(variantModals).toMatch(/\.spades-bid-select\s*\{[\s\S]*?--sc-text/);
    expect(variantModals).toMatch(/\.king-auction-toolbar__select\s*\{[\s\S]*?--sc-text/);
  });

  it('command rail uses vertical column layout (Batch 2)', () => {
    expect(inGameBar).toMatch(/\.in-game-bar-actions\s*\{[\s\S]*?flex-direction:\s*column/);
    expect(inGameBar).not.toMatch(
      /\.in-game-bar-actions\s*\{[^}]*flex-direction:\s*row/
    );
  });

  it('InGameBar consumes semantic text/surface (not sueca-color-text)', () => {
    expect(inGameBar).toMatch(/var\(--sc-text/);
    expect(inGameBar).toMatch(/var\(--sc-text-muted\)/);
    expect(inGameBar).toMatch(/var\(--sc-surface-border/);
    expect(inGameBar).not.toMatch(/sueca-color-text|sueca-rgb-text/);
  });

  it('shared modal/button systems remain the paint path', () => {
    expect(variantModals).toMatch(/--sc-surface-modal/);
    expect(gameBoard).toMatch(/\.modal-container\s*\{[\s\S]*?--sc-surface-modal/);
    expect(gameBoard).not.toMatch(/\.continue-button\b/);
  });

  it('game-semantic danger/us tokens stay fixed on :root (not theme-varying)', () => {
    expect(tokens).toMatch(/--sc-game-us:\s*var\(--sueca-color-us\)/);
    expect(tokens).toMatch(/--sc-game-them:\s*var\(--sueca-color-them\)/);
    expect(tokens).toMatch(/--sc-danger:\s*var\(--sueca-color-danger\)/);
    expect(tokens).toMatch(/--sueca-color-us:\s*#3484ea/);
    expect(tokens).toMatch(/--sueca-color-them:\s*#e25c5c/);
  });

  it('theme companion bg-game-alt/mid may remain for wash only (documented)', () => {
    expect(gameBoard).toMatch(/--theme-bg-game-alt/);
    expect(gameBoard).toMatch(/--theme-bg-game-mid/);
    expect(gameBoard).not.toMatch(/--theme-bg-game\)/);
  });
});
