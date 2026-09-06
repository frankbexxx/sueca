import {
  buildPhaserTableLayout,
  layoutLocalHandPositions,
  layoutOpponentBackPositions,
  layoutTrickSlot,
  playerIndexToCompass
} from './phaserTableLayout';
import { cardTextureKey, mapTableModelToPhaserView } from './mapTableModelToPhaserView';
import { shouldUseSuecaPhaserTable } from './rendererFlag';
import type { TableRenderModel } from '../../table/tableRenderModel';
import type { Card } from '../../types/game';
import { resolveGameBoardFlow } from '../../utils/gameFlowOrchestrator';

function minimalModel(overrides: Partial<TableRenderModel> = {}): TableRenderModel {
  const gameState = {
    players: [
      { id: '1', name: 'P1', hand: [{ suit: 'hearts', rank: 'A', id: 'hA' } as Card], team: 1 as const, type: 'human' as const },
      { id: '2', name: 'P2', hand: [], team: 2 as const, type: 'ai' as const },
      { id: '3', name: 'P3', hand: [], team: 1 as const, type: 'ai' as const },
      { id: '4', name: 'P4', hand: [], team: 2 as const, type: 'ai' as const }
    ],
    currentPlayerIndex: 0,
    dealerIndex: 1,
    trumpSuit: 'spades' as const,
    trumpCard: null,
    currentTrick: [{ suit: 'clubs', rank: '7', id: 'c7' } as Card],
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
    isFirstTrick: false,
    dealingMethod: 'A' as const,
    dealingDirection: 'left' as const,
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    playedCards: [],
    isPaused: false,
    playerName: 'P1',
    aiDifficulty: 'medium' as const,
    partnerSignals: []
  };

  const boardFlow = resolveGameBoardFlow({ variant: 'sueca', gameState });
  const base: TableRenderModel = {
    variant: 'sueca',
    localPlayerIndex: 0,
    usTeam: 1,
    themTeam: 2,
    seats: [
      { index: 0, name: 'P1', team: 1, isLocal: true, isActive: true, isDealer: false, isTrickLeader: true, handCount: 1 },
      { index: 1, name: 'P2', team: 2, isLocal: false, isActive: false, isDealer: true, isTrickLeader: false, handCount: 9 },
      { index: 2, name: 'P3', team: 1, isLocal: false, isActive: false, isDealer: false, isTrickLeader: false, handCount: 10 },
      { index: 3, name: 'P4', team: 2, isLocal: false, isActive: false, isDealer: false, isTrickLeader: false, handCount: 10 }
    ],
    localHand: [{ suit: 'hearts', rank: 'A', id: 'hA' }],
    currentTrick: [
      { card: { suit: 'clubs', rank: '7', id: 'c7' }, playerIndex: 0, orderIndex: 0 }
    ],
    activeSeat: 0,
    dealerSeat: 1,
    leaderSeat: 0,
    trumpSuit: 'spades',
    trumpCard: null,
    scores: { roundPoints: { team1: 0, team2: 0 }, gamePoints: { team1: 0, team2: 0 }, round: 1 },
    status: {
      flowKind: boardFlow.kind,
      isPaused: false,
      isGameOver: false,
      waitingForTrickEnd: false,
      waitingForRoundStart: false,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      heartsPassActive: false,
      spadesBidActive: false,
      festaSheetActive: false,
      flowOverlayActive: false,
      showTrickContinueCta: false,
      showTrickContinueChrome: false
    },
    chrome: {
      showTeamLabels: true,
      isTeamTableLayout: true,
      compactSeats: false,
      spadesBidPhase: false,
      showAuctionBadges: false,
      auctionLocale: 'pt',
      handReadOnly: false,
      boardModifiers: ['game-board--team-table']
    },
    variantUi: {}
  };
  return { ...base, ...overrides };
}

describe('phaserTableLayout', () => {
  it('maps seats relative to local player', () => {
    expect(playerIndexToCompass(0, 0)).toBe('south');
    expect(playerIndexToCompass(1, 0)).toBe('west');
    expect(playerIndexToCompass(2, 0)).toBe('north');
    expect(playerIndexToCompass(3, 0)).toBe('east');
  });

  it('fans local hand and places trick slots', () => {
    const layout = buildPhaserTableLayout(800, 600);
    const hand = layoutLocalHandPositions(10, layout);
    expect(hand).toHaveLength(10);
    expect(hand[0].x).toBeLessThan(hand[9].x);
    expect(layoutTrickSlot('south', layout).y).toBeGreaterThan(layout.center.y);
    expect(layoutOpponentBackPositions(5, 'north', layout)).toHaveLength(5);
  });
});

describe('mapTableModelToPhaserView', () => {
  it('builds card identity keys and view entities from the model', () => {
    const model = minimalModel();
    const view = mapTableModelToPhaserView({
      model,
      width: 640,
      height: 480,
      selectedCardIndex: 0,
      isLocalCardPlayable: () => true
    });
    expect(view.localHand).toHaveLength(1);
    expect(view.localHand[0].textureKey).toBe(cardTextureKey(model.localHand[0]));
    expect(view.localHand[0].selected).toBe(true);
    expect(view.opponents).toHaveLength(3);
    expect(view.trick[0].compass).toBe('south');
    expect(view.trumpLabel).toContain('Trunfo');
    expect(view.interactionEnabled).toBe(true);
  });

  it('disables interaction while waiting for trick end', () => {
    const model = minimalModel({
      status: {
        ...minimalModel().status,
        waitingForTrickEnd: true,
        flowKind: 'trick_end_wait'
      }
    });
    const view = mapTableModelToPhaserView({ model, width: 640, height: 480 });
    expect(view.interactionEnabled).toBe(false);
    expect(view.waitingForTrickEnd).toBe(true);
  });
});

describe('rendererFlag', () => {
  it('only enables for Sueca when flag is requested', () => {
    expect(shouldUseSuecaPhaserTable('spades')).toBe(false);
    expect(shouldUseSuecaPhaserTable('hearts')).toBe(false);
    expect(shouldUseSuecaPhaserTable('king')).toBe(false);
  });
});
