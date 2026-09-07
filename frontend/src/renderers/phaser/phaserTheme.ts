/**
 * Minimal Phaser table theme tokens from the active CSS theme (or defaults).
 * No full theme port — felt / text / accent / active only.
 */

export interface PhaserThemeView {
  felt: number;
  feltDark: number;
  text: string;
  textMuted: string;
  active: string;
  accent: string;
  seatBg: string;
  illegalAlpha: number;
  inactiveAlpha: number;
}

const DEFAULT_THEME: PhaserThemeView = {
  felt: 0x2f6d2f,
  feltDark: 0x1f4f1f,
  text: '#f5f5f0',
  textMuted: '#c8c8c0',
  active: '#ffd700',
  accent: '#6c5ce7',
  seatBg: '#00000099',
  /** Kept for theme parity; scene uses `phaserHandVisual` as source of truth. */
  illegalAlpha: 0.9,
  inactiveAlpha: 0.94
};

function parseCssColorToInt(raw: string, fallback: number): number {
  const s = (raw || '').trim();
  if (!s) return fallback;
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      return parseInt(hex.split('').map((c) => c + c).join(''), 16);
    }
    if (hex.length >= 6) return parseInt(hex.slice(0, 6), 16);
  }
  const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) {
    return (Number(m[1]) << 16) + (Number(m[2]) << 8) + Number(m[3]);
  }
  return fallback;
}

/** Read tokens from `.app-shell` / `:root` when available. */
export function resolvePhaserThemeFromDom(
  root: Element | null = typeof document !== 'undefined'
    ? document.querySelector('.app-shell') || document.documentElement
    : null
): PhaserThemeView {
  if (!root || typeof window === 'undefined' || !window.getComputedStyle) {
    return { ...DEFAULT_THEME };
  }
  const cs = window.getComputedStyle(root as Element);
  const felt = parseCssColorToInt(
    cs.getPropertyValue('--theme-table-felt'),
    DEFAULT_THEME.felt
  );
  const feltDark = parseCssColorToInt(
    cs.getPropertyValue('--theme-table-felt-dark'),
    DEFAULT_THEME.feltDark
  );
  const text =
    cs.getPropertyValue('--sueca-color-text').trim() ||
    cs.getPropertyValue('--color-text').trim() ||
    DEFAULT_THEME.text;
  const active =
    cs.getPropertyValue('--theme-turn-indicator').trim() || DEFAULT_THEME.active;
  const accent =
    cs.getPropertyValue('--sueca-color-primary').trim() ||
    cs.getPropertyValue('--color-primary').trim() ||
    DEFAULT_THEME.accent;

  return {
    felt,
    feltDark,
    text,
    textMuted: DEFAULT_THEME.textMuted,
    active,
    accent,
    seatBg: DEFAULT_THEME.seatBg,
    illegalAlpha: DEFAULT_THEME.illegalAlpha,
    inactiveAlpha: DEFAULT_THEME.inactiveAlpha
  };
}

export function themesEqual(a: PhaserThemeView, b: PhaserThemeView): boolean {
  return (
    a.felt === b.felt &&
    a.feltDark === b.feltDark &&
    a.text === b.text &&
    a.active === b.active &&
    a.accent === b.accent
  );
}

export { DEFAULT_THEME };
