import { describe, expect, it, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACTIVE_CARD_DECK_ID,
  CARD_BACKS,
  CARD_DECKS,
  DEFAULT_CARD_BACK_ID,
  DEFAULT_CARD_DECK_ID,
  LEGACY_CARD_BACK_MIGRATION,
  LEGACY_CARD_FRONT_MIGRATION,
  isCardBackId,
  isCardDeckId,
  migrateLegacyCardBackId,
  migrateLegacyCardFrontId,
  parseDeckOverrideFromQuery,
  resolveActiveDeck,
  resolveCardBackForTheme,
  resolveCardBackFromId,
  resolveCardDeckForTheme,
  resolveCardDeckFromId,
  resolveEffectiveBack,
  resolveEffectiveDeck
} from './cardDeckRegistry';
import {
  CARD_ASSETS_DIR,
  CARD_BACK_PATH,
  getCardAssetsDir,
  getCardBackPath,
  getCardImagePath
} from './cardAssets';
import { THEME_CARD_VISUALS } from './themeCardVisuals';
import { loadCardSkinPreferences } from './cardSkinPreferences';
import { STORAGE_KEYS } from './gameConstants';

const BUILT_IN_THEMES = [
  'classic', 'forest', 'midnight', 'thule', 'hyperborea', 'skara-brae', 'avalon',
  'knossos', 'thebes', 'cartago', 'atlantida', 'babylon', 'ur', 'petra', 'persepolis',
  'axum', 'meroe', 'great-zimbabwe', 'xanadu', 'shambhala', 'mohenjo-daro', 'yamatai',
  'angkor', 'tikal', 'teotihuacan', 'tiwanaku', 'caral', 'el-dorado', 'rapanui', 'nanmadol'
] as const;

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'] as const;
const SUITS = ['Clubs', 'Diamonds', 'Hearts', 'Spades'] as const;

const PUBLIC = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../public'
);

function assertFaceFiles(deckDir: string, facePathPrefix: string) {
  const dir = path.join(PUBLIC, deckDir.replace(/^\//, ''));
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.png') && f.includes('_of_'));
  expect(files).toHaveLength(52);
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      const name = `${rank}_of_${suit}.png`;
      expect(files).toContain(name);
      expect(fs.statSync(path.join(dir, name)).size).toBeGreaterThan(500);
      expect(
        getCardImagePath(rank, suit, '', 'classic', `?deck=${facePathPrefix}`)
      ).toBe(`${CARD_DECKS[facePathPrefix as keyof typeof CARD_DECKS].facePath}/${name}`);
    }
  }
}

describe('cardDeckRegistry + theme card visuals (REL-DECK-01B)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('registers cardmeister + pd-ornate; default is cardmeister; no Casino', () => {
    expect(Object.keys(CARD_DECKS).sort()).toEqual(['cardmeister', 'pd-ornate']);
    expect(DEFAULT_CARD_DECK_ID).toBe('cardmeister');
    expect(ACTIVE_CARD_DECK_ID).toBe('cardmeister');
    expect(isCardDeckId('casino')).toBe(false);
    expect(isCardDeckId('cardmeister')).toBe(true);
    expect(isCardDeckId('pd-ornate')).toBe(true);
    expect(resolveActiveDeck().facePath).toBe('/assets/cards-cardmeister');
    expect(CARD_ASSETS_DIR).toBe('/assets/cards-cardmeister');
    expect(CARD_DECKS['pd-ornate'].facePath).toBe('/assets/cards/pd-ornate');
  });

  it('registers suecao-navy + six Sylly backs; no Casino/hazmat backs', () => {
    expect(Object.keys(CARD_BACKS).sort()).toEqual([
      'suecao-navy',
      'sylly-01',
      'sylly-02',
      'sylly-03',
      'sylly-04',
      'sylly-05',
      'sylly-06'
    ].sort());
    expect(isCardBackId('casino-05')).toBe(false);
    expect(isCardBackId('hazmat-red')).toBe(false);
    expect(CARD_BACKS['suecao-navy'].assetPathBase).toBe(
      '/assets/card-backs/suecao-navy'
    );
    expect(CARD_BACK_PATH).toContain('/assets/card-backs/suecao-navy.');
  });

  it('registry back/face paths resolve to real files on disk', () => {
    for (const deck of Object.values(CARD_DECKS)) {
      const dir = path.join(PUBLIC, deck.facePath.replace(/^\//, ''));
      expect(fs.existsSync(dir), deck.id).toBe(true);
      const faces = fs.readdirSync(dir).filter((f) => f.includes('_of_'));
      expect(faces.length, deck.id).toBe(52);
    }
    for (const back of Object.values(CARD_BACKS)) {
      const file = path.join(
        PUBLIC,
        `${back.assetPathBase.replace(/^\//, '')}.png`
      );
      expect(fs.existsSync(file), back.id).toBe(true);
      expect(fs.statSync(file).size, back.id).toBeGreaterThan(500);
    }
  });

  it('ships 52 pd-ornate faces with canonical names', () => {
    assertFaceFiles('/assets/cards/pd-ornate', 'pd-ornate');
  });

  it('ships 52 CardMeister faces', () => {
    assertFaceFiles('/assets/cards-cardmeister', 'cardmeister');
  });

  it('migrates legacy Casino front/back ids', () => {
    expect(LEGACY_CARD_FRONT_MIGRATION.casino).toBe('cardmeister');
    expect(migrateLegacyCardFrontId('casino')).toBe('cardmeister');
    expect(resolveCardDeckFromId('casino').id).toBe('cardmeister');
    expect(parseDeckOverrideFromQuery('?deck=casino')).toBe('cardmeister');

    expect(LEGACY_CARD_BACK_MIGRATION['casino-05']).toBe('sylly-05');
    expect(LEGACY_CARD_BACK_MIGRATION['casino-06']).toBe('sylly-03');
    expect(LEGACY_CARD_BACK_MIGRATION['casino-07']).toBe('sylly-01');
    expect(LEGACY_CARD_BACK_MIGRATION['casino-08']).toBe('sylly-02');
    expect(migrateLegacyCardBackId('casino-06')).toBe('sylly-03');
    expect(resolveEffectiveBack('classic', 'casino-06').id).toBe('sylly-03');
    expect(resolveCardBackFromId('hazmat-red').id).toBe('suecao-navy');
  });

  it('persists Casino preference migration on load', () => {
    localStorage.setItem(STORAGE_KEYS.CARD_FRONT, 'casino');
    localStorage.setItem(STORAGE_KEYS.CARD_BACK, 'casino-08');
    const prefs = loadCardSkinPreferences();
    expect(prefs).toEqual({
      cardFrontId: 'cardmeister',
      cardBackId: 'sylly-02'
    });
    expect(localStorage.getItem(STORAGE_KEYS.CARD_FRONT)).toBe('cardmeister');
    expect(localStorage.getItem(STORAGE_KEYS.CARD_BACK)).toBe('sylly-02');
  });

  it('invalid legacy preference falls back safely', () => {
    expect(resolveEffectiveDeck('classic', '', 'not-a-deck').id).toBe(
      'cardmeister'
    );
    expect(resolveEffectiveBack('classic', 'not-a-back').id).toBe('suecao-navy');
    localStorage.setItem(STORAGE_KEYS.CARD_FRONT, 'garbage');
    localStorage.setItem(STORAGE_KEYS.CARD_BACK, 'garbage');
    expect(loadCardSkinPreferences()).toEqual({
      cardFrontId: 'theme',
      cardBackId: 'theme'
    });
  });

  it('resolves theme without deckId → cardmeister default', () => {
    expect(THEME_CARD_VISUALS.classic?.cardVisuals?.deckId).toBeUndefined();
    expect(resolveCardDeckForTheme('classic').id).toBe('cardmeister');
    expect(getCardAssetsDir('classic', '')).toBe('/assets/cards-cardmeister');
  });

  it('keeps deckId and backId independent', () => {
    expect(resolveCardDeckForTheme('midnight').id).toBe('cardmeister');
    expect(resolveCardBackForTheme('midnight').id).toBe('sylly-03');
    expect(resolveEffectiveDeck('midnight', '?deck=pd-ornate').id).toBe(
      'pd-ornate'
    );
    expect(resolveCardBackForTheme('midnight').id).toBe('sylly-03');
    expect(resolveEffectiveDeck('midnight', '', 'pd-ornate').id).toBe(
      'pd-ornate'
    );
    expect(resolveEffectiveBack('midnight', 'sylly-01').id).toBe('sylly-01');
  });

  it('assigns cleared backId to every built-in theme', () => {
    expect(Object.keys(THEME_CARD_VISUALS).sort()).toEqual(
      [...BUILT_IN_THEMES].sort()
    );
    for (const id of BUILT_IN_THEMES) {
      const visuals = THEME_CARD_VISUALS[id]?.cardVisuals;
      expect(visuals?.deckId).toBeUndefined();
      expect(isCardBackId(visuals?.backId)).toBe(true);
      expect(String(visuals?.backId)).not.toMatch(/^casino-/);
      expect(resolveCardBackForTheme(id).id).toBe(visuals?.backId);
      expect(resolveCardDeckForTheme(id).id).toBe('cardmeister');
    }
  });

  it('maps curated theme backs after Casino removal', () => {
    expect(resolveCardBackForTheme('classic').id).toBe('suecao-navy');
    expect(resolveCardBackForTheme('midnight').id).toBe('sylly-03');
    expect(resolveCardBackForTheme('thebes').id).toBe('sylly-01');
    expect(resolveCardBackForTheme('thule').id).toBe('sylly-05');
    expect(resolveCardBackForTheme('forest').id).toBe('sylly-05');
    expect(getCardBackPath('midnight')).toContain('/assets/card-backs/sylly-03.');
  });

  it('has no registry references to cards3 or Casino backs', () => {
    const blob = JSON.stringify({ CARD_DECKS, CARD_BACKS, THEME_CARD_VISUALS });
    expect(blob).not.toMatch(/cards3/);
    expect(blob).not.toMatch(/casino-0[5-8]/);
    expect(blob).not.toMatch(/hazmat/);
    expect(Object.keys(CARD_DECKS)).not.toContain('casino');
  });

  it('DOM/Phaser path helpers resolve under cleared assets', () => {
    expect(getCardImagePath('Ace', 'Spades', '', 'classic', '')).toBe(
      '/assets/cards-cardmeister/Ace_of_Spades.png'
    );
    expect(
      getCardImagePath('King', 'Hearts', '', 'classic', '?deck=pd-ornate')
    ).toBe('/assets/cards/pd-ornate/King_of_Hearts.png');
    expect(getCardBackPath('classic')).toBe('/assets/card-backs/suecao-navy.png');
    expect(getCardBackPath('midnight', 'sylly-06')).toBe(
      '/assets/card-backs/sylly-06.png'
    );
  });

  it('falls back to suecao-navy when theme has no cardVisuals', () => {
    expect(THEME_CARD_VISUALS['custom_unmapped']).toBeUndefined();
    const back = resolveCardBackForTheme('custom_unmapped');
    expect(back.id).toBe(DEFAULT_CARD_BACK_ID);
    expect(getCardBackPath('custom_unmapped')).toBe(CARD_BACK_PATH);
  });
});
