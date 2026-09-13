/**
 * Central card deck / back registry.
 * Faces and backs are independent so future themes can swap backs
 * without changing the global face deck.
 *
 * Phase 1: fixed active ids (no UI theme picker yet).
 */

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

/** Available face decks (product + catalogued legacy). */
export const CARD_DECKS = {
  casino: {
    id: 'casino',
    facePath: '/assets/cards3',
    label: 'Casino Normal'
  },
  /** Legacy Hazmat faces — kept for reference; not active. */
  hazmat: {
    id: 'hazmat',
    facePath: '/assets/cards2',
    label: 'Hazmat (legacy)'
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
  /** Reserved / future IAP */
  'hazmat-red': {
    id: 'hazmat-red',
    assetPathBase: '/assets/cards3/card_back_red',
    label: 'Hazmat red (reserved)'
  }
} as const satisfies Record<string, CardBackDefinition>;

export type CardBackId = keyof typeof CARD_BACKS;

/** Product defaults — no runtime UI selection in this phase. */
export const ACTIVE_CARD_DECK_ID: CardDeckId = 'casino';
export const ACTIVE_CARD_BACK_ID: CardBackId = 'suecao-navy';

export function resolveActiveDeck(
  deckId: CardDeckId = ACTIVE_CARD_DECK_ID
): CardDeckDefinition {
  return CARD_DECKS[deckId];
}

export function resolveActiveBack(
  backId: CardBackId = ACTIVE_CARD_BACK_ID
): CardBackDefinition {
  return CARD_BACKS[backId];
}
