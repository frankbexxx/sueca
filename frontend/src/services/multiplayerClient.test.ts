const mockSet = jest.fn(() => Promise.resolve());
const mockGet = jest.fn();
const mockPush = jest.fn(() => Promise.resolve());
const mockRunTransaction = jest.fn();
const mockOnValue = jest.fn(() => jest.fn());
const mockOnChildAdded = jest.fn(() => jest.fn());
const mockOff = jest.fn();
const mockRef = jest.fn((_db: unknown, path: string) => ({ path }));
const mockEnsureAnonymousAuth = jest.fn();

vi.mock('firebase/database', () => ({
  ref: (...args: unknown[]) => mockRef(...args),
  set: (...args: unknown[]) => mockSet(...args),
  get: (...args: unknown[]) => mockGet(...args),
  push: (...args: unknown[]) => mockPush(...args),
  runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
  onValue: (...args: unknown[]) => mockOnValue(...args),
  onChildAdded: (...args: unknown[]) => mockOnChildAdded(...args),
  off: (...args: unknown[]) => mockOff(...args)
}));

vi.mock('./firebaseConfig', () => ({ getFirebaseDatabase: () => ({}) }));

vi.mock('./firebaseAuth', () => ({
  ensureAnonymousAuth: (...args: unknown[]) => mockEnsureAnonymousAuth(...args)
}));

import {
  claimSeatForUid,
  createSession,
  joinSession,
  pushAction,
  endSession,
  publishState,
  type SessionSlot
} from './multiplayerClient';
import { GameState } from '../types/game';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vi } from 'vitest';

const humanSlots = (): SessionSlot[] => [
  { type: 'human', name: 'Host', joined: true },
  { type: 'human', name: 'Guest', joined: false },
  { type: 'ai', name: 'Bot', joined: true },
  { type: 'ai', name: 'Bot', joined: true }
];

describe('claimSeatForUid', () => {
  it('claims first free human seat for a new uid', () => {
    const result = claimSeatForUid(humanSlots(), 'uid-joiner');
    expect(result).toEqual({
      ok: true,
      seatIndex: 1,
      slots: [
        { type: 'human', name: 'Host', joined: true },
        { type: 'human', name: 'Guest', joined: true, uid: 'uid-joiner' },
        { type: 'ai', name: 'Bot', joined: true },
        { type: 'ai', name: 'Bot', joined: true }
      ]
    });
  });

  it('same uid reuses the same seat', () => {
    const slots: SessionSlot[] = [
      { type: 'human', name: 'Host', joined: true, uid: 'uid-host' },
      { type: 'human', name: 'Guest', joined: true, uid: 'uid-joiner' },
      { type: 'ai', name: 'Bot', joined: true },
      { type: 'ai', name: 'Bot', joined: true }
    ];
    const result = claimSeatForUid(slots, 'uid-joiner');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.seatIndex).toBe(1);
    expect(result.slots[1].uid).toBe('uid-joiner');
    expect(result.slots[0].uid).toBe('uid-host');
  });

  it('cannot steal an occupied seat', () => {
    const slots: SessionSlot[] = [
      { type: 'human', name: 'Host', joined: true, uid: 'uid-host' },
      { type: 'human', name: 'Guest', joined: true, uid: 'uid-other' },
      { type: 'ai', name: 'Bot', joined: true },
      { type: 'ai', name: 'Bot', joined: true }
    ];
    expect(claimSeatForUid(slots, 'uid-attacker')).toEqual({ ok: false, reason: 'full' });
    expect(slots[1].uid).toBe('uid-other');
  });

  it('AI seats are not claimable', () => {
    const slots: SessionSlot[] = [
      { type: 'human', name: 'Host', joined: true, uid: 'uid-host' },
      { type: 'ai', name: 'Bot', joined: false },
      { type: 'ai', name: 'Bot', joined: true },
      { type: 'ai', name: 'Bot', joined: true }
    ];
    expect(claimSeatForUid(slots, 'uid-joiner')).toEqual({ ok: false, reason: 'full' });
  });

  it('joined human without uid is not claimable (cannot steal legacy/host)', () => {
    const slots: SessionSlot[] = [
      { type: 'human', name: 'Host', joined: true },
      { type: 'human', name: 'Guest', joined: true },
      { type: 'ai', name: 'Bot', joined: true },
      { type: 'ai', name: 'Bot', joined: true }
    ];
    expect(claimSeatForUid(slots, 'uid-joiner')).toEqual({ ok: false, reason: 'full' });
  });
});

describe('multiplayerClient create/join auth binding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockEnsureAnonymousAuth.mockResolvedValue({ uid: 'uid-host' });
  });

  it('createSession writes hostUid and binds seat 0', async () => {
    mockSet.mockResolvedValueOnce(undefined);
    const slots = humanSlots();
    const code = await createSession('sueca', slots);
    expect(code).toHaveLength(5);
    expect(mockEnsureAnonymousAuth).toHaveBeenCalled();
    const payload = mockSet.mock.calls[0][1] as {
      hostUid: string;
      status: string;
      variant: string;
      slots: SessionSlot[];
    };
    expect(payload.hostUid).toBe('uid-host');
    expect(payload.variant).toBe('sueca');
    expect(payload.status).toBe('waiting');
    expect(payload.slots[0]).toEqual({
      type: 'human',
      name: 'Host',
      joined: true,
      uid: 'uid-host'
    });
    expect(payload.slots[1]).toEqual({ type: 'human', name: 'Guest', joined: false });
    expect(payload.slots[1]).not.toHaveProperty('uid');
    expect(payload.slots[2]).toEqual({ type: 'ai', name: 'Bot', joined: true });
    expect(localStorage.getItem(`sueca-mp-local-index-${code}`)).toBe('0');
  });

  it('createSession fails clearly when anonymous auth fails', async () => {
    mockEnsureAnonymousAuth.mockRejectedValueOnce(new Error('Anonymous authentication failed'));
    await expect(createSession('sueca', humanSlots())).rejects.toThrow(
      /Anonymous authentication failed/
    );
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('joinSession claims free human seat for new uid', async () => {
    mockEnsureAnonymousAuth.mockResolvedValue({ uid: 'uid-joiner' });
    mockGet.mockResolvedValueOnce({ exists: () => true });
    mockRunTransaction.mockImplementationOnce(async (_ref, updateFn) => {
      const current = {
        variant: 'sueca',
        status: 'waiting',
        hostUid: 'uid-host',
        slots: [
          { type: 'human', name: 'Host', joined: true, uid: 'uid-host' },
          { type: 'human', name: 'Guest', joined: false },
          { type: 'ai', name: 'Bot', joined: true },
          { type: 'ai', name: 'Bot', joined: true }
        ]
      };
      const updated = updateFn(current);
      return {
        committed: true,
        snapshot: { val: () => updated }
      };
    });

    // Poison localStorage — must not override server assignment.
    localStorage.setItem('sueca-mp-local-index-ABCDE', '3');

    const result = await joinSession('ABCDE');
    expect(result.localPlayerIndex).toBe(1);
    expect(result.slots[1].uid).toBe('uid-joiner');
    expect(localStorage.getItem('sueca-mp-local-index-ABCDE')).toBe('1');
  });

  it('joinSession same uid rejoins same seat', async () => {
    mockEnsureAnonymousAuth.mockResolvedValue({ uid: 'uid-joiner' });
    mockGet.mockResolvedValueOnce({ exists: () => true });
    mockRunTransaction.mockImplementationOnce(async (_ref, updateFn) => {
      const current = {
        variant: 'sueca',
        status: 'waiting',
        hostUid: 'uid-host',
        slots: [
          { type: 'human', name: 'Host', joined: true, uid: 'uid-host' },
          { type: 'human', name: 'Guest', joined: true, uid: 'uid-joiner' },
          { type: 'ai', name: 'Bot', joined: true },
          { type: 'ai', name: 'Bot', joined: true }
        ]
      };
      const updated = updateFn(current);
      return {
        committed: true,
        snapshot: { val: () => updated }
      };
    });

    const result = await joinSession('ROOM2');
    expect(result.localPlayerIndex).toBe(1);
    expect(result.slots[1].uid).toBe('uid-joiner');
  });

  it('joinSession throws when lobby is full', async () => {
    mockEnsureAnonymousAuth.mockResolvedValue({ uid: 'uid-late' });
    mockGet.mockResolvedValueOnce({ exists: () => true });
    mockRunTransaction.mockImplementationOnce(async (_ref, updateFn) => {
      const current = {
        variant: 'sueca',
        status: 'waiting',
        hostUid: 'uid-host',
        slots: [
          { type: 'human', name: 'Host', joined: true, uid: 'uid-host' },
          { type: 'human', name: 'Guest', joined: true, uid: 'uid-joiner' },
          { type: 'ai', name: 'Bot', joined: true },
          { type: 'ai', name: 'Bot', joined: true }
        ]
      };
      const updated = updateFn(current);
      return {
        committed: false,
        snapshot: { val: () => updated ?? current }
      };
    });

    await expect(joinSession('FULL1')).rejects.toThrow('Session is full');
    expect(localStorage.getItem('sueca-mp-local-index-FULL1')).toBeNull();
  });

  it('pushAction appends to actions node', async () => {
    await pushAction('ROOM1', {
      type: 'playCard',
      playerIndex: 1,
      cardIndex: 2,
      clientId: 'client-1',
      at: 123,
      seatIndex: 1,
      uid: 'uid-joiner'
    });
    expect(mockPush).toHaveBeenCalled();
    expect(mockRef.mock.calls[0][1]).toBe('sessions/ROOM1/actions');
    const action = mockPush.mock.calls[0][1] as { seatIndex: number; uid: string };
    expect(action.seatIndex).toBe(1);
    expect(action.uid).toBe('uid-joiner');
  });

  it('endSession marks ended and clears runtime nodes', async () => {
    await endSession('ROOM1');
    expect(mockSet).toHaveBeenCalledTimes(3);
    const paths = mockRef.mock.calls.map((c) => c[1]);
    expect(paths).toContain('sessions/ROOM1/status');
    expect(paths).toContain('sessions/ROOM1/state');
    expect(paths).toContain('sessions/ROOM1/actions');
  });

  it('publishState still writes full GameState (no viewer transport yet)', async () => {
    const state = {
      players: [
        { id: 'p0', name: 'Host', team: 1, hand: [{ suit: 'hearts', rank: 'A', id: 'hA' }] },
        { id: 'p1', name: 'Guest', team: 2, hand: [{ suit: 'spades', rank: 'K', id: 'sK' }] },
        { id: 'p2', name: 'Bot1', team: 1, hand: [] },
        { id: 'p3', name: 'Bot2', team: 2, hand: [] }
      ],
      currentPlayerIndex: 0,
      dealerIndex: 0,
      trumpSuit: null,
      trumpCard: null,
      currentTrick: undefined,
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
      pendingRoundMultiplier: undefined
    } as unknown as GameState;

    await publishState('ROOM1', state);

    expect(mockSet).toHaveBeenCalledTimes(1);
    const payload = mockSet.mock.calls[0][1] as {
      players: Array<{ hand: Array<{ id: string }> }>;
    };
    expect(payload.players[0].hand[0].id).toBe('hA');
    expect(payload.players[1].hand[0].id).toBe('sK');
    expect(mockRef.mock.calls[0][1]).toBe('sessions/ROOM1/state');
  });

  it('multiplayerClient does not publish viewer-state paths', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'multiplayerClient.ts'),
      'utf8'
    );
    expect(source).not.toMatch(/buildViewerState|\/views\//);
  });
});
