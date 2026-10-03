import { describe, expect, it, vi } from 'vitest';
import type { GameAdapter } from '../models/games/GameAdapter';
import type { GameState } from '../types/game';
import type { HeartsFlowController } from '../flow/heartsFlowController';
import {
  dispatchCanonicalCardAction,
  handleDomCardPhysicalActivation,
  handlePhaserCardPhysicalActivation,
  resolveDomHandIntent,
  resolvePhaserHandIntent,
  type CanonicalCardActionContext
} from './canonicalCardActions';

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    players: [
      {
        id: '1',
        name: 'P1',
        hand: [
          { suit: 'hearts', rank: 'A', id: 'hA' },
          { suit: 'clubs', rank: '2', id: 'c2' }
        ],
        team: 1,
        type: 'human'
      },
      {
        id: '2',
        name: 'P2',
        hand: [{ suit: 'spades', rank: '3', id: 's3' }],
        team: 2,
        type: 'ai'
      },
      {
        id: '3',
        name: 'P3',
        hand: [{ suit: 'diamonds', rank: '4', id: 'd4' }],
        team: 1,
        type: 'ai'
      },
      {
        id: '4',
        name: 'P4',
        hand: [{ suit: 'clubs', rank: '5', id: 'c5' }],
        team: 2,
        type: 'ai'
      }
    ],
    currentPlayerIndex: 0,
    dealerIndex: 1,
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
    isFirstTrick: false,
    dealingMethod: 'A',
    dealingDirection: 'left',
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    playedCards: [],
    isPaused: false,
    playerName: 'P1',
    aiDifficulty: 'medium',
    partnerSignals: [],
    ...overrides
  };
}

function makeCtx(
  partial: Partial<CanonicalCardActionContext> & {
    gameAdapter?: GameAdapter | null;
    gameState?: GameState;
  } = {}
): CanonicalCardActionContext {
  const gameState = partial.gameState ?? baseState();
  const canPlay = vi.fn(() => true);
  const playCard = vi.fn(() => true);
  const adapter = (partial.gameAdapter ?? {
    variant: 'sueca',
    getCurrentState: () => gameState,
    canPlayCard: canPlay,
    playCard,
    getVariantFlow: () => ({})
  }) as unknown as GameAdapter;

  return {
    gameAdapter: adapter,
    gameState,
    heartsCtrl: null,
    localPlayerIndex: 0,
    selectedCard: null,
    setSelectedCard: vi.fn(),
    syncGameStateFromAdapter: vi.fn(),
    isMultiplayer: false,
    isJoiner: false,
    isMultiplayerActive: false,
    multiplayerPlayerIndex: 0,
    suecaPlayReady: true,
    waitingForEarlyEnd: false,
    festaSheetActive: false,
    rulesPresetId: 'default',
    submitAction: vi.fn(),
    afterHostMutation: vi.fn(),
    playCardSound: vi.fn(),
    onIllegalOrFailedPlay: vi.fn(),
    source: 'dom',
    ...partial
  };
}

describe('canonicalCardActions intent translation', () => {
  it('DOM: first click selects; second click on same card activates', () => {
    expect(resolveDomHandIntent(1, null, false)).toEqual({ type: 'selectCard', cardIndex: 1 });
    expect(resolveDomHandIntent(1, 1, false)).toEqual({ type: 'activateCard', cardIndex: 1 });
    expect(resolveDomHandIntent(2, 1, false)).toEqual({ type: 'selectCard', cardIndex: 2 });
  });

  it('Phaser: legal tap/drop activates directly (no select)', () => {
    expect(resolvePhaserHandIntent(0, false)).toEqual({ type: 'activateCard', cardIndex: 0 });
    expect(resolvePhaserHandIntent(3, false)).toEqual({ type: 'activateCard', cardIndex: 3 });
  });

  it('Hearts pass: DOM and Phaser both toggle pass selection', () => {
    expect(resolveDomHandIntent(2, 2, true)).toEqual({
      type: 'togglePassSelection',
      cardIndex: 2
    });
    expect(resolvePhaserHandIntent(2, true)).toEqual({
      type: 'togglePassSelection',
      cardIndex: 2
    });
  });
});

describe('dispatchCanonicalCardAction', () => {
  it('selectCard updates semantic selection without playing', () => {
    const setSelectedCard = vi.fn();
    const afterHostMutation = vi.fn();
    const ctx = makeCtx({ setSelectedCard, afterHostMutation, source: 'dom' });
    const result = dispatchCanonicalCardAction({ type: 'selectCard', cardIndex: 0 }, ctx);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.effect).toBe('selected');
    expect(setSelectedCard).toHaveBeenCalledWith(0);
    expect(afterHostMutation).not.toHaveBeenCalled();
  });

  it('activateCard does not require prior selection (Phaser UX)', () => {
    const setSelectedCard = vi.fn();
    const afterHostMutation = vi.fn();
    const playCardSound = vi.fn();
    const ctx = makeCtx({
      selectedCard: null,
      setSelectedCard,
      afterHostMutation,
      playCardSound,
      source: 'phaser'
    });
    const result = dispatchCanonicalCardAction({ type: 'activateCard', cardIndex: 0 }, ctx);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.effect).toBe('played');
    expect(setSelectedCard).toHaveBeenCalledWith(null);
    expect(afterHostMutation).toHaveBeenCalled();
    expect(playCardSound).toHaveBeenCalled();
  });

  it('illegal activateCard does not play; feedback is presentation-only', () => {
    const gameState = baseState();
    const adapter = {
      variant: 'sueca',
      getCurrentState: () => gameState,
      canPlayCard: () => false,
      playCard: vi.fn(() => true),
      getVariantFlow: () => ({})
    } as unknown as GameAdapter;
    const onIllegal = vi.fn();
    const afterHostMutation = vi.fn();
    const ctx = makeCtx({
      gameAdapter: adapter,
      gameState,
      onIllegalOrFailedPlay: onIllegal,
      afterHostMutation,
      source: 'dom'
    });
    const result = dispatchCanonicalCardAction({ type: 'activateCard', cardIndex: 0 }, ctx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('illegal');
    expect(onIllegal).toHaveBeenCalled();
    expect(afterHostMutation).not.toHaveBeenCalled();
  });

  it('togglePassSelection uses hearts controller and does not activate play', () => {
    const sync = vi.fn();
    const afterHostMutation = vi.fn();
    const heartsCtrl: HeartsFlowController = {
      readState: () => ({ waitingForPass: true } as never),
      isPassing: () => true,
      togglePassCardIfPassing: vi.fn(() => true),
      confirmPass: () => false,
      releasePassExchange: () => undefined,
      resolveEarlyEnd: () => undefined
    };
    const ctx = makeCtx({
      heartsCtrl,
      syncGameStateFromAdapter: sync,
      afterHostMutation,
      source: 'phaser'
    });
    const result = dispatchCanonicalCardAction(
      { type: 'togglePassSelection', cardIndex: 1 },
      ctx
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.effect).toBe('passToggled');
    expect(heartsCtrl.togglePassCardIfPassing).toHaveBeenCalledWith(ctx.gameState, 1, 0);
    expect(sync).toHaveBeenCalled();
    expect(afterHostMutation).not.toHaveBeenCalled();
  });

  it('joiner activateCard uses existing submitAction playCard route (no second MP path)', () => {
    const submitAction = vi.fn();
    const afterHostMutation = vi.fn();
    const ctx = makeCtx({
      isMultiplayer: true,
      isJoiner: true,
      isMultiplayerActive: true,
      multiplayerPlayerIndex: 2,
      gameState: baseState({ currentPlayerIndex: 2 }),
      submitAction,
      afterHostMutation,
      source: 'dom'
    });
    const result = dispatchCanonicalCardAction({ type: 'activateCard', cardIndex: 0 }, ctx);
    expect(result.ok).toBe(true);
    expect(submitAction).toHaveBeenCalledWith({
      type: 'playCard',
      playerIndex: 2,
      cardIndex: 0
    });
    expect(afterHostMutation).not.toHaveBeenCalled();
  });
});

describe('physical activation helpers share the same dispatch vocabulary', () => {
  it('DOM two-step and Phaser one-step both reach activateCard semantics', () => {
    const setSelectedCard = vi.fn();
    let selected: number | null = null;
    const afterHostMutation = vi.fn();
    const playCardSound = vi.fn();

    const domCtx = makeCtx({
      get selectedCard() {
        return selected;
      },
      setSelectedCard: (i) => {
        selected = i;
        setSelectedCard(i);
      },
      afterHostMutation,
      playCardSound,
      source: 'dom'
    });

    const first = handleDomCardPhysicalActivation(0, domCtx);
    expect(first.ok && first.action.type === 'selectCard').toBe(true);
    expect(selected).toBe(0);

    const second = handleDomCardPhysicalActivation(0, {
      ...domCtx,
      selectedCard: selected
    });
    expect(second.ok && second.action.type === 'activateCard').toBe(true);
    expect(afterHostMutation).toHaveBeenCalledTimes(1);

    afterHostMutation.mockClear();
    selected = null;
    const phaser = handlePhaserCardPhysicalActivation(
      0,
      makeCtx({
        selectedCard: null,
        setSelectedCard: (i) => {
          selected = i;
        },
        afterHostMutation,
        playCardSound,
        source: 'phaser'
      })
    );
    expect(phaser.ok && phaser.action.type === 'activateCard').toBe(true);
    expect(afterHostMutation).toHaveBeenCalledTimes(1);
  });

  it('module has no Phaser/React/DOM imports', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const file = path.join(__dirname, 'canonicalCardActions.ts');
    const source = fs.readFileSync(file, 'utf8');
    const code = source
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('*') && !line.trimStart().startsWith('//'))
      .join('\n');
    expect(code).not.toMatch(/from\s+['"]react['"]/);
    expect(code).not.toMatch(/from\s+['"]phaser['"]/);
    expect(code).not.toMatch(/document\.|window\.|localStorage/);
    expect(code).not.toMatch(/from\s+['"][^'"]*sceneGeometry[^'"]*['"]/);
  });
});
