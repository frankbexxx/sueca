import { describe, expect, it } from 'vitest';
import {
  ACTIVE_CARD_BACK_ID,
  ACTIVE_CARD_DECK_ID,
  resolveActiveBack,
  resolveActiveDeck
} from './cardDeckRegistry';
import { CARD_ASSETS_DIR, CARD_BACK_PATH } from './cardAssets';

describe('cardDeckRegistry', () => {
  it('activates Casino faces + Suecão navy back', () => {
    expect(ACTIVE_CARD_DECK_ID).toBe('casino');
    expect(ACTIVE_CARD_BACK_ID).toBe('suecao-navy');
    expect(resolveActiveDeck().facePath).toBe('/assets/cards3');
    expect(resolveActiveBack().assetPathBase).toBe('/assets/cards3/card_back');
    expect(CARD_ASSETS_DIR).toBe('/assets/cards3');
    expect(CARD_BACK_PATH).toMatch(/\/assets\/cards3\/card_back\.(png|svg)$/);
  });
});
