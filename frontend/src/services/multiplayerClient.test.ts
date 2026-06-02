const mockSet = jest.fn(() => Promise.resolve());
const mockGet = jest.fn();
const mockPush = jest.fn(() => Promise.resolve());
const mockRunTransaction = jest.fn();
const mockOnValue = jest.fn(() => jest.fn());
const mockOnChildAdded = jest.fn(() => jest.fn());
const mockOff = jest.fn();
const mockRef = jest.fn((_db: unknown, path: string) => ({ path }));

jest.mock('firebase/database', () => ({
  ref: (...args: unknown[]) => mockRef(...args),
  set: (...args: unknown[]) => mockSet(...args),
  get: (...args: unknown[]) => mockGet(...args),
  push: (...args: unknown[]) => mockPush(...args),
  runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
  onValue: (...args: unknown[]) => mockOnValue(...args),
  onChildAdded: (...args: unknown[]) => mockOnChildAdded(...args),
  off: (...args: unknown[]) => mockOff(...args),
}));

jest.mock('./firebaseConfig', () => ({ db: {} }));

import {
  createSession,
  joinSession,
  pushAction,
  endSession,
  publishState,
} from './multiplayerClient';
import { GameState } from '../types/game';

describe('multiplayerClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('createSession writes meta and stores host slot index', async () => {
    mockSet.mockResolvedValueOnce(undefined);
    const slots = [
      { type: 'human' as const, name: 'Host', joined: true },
      { type: 'ai' as const, name: 'Bot', joined: true },
      { type: 'ai' as const, name: 'Bot', joined: true },
      { type: 'ai' as const, name: 'Bot', joined: true },
    ];
    const code = await createSession('sueca', slots);
    expect(code).toHaveLength(5);
    expect(mockSet).toHaveBeenCalled();
    const setPath = mockRef.mock.calls[0][1] as string;
    expect(setPath).toMatch(/^sessions\/[A-Z0-9]{5}$/);
    expect(localStorage.getItem(`sueca-mp-local-index-${code}`)).toBe('0');
  });

  it('joinSession assigns first free human slot via transaction', async () => {
    mockGet.mockResolvedValueOnce({ exists: () => true });
    mockRunTransaction.mockImplementationOnce(async (_ref, updateFn) => {
      const current = {
        variant: 'sueca',
        status: 'waiting',
        slots: [
          { type: 'human', name: 'Host', joined: true },
          { type: 'human', name: 'Guest', joined: false },
          { type: 'ai', name: 'Bot', joined: true },
          { type: 'ai', name: 'Bot', joined: true },
        ],
      };
      const updated = updateFn(current);
      return {
        committed: true,
        snapshot: { val: () => updated },
      };
    });

    const result = await joinSession('ABCDE');
    expect(result.localPlayerIndex).toBe(1);
    expect(result.variant).toBe('sueca');
    expect(localStorage.getItem('sueca-mp-local-index-ABCDE')).toBe('1');
  });

  it('joinSession throws when session is full', async () => {
    mockGet.mockResolvedValueOnce({ exists: () => true });
    mockRunTransaction.mockResolvedValueOnce({ committed: false });
    await expect(joinSession('FULL1')).rejects.toThrow('Session is full');
  });

  it('pushAction appends to actions node', async () => {
    await pushAction('ROOM1', {
      type: 'playCard',
      playerIndex: 1,
      cardIndex: 2,
      clientId: 'client-1',
      at: 123,
    });
    expect(mockPush).toHaveBeenCalled();
    expect(mockRef.mock.calls[0][1]).toBe('sessions/ROOM1/actions');
  });

  it('endSession marks ended and clears runtime nodes', async () => {
    await endSession('ROOM1');
    expect(mockSet).toHaveBeenCalledTimes(3);
    const paths = mockRef.mock.calls.map((c) => c[1]);
    expect(paths).toContain('sessions/ROOM1/status');
    expect(paths).toContain('sessions/ROOM1/state');
    expect(paths).toContain('sessions/ROOM1/actions');
  });

  it('publishState strips undefined fields', async () => {
    const state = {
      players: [],
      currentPlayerIndex: 0,
      dealerIndex: 0,
      trumpSuit: null,
      trumpCard: null,
      currentTrick: [],
      trickLeader: 0,
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      completedPentes: [],
      round: 1,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: true,
      dealingMethod: 'A',
      waitingForRoundStart: true,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [],
      isPaused: false,
      playerName: 'Player 1',
      aiDifficulty: 'medium',
      partnerSignals: [],
      nextRoundValue: undefined,
      pendingRoundMultiplier: undefined,
    } as GameState;

    await publishState('ROOM1', state);

    expect(mockSet).toHaveBeenCalledTimes(1);
    const payload = mockSet.mock.calls[0][1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('nextRoundValue');
    expect(payload).not.toHaveProperty('pendingRoundMultiplier');
    expect(mockRef.mock.calls[0][1]).toBe('sessions/ROOM1/state');
  });
});
