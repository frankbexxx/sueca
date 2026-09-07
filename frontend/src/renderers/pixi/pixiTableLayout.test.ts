import {
  buildPixiTableLayout,
  layoutLocalHandPositions,
  layoutOpponentBackPositions,
  layoutTrickSlot,
  playerIndexToCompass
} from './pixiTableLayout';
import { cardTextureKey, mapTableModelToPixiView } from './mapTableModelToPixiView';
import { shouldUseSuecaPixiTable, isPixiArchiveRendererRequested } from './rendererFlag';
import type { TableRenderModel } from '../../table/tableRenderModel';
import type { Card } from '../../types/game';
import { resolveGameBoardFlow } from '../../utils/gameFlowOrchestrator';
import { easeOutCubic, PixiTweenRunner } from './pixiTween';

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
      showContinueTrick: false,
      showContinueRound: false,
      showContinueGame: false
    },
    chrome: {
      showLocalHand: true,
      handReadOnly: false,
      showDock: true,
      showSpadesBidUi: false
    },
    variantUi: { kind: 'sueca' }
  };
  return { ...base, ...overrides };
}

describe('pixiTableLayout', () => {
  it('maps seats relative to local south', () => {
    expect(playerIndexToCompass(0, 0)).toBe('south');
    expect(playerIndexToCompass(1, 0)).toBe('west');
    expect(playerIndexToCompass(2, 0)).toBe('north');
    expect(playerIndexToCompass(3, 0)).toBe('east');
  });

  it('builds stable hand and trick positions', () => {
    const layout = buildPixiTableLayout(640, 480);
    const hand = layoutLocalHandPositions(10, layout);
    expect(hand).toHaveLength(10);
    expect(hand[0].x).toBeLessThan(hand[9].x);
    const northBacks = layoutOpponentBackPositions(5, 'north', layout);
    expect(northBacks).toHaveLength(5);
    expect(layoutTrickSlot('south', layout).y).toBeGreaterThan(layout.center.y);
  });
});

describe('mapTableModelToPixiView', () => {
  it('maps card identity and seat roles', () => {
    const model = minimalModel();
    const view = mapTableModelToPixiView({
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
    expect(view.dealerSeat).toBe(1);
    expect(view.activeSeat).toBe(0);
  });

  it('disables interaction while waiting for trick end', () => {
    const model = minimalModel({
      status: {
        ...minimalModel().status,
        waitingForTrickEnd: true,
        flowKind: 'trick_end_wait'
      }
    });
    const view = mapTableModelToPixiView({ model, width: 640, height: 480 });
    expect(view.interactionEnabled).toBe(false);
    expect(view.waitingForTrickEnd).toBe(true);
  });
});

describe('rendererFlag', () => {
  it('only enables for Sueca when archive flag is requested', () => {
    expect(shouldUseSuecaPixiTable('spades')).toBe(false);
    expect(shouldUseSuecaPixiTable('hearts')).toBe(false);
    expect(shouldUseSuecaPixiTable('king')).toBe(false);
    expect(shouldUseSuecaPixiTable('sueca')).toBe(false);
    expect(isPixiArchiveRendererRequested()).toBe(false);
  });
});

describe('pixiTween', () => {
  it('lerps target props to completion', () => {
    const target = { x: 0, y: 0, alpha: 1 };
    const runner = new PixiTweenRunner();
    let done = false;
    runner.add({
      target,
      to: { x: 100, y: 50 },
      durationMs: 100,
      ease: easeOutCubic,
      onComplete: () => {
        done = true;
      }
    });
    runner.update(50);
    expect(target.x).toBeGreaterThan(0);
    expect(target.x).toBeLessThan(100);
    runner.update(50);
    expect(target.x).toBe(100);
    expect(target.y).toBe(50);
    expect(done).toBe(true);
  });
});
