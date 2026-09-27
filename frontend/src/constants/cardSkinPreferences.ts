/**
 * User card skin preferences — independent front (faces) and back.
 * `'theme'` follows themeCardVisuals; explicit ids override without coupling.
 * Local-first only (not added to syncable prefs in this slice).
 */

import { STORAGE_KEYS } from './gameConstants';
import {
  CARD_BACKS,
  CARD_DECKS,
  type CardBackId,
  type CardDeckId,
  isCardBackId,
  isCardDeckId
} from './cardDeckRegistry';

export type CardFrontPreference = CardDeckId | 'theme';
export type CardBackPreference = CardBackId | 'theme';

export type CardSkinPreferences = {
  cardFrontId: CardFrontPreference;
  cardBackId: CardBackPreference;
};

/** Backs offered in Personalizar (exclude reserved IAP). */
export const SELECTABLE_CARD_BACK_IDS: readonly CardBackId[] = (
  Object.keys(CARD_BACKS) as CardBackId[]
).filter((id) => id !== 'hazmat-red');

export const SELECTABLE_CARD_FRONT_IDS: readonly CardDeckId[] = Object.keys(
  CARD_DECKS
) as CardDeckId[];

export function loadCardSkinPreferences(): CardSkinPreferences {
  const frontRaw = localStorage.getItem(STORAGE_KEYS.CARD_FRONT);
  const backRaw = localStorage.getItem(STORAGE_KEYS.CARD_BACK);
  return {
    cardFrontId:
      frontRaw === 'theme' || isCardDeckId(frontRaw) ? frontRaw : 'theme',
    cardBackId:
      backRaw === 'theme' || isCardBackId(backRaw) ? backRaw : 'theme'
  };
}

export function saveCardSkinPreferences(
  patch: Partial<CardSkinPreferences>
): void {
  if (patch.cardFrontId !== undefined) {
    localStorage.setItem(STORAGE_KEYS.CARD_FRONT, patch.cardFrontId);
  }
  if (patch.cardBackId !== undefined) {
    localStorage.setItem(STORAGE_KEYS.CARD_BACK, patch.cardBackId);
  }
}

/** Clear override → follow theme again. */
export function clearCardFrontOverride(): void {
  localStorage.setItem(STORAGE_KEYS.CARD_FRONT, 'theme');
}

export function clearCardBackOverride(): void {
  localStorage.setItem(STORAGE_KEYS.CARD_BACK, 'theme');
}
