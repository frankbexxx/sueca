import {
  loadFinishedGames,
  loadPinnedSession,
  loadPinnedSessions,
  pinGameSession,
  recordFinishedGame,
  unpinGameSession
} from './gameHistoryStorage';
import { GameConfig } from '../types/gameConfig';
import { GameState } from '../types/game';

const PINNED_KEY = 'sueca-pinned-sessions-v1';
const FINISHED_KEY = 'sueca-finished-games-v1';

const mockConfig = (variant: GameConfig['gameVariant'] = 'sueca'): GameConfig => ({
  playerNames: ['Alice', 'Bot 2', 'Bot 3', 'Bot 4'],
  aiDifficulty: 'medium',
  dealingMethod: 'A',
  multiplayerEnabled: false,
  multiplayerJoinMode: false,
  gameVariant: variant,
  rulesPresetId: 'sueca-pt-normal'
});

const mockState = (variant: GameConfig['gameVariant'] = 'sueca', isGameOver = false): GameState =>
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
    winner: isGameOver ? 1 : null,
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

describe('gameHistoryStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-20T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('pins and loads a session by variant', () => {
    const config = mockConfig('hearts');
    const state = mockState();
    pinGameSession(config, state, 'My hearts game');

    const pinned = loadPinnedSession('hearts');
    expect(pinned).not.toBeNull();
    expect(pinned?.config.gameVariant).toBe('hearts');
    expect(pinned?.label).toBe('My hearts game');
    expect(loadPinnedSessions().hearts).toBeDefined();
  });

  it('ignores pinned sessions that are game over', () => {
    pinGameSession(mockConfig(), mockState('sueca', true));
    expect(loadPinnedSession('sueca')).toBeNull();
  });

  it('unpins a variant', () => {
    pinGameSession(mockConfig(), mockState());
    unpinGameSession('sueca');
    expect(loadPinnedSession('sueca')).toBeNull();
    expect(localStorage.getItem(PINNED_KEY)).toBeNull();
  });

  it('records finished games with FIFO max 3', () => {
    const base = Date.now();
    recordFinishedGame({
      variant: 'sueca',
      finishedAt: base,
      playerWon: true,
      summary: 'Nós · 2-0'
    });
    recordFinishedGame({
      variant: 'hearts',
      finishedAt: base + 1,
      playerWon: false,
      summary: 'Eles · 1-0'
    });
    recordFinishedGame({
      variant: 'spades',
      finishedAt: base + 2,
      playerWon: true,
      summary: 'Nós · 3-1'
    });
    recordFinishedGame({
      variant: 'king',
      finishedAt: base + 3,
      playerWon: false,
      summary: 'Eles · 500'
    });

    const finished = loadFinishedGames();
    expect(finished).toHaveLength(3);
    expect(finished[0].variant).toBe('king');
    expect(finished[2].variant).toBe('hearts');
    expect(JSON.parse(localStorage.getItem(FINISHED_KEY) || '[]')).toHaveLength(3);
  });
});
