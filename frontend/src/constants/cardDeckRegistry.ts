/**
 * Central card deck / back registry.
 * Faces and backs are independent so themes can swap backs
 * without changing the global face deck (`casino`).
 */

import { THEME_CARD_VISUALS } from './themeCardVisuals';

export type CardDeckDefinition = {
  id: string;
  /** Public directory for `{Rank}_of_{Suit}.png` faces (no trailing slash). */
  facePath: string;
  label: string;
};

export type CardBackDefinition = {
  id: string;
  /**
   * Public path to the back asset **without** file extension.
   * Extension comes from VITE_CARD_EXT / cardAssets.
   */
  assetPathBase: string;
  label: string;
};

/** Available face decks — runtime ships Casino only (`cards3`). */
export const CARD_DECKS = {
  casino: {
    id: 'casino',
    facePath: '/assets/cards3',
    label: 'Casino Normal'
  }
} as const satisfies Record<string, CardDeckDefinition>;

export type CardDeckId = keyof typeof CARD_DECKS;

/** Available backs — independent of face deck. */
export const CARD_BACKS = {
  'suecao-navy': {
    id: 'suecao-navy',
    assetPathBase: '/assets/cards3/card_back',
    label: 'Suecão navy'
  },
  'casino-05': {
    id: 'casino-05',
    assetPathBase: '/assets/cards3/card_back_casino_05',
    label: 'Casino red diamond'
  },
  'casino-06': {
    id: 'casino-06',
    assetPathBase: '/assets/cards3/card_back_casino_06',
    label: 'Casino black star'
  },
  'casino-07': {
    id: 'casino-07',
    assetPathBase: '/assets/cards3/card_back_casino_07',
    label: 'Casino cyan wave'
  },
  'casino-08': {
    id: 'casino-08',
    assetPathBase: '/assets/cards3/card_back_casino_08',
    label: 'Casino cube gradient'
  },
  /** Reserved / future IAP */
  'hazmat-red': {
    id: 'hazmat-red',
    assetPathBase: '/assets/cards3/card_back_red',
    label: 'Hazmat red (reserved)'
  }
} as const satisfies Record<string, CardBackDefinition>;

export type CardBackId = keyof typeof CARD_BACKS;

/** Global face deck — fixed for this phase. */
export const ACTIVE_CARD_DECK_ID: CardDeckId = 'casino';

/** Default / fallback back when theme has no valid backId. */
export const DEFAULT_CARD_BACK_ID: CardBackId = 'suecao-navy';

/** @deprecated Prefer DEFAULT_CARD_BACK_ID — kept for call-site clarity. */
export const ACTIVE_CARD_BACK_ID: CardBackId = DEFAULT_CARD_BACK_ID;

export function resolveActiveDeck(
  deckId: CardDeckId = ACTIVE_CARD_DECK_ID
): CardDeckDefinition {
  return CARD_DECKS[deckId];
}

export function isCardBackId(id: string | null | undefined): id is CardBackId {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(CARD_BACKS, id);
}

export function resolveActiveBack(
  backId: CardBackId = DEFAULT_CARD_BACK_ID
): CardBackDefinition {
  return CARD_BACKS[backId];
}

export function resolveCardBackFromId(
  raw?: string | null
): CardBackDefinition {
  if (isCardBackId(raw)) return CARD_BACKS[raw];
  return CARD_BACKS[DEFAULT_CARD_BACK_ID];
}

/**
 * Resolve card back for a theme id.
 * Missing theme / missing cardVisuals / invalid backId → suecao-navy.
 * Never throws.
 */
export function resolveCardBackForTheme(
  themeId?: string | null
): CardBackDefinition {
  try {
    if (!themeId) return CARD_BACKS[DEFAULT_CARD_BACK_ID];
    const config = THEME_CARD_VISUALS[themeId];
    return resolveCardBackFromId(config?.cardVisuals?.backId);
  } catch {
    return CARD_BACKS[DEFAULT_CARD_BACK_ID];
  }
}

/** Active CSS theme id from shell `data-theme`, else classic. */
export function readActiveThemeIdFromDom(
  root: Element | null = typeof document !== 'undefined'
    ? document.querySelector('.app-shell') || document.documentElement
    : null
): string {
  if (!root) return 'classic';
  const id = root.getAttribute('data-theme');
  return id && id.trim() ? id.trim() : 'classic';
}
