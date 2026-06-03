import { GameAdapter } from '../../models/games/GameAdapter';
import { Card, GameState } from '../../types/game';
import { LogEvent } from '../shared/types/logEvents';
import { setLogStoreForTests } from '../shared/storage/logStore';
import { LogStore } from '../shared/storage/logStore.localStorage';
import { resetLoggerSessionForTests } from '../logger/CardIntelligenceLogger';
import { playCardAndLogDecision } from '../logger/playWithLogging';
import { trickIndexTracker } from '../logger/resolveTrickIndex';
import { resetLogFailureCountForTests } from '../logger/logFailureTelemetry';
import {
  buildTrickEndEvent,
  isTrickJustClosed,
} from './trickEvents';
import { resetRoundHistoryEngineForTests, roundHistoryEngine } from './roundHistory';
import { heartsTrickPoints, suecaTrickPoints } from './historySelectors';

jest.mock('../../config/features', () => ({
  CARD_INTELLIGENCE_LOGGER_ENABLED: true,
}));

const card = (suit: Card['suit'], rank: Card['rank'], id: string): Card => ({
  suit,
  rank,
  id,
});

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    players: [
      { id: 'p0', name: 'P0', hand: [], team: 1, type: 'human' },
      { id: 'p1', name: 'P1', hand: [], team: 2, type: 'ai' },
      { id: 'p2', name: 'P2', hand: [], team: 1, type: 'ai' },
      { id: 'p3', name: 'P3', hand: [], team: 2, type: 'ai' },
    ],
    currentPlayerIndex: 0,
    dealerIndex: 0,
    trumpSuit: 'spades',
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
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    playedCards: [],
    isPaused: false,
    playerName: 'P0',
    aiDifficulty: 'medium',
    partnerSignals: [],
    variant: 'sueca',
    ...overrides,
  };
}

describe('isTrickJustClosed', () => {
  it('returns true when 4th card closes trick', () => {
    const before = baseState({
      currentTrick: [card('clubs', 'A', '1'), card('clubs', '2', '2'), card('clubs', '3', '3')],
    });
    const after = baseState({
      currentTrick: [
        card('clubs', 'A', '1'),
        card('clubs', '2', '2'),
        card('clubs', '3', '3'),
        card('clubs', 'K', '4'),
      ],
      waitingForTrickEnd: true,
      lastTrickWinner: 0,
    });
    expect(isTrickJustClosed(before, after)).toBe(true);
  });

  it('returns false on non-closing play', () => {
    const before = baseState({ currentTrick: [] });
    const after = baseState({
      currentTrick: [card('clubs', 'A', '1')],
      waitingForTrickEnd: false,
    });
    expect(isTrickJustClosed(before, after)).toBe(false);
  });

  it('returns true when stateBefore currentTrick was mutated (Sueca shallow copy)', () => {
    const trick = [
      card('clubs', 'A', '1'),
      card('clubs', '2', '2'),
      card('clubs', '3', '3'),
      card('clubs', 'K', '4'),
    ];
    const before = baseState({ currentTrick: trick, waitingForTrickEnd: false });
    const after = baseState({
      currentTrick: trick,
      waitingForTrickEnd: true,
      lastTrickWinner: 0,
    });
    expect(isTrickJustClosed(before, after)).toBe(true);
  });
});

describe('buildTrickEndEvent', () => {
  beforeEach(() => {
    resetRoundHistoryEngineForTests();
  });

  it('builds sueca trick with pointsInTrick and winnerIndex', () => {
    const trick = [
      card('clubs', 'A', '1'),
      card('clubs', '7', '2'),
      card('hearts', 'K', '3'),
      card('diamonds', '2', '4'),
    ];
    trick.forEach((c, turnIndex) => {
      roundHistoryEngine.recordPlay({
        roundIndex: 0,
        trickIndex: 0,
        turnIndex,
        playerIndex: turnIndex,
        card: c,
      });
    });

    const adapter: GameAdapter = { ...mockAdapterStub(), variant: 'sueca' };
    const stateAfter = baseState({
      currentTrick: trick,
      trickLeader: 0,
      lastTrickWinner: 2,
      waitingForTrickEnd: true,
      trumpSuit: 'spades',
    });

    const event = buildTrickEndEvent({
      gameAdapter: adapter,
      stateAfter,
      gameId: 'g1',
      sessionId: 's1',
      trickIndex: 0,
    });

    expect(event.eventType).toBe('trick_end');
    expect(event.winnerIndex).toBe(2);
    expect(event.plays).toHaveLength(4);
    expect(event.pointsInTrick).toBe(suecaTrickPoints(trick));
    expect(event.schemaVersion).toBe('3.0.0');
  });

  it('builds hearts trick points', () => {
    const trick = [
      card('hearts', '2', '1'),
      card('hearts', '3', '2'),
      card('spades', 'Q', '3'),
      card('clubs', '2', '4'),
    ];
    trick.forEach((c, turnIndex) => {
      roundHistoryEngine.recordPlay({
        roundIndex: 0,
        trickIndex: 0,
        turnIndex,
        playerIndex: turnIndex,
        card: c,
      });
    });

    const adapter: GameAdapter = { ...mockAdapterStub(), variant: 'hearts' };
    const stateAfter = baseState({
      variant: 'hearts',
      currentTrick: trick,
      lastTrickWinner: 1,
      waitingForTrickEnd: true,
      variantState: {
        hearts: {
          heartsBroken: true,
          roundPoints: [0, 0, 0, 0],
        },
      },
    });

    const event = buildTrickEndEvent({
      gameAdapter: adapter,
      stateAfter,
      gameId: 'g1',
      sessionId: 's1',
      trickIndex: 0,
    });

    expect(event.pointsInTrick).toBe(heartsTrickPoints(trick));
    expect(event.variantFields).toMatchObject({
      heartsBroken: true,
      queenSpadesInTrick: true,
    });
  });

  it('builds king simplified variantFields', () => {
    const trick = [0, 1, 2, 3].map((i) => card('clubs', '2', `c-${i}`));
    trick.forEach((c, turnIndex) => {
      roundHistoryEngine.recordPlay({
        roundIndex: 0,
        trickIndex: 0,
        turnIndex,
        playerIndex: turnIndex,
        card: c,
      });
    });

    const adapter: GameAdapter = { ...mockAdapterStub(), variant: 'king' };
    const stateAfter = baseState({
      variant: 'king',
      currentTrick: trick,
      lastTrickWinner: 0,
      waitingForTrickEnd: true,
      variantState: {
        kingSimplified: {
          handIndex: 0,
          handType: 'negative',
          trumpSuit: 'clubs',
          playerScores: [0, 0, 0, 0],
        },
      },
    });

    const event = buildTrickEndEvent({
      gameAdapter: adapter,
      stateAfter,
      gameId: 'g1',
      sessionId: 's1',
      trickIndex: 0,
    });

    expect(event.variantFields).toMatchObject({
      engine: 'king_simplified',
      handType: 'negative',
      trickScoreDelta: -5,
    });
  });
});

describe('playWithLogging TrickEnd persistence', () => {
  let events: LogEvent[];

  beforeEach(() => {
    events = [];
    resetLoggerSessionForTests();
    resetLogFailureCountForTests();
    setLogStoreForTests({
      appendEvent: async (event) => {
        events.push(event);
      },
    } as LogStore);
  });

  afterEach(() => {
    setLogStoreForTests(null);
  });

  it('emits CardDecision and TrickEnd on 4th card', async () => {
    const trickSoFar = [
      card('clubs', 'A', '1'),
      card('clubs', '2', '2'),
      card('clubs', '3', '3'),
    ];
    const hand = [card('clubs', 'K', '4')];
    let state = baseState({
      currentTrick: trickSoFar,
      trickLeader: 0,
      currentPlayerIndex: 3,
      players: [
        { id: 'p0', name: 'P0', hand, team: 1, type: 'human' },
        { id: 'p1', name: 'P1', hand: [], team: 2, type: 'ai' },
        { id: 'p2', name: 'P2', hand: [], team: 1, type: 'ai' },
        { id: 'p3', name: 'P3', hand: [], team: 2, type: 'ai' },
      ],
    });

    const adapter: GameAdapter = {
      ...mockAdapterStub(),
      variant: 'sueca',
      getCurrentState: jest.fn(() => ({
        ...state,
        players: state.players.map((p) => ({ ...p, hand: [...p.hand] })),
        currentTrick: [...state.currentTrick],
      })),
      canPlayCard: jest.fn((_s, _p, cardIndex) => cardIndex === 0),
      playCard: jest.fn((_s, playerIndex, cardIndex) => {
        if (cardIndex !== 0) return false;
        const played = state.players[playerIndex].hand.splice(0, 1)[0];
        state = {
          ...state,
          currentTrick: [...state.currentTrick, played],
          waitingForTrickEnd: true,
          lastTrickWinner: 0,
        };
        return true;
      }),
    };

    const stateBefore = {
      ...state,
      players: state.players.map((p) => ({ ...p, hand: [...p.hand] })),
      currentTrick: [...state.currentTrick],
    };

    trickIndexTracker.resolve(0, 0);

    playCardAndLogDecision(adapter, stateBefore, 0, 0);

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(events.length).toBeGreaterThanOrEqual(2);
    const decision = events.find(
      (e) => !('eventType' in e) || (e as { eventType?: string }).eventType !== 'trick_end'
    );
    const trickEnd = events.find(
      (e): e is Extract<LogEvent, { eventType: 'trick_end' }> =>
        'eventType' in e && e.eventType === 'trick_end'
    );
    expect(decision).toBeDefined();
    expect(trickEnd).toBeDefined();
    if (trickEnd && 'eventType' in trickEnd && trickEnd.eventType === 'trick_end') {
      expect(trickEnd.plays).toHaveLength(4);
      expect(trickEnd.winnerIndex).toBe(0);
    }
  });
});

function mockAdapterStub(): GameAdapter {
  return {
    variant: 'sueca',
    initialize: jest.fn(),
    getCurrentState: jest.fn(),
    canPlayCard: jest.fn(() => true),
    playCard: jest.fn(),
    finishTrick: jest.fn(),
    continueToNextRound: jest.fn(),
    startRound: jest.fn(),
    chooseAICard: jest.fn(),
    pauseGame: jest.fn(),
    resumeGame: jest.fn(),
    quitGame: jest.fn(),
    updatePlayerNames: jest.fn(),
    getPlayerHand: jest.fn(),
    getPlayers: jest.fn(),
    getState: jest.fn(),
    restoreState: jest.fn(),
  };
}
