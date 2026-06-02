import {
  loadLocalStats,
  recordGameResult,
  touchLastPlayed,
  getWinRate,
  formatRelativeTime,
  saveLastConfig,
  saveGameSession,
  loadGameSession,
  loadAllGameSessions,
  clearGameSession,
  buildSoloConfigForVariant,
  stripMultiplayerFields,
  clearMultiplayerLocalStorage,
  loadLastConfig,
  isOfflineMultiplayerSession,
  MP_LOCAL_STORAGE_KEYS
} from './gameSessionStorage';
import { GameConfig } from '../types/gameConfig';
import { GameState } from '../types/game';
import { GameFactory } from '../models/games/GameFactory';

const STATS_KEY = 'sueca-local-stats';
const LAST_CONFIG_KEY = 'sueca-last-config';
const SESSIONS_KEY = 'sueca-saved-sessions-v1';
const LEGACY_SESSION_KEY = 'sueca-saved-session';

const mockConfig = (variant: GameConfig['gameVariant'] = 'hearts'): GameConfig => ({
  playerNames: ['Alice', 'Bot 2', 'Bot 3', 'Bot 4'],
  aiDifficulty: 'medium',
  dealingMethod: 'A',
  multiplayerEnabled: false,
  gameVariant: variant,
  rulesPresetId: variant === 'hearts' ? 'hearts-us-normal' : 'sueca-pt-normal'
});

const mockState = (variant: GameConfig['gameVariant'], isGameOver = false): GameState =>
  ({
    players: [],
    currentPlayerIndex: 0,
    dealerIndex: 0,
    trumpSuit: null,
    trumpCard: null,
    currentTrick: [],
    trickLeader: 0,
    scores: { team1: 0, team2: 0 },
    gameScore: { team1: 0, team2: 0 },
    round: 1,
    isGameOver,
    winner: null,
    lastTrickWinner: null,
    waitingForTrickEnd: false,
    nextTrickLeader: null,
    isFirstTrick: true,
    dealingMethod: 'A',
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    playedCards: [],
    isPaused: false,
    playerName: 'Alice',
    aiDifficulty: 'medium',
    partnerSignals: [],
    variantState: variant === 'hearts' ? { hearts: {} } : undefined
  }) as GameState;

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

  it('saveGameSession stores one slot per variant', () => {
    saveGameSession(mockConfig('sueca'), mockState('sueca'));
    saveGameSession(mockConfig('hearts'), mockState('hearts'));
    expect(loadGameSession('sueca')?.config.gameVariant).toBe('sueca');
    expect(loadGameSession('hearts')?.config.gameVariant).toBe('hearts');
    const all = loadAllGameSessions();
    expect(all.sueca).toBeTruthy();
    expect(all.hearts).toBeTruthy();
  });

  it('clearGameSession removes only the requested variant', () => {
    saveGameSession(mockConfig('sueca'), mockState('sueca'));
    saveGameSession(mockConfig('spades'), mockState('spades'));
    clearGameSession('sueca');
    expect(loadGameSession('sueca')).toBeNull();
    expect(loadGameSession('spades')?.config.gameVariant).toBe('spades');
  });

  it('saveGameSession clears slot when game is over', () => {
    saveGameSession(mockConfig('king'), mockState('king'));
    saveGameSession(mockConfig('king'), mockState('king', true));
    expect(loadGameSession('king')).toBeNull();
  });

  it('migrates legacy single session key into variant slot', () => {
    const legacy = {
      config: mockConfig('sueca'),
      state: mockState('sueca'),
      savedAt: Date.now()
    };
    localStorage.setItem(LEGACY_SESSION_KEY, JSON.stringify(legacy));
    expect(loadGameSession('sueca')?.config.gameVariant).toBe('sueca');
    expect(localStorage.getItem(LEGACY_SESSION_KEY)).toBeNull();
  });

  it('loadGameSession without variant returns most recent save', () => {
    jest.setSystemTime(new Date('2026-05-20T10:00:00Z'));
    saveGameSession(mockConfig('sueca'), mockState('sueca'));
    jest.setSystemTime(new Date('2026-05-20T12:00:00Z'));
    saveGameSession(mockConfig('hearts'), mockState('hearts'));
    expect(loadGameSession()?.config.gameVariant).toBe('hearts');
  });

  it('saved sueca session round-trips through adapter restoreState', () => {
    const adapter = GameFactory.getAdapter('sueca');
    const state = adapter.initialize(['P1', 'P2', 'P3', 'P4'], {
      dealingMethod: 'A',
      aiDifficulty: 'medium'
    });
    saveGameSession(mockConfig('sueca'), state);
    const loaded = loadGameSession('sueca');
    expect(loaded).toBeTruthy();
    const restored = adapter.restoreState(loaded!.state);
    expect(restored.players).toHaveLength(4);
    expect(restored.round).toBe(state.round);
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

  it('buildSoloConfigForVariant strips multiplayer fields from last config', () => {
    saveLastConfig({
      ...mockConfig('sueca'),
      multiplayerEnabled: true,
      multiplayerSessionId: 'ABC12',
      localPlayerIndex: 2,
      multiplayerSlots: ['human', 'human', 'ai', 'ai']
    });
    const config = buildSoloConfigForVariant('sueca');
    expect(config.multiplayerEnabled).toBe(false);
    expect(config.multiplayerSessionId).toBeUndefined();
    expect(config.localPlayerIndex).toBeUndefined();
    expect(config.multiplayerSlots).toBeUndefined();
    expect(config.playerNames[0]).toBe('Alice');
    expect(config.aiDifficulty).toBe('medium');
  });

  it('stripMultiplayerFields removes session fields only', () => {
    const stripped = stripMultiplayerFields({
      ...mockConfig('sueca'),
      multiplayerEnabled: true,
      multiplayerSessionId: 'XYZ99',
      localPlayerIndex: 1,
      multiplayerSlots: ['human', 'ai', 'ai', 'ai'],
    });
    expect(stripped.multiplayerEnabled).toBe(false);
    expect(stripped.multiplayerSessionId).toBeUndefined();
    expect(stripped.playerNames[0]).toBe('Alice');
  });

  it('saveLastConfig and loadLastConfig never persist multiplayer session fields', () => {
    saveLastConfig({
      ...mockConfig('hearts'),
      multiplayerEnabled: true,
      multiplayerSessionId: 'ROOM1',
      localPlayerIndex: 0,
    });
    const loaded = loadLastConfig();
    expect(loaded?.multiplayerEnabled).toBe(false);
    expect(loaded?.multiplayerSessionId).toBeUndefined();
    const raw = JSON.parse(localStorage.getItem(LAST_CONFIG_KEY) ?? '{}');
    expect(raw.multiplayerSessionId).toBeUndefined();
  });

  it('clearMultiplayerLocalStorage removes MP keys', () => {
    localStorage.setItem(MP_LOCAL_STORAGE_KEYS.enabled, 'true');
    localStorage.setItem(MP_LOCAL_STORAGE_KEYS.sessionId, 'ABC12');
    clearMultiplayerLocalStorage();
    expect(localStorage.getItem(MP_LOCAL_STORAGE_KEYS.enabled)).toBeNull();
    expect(localStorage.getItem(MP_LOCAL_STORAGE_KEYS.sessionId)).toBeNull();
  });

  it('isOfflineMultiplayerSession detects saved MP sessions', () => {
    const session = {
      config: { ...mockConfig('sueca'), multiplayerEnabled: true, multiplayerSessionId: 'X' },
      state: mockState('sueca'),
      savedAt: Date.now(),
    };
    expect(isOfflineMultiplayerSession(session)).toBe(true);
    expect(isOfflineMultiplayerSession({ ...session, config: mockConfig('sueca') })).toBe(false);
  });

  it('buildSoloConfigForVariant uses requested variant and default preset when last differs', () => {
    saveLastConfig(mockConfig('hearts'));
    const config = buildSoloConfigForVariant('sueca');
    expect(config.gameVariant).toBe('sueca');
    expect(config.rulesPresetId).toBe('sueca-pt-normal');
    expect(config.playerNames[0]).toBe('Alice');
  });

  it('buildSoloConfigForVariant preserves preset when last matches variant', () => {
    saveLastConfig({ ...mockConfig('sueca'), rulesPresetId: 'sueca-pt-normal' });
    const config = buildSoloConfigForVariant('sueca');
    expect(config.rulesPresetId).toBe('sueca-pt-normal');
  });
});
