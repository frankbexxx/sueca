/**
 * Stage 9 — Responsive Theme Pass (structural guards).
 * Validation + minimal hardening — not redesign.
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

describe('Stage 9 responsive theme hardening', () => {
  const landing = read('components/LandingPage.css');
  const shell = read('styles/app-shell.css');
  const bottomNav = read('components/navigation/BottomNav.css');
  const buttons = read('styles/sueca-buttons.css');
  const variantModals = read('components/VariantModals.css');
  const rulesSheet = read('components/RulesSheet.css');
  const credits = read('components/CreditsModal.css');
  const more = read('components/screens/MoreScreen.css');
  const playSetup = read('components/screens/PlaySetup.css');
  const gameBoard = read('components/GameBoard.css');
  const tokens = read('styles/design-tokens.css');
  const inGameBar = read('components/navigation/InGameBar.css');

  it('defines touch-min and shell reserves bottom-nav + safe-area space', () => {
    expect(tokens).toMatch(/--sueca-touch-min:\s*48px/);
    expect(shell).toMatch(
      /padding-bottom:\s*calc\(var\(--sueca-bottom-nav-height[\s\S]*?safe-area-inset-bottom/
    );
    expect(bottomNav).toMatch(/padding-bottom:\s*env\(safe-area-inset-bottom/);
  });

  it('shared buttons keep touch-min targets', () => {
    expect(buttons).toMatch(/min-height:\s*var\(--sueca-touch-min/);
  });

  it('Landing avoids double-counting safe-area in card max-height', () => {
    expect(landing).toMatch(/\.landing-content[\s\S]*?safe-area-inset-top/);
    expect(landing).toMatch(/\.landing-card[\s\S]*?max-height:\s*100%/);
    expect(landing).not.toMatch(
      /landing-card[\s\S]{0,200}100dvh\s*-\s*24px\s*-\s*env\(safe-area-inset-top\)/
    );
    expect(landing).toMatch(
      /@media \(min-width: 769px\)[\s\S]*?safe-area-inset-top/
    );
  });

  it('bottom-sheet overlay does not double bottom safe-area with sheet padding', () => {
    expect(variantModals).toMatch(
      /\.variant-modal-overlay--bottom-sheet\s*\{[\s\S]*?padding-bottom:\s*0/
    );
    expect(variantModals).toMatch(
      /\.variant-modal--bottom-sheet\s*\{[\s\S]*?safe-area-inset-bottom/
    );
  });

  it('key mobile form controls use ≥16px font-size (iOS zoom guard)', () => {
    expect(more).toMatch(/\.more-select,\s*\n\.more-name-input\s*\{[\s\S]*?font-size:\s*1rem/);
    expect(playSetup).toMatch(/\.form-input,\s*\n\.form-select\s*\{[\s\S]*?font-size:\s*1rem/);
    expect(variantModals).toMatch(/\.spades-bid-select\s*\{[\s\S]*?font-size:\s*1rem/);
    expect(variantModals).toMatch(/\.king-auction-toolbar__select\s*\{[\s\S]*?font-size:\s*1rem/);
    expect(variantModals).toMatch(/\.king-festa-setup-select\s*\{[\s\S]*?font-size:\s*1rem/);
  });

  it('modal max-heights prefer dvh fallbacks for short viewports', () => {
    expect(rulesSheet).toMatch(/max-height:\s*70dvh/);
    expect(credits).toMatch(/max-height:\s*90dvh/);
    expect(gameBoard).toMatch(/max-height:\s*82dvh/);
    expect(variantModals).toMatch(/max-height:\s*85dvh/);
    expect(variantModals).toMatch(/\.variant-modal--hearts-pass[\s\S]*?16dvh/);
    expect(variantModals).toMatch(/\.variant-modal--spades-bid[\s\S]*?16dvh/);
  });

  it('Credits / Rules overlays include safe-area padding', () => {
    expect(credits).toMatch(/credits-modal-overlay[\s\S]*?safe-area-inset-top/);
    expect(rulesSheet).toMatch(/rules-sheet-overlay[\s\S]*?safe-area-inset-top/);
    expect(rulesSheet).toMatch(/\.rules-sheet[\s\S]*?safe-area-inset-bottom/);
  });

  it('GameBoard avoids 100vw horizontal soft overflow trap', () => {
    expect(gameBoard).toMatch(/\.game-board\s*\{[\s\S]*?max-width:\s*100%/);
    expect(gameBoard).not.toMatch(/\.game-board\s*\{[\s\S]*?max-width:\s*100vw/);
  });

  it('InGameBar / HUD chrome keeps top safe-area; landscape game board rule remains', () => {
    expect(inGameBar).toMatch(/safe-area-inset-top/);
    expect(gameBoard).toMatch(/orientation:\s*landscape[\s\S]*?max-height:\s*500px/);
  });

  it('does not introduce theme-specific responsive overrides', () => {
    for (const css of [landing, shell, bottomNav, variantModals, gameBoard, more, credits]) {
      expect(css).not.toMatch(/\[data-theme="/);
    }
  });
});
