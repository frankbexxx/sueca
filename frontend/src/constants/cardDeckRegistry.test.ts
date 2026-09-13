import { describe, expect, it } from 'vitest';
import {
  ACTIVE_CARD_DECK_ID,
  CARD_BACKS,
  CARD_DECKS,
  DEFAULT_CARD_BACK_ID,
  DEFAULT_CARD_DECK_ID,
  isCardBackId,
  isCardDeckId,
  resolveActiveDeck,
  resolveCardBackForTheme,
  resolveCardBackFromId,
  resolveCardDeckForTheme,
  resolveCardDeckFromId
} from './cardDeckRegistry';
import {
  CARD_ASSETS_DIR,
  CARD_BACK_PATH,
  getCardAssetsDir,
  getCardBackPath,
  getCardImagePath
} from './cardAssets';
import { THEME_CARD_VISUALS } from './themeCardVisuals';

const BUILT_IN_THEMES = [
  'classic', 'forest', 'midnight', 'thule', 'hyperborea', 'skara-brae', 'avalon',
  'knossos', 'thebes', 'cartago', 'atlantida', 'babylon', 'ur', 'petra', 'persepolis',
  'axum', 'meroe', 'great-zimbabwe', 'xanadu', 'shambhala', 'mohenjo-daro', 'yamatai',
  'angkor', 'tikal', 'teotihuacan', 'tiwanaku', 'caral', 'el-dorado', 'rapanui', 'nanmadol'
] as const;

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'] as const;
const SUITS = ['Clubs', 'Diamonds', 'Hearts', 'Spades'] as const;

describe('cardDeckRegistry + theme card visuals', () => {
  it('registers only casino as a runtime face deck', () => {
    expect(Object.keys(CARD_DECKS)).toEqual(['casino']);
    expect(DEFAULT_CARD_DECK_ID).toBe('casino');
    expect(ACTIVE_CARD_DECK_ID).toBe('casino');
    expect(isCardDeckId('casino')).toBe(true);
    expect(isCardDeckId('hazmat')).toBe(false);
    expect(isCardDeckId('cards2')).toBe(false);
    expect(resolveActiveDeck().facePath).toBe('/assets/cards3');
    expect(CARD_ASSETS_DIR).toBe('/assets/cards3');
  });

  it('registers suecao + casino pilot backs', () => {
    expect(isCardBackId('suecao-navy')).toBe(true);
    expect(isCardBackId('casino-05')).toBe(true);
    expect(isCardBackId('casino-06')).toBe(true);
    expect(isCardBackId('casino-07')).toBe(true);
    expect(isCardBackId('casino-08')).toBe(true);
    expect(CARD_BACKS['casino-06'].assetPathBase).toContain('card_back_casino_06');
  });

  it('resolves theme without deckId → casino', () => {
    expect(THEME_CARD_VISUALS.classic?.cardVisuals?.deckId).toBeUndefined();
    expect(resolveCardDeckForTheme('classic').id).toBe('casino');
    expect(resolveCardDeckForTheme('classic').facePath).toBe('/assets/cards3');
    expect(getCardAssetsDir('classic')).toBe('/assets/cards3');
  });

  it('resolves unknown theme → casino', () => {
    expect(resolveCardDeckForTheme('unknown-theme-xyz').id).toBe('casino');
    expect(resolveCardDeckForTheme(null).id).toBe('casino');
    expect(resolveCardDeckForTheme(undefined).id).toBe('casino');
    expect(getCardAssetsDir('nope')).toBe('/assets/cards3');
  });

  it('resolves invalid deckId → casino', () => {
    expect(resolveCardDeckFromId('cards2').id).toBe('casino');
    expect(resolveCardDeckFromId('hazmat').id).toBe('casino');
    expect(resolveCardDeckFromId('')).toEqual(CARD_DECKS.casino);
    expect(resolveCardDeckFromId(null).id).toBe('casino');
  });

  it('resolves valid deckId → casino', () => {
    expect(resolveCardDeckFromId('casino').id).toBe('casino');
    expect(resolveCardDeckFromId('casino').facePath).toBe('/assets/cards3');
  });

  it('keeps deckId and backId independent', () => {
    expect(resolveCardDeckForTheme('midnight').id).toBe('casino');
    expect(resolveCardBackForTheme('midnight').id).toBe('casino-06');
    expect(resolveCardDeckForTheme('classic').id).toBe('casino');
    expect(resolveCardBackForTheme('classic').id).toBe('suecao-navy');
  });

  it('falls back to suecao-navy when theme has no cardVisuals', () => {
    expect(THEME_CARD_VISUALS['custom_unmapped']).toBeUndefined();
    const back = resolveCardBackForTheme('custom_unmapped');
    expect(back.id).toBe(DEFAULT_CARD_BACK_ID);
    expect(getCardBackPath('custom_unmapped')).toBe(CARD_BACK_PATH);
  });

  it('falls back on invalid / empty backId', () => {
    expect(resolveCardBackFromId('not-a-real-back').id).toBe('suecao-navy');
    expect(resolveCardBackFromId(null).id).toBe('suecao-navy');
    expect(resolveCardBackFromId(undefined).id).toBe('suecao-navy');
    expect(resolveCardBackFromId('').id).toBe('suecao-navy');
    expect(resolveCardBackForTheme('unknown-theme-xyz').id).toBe('suecao-navy');
  });

  it('assigns an explicit backId to every built-in theme (no explicit deckId)', () => {
    expect(Object.keys(THEME_CARD_VISUALS).sort()).toEqual([...BUILT_IN_THEMES].sort());
    for (const id of BUILT_IN_THEMES) {
      const visuals = THEME_CARD_VISUALS[id]?.cardVisuals;
      expect(visuals?.deckId).toBeUndefined();
      expect(isCardBackId(visuals?.backId)).toBe(true);
      expect(visuals?.backId).not.toBe('hazmat-red');
      expect(resolveCardBackForTheme(id).id).toBe(visuals?.backId);
      expect(resolveCardDeckForTheme(id).id).toBe('casino');
    }
  });

  it('resolves curated theme backs (incl. pilot re-eval)', () => {
    expect(resolveCardBackForTheme('classic').id).toBe('suecao-navy');
    expect(resolveCardBackForTheme('midnight').id).toBe('casino-06');
    /** Warm sand felt → cyan for contrast */
    expect(resolveCardBackForTheme('thebes').id).toBe('casino-07');
    /** Arctic blue felt → red for contrast */
    expect(resolveCardBackForTheme('thule').id).toBe('casino-05');
    expect(resolveCardBackForTheme('forest').id).toBe('casino-05');
    expect(getCardBackPath('midnight')).toContain('card_back_casino_06');
    expect(getCardBackPath('thebes')).toContain('card_back_casino_07');
    expect(getCardBackPath('thule')).toContain('card_back_casino_05');
  });

  it('resolves 52 Casino face paths under cards3 (no cards1/cards2)', () => {
    const paths: string[] = [];
    for (const rank of RANKS) {
      for (const suit of SUITS) {
        paths.push(getCardImagePath(rank, suit, '', 'classic'));
      }
    }
    expect(paths).toHaveLength(52);
    for (const p of paths) {
      expect(p).toMatch(/^\/assets\/cards3\/.+\.png$/);
      expect(p).not.toMatch(/cards1|cards2/);
    }
    expect(getCardImagePath('Ace', 'Spades', '', 'midnight')).toBe(
      '/assets/cards3/Ace_of_Spades.png'
    );
  });
});
