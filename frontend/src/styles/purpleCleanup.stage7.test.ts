/**
 * Stage 7 — Legacy purple cleanup / GLOBAL-UI-01.
 *
 * Forbidden literals = historical accidental purple/lavender system.
 * Classic theme block may contain approved Classic purple.
 * Built-in themes with intentional purple-ish identity (e.g. Shambhala)
 * are out of scope for this forbidden-literal list.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

/** Legacy accidental palette — must not appear outside Classic / tests / comments-of-record */
const FORBIDDEN =
  /#6c5ce7|#5a4fd6|#7c5cbf|#7c4dff|#c4b5fd|#e9d5ff|#e2e6ff|#e0e3ff|#667eea|#764ba2|108,\s*92,\s*231|196,\s*181,\s*253/i;

function walkOwnedSources(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === 'generated') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      walkOwnedSources(p, acc);
      continue;
    }
    if (!/\.(css|tsx|ts)$/.test(name)) continue;
    if (/\.test\./.test(name)) continue;
    acc.push(p);
  }
  return acc;
}

/** Strip Classic theme block so remaining themes.css can be grepped for leakage */
function themesCssWithoutClassic(css: string): string {
  return css.replace(
    /\/\* CLASSIC[\s\S]*?\.app-shell\[data-theme="classic"\]\s*\{[\s\S]*?\n\}/,
    '/* CLASSIC_BLOCK_REMOVED_FOR_AUDIT */'
  );
}

describe('Stage 7 legacy purple cleanup (GLOBAL-UI-01)', () => {
  const tokens = read('styles/design-tokens.css');
  const themes = read('styles/themes.css');
  const indexCss = read('index.css');
  const errorBoundaryTsx = read('components/ErrorBoundary.tsx');
  const errorBoundaryCss = read('components/ErrorBoundary.css');
  const penteTsx = read('components/PenteVisualization.tsx');
  const penteCss = read('components/PenteVisualization.css');
  const gameBoard = read('components/GameBoard.css');
  const gameSelector = read('components/GameSelector.css');
  const credits = read('components/CreditsModal.css');
  const customHook = read('hooks/useCustomThemeCSS.ts');

  it('emergency :root accent is brass/gold — not Classic purple', () => {
    expect(tokens).toMatch(/--sc-accent:\s*#c5a45b/);
    expect(tokens).not.toMatch(/--sc-accent:\s*#6c5ce7/i);
    expect(tokens).toMatch(/--sueca-color-primary-dark:\s*#9a7d32/);
    expect(tokens).not.toMatch(/--sueca-color-primary-dark:\s*#5a4fd6/i);
  });

  it('Classic theme block retains approved intentional purple', () => {
    const classic = themes.match(
      /\.app-shell\[data-theme="classic"\]\s*\{[\s\S]*?\n\}/
    )?.[0];
    expect(classic).toBeTruthy();
    expect(classic!).toMatch(/--sc-accent:\s*#6c5ce7/);
    expect(classic!).toMatch(/--sc-accent-rgb:\s*108,\s*92,\s*231/);
    expect(classic!).toMatch(/--sueca-color-primary-dark:\s*#5a4fd6/);
  });

  it('themes.css outside Classic has no Classic legacy purple literals', () => {
    const rest = themesCssWithoutClassic(themes);
    expect(rest).not.toMatch(/#6c5ce7/i);
    expect(rest).not.toMatch(/#5a4fd6/i);
    expect(rest).not.toMatch(/108,\s*92,\s*231/);
  });

  it('aliases on :root and theme bridge point at --sc-accent (no purple literal)', () => {
    expect(tokens).toMatch(/--sueca-color-primary:\s*var\(--sc-accent\)/);
    expect(tokens).toMatch(/--sueca-rgb-primary:\s*var\(--sc-accent-rgb\)/);
    expect(tokens).toMatch(/--color-primary:\s*var\(--sc-accent\)/);
    expect(themes).toMatch(
      /\.app-shell\[data-theme\]\s*\{[\s\S]*?--sueca-color-primary:\s*var\(--sc-accent\)/
    );
  });

  it('custom theme primary-dark is derived from accent, not fixed purple', () => {
    expect(customHook).toMatch(/primary-dark.*darken\(accent/i);
    expect(customHook).toMatch(/'--sueca-color-primary-dark':\s*darken\(accent/);
    expect(customHook).not.toMatch(/#5a4fd6|#6c5ce7/i);
  });

  it('ErrorBoundary uses semantic recovery CTA — no hardcoded purple', () => {
    expect(errorBoundaryTsx).not.toMatch(FORBIDDEN);
    expect(errorBoundaryTsx).toMatch(/error-boundary__reload/);
    expect(errorBoundaryCss).toMatch(/--sc-accent-rgb/);
    expect(errorBoundaryCss).not.toMatch(FORBIDDEN);
  });

  it('PenteVisualization uses game-semantic Us/Them (not legacy purple / theme accent)', () => {
    expect(penteTsx).not.toMatch(/#6c5ce7|#ff6b6b/i);
    expect(penteTsx).toMatch(/pente-team--us/);
    expect(penteTsx).toMatch(/pente-team--them/);
    expect(penteCss).toMatch(/\.pente-team--us\s*\{[\s\S]*?--sc-game-us/);
    expect(penteCss).toMatch(/\.pente-team--them\s*\{[\s\S]*?--sc-game-them/);
    expect(penteCss).not.toMatch(FORBIDDEN);
  });

  it('GameBoard bidding/auction chrome has no lavender leftovers', () => {
    expect(gameBoard).not.toMatch(/#e9d5ff|196,\s*181,\s*253|#c4b5fd/i);
    expect(gameBoard).toMatch(/player-seat--bidding[\s\S]*?--sc-accent-rgb/);
    expect(gameBoard).toMatch(/\.player-auction-badge\s*\{[\s\S]*?--sc-accent-rgb/);
  });

  it('GameSelector and body canvas no longer use indigo/purple gradient', () => {
    expect(gameSelector).not.toMatch(/#667eea|#764ba2/i);
    expect(gameSelector).toMatch(/--sc-surface-modal|--sc-accent-rgb/);
    expect(indexCss).not.toMatch(/#667eea|#764ba2/i);
    expect(indexCss).toMatch(/--sc-canvas-from/);
  });

  it('Credits modal body text no longer uses lavender literals', () => {
    expect(credits).not.toMatch(/#e2e6ff|#e0e3ff|#f5f7ff/i);
    // Copper title remains intentional decorative
    expect(credits).toMatch(/#d4a574/);
  });

  it('owned frontend sources (excl. Classic block + tests) have no forbidden purple literals', () => {
    const files = walkOwnedSources(root);
    const offenders: string[] = [];
    for (const abs of files) {
      let text = readFileSync(abs, 'utf8');
      const rel = relative(root, abs).replace(/\\/g, '/');
      if (rel === 'styles/themes.css') {
        text = themesCssWithoutClassic(text);
      }
      // Allow comments that mention the hex as documentation of what was removed
      if (FORBIDDEN.test(text)) {
        offenders.push(rel);
      }
    }
    expect(offenders).toEqual([]);
  });
});
