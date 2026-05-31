import { useEffect } from 'react';
import { getCustomTheme } from '../services/customThemeStorage';
import { CustomThemeColors } from '../types/theme';

const STYLE_ID = 'suecao-custom-theme-css';

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function clamp(v: number): number {
  return Math.min(255, Math.max(0, Math.round(v)));
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = 1 - amount;
  return `#${[r, g, b].map((c) => clamp(c * f).toString(16).padStart(2, '0')).join('')}`;
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `#${[r, g, b].map((c) => clamp(c + (255 - c) * amount).toString(16).padStart(2, '0')).join('')}`;
}

function generateCSS(themeId: string, colors: CustomThemeColors): string {
  const { bgTop, bgBottom, accent, textTitle, felt } = colors;
  const sel = `.app-shell[data-theme="${themeId}"]`;
  return `
${sel} {
  background: linear-gradient(160deg, ${bgTop} 0%, ${bgBottom} 100%);
  --theme-panel-modal: ${darken(bgTop, 0.2)};
}
${sel} .shell-panel {
  background: ${hexToRgba(accent, 0.06)};
  border-color: ${hexToRgba(accent, 0.15)};
}
${sel} .shell-section-title,
${sel} .screen-title,
${sel} .dashboard-section-title,
${sel} .shell-hub-item {
  color: ${textTitle};
}
${sel} .bottom-nav-item.active {
  background: ${hexToRgba(accent, 0.2)};
  color: ${textTitle};
}
${sel} .sueca-btn--primary {
  background: ${hexToRgba(accent, 0.45)};
  border-color: ${hexToRgba(accent, 0.65)};
}
${sel} .sueca-btn--primary:hover:not(:disabled) {
  background: ${hexToRgba(accent, 0.58)};
  border-color: ${hexToRgba(accent, 0.8)};
}
${sel} .themes-card--active {
  border-color: ${hexToRgba(accent, 0.55)};
  background: ${hexToRgba(accent, 0.12)};
}
${sel} .dashboard-game-row--active {
  border-color: ${hexToRgba(accent, 0.55)};
  background: ${hexToRgba(accent, 0.12)};
}
${sel} .game-board {
  --theme-table-felt: ${felt};
  --theme-table-felt-dark: ${darken(felt, 0.3)};
  --theme-table-rail: ${lighten(felt, 0.2)};
  --theme-bg-game: ${darken(felt, 0.1)};
  --theme-bg-game-alt: ${darken(felt, 0.05)};
}
`.trim();
}

function getOrCreateStyleTag(): HTMLStyleElement {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  return el;
}

export function useCustomThemeCSS(activeTheme: string): void {
  useEffect(() => {
    const style = getOrCreateStyleTag();
    if (!activeTheme.startsWith('custom_')) {
      style.textContent = '';
      return;
    }
    const data = getCustomTheme(activeTheme);
    if (!data) {
      style.textContent = '';
      return;
    }
    style.textContent = generateCSS(activeTheme, data.colors);
  }, [activeTheme]);
}

export { generateCSS };
