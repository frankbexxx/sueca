import { GameAdapter } from '../../models/games/GameAdapter';
import { Card, GameState } from '../../types/game';
import { buildCardDecisionEvent } from './buildCardDecisionEvent';
import { resetRoundHistorySessionForTests } from './roundHistorySession';
import { resetTrickIndexTrackerForTests } from './resolveTrickIndex';

const card = (suit: Card['suit'], rank: Card['rank'], id: string): Card => ({
  suit,
  rank,
  id,
});

function mockAdapter(variant: GameAdapter['variant'] = 'sueca'): GameAdapter {
  return {
    variant,
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

function mockState(): GameState {
  const c1 = card('clubs', 'A', 'A-clubs');
  const c2 = card('hearts', '2', '2-hearts');
  return {
    players: [
      { id: 'p0', name: 'P0', hand: [c1, c2], team: 1, type: 'human' },
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

describe('buildCardDecisionEvent', () => {
  beforeEach(() => {
    resetRoundHistorySessionForTests();
    resetTrickIndexTrackerForTests();
  });

  it('builds logger v0 event with fixed classification and reason', () => {
    const adapter = mockAdapter();
    const before = mockState();
    const after = mockState();
    after.currentTrick = [before.players[0].hand[0]];

    const event = buildCardDecisionEvent({
      gameAdapter: adapter,
      stateBefore: before,
      stateAfter: after,
      playerIndex: 0,
      cardIndex: 0,
      gameId: 'game-1',
      sessionId: 'session-1',
      trickIndex: 0,
      gameConfigMode: 'sueca-pt-normal',
    });

    expect(event.schemaVersion).toBe('3.0.0');
    expect(event.classification).toBe('unknown');
    expect(event.reason).toBeNull();
    expect(event.aiSource).toBeNull();
    expect(event.chosenCard.id).toBe('A-clubs');
    expect(event.legalMoves.some((m) => m.id === event.chosenCard.id)).toBe(true);
    expect(event.roundPlayHistory).toHaveLength(1);
    expect(event.metricsCandidateIds).toContain('T01');
  });
});
