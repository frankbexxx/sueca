/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  SETUP_PREFS_KEY,
  getBotNamesForVariant,
  getDifficultyForVariant,
  getP1Name,
  getPlayerNamesForVariant,
  loadSetupPrefs,
  savePlayerNamesForVariant,
  setDifficultyForVariant,
  setP1Name
} from './setupPreferences';
import { STORAGE_KEYS } from '../constants/gameConstants';
import { buildSoloConfigForVariant } from './gameSessionStorage';

describe('setupPreferences (REL-PLAYERS-01 / REL-DIFF-01)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('migrates legacy global names into P1 + per-game bots', () => {
    localStorage.setItem(
      STORAGE_KEYS.PLAYER_NAMES,
      JSON.stringify(['Francisco', 'BotA', 'BotB', 'BotC'])
    );
    localStorage.setItem(STORAGE_KEYS.AI_DIFFICULTY, 'hard');

    const prefs = loadSetupPrefs();
    expect(prefs.p1Name).toBe('Francisco');
    expect(prefs.botNamesByVariant.sueca).toEqual(['BotA', 'BotB', 'BotC']);
    expect(prefs.botNamesByVariant.king).toEqual(['BotA', 'BotB', 'BotC']);
    expect(prefs.difficultyByVariant.sueca).toBe('hard');
    expect(prefs.difficultyByVariant.hearts).toBe('hard');
    expect(localStorage.getItem(SETUP_PREFS_KEY)).toBeTruthy();
  });

  it('migration is idempotent', () => {
    localStorage.setItem(
      STORAGE_KEYS.PLAYER_NAMES,
      JSON.stringify(['Ana', 'X', 'Y', 'Z'])
    );
    const first = loadSetupPrefs();
    first.botNamesByVariant.king = ['K2', 'K3', 'K4'];
    localStorage.setItem(SETUP_PREFS_KEY, JSON.stringify(first));

    const second = loadSetupPrefs();
    expect(second.p1Name).toBe('Ana');
    expect(second.botNamesByVariant.king).toEqual(['K2', 'K3', 'K4']);
    expect(second.botNamesByVariant.sueca).toEqual(['X', 'Y', 'Z']);
  });

  it('keeps P1 global while bots differ per game', () => {
    setP1Name('Francisco');
    savePlayerNamesForVariant('sueca', ['Francisco', 'Sueca2', 'Sueca3', 'Sueca4']);
    savePlayerNamesForVariant('king', ['Francisco', 'King2', 'King3', 'King4']);

    expect(getP1Name()).toBe('Francisco');
    expect(getBotNamesForVariant('sueca')).toEqual(['Sueca2', 'Sueca3', 'Sueca4']);
    expect(getBotNamesForVariant('king')).toEqual(['King2', 'King3', 'King4']);
    expect(getPlayerNamesForVariant('sueca')[0]).toBe('Francisco');
    expect(getPlayerNamesForVariant('king')[1]).toBe('King2');
  });

  it('setP1Name updates global identity without wiping bots', () => {
    savePlayerNamesForVariant('sueca', ['Old', 'A', 'B', 'C']);
    setP1Name('Novo');
    expect(getP1Name()).toBe('Novo');
    expect(getPlayerNamesForVariant('sueca')).toEqual(['Novo', 'A', 'B', 'C']);
  });

  it('stores difficulty independently per game', () => {
    setDifficultyForVariant('sueca', 'hard');
    setDifficultyForVariant('hearts', 'easy');
    setDifficultyForVariant('king', 'medium');

    expect(getDifficultyForVariant('sueca')).toBe('hard');
    expect(getDifficultyForVariant('hearts')).toBe('easy');
    expect(getDifficultyForVariant('king')).toBe('medium');
  });

  it('buildSoloConfigForVariant uses per-game names and difficulty', () => {
    setP1Name('Francisco');
    savePlayerNamesForVariant('spades', ['Francisco', 'S2', 'S3', 'S4']);
    setDifficultyForVariant('spades', 'easy');
    savePlayerNamesForVariant('hearts', ['Francisco', 'H2', 'H3', 'H4']);
    setDifficultyForVariant('hearts', 'hard');

    const spades = buildSoloConfigForVariant('spades');
    const hearts = buildSoloConfigForVariant('hearts');
    expect(spades.playerNames).toEqual(['Francisco', 'S2', 'S3', 'S4']);
    expect(spades.aiDifficulty).toBe('easy');
    expect(hearts.playerNames).toEqual(['Francisco', 'H2', 'H3', 'H4']);
    expect(hearts.aiDifficulty).toBe('hard');
  });
});
