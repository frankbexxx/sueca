/**
 * Optional per-theme card visuals.
 * Faces stay on the global `casino` deck; only backs are theme-selectable here.
 */

export type ThemeCardVisuals = {
  /** Card back id from `CARD_BACKS`. Invalid/missing → suecao-navy. */
  backId?: string;
};

export type ThemeCardVisualConfig = {
  cardVisuals?: ThemeCardVisuals;
};

/**
 * Pilot mapping only — most themes omit this and fall back to suecao-navy.
 * Chosen for felt contrast: warm / dark / cyan vs classic navy.
 */
export const THEME_CARD_VISUALS: Readonly<Record<string, ThemeCardVisualConfig>> = {
  classic: { cardVisuals: { backId: 'suecao-navy' } },
  /** Warm / clear — red diamond Casino back */
  thebes: { cardVisuals: { backId: 'casino-05' } },
  /** Dark — black/white star Casino back */
  midnight: { cardVisuals: { backId: 'casino-06' } },
  /** Blue / cyan — wave Casino back */
  thule: { cardVisuals: { backId: 'casino-07' } }
};
