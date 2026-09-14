/**
 * Central card deck / back registry.
 * Faces (`deckId`) and backs (`backId`) are independent so themes can
 * swap either without coupling. Default faces remain `casino`; `cardmeister`
 * is available via registry / `?deck=` without theme assignment.
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

/** Available face decks — Casino default; CardMeister optional second deck. */
export const CARD_DECKS = {
  casino: {
    id: 'casino',
    facePath: '/assets/cards3',
    label: 'Casino Normal'
  },
  cardmeister: {
    id: 'cardmeister',
    facePath: '/assets/cards-cardmeister',
    label: 'Classic Vector'
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

/**
 * Default / fallback face deck when theme has no valid deckId.
 * Themes do not select `cardmeister` yet — default remains casino.
 */
export const DEFAULT_CARD_DECK_ID: CardDeckId = 'casino';

/** @deprecated Prefer DEFAULT_CARD_DECK_ID — alias kept for existing call sites. */
export const ACTIVE_CARD_DECK_ID: CardDeckId = DEFAULT_CARD_DECK_ID;

/** Default / fallback back when theme has no valid backId. */
export const DEFAULT_CARD_BACK_ID: CardBackId = 'suecao-navy';

/** @deprecated Prefer DEFAULT_CARD_BACK_ID — kept for call-site clarity. */
export const ACTIVE_CARD_BACK_ID: CardBackId = DEFAULT_CARD_BACK_ID;

export function isCardDeckId(id: string | null | undefined): id is CardDeckId {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(CARD_DECKS, id);
}

export function resolveActiveDeck(
  deckId: CardDeckId = DEFAULT_CARD_DECK_ID
): CardDeckDefinition {
  return CARD_DECKS[deckId];
}

export function resolveCardDeckFromId(
  raw?: string | null
): CardDeckDefinition {
  if (isCardDeckId(raw)) return CARD_DECKS[raw];
  return CARD_DECKS[DEFAULT_CARD_DECK_ID];
}

/**
 * Resolve face deck for a theme id.
 * Missing theme / missing cardVisuals / invalid deckId → casino.
 * Never throws.
 */
export function resolveCardDeckForTheme(
  themeId?: string | null
): CardDeckDefinition {
  try {
    if (!themeId) return CARD_DECKS[DEFAULT_CARD_DECK_ID];
    const config = THEME_CARD_VISUALS[themeId];
    return resolveCardDeckFromId(config?.cardVisuals?.deckId);
  } catch {
    return CARD_DECKS[DEFAULT_CARD_DECK_ID];
  }
}

/**
 * Dev/query override mirroring `?renderer=` — `?deck=cardmeister`.
 * Invalid / absent → null (use theme / default).
 */
export function parseDeckOverrideFromQuery(
  search?: string | null
): CardDeckId | null {
  if (search == null || search === '') return null;
  try {
    const raw = search.startsWith('?') ? search.slice(1) : search;
    const param = new URLSearchParams(raw).get('deck');
    if (!param) return null;
    return isCardDeckId(param) ? param : null;
  } catch {
    return null;
  }
}

/**
 * Effective face deck: query `?deck=` → theme deckId → casino.
 * Pure when `search` is passed (tests); otherwise reads `window.location.search`.
 */
export function resolveEffectiveDeck(
  themeId?: string | null,
  search?: string | null
): CardDeckDefinition {
  const resolvedSearch =
    search !== undefined
      ? search
      : typeof window !== 'undefined'
        ? window.location.search
        : null;
  const fromQuery = parseDeckOverrideFromQuery(resolvedSearch);
  if (fromQuery) return CARD_DECKS[fromQuery];
  return resolveCardDeckForTheme(themeId);
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
 * Never throws. Independent of deckId.
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
