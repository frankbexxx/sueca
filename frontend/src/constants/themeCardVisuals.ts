/**
 * Optional per-theme card visuals.
 * `deckId` and `backId` are independent decisions.
 * - deckId omitted / invalid → global default (`cardmeister`)
 * - backId omitted / invalid → `suecao-navy`
 *
 * REL-DECK-01B: Casino backs remapped to Sylly (colour intent preserved).
 */

export type ThemeCardVisuals = {
  /**
   * Face deck id from `CARD_DECKS`.
   * Optional — omit to use the global default.
   */
  deckId?: string;
  /** Card back id from `CARD_BACKS`. Invalid/missing → suecao-navy. */
  backId?: string;
};

export type ThemeCardVisualConfig = {
  cardVisuals?: ThemeCardVisuals;
};

/**
 * Explicit backId for every built-in theme.
 * deckId omitted: absence = default face deck.
 *
 * Legacy Casino → Sylly (REL-DECK-01B):
 * casino-05 (red) → sylly-05 · casino-06 (dark) → sylly-03
 * casino-07 (cyan/cool) → sylly-01 · casino-08 (gradient) → sylly-02
 */
export const THEME_CARD_VISUALS: Readonly<Record<string, ThemeCardVisualConfig>> = {
  // Base
  classic: { cardVisuals: { backId: 'suecao-navy' } },
  forest: { cardVisuals: { backId: 'sylly-05' } },
  midnight: { cardVisuals: { backId: 'sylly-03' } },

  // Polar & Boreal
  thule: { cardVisuals: { backId: 'sylly-05' } },
  hyperborea: { cardVisuals: { backId: 'sylly-02' } },
  'skara-brae': { cardVisuals: { backId: 'sylly-02' } },
  avalon: { cardVisuals: { backId: 'sylly-01' } },

  // Mediterrâneo & Mar Antigo
  knossos: { cardVisuals: { backId: 'sylly-05' } },
  thebes: { cardVisuals: { backId: 'sylly-01' } },
  cartago: { cardVisuals: { backId: 'sylly-01' } },
  atlantida: { cardVisuals: { backId: 'sylly-05' } },

  // Próximo Oriente / Pérsia
  babylon: { cardVisuals: { backId: 'sylly-05' } },
  ur: { cardVisuals: { backId: 'sylly-02' } },
  petra: { cardVisuals: { backId: 'sylly-01' } },
  persepolis: { cardVisuals: { backId: 'sylly-02' } },

  // África
  axum: { cardVisuals: { backId: 'sylly-01' } },
  meroe: { cardVisuals: { backId: 'sylly-05' } },
  'great-zimbabwe': { cardVisuals: { backId: 'suecao-navy' } },

  // Ásia
  xanadu: { cardVisuals: { backId: 'suecao-navy' } },
  shambhala: { cardVisuals: { backId: 'sylly-01' } },
  'mohenjo-daro': { cardVisuals: { backId: 'sylly-02' } },
  yamatai: { cardVisuals: { backId: 'sylly-03' } },
  angkor: { cardVisuals: { backId: 'suecao-navy' } },

  // Américas
  tikal: { cardVisuals: { backId: 'sylly-05' } },
  teotihuacan: { cardVisuals: { backId: 'sylly-03' } },
  tiwanaku: { cardVisuals: { backId: 'sylly-01' } },
  caral: { cardVisuals: { backId: 'suecao-navy' } },
  'el-dorado': { cardVisuals: { backId: 'sylly-05' } },

  // Pacífico
  rapanui: { cardVisuals: { backId: 'sylly-02' } },
  nanmadol: { cardVisuals: { backId: 'sylly-03' } }
};
