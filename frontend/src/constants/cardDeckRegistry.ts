/**
 * Central card deck / back registry.
 * Faces (`deckId`) and backs (`backId`) are independent.
 * Shipping decks (REL-DECK-01C Batch 2): cardmeister + pd-ornate + woodcut + Saul Spatz ×3.
 */

import { THEME_CARD_VISUALS } from './themeCardVisuals';
import { STORAGE_KEYS } from './gameConstants';

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

/** Shipping face decks — Casino removed. Default remains cardmeister. */
export const CARD_DECKS = {
  cardmeister: {
    id: 'cardmeister',
    facePath: '/assets/cards-cardmeister',
    label: 'CardMeister'
  },
  'pd-ornate': {
    id: 'pd-ornate',
    facePath: '/assets/cards/pd-ornate',
    label: 'Ornate'
  },
  woodcut: {
    id: 'woodcut',
    facePath: '/assets/cards/woodcut',
    label: 'Woodcut'
  },
  'jumbo-2': {
    id: 'jumbo-2',
    facePath: '/assets/cards/jumbo-2',
    label: 'Jumbo'
  },
  fourcolour: {
    id: 'fourcolour',
    facePath: '/assets/cards/fourcolour',
    label: '4-Colour'
  },
  accessible: {
    id: 'accessible',
    facePath: '/assets/cards/accessible',
    label: 'Accessible'
  }
} as const satisfies Record<string, CardDeckDefinition>;

export type CardDeckId = keyof typeof CARD_DECKS;

/** Shipping backs — Casino / hazmat removed. Batch 2 expands selectable set. */
export const CARD_BACKS = {
  'suecao-navy': {
    id: 'suecao-navy',
    assetPathBase: '/assets/card-backs/suecao-navy',
    label: 'Suecão navy'
  },
  'sylly-01': {
    id: 'sylly-01',
    assetPathBase: '/assets/card-backs/sylly-01',
    label: 'Sylly blue A'
  },
  'sylly-02': {
    id: 'sylly-02',
    assetPathBase: '/assets/card-backs/sylly-02',
    label: 'Sylly blue B'
  },
  'sylly-03': {
    id: 'sylly-03',
    assetPathBase: '/assets/card-backs/sylly-03',
    label: 'Sylly grey A'
  },
  'sylly-04': {
    id: 'sylly-04',
    assetPathBase: '/assets/card-backs/sylly-04',
    label: 'Sylly grey B'
  },
  'sylly-05': {
    id: 'sylly-05',
    assetPathBase: '/assets/card-backs/sylly-05',
    label: 'Sylly red A'
  },
  'sylly-06': {
    id: 'sylly-06',
    assetPathBase: '/assets/card-backs/sylly-06',
    label: 'Sylly red B'
  },
  'woodcut-01': {
    id: 'woodcut-01',
    assetPathBase: '/assets/card-backs/woodcut-01',
    label: 'Woodcut'
  },
  'saul-blue-01': {
    id: 'saul-blue-01',
    assetPathBase: '/assets/card-backs/saul-blue-01',
    label: 'Saul blue'
  },
  'saul-red-01': {
    id: 'saul-red-01',
    assetPathBase: '/assets/card-backs/saul-red-01',
    label: 'Saul red'
  },
  'ornate-blue-01': {
    id: 'ornate-blue-01',
    assetPathBase: '/assets/card-backs/ornate-blue-01',
    label: 'Ornate blue'
  },
  'ornate-red-01': {
    id: 'ornate-red-01',
    assetPathBase: '/assets/card-backs/ornate-red-01',
    label: 'Ornate red'
  },
  'ornate-blue-02': {
    id: 'ornate-blue-02',
    assetPathBase: '/assets/card-backs/ornate-blue-02',
    label: 'Ornate blue B'
  },
  'ornate-red-02': {
    id: 'ornate-red-02',
    assetPathBase: '/assets/card-backs/ornate-red-02',
    label: 'Ornate red B'
  }
} as const satisfies Record<string, CardBackDefinition>;

export type CardBackId = keyof typeof CARD_BACKS;

/**
 * Default face deck. CardMeister kept as least-disruptive default
 * (already shipped + covered by existing tests).
 */
export const DEFAULT_CARD_DECK_ID: CardDeckId = 'cardmeister';

/** @deprecated Prefer DEFAULT_CARD_DECK_ID — alias kept for existing call sites. */
export const ACTIVE_CARD_DECK_ID: CardDeckId = DEFAULT_CARD_DECK_ID;

/** Default / fallback back when theme has no valid backId. */
export const DEFAULT_CARD_BACK_ID: CardBackId = 'suecao-navy';

/** @deprecated Prefer DEFAULT_CARD_BACK_ID — kept for call-site clarity. */
export const ACTIVE_CARD_BACK_ID: CardBackId = DEFAULT_CARD_BACK_ID;

/** Legacy Casino front → default front (Casino removed from shipping). */
export const LEGACY_CARD_FRONT_MIGRATION: Readonly<Record<string, CardDeckId>> = {
  casino: DEFAULT_CARD_DECK_ID
};

/**
 * Legacy Casino backs → Sylly replacements (deterministic colour intent).
 * red diamond → red A; black star → grey A; cyan wave → blue A; cube → blue B
 */
export const LEGACY_CARD_BACK_MIGRATION: Readonly<Record<string, CardBackId>> = {
  'casino-05': 'sylly-05',
  'casino-06': 'sylly-03',
  'casino-07': 'sylly-01',
  'casino-08': 'sylly-02',
  'hazmat-red': DEFAULT_CARD_BACK_ID
};

export function migrateLegacyCardFrontId(
  raw: string | null | undefined
): string | null | undefined {
  if (raw == null) return raw;
  return LEGACY_CARD_FRONT_MIGRATION[raw] ?? raw;
}

export function migrateLegacyCardBackId(
  raw: string | null | undefined
): string | null | undefined {
  if (raw == null) return raw;
  return LEGACY_CARD_BACK_MIGRATION[raw] ?? raw;
}

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
  const migrated = migrateLegacyCardFrontId(raw);
  if (isCardDeckId(migrated)) return CARD_DECKS[migrated];
  return CARD_DECKS[DEFAULT_CARD_DECK_ID];
}

/**
 * Resolve face deck for a theme id.
 * Missing theme / missing cardVisuals / invalid deckId → default.
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
 * Dev/query override mirroring `?renderer=` — `?deck=cardmeister` / `pd-ornate`.
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
    const migrated = migrateLegacyCardFrontId(param);
    return isCardDeckId(migrated) ? migrated : null;
  } catch {
    return null;
  }
}

/**
 * Effective face deck: query `?deck=` → user front override → theme deckId → default.
 * Pure when `search` / `userFront` are passed (tests).
 */
export function resolveEffectiveDeck(
  themeId?: string | null,
  search?: string | null,
  userFront?: string | null
): CardDeckDefinition {
  const resolvedSearch =
    search !== undefined
      ? search
      : typeof window !== 'undefined'
        ? window.location.search
        : null;
  const fromQuery = parseDeckOverrideFromQuery(resolvedSearch);
  if (fromQuery) return CARD_DECKS[fromQuery];

  const frontPref =
    userFront !== undefined
      ? userFront
      : typeof localStorage !== 'undefined'
        ? localStorage.getItem(STORAGE_KEYS.CARD_FRONT)
        : null;
  const migratedFront = migrateLegacyCardFrontId(frontPref);
  if (migratedFront && migratedFront !== 'theme' && isCardDeckId(migratedFront)) {
    return CARD_DECKS[migratedFront];
  }
  return resolveCardDeckForTheme(themeId);
}

/**
 * Effective card back: user back override → theme backId → suecao-navy.
 * Independent of face deck. Pass `userBack` to avoid localStorage in tests.
 */
export function resolveEffectiveBack(
  themeId?: string | null,
  userBack?: string | null
): CardBackDefinition {
  const backPref =
    userBack !== undefined
      ? userBack
      : typeof localStorage !== 'undefined'
        ? localStorage.getItem(STORAGE_KEYS.CARD_BACK)
        : null;
  const migratedBack = migrateLegacyCardBackId(backPref);
  if (migratedBack && migratedBack !== 'theme' && isCardBackId(migratedBack)) {
    return CARD_BACKS[migratedBack];
  }
  return resolveCardBackForTheme(themeId);
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
  const migrated = migrateLegacyCardBackId(raw);
  if (isCardBackId(migrated)) return CARD_BACKS[migrated];
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
