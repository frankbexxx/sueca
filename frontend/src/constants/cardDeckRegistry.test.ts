import { describe, expect, it } from 'vitest';
import {
  ACTIVE_CARD_DECK_ID,
  CARD_BACKS,
  DEFAULT_CARD_BACK_ID,
  isCardBackId,
  resolveActiveDeck,
  resolveCardBackForTheme,
  resolveCardBackFromId
} from './cardDeckRegistry';
import { CARD_ASSETS_DIR, CARD_BACK_PATH, getCardBackPath } from './cardAssets';
import { THEME_CARD_VISUALS } from './themeCardVisuals';

describe('cardDeckRegistry + theme backs', () => {
  it('keeps Casino faces as the global deck', () => {
    expect(ACTIVE_CARD_DECK_ID).toBe('casino');
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

  it('assigns an explicit backId to every built-in theme', () => {
    const builtIn = [
      'classic', 'forest', 'midnight', 'thule', 'hyperborea', 'skara-brae', 'avalon',
      'knossos', 'thebes', 'cartago', 'atlantida', 'babylon', 'ur', 'petra', 'persepolis',
      'axum', 'meroe', 'great-zimbabwe', 'xanadu', 'shambhala', 'mohenjo-daro', 'yamatai',
      'angkor', 'tikal', 'teotihuacan', 'tiwanaku', 'caral', 'el-dorado', 'rapanui', 'nanmadol'
    ];
    expect(Object.keys(THEME_CARD_VISUALS).sort()).toEqual([...builtIn].sort());
    for (const id of builtIn) {
      const backId = THEME_CARD_VISUALS[id]?.cardVisuals?.backId;
      expect(isCardBackId(backId)).toBe(true);
      expect(backId).not.toBe('hazmat-red');
      expect(resolveCardBackForTheme(id).id).toBe(backId);
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
});
