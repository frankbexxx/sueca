/**
 * User card skin preferences — independent front (faces) and back.
 * `'theme'` follows themeCardVisuals; explicit ids override without coupling.
 * Local-first only (not added to syncable prefs in this slice).
 * REL-DECK-01B: migrates legacy Casino / hazmat ids on load and persists.
 */

import { STORAGE_KEYS } from './gameConstants';
import {
  CARD_BACKS,
  CARD_DECKS,
  DEFAULT_CARD_BACK_ID,
  DEFAULT_CARD_DECK_ID,
  type CardBackId,
  type CardDeckId,
  isCardBackId,
  isCardDeckId,
  migrateLegacyCardBackId,
  migrateLegacyCardFrontId
} from './cardDeckRegistry';

export type CardFrontPreference = CardDeckId | 'theme';
export type CardBackPreference = CardBackId | 'theme';

export type CardSkinPreferences = {
  cardFrontId: CardFrontPreference;
  cardBackId: CardBackPreference;
};

/** Backs offered in Personalizar. */
export const SELECTABLE_CARD_BACK_IDS: readonly CardBackId[] = Object.keys(
  CARD_BACKS
) as CardBackId[];

export const SELECTABLE_CARD_FRONT_IDS: readonly CardDeckId[] = Object.keys(
  CARD_DECKS
) as CardDeckId[];

function normalizeFrontPref(raw: string | null): CardFrontPreference {
  const migrated = migrateLegacyCardFrontId(raw);
  if (migrated === 'theme') return 'theme';
  if (isCardDeckId(migrated)) return migrated;
  return 'theme';
}

function normalizeBackPref(raw: string | null): CardBackPreference {
  const migrated = migrateLegacyCardBackId(raw);
  if (migrated === 'theme') return 'theme';
  if (isCardBackId(migrated)) return migrated;
  return 'theme';
}

/**
 * Load prefs; rewrite storage when legacy Casino/hazmat ids are found.
 */
export function loadCardSkinPreferences(): CardSkinPreferences {
  const frontRaw = localStorage.getItem(STORAGE_KEYS.CARD_FRONT);
  const backRaw = localStorage.getItem(STORAGE_KEYS.CARD_BACK);

  const cardFrontId = normalizeFrontPref(frontRaw);
  const cardBackId = normalizeBackPref(backRaw);

  // Persist migrated / normalized ids (legacy Casino, hazmat, unknown → safe).
  if (frontRaw != null && frontRaw !== cardFrontId) {
    localStorage.setItem(STORAGE_KEYS.CARD_FRONT, cardFrontId);
  }
  if (backRaw != null && backRaw !== cardBackId) {
    localStorage.setItem(STORAGE_KEYS.CARD_BACK, cardBackId);
  }

  return { cardFrontId, cardBackId };
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

/** @internal test helper — default deck after Casino removal */
export const MIGRATED_DEFAULT_FRONT: CardDeckId = DEFAULT_CARD_DECK_ID;
/** @internal test helper */
export const MIGRATED_DEFAULT_BACK: CardBackId = DEFAULT_CARD_BACK_ID;
