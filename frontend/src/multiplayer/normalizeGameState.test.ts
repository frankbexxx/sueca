import { GameState } from '../types/game';
import { normalizeGameState } from './normalizeGameState';

function minimalFullState(): GameState {
  return {
    players: [
      { id: 'p0', name: 'Host', hand: [], team: 1, type: 'human' },
      { id: 'p1', name: 'Guest', hand: [], team: 2, type: 'remote' },
      { id: 'p2', name: 'Bot1', hand: [], team: 1, type: 'ai' },
      { id: 'p3', name: 'Bot2', hand: [], team: 2, type: 'ai' },
    ],
    currentPlayerIndex: 1,
    dealerIndex: 0,
    trumpSuit: null,
    trumpCard: null,
    currentTrick: [],
    trickLeader: 1,
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
    playerName: 'Host',
    aiDifficulty: 'medium',
    partnerSignals: [],
    variant: 'sueca',
  };
}

describe('normalizeGameState', () => {
  it('round-trips undefined fields through JSON.stringify like sanitizeForRtdb', () => {
    const fullState = minimalFullState();
    const hostState = {
      ...fullState,
      currentTrick: undefined,
      playedCards: undefined,
      partnerSignals: undefined,
      players: fullState.players.map((p) => ({ ...p, hand: undefined })),
    };

    const afterRtdb = JSON.parse(JSON.stringify(hostState)) as Partial<GameState>;
    const fixed = normalizeGameState(afterRtdb);

    expect(fixed.currentTrick).toEqual([]);
    expect(fixed.playedCards).toEqual([]);
    expect(fixed.partnerSignals).toEqual([]);
    expect(fixed.players).toHaveLength(4);
    expect(fixed.players.every((p) => Array.isArray(p.hand))).toBe(true);
    expect(fixed.waitingForRoundStart).toBe(true);
  });

  it('is idempotent on a complete state', () => {
    const full = minimalFullState();
    full.players[0].hand = [{ suit: 'hearts', rank: 'A', id: 'hA' }];
    const once = normalizeGameState(full);
    const twice = normalizeGameState(once);
    expect(twice).toEqual(once);
    expect(twice.players[0].hand).toHaveLength(1);
  });

  it('pads players to four and warns', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.REACT_APP_DEBUG_MP = 'true';

    const fixed = normalizeGameState({
      ...minimalFullState(),
      players: [
        { id: 'p0', name: 'Host', hand: [], team: 1 },
        { id: 'p1', name: 'Guest', hand: [], team: 2 },
      ],
    });

    expect(fixed.players).toHaveLength(4);
    expect(fixed.players[2].name).toBe('Player 3');
    expect(warnSpy).toHaveBeenCalledWith(
      '[MP] normalize padded players',
      expect.objectContaining({ had: 2 })
    );

    warnSpy.mockRestore();
    delete process.env.REACT_APP_DEBUG_MP;
  });

  it('defaults booleans to false when absent', () => {
    const fixed = normalizeGameState({
      players: minimalFullState().players,
    } as Partial<GameState>);
    expect(fixed.isGameOver).toBe(false);
    expect(fixed.waitingForTrickEnd).toBe(false);
    expect(fixed.isPaused).toBe(false);
  });
});
