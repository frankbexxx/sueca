import {
  loadLocalStats,
  recordGameResult,
  touchLastPlayed,
  getWinRate,
  formatRelativeTime,
  saveLastConfig
} from './gameSessionStorage';
import { GameConfig } from '../types/gameConfig';

const STATS_KEY = 'sueca-local-stats';
const LAST_CONFIG_KEY = 'sueca-last-config';

const mockConfig = (): GameConfig => ({
  playerNames: ['Alice', 'Bot 2', 'Bot 3', 'Bot 4'],
  aiDifficulty: 'medium',
  dealingMethod: 'A',
  multiplayerEnabled: false,
  multiplayerJoinMode: false,
  gameVariant: 'hearts'
});

describe('gameSessionStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-20T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('touchLastPlayed updates lastPlayed fields', () => {
    touchLastPlayed('spades');
    const stats = loadLocalStats();
    expect(stats.lastPlayedAt).toBe(Date.now());
    expect(stats.lastPlayedVariant).toBe('spades');
  });

  it('recordGameResult increments stats and lastPlayed', () => {
    recordGameResult('sueca', true);
    const stats = loadLocalStats();
    expect(stats.gamesPlayed).toBe(1);
    expect(stats.wins).toBe(1);
    expect(stats.byVariant.sueca.played).toBe(1);
    expect(stats.byVariant.sueca.wins).toBe(1);
    expect(stats.lastPlayedVariant).toBe('sueca');
    expect(stats.lastPlayedAt).toBe(Date.now());
  });

  it('merges corrupt partial byVariant with defaults', () => {
    localStorage.setItem(
      STATS_KEY,
      JSON.stringify({ gamesPlayed: 2, wins: 1, byVariant: { sueca: { played: 2, wins: 1 } } })
    );
    const stats = loadLocalStats();
    expect(stats.byVariant.sueca.played).toBe(2);
    expect(stats.byVariant.hearts.played).toBe(0);
    expect(stats.byVariant.spades.wins).toBe(0);
  });

  it('saveLastConfig touches last played variant', () => {
    saveLastConfig(mockConfig());
    const stats = loadLocalStats();
    expect(stats.lastPlayedVariant).toBe('hearts');
    expect(localStorage.getItem(LAST_CONFIG_KEY)).toBeTruthy();
  });

  it('getWinRate returns null when no games played', () => {
    expect(getWinRate(loadLocalStats())).toBeNull();
  });

  it('getWinRate computes rounded percentage', () => {
    recordGameResult('king', true);
    recordGameResult('king', false);
    recordGameResult('king', true);
    expect(getWinRate(loadLocalStats())).toBe(67);
  });

  it('formatRelativeTime handles recent and day boundaries', () => {
    const now = Date.now();
    expect(formatRelativeTime(now, 'pt')).toBe('agora');
    expect(formatRelativeTime(now - 30 * 60 * 1000, 'en')).toBe('30 min ago');
    expect(formatRelativeTime(now - 25 * 60 * 60 * 1000, 'pt')).toBe('ontem');
    expect(formatRelativeTime(now - 3 * 24 * 60 * 60 * 1000, 'en')).toBe('3 days ago');
  });
});
