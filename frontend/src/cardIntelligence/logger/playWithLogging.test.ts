import { GameAdapter } from '../../models/games/GameAdapter';
import { Card, GameState } from '../../types/game';
import { CardDecisionLogEvent } from '../shared/types/logEvents';
import { appendLogEvent, setLogStoreForTests } from '../shared/storage/logStore';
import { LogStore } from '../shared/storage/logStore.localStorage';
import {
  getLogFailureCount,
  playCardAndLogDecision,
  playFirstLegalAndLogDecision,
  resetLoggerSessionForTests,
} from './index';
import { resetLogFailureCountForTests } from './logFailureTelemetry';

jest.mock('../../config/features', () => ({
  CARD_INTELLIGENCE_LOGGER_ENABLED: true,
}));

const card = (suit: Card['suit'], rank: Card['rank'], id: string): Card => ({
  suit,
  rank,
  id,
});

function mockState(hand: Card[]): GameState {
  const clonedHand = hand.map((c) => ({ ...c }));
  return {
    players: [
      { id: 'p0', name: 'P0', hand: clonedHand, team: 1, type: 'human' },
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
  };
}

function createMockAdapter(
  hand: Card[],
  playBehavior: (playerIndex: number, cardIndex: number) => boolean
): GameAdapter {
  let state = mockState(hand);
  return {
    variant: 'sueca',
    initialize: jest.fn(),
    getCurrentState: jest.fn(() => ({
      ...state,
      players: state.players.map((p, i) =>
        i === 0 ? { ...p, hand: [...p.hand] } : { ...p, hand: [...p.hand] }
      ),
      currentTrick: [...state.currentTrick],
    })),
    canPlayCard: jest.fn((_s, playerIndex, cardIndex) => {
      const player = state.players[playerIndex];
      return Boolean(player && cardIndex >= 0 && cardIndex < player.hand.length);
    }),
    playCard: jest.fn((_s, playerIndex, cardIndex) => {
      const ok = playBehavior(playerIndex, cardIndex);
      if (ok) {
        const played = state.players[playerIndex].hand.splice(cardIndex, 1)[0];
        state = {
          ...state,
          currentTrick: [...state.currentTrick, played],
          currentPlayerIndex: 1,
        };
      }
      return ok;
    }),
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

describe('playWithLogging', () => {
  let events: CardDecisionLogEvent[];

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

  it('playCardAndLogDecision logs event with chosenCard in legalMoves on success', async () => {
    const hand = [card('clubs', 'A', 'A-clubs'), card('hearts', '2', '2-hearts')];
    const adapter = createMockAdapter(hand, () => true);

    const played = playCardAndLogDecision(adapter, mockState(hand), 0, 0, {
      gameConfigMode: 'sueca-pt-normal',
    });

    expect(played).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(events).toHaveLength(1);
    expect(events[0].chosenCard.id).toBe('A-clubs');
    expect(events[0].legalMoves.some((m) => m.id === events[0].chosenCard.id)).toBe(true);
    expect(getLogFailureCount()).toBe(0);
  });

  it('playCardAndLogDecision does not log when play fails', async () => {
    const hand = [card('clubs', 'A', 'A-clubs')];
    const adapter = createMockAdapter(hand, () => false);

    const played = playCardAndLogDecision(adapter, mockState(hand), 0, 0);

    expect(played).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(events).toHaveLength(0);
    expect(getLogFailureCount()).toBe(0);
  });

  it('playCardAndLogDecision returns true when log fails without affecting play', async () => {
    const hand = [card('clubs', 'A', 'A-clubs')];
    const adapter = createMockAdapter(hand, () => true);
    setLogStoreForTests({
      appendEvent: async () => {
        throw new Error('store reject');
      },
    } as LogStore);

    const played = playCardAndLogDecision(adapter, mockState(hand), 0, 0);

    expect(played).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getLogFailureCount()).toBe(1);
  });

  it('playFirstLegalAndLogDecision logs when second index is legal', async () => {
    const hand = [
      card('clubs', 'A', 'A-clubs'),
      card('hearts', '2', '2-hearts'),
    ];
    const adapter = createMockAdapter(hand, (_p, idx) => idx === 1);

    const idx = playFirstLegalAndLogDecision(adapter, mockState(hand), 0);

    expect(idx).toBe(1);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(events).toHaveLength(1);
    expect(events[0].chosenCard.id).toBe('2-hearts');
  });
});

describe('playWithLogging logger disabled', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('playCardAndLogDecision plays without logging when flag is off', async () => {
    jest.doMock('../../config/features', () => ({
      CARD_INTELLIGENCE_LOGGER_ENABLED: false,
    }));

    const { playCardAndLogDecision: playDisabled } = await import('./playWithLogging');
    const events: CardDecisionLogEvent[] = [];
    setLogStoreForTests({
      appendEvent: async (event) => {
        events.push(event);
      },
    } as LogStore);

    const hand = [card('clubs', 'A', 'A-clubs')];
    const adapter = createMockAdapter(hand, () => true);
    const played = playDisabled(adapter, mockState(hand), 0, 0);

    expect(played).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(events).toHaveLength(0);

    setLogStoreForTests(null);
    jest.dontMock('../../config/features');
  });
});
