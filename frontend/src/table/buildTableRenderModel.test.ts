import { buildTableRenderModel } from './buildTableRenderModel';
import { resolveGameBoardFlow } from '../utils/gameFlowOrchestrator';
import { GameState } from '../types/game';
import {
  mapTableModelToDomDockProps,
  mapTableModelToDomHandProps,
  mapTableModelToDomSurfaceProps
} from './mapTableModelToDomProps';

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    players: [
      { id: '1', name: 'South', hand: [{ suit: 'hearts', rank: 'A', id: 'hA' }], team: 1, type: 'human' },
      { id: '2', name: 'West', hand: [], team: 2, type: 'ai' },
      { id: '3', name: 'North', hand: [], team: 1, type: 'ai' },
      { id: '4', name: 'East', hand: [], team: 2, type: 'ai' }
    ],
    currentPlayerIndex: 0,
    dealerIndex: 2,
    trumpSuit: 'spades',
    trumpCard: { suit: 'spades', rank: '2', id: 's2' },
    currentTrick: [
      { suit: 'clubs', rank: '7', id: 'c7' },
      { suit: 'clubs', rank: 'A', id: 'cA' }
    ],
    trickLeader: 1,
    scores: { team1: 10, team2: 20 },
    gameScore: { team1: 1, team2: 2 },
    completedPentes: [],
    round: 3,
    isGameOver: false,
    winner: null,
    lastTrickWinner: null,
    waitingForTrickEnd: false,
    nextTrickLeader: null,
    isFirstTrick: false,
    dealingMethod: 'A',
    dealingDirection: 'left',
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    playedCards: [],
    isPaused: false,
    playerName: 'South',
    aiDifficulty: 'medium',
    partnerSignals: [],
    ...overrides
  };
}

describe('buildTableRenderModel', () => {
  it('maps seats, trick, trump, and scores from the engine snapshot', () => {
    const gameState = baseState();
    const boardFlow = resolveGameBoardFlow({ variant: 'sueca', gameState });
    const model = buildTableRenderModel({
      gameState,
      variant: 'sueca',
      localPlayerIndex: 0,
      usTeam: 1,
      themTeam: 2,
      boardFlow
    });

    expect(model.variant).toBe('sueca');
    expect(model.dealerSeat).toBe(2);
    expect(model.leaderSeat).toBe(1);
    expect(model.activeSeat).toBe(0);
    expect(model.trumpSuit).toBe('spades');
    expect(model.localHand).toHaveLength(1);
    expect(model.currentTrick).toEqual([
      { card: gameState.currentTrick[0], playerIndex: 1, orderIndex: 0 },
      { card: gameState.currentTrick[1], playerIndex: 2, orderIndex: 1 }
    ]);
    expect(model.seats[0]).toMatchObject({
      isLocal: true,
      isActive: true,
      isDealer: false,
      isTrickLeader: false,
      handCount: 1
    });
    expect(model.seats[2].isDealer).toBe(true);
    expect(model.seats[1].isTrickLeader).toBe(true);
    expect(model.scores.round).toBe(3);
    expect(model.chrome.isTeamTableLayout).toBe(true);
    expect(model.chrome.showTeamLabels).toBe(true);
  });

  it('clears active seat during trick-end wait (B1/B7 contract)', () => {
    const gameState = baseState({ waitingForTrickEnd: true, currentPlayerIndex: 0 });
    const boardFlow = resolveGameBoardFlow({ variant: 'sueca', gameState });
    const model = buildTableRenderModel({
      gameState,
      variant: 'sueca',
      localPlayerIndex: 0,
      usTeam: 1,
      themTeam: 2,
      boardFlow
    });
    expect(model.status.flowKind).toBe('trick_end_wait');
    expect(model.activeSeat).toBeNull();
    expect(model.status.showTrickContinueCta).toBe(true);
  });

  it('sets hearts pass chrome and suppresses active seats', () => {
    const gameState = baseState({
      variantState: {
        hearts: {
          waitingForPass: true,
          heartsBroken: false,
          playerScores: [0, 0, 0, 0],
          roundPoints: [0, 0, 0, 0],
          lastRoundDeltas: [0, 0, 0, 0],
          passDirection: 'left',
          humanPassIndices: [0, 2],
          heartsTakenCount: 0,
          queenSpadesTaken: false,
          penaltyCardsTaken: [[], [], [], []],
          waitingForEarlyEnd: false,
          scoringFrozen: false,
          earlyEndOffered: false
        }
      }
    });
    const boardFlow = resolveGameBoardFlow({ variant: 'hearts', gameState });
    const model = buildTableRenderModel({
      gameState,
      variant: 'hearts',
      localPlayerIndex: 0,
      usTeam: 1,
      themTeam: 2,
      boardFlow,
      heartsPassIndices: [0, 2]
    });
    expect(model.status.heartsPassActive).toBe(true);
    expect(model.chrome.compactSeats).toBe(true);
    expect(model.activeSeat).toBeNull();
    expect(model.variantUi.heartsPassIndices).toEqual([0, 2]);
    expect(model.chrome.boardModifiers).toContain('game-board--hearts-pass');
  });

  it('enables king auction badges only during auction festa phase', () => {
    const gameState = baseState({ waitingForRoundStart: true });
    const boardFlow = resolveGameBoardFlow({
      variant: 'king',
      gameState,
      rulesPresetId: 'king-pt-normal'
    });
    const model = buildTableRenderModel({
      gameState,
      variant: 'king',
      rulesPresetId: 'king-pt-normal',
      localPlayerIndex: 0,
      usTeam: 1,
      themTeam: 2,
      boardFlow,
      kingPt: {
        festaPhase: 'auction',
        auctionPlayerActions: { 1: 'pass' }
      } as never
    });
    expect(model.chrome.showAuctionBadges).toBe(true);
    expect(model.variantUi.auctionActions).toEqual({ 1: 'pass' });
  });
});

describe('mapTableModelToDomProps', () => {
  it('projects chrome into DOM surface/dock/hand props without mutating model', () => {
    const gameState = baseState();
    const boardFlow = resolveGameBoardFlow({ variant: 'sueca', gameState });
    const model = buildTableRenderModel({
      gameState,
      variant: 'sueca',
      localPlayerIndex: 0,
      usTeam: 1,
      themTeam: 2,
      boardFlow
    });
    const surface = mapTableModelToDomSurfaceProps(model, gameState);
    const dock = mapTableModelToDomDockProps(model, gameState);
    const hand = mapTableModelToDomHandProps(model);
    expect(surface.showTeamLabels).toBe(true);
    expect(dock.localPlayerIndex).toBe(0);
    expect(hand.readOnly).toBe(false);
    expect(model.seats).toHaveLength(4);
  });
});
