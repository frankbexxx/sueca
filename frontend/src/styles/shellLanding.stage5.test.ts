/**
 * Stage 5 — Landing + App Shell consume Theme Contract v1 directly.
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

describe('Stage 5 Landing + App Shell theming', () => {
  const appTsx = read('App.tsx');
  const landingCss = read('components/LandingPage.css');
  const bottomNavCss = read('components/navigation/BottomNav.css');
  const shellCss = read('styles/app-shell.css');
  const shellScreensCss = read('styles/shell-screens.css');
  const dashboardCss = read('components/screens/HomeDashboard.css');
  const themesCss = read('components/screens/ThemesScreen.css');

  it('puts Landing under .app-shell with data-theme (same theme scope)', () => {
    expect(appTsx).toMatch(
      /screen === 'landing'[\s\S]*?className="App app-shell app-shell--landing"[\s\S]*?data-theme=\{activeTheme\}/
    );
    expect(appTsx).not.toMatch(/App--full"[\s\S]*?<LandingPage/);
  });

  it('Landing CSS uses semantic canvas/surface/text/accent tokens', () => {
    expect(landingCss).toMatch(/var\(--sc-canvas-from\)/);
    expect(landingCss).toMatch(/var\(--sc-canvas-to\)/);
    expect(landingCss).toMatch(/var\(--sc-surface-modal\)/);
    expect(landingCss).toMatch(/var\(--sc-surface-border\)/);
    expect(landingCss).toMatch(/var\(--sc-text-title\)/);
    expect(landingCss).toMatch(/var\(--sc-text-muted\)/);
    expect(landingCss).toMatch(/var\(--sc-accent\)/);
    expect(landingCss).toMatch(/var\(--sc-accent-rgb\)/);
  });

  it('Landing no longer uses the old purple/navy fixed palette system', () => {
    expect(landingCss).not.toMatch(/#1b2143|#29235c|#4b2b73|#6c5ce7/i);
    expect(landingCss).not.toMatch(/#d4a574/);
    expect(landingCss).not.toMatch(/#e2e6ff/);
    expect(landingCss).not.toMatch(/rgba\(10,\s*10,\s*30/);
  });

  it('BottomNav uses semantic surface/active tokens (not fixed dark-slate)', () => {
    expect(bottomNavCss).toMatch(/var\(--sc-surface-modal\)/);
    expect(bottomNavCss).toMatch(/var\(--sc-surface-border\)/);
    expect(bottomNavCss).toMatch(/var\(--sc-text-muted\)/);
    expect(bottomNavCss).toMatch(/rgba\(var\(--sc-accent-rgb\)/);
    expect(bottomNavCss).not.toMatch(/rgba\(20,\s*28,\s*40/);
    expect(bottomNavCss).not.toMatch(/sueca-rgb-primary/);
  });

  it('shell panels/hubs and dashboard consume --sc-* directly', () => {
    expect(shellScreensCss).toMatch(/\.shell-panel[\s\S]*var\(--sc-surface\)/);
    expect(shellScreensCss).toMatch(/\.shell-hub-item[\s\S]*var\(--sc-surface\)/);
    expect(dashboardCss).toMatch(/\.dashboard-game-row[\s\S]*var\(--sc-surface\)/);
    expect(dashboardCss).toMatch(/rgba\(var\(--sc-accent-rgb\)/);
    expect(themesCss).toMatch(/\.themes-card--active[\s\S]*--sc-accent-rgb/);
  });

  it('does not introduce per-theme component selectors in shell CSS', () => {
    for (const css of [shellCss, shellScreensCss, bottomNavCss, landingCss, dashboardCss]) {
      expect(css).not.toMatch(/\[data-theme="/);
    }
  });
});
