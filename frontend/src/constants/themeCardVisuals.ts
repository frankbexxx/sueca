/**
 * Optional per-theme card visuals.
 * `deckId` and `backId` are independent decisions.
 * - deckId omitted / invalid → global default `casino` (cards3)
 * - backId omitted / invalid → `suecao-navy`
 *
 * Curation (THEME-CARD-BACK-02): contraste com felt > coerência > variedade.
 */

export type ThemeCardVisuals = {
  /**
   * Face deck id from `CARD_DECKS`.
   * Optional — omit to use the global default (`casino`).
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
 * deckId is omitted on purpose: absence = casino (no noise until alternate decks ship).
 * Pilot re-eval: classic/midnight kept; thebes↔thule swapped for felt contrast
 * (cyan on warm sand; red on arctic blue).
 */
export const THEME_CARD_VISUALS: Readonly<Record<string, ThemeCardVisualConfig>> = {
  // Base
  classic: { cardVisuals: { backId: 'suecao-navy' } },
  forest: { cardVisuals: { backId: 'casino-05' } },
  midnight: { cardVisuals: { backId: 'casino-06' } },

  // Polar & Boreal
  /** ice blue felt — red pops harder than cyan */
  thule: { cardVisuals: { backId: 'casino-05' } },
  hyperborea: { cardVisuals: { backId: 'casino-08' } },
  'skara-brae': { cardVisuals: { backId: 'casino-08' } },
  avalon: { cardVisuals: { backId: 'casino-07' } },

  // Mediterrâneo & Mar Antigo
  knossos: { cardVisuals: { backId: 'casino-05' } },
  /** warm gold felt — cyan over red for contrast */
  thebes: { cardVisuals: { backId: 'casino-07' } },
  cartago: { cardVisuals: { backId: 'casino-07' } },
  atlantida: { cardVisuals: { backId: 'casino-05' } },

  // Próximo Oriente / Pérsia
  babylon: { cardVisuals: { backId: 'casino-05' } },
  ur: { cardVisuals: { backId: 'casino-08' } },
  petra: { cardVisuals: { backId: 'casino-07' } },
  persepolis: { cardVisuals: { backId: 'casino-08' } },

  // África
  axum: { cardVisuals: { backId: 'casino-07' } },
  meroe: { cardVisuals: { backId: 'casino-05' } },
  'great-zimbabwe': { cardVisuals: { backId: 'suecao-navy' } },

  // Ásia
  xanadu: { cardVisuals: { backId: 'suecao-navy' } },
  shambhala: { cardVisuals: { backId: 'casino-07' } },
  'mohenjo-daro': { cardVisuals: { backId: 'casino-08' } },
  yamatai: { cardVisuals: { backId: 'casino-06' } },
  angkor: { cardVisuals: { backId: 'suecao-navy' } },

  // Américas
  tikal: { cardVisuals: { backId: 'casino-05' } },
  teotihuacan: { cardVisuals: { backId: 'casino-06' } },
  tiwanaku: { cardVisuals: { backId: 'casino-07' } },
  caral: { cardVisuals: { backId: 'suecao-navy' } },
  'el-dorado': { cardVisuals: { backId: 'casino-05' } },

  // Pacífico
  rapanui: { cardVisuals: { backId: 'casino-08' } },
  nanmadol: { cardVisuals: { backId: 'casino-06' } }
};
