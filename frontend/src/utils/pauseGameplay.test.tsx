import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { Game } from '../models/Game';
import { SpadesGame } from '../models/games/SpadesGame';
import { HeartsGame, getHeartsState } from '../models/games/HeartsGame';
import { KingPtGame, getKingPtState } from '../models/games/KingPtGame';
import { GameActions } from '../components/GameActions';
import { schedulePauseGatedAction } from './pauseGatedTimer';
import { GameState } from '../types/game';
import { STORAGE_KEYS, TRICK_AUTO_CONTINUE_SECONDS } from '../constants/gameConstants';

function card(id: string, rank: '2' | 'A', suit: 'clubs' | 'hearts' | 'spades' | 'diamonds') {
  return { id, rank, suit };
}

describe('schedulePauseGatedAction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not fire while paused, then fires once after a fresh delay', () => {
    let paused = true;
    let calls = 0;
    let cancel = schedulePauseGatedAction(paused, 1500, () => !paused, () => {
      calls += 1;
    });
    vi.advanceTimersByTime(20_000);
    expect(calls).toBe(0);
    cancel();

    paused = false;
    cancel = schedulePauseGatedAction(paused, 1500, () => !paused, () => {
      calls += 1;
    });
    vi.advanceTimersByTime(1499);
    expect(calls).toBe(0);
    vi.advanceTimersByTime(1);
    expect(calls).toBe(1);
    vi.advanceTimersByTime(20_000);
    expect(calls).toBe(1);
    cancel();
  });

  it('drops a callback that was armed and then paused', () => {
    let paused = false;
    let calls = 0;
    const cancel = schedulePauseGatedAction(false, 350, () => !paused, () => {
      calls += 1;
    });
    paused = true;
    vi.advanceTimersByTime(350);
    expect(calls).toBe(0);
    cancel();
  });
});

describe('pause freezes card play', () => {
  it('Sueca plays no card while paused and exactly one after resume', () => {
    const game = new Game(['Ana', 'Bruno', 'Carla', 'Diogo']);
    game.startRound();
    const internal = game as unknown as { state: GameState };
    internal.state.currentPlayerIndex = 1;
    internal.state.trickLeader = 1;
    internal.state.currentTrick = [];
    internal.state.waitingForTrickEnd = false;
    internal.state.waitingForRoundStart = false;
    internal.state.players[1].hand = [card('c2', '2', 'clubs')];
    internal.state.isPaused = true;
    expect(game.playCard(1, 0)).toBe(false);
    expect(internal.state.players[1].hand).toHaveLength(1);
    internal.state.isPaused = false;
    expect(game.playCard(1, 0)).toBe(true);
    expect(game.getState().players[1].hand).toHaveLength(0);
    expect(game.playCard(1, 0)).toBe(false);
  });

  it('Spades, Hearts, and King refuse a card while paused', () => {
    const spades = new SpadesGame();
    const spadesState = spades.initialize(['A', 'B', 'C', 'D'], {});
    const spadesInternal = spades as unknown as { state: GameState };
    spadesInternal.state = spadesState;
    spadesState.waitingForRoundStart = false;
    spadesState.currentPlayerIndex = 1;
    spadesState.currentTrick = [];
    spadesState.players[1].hand = [card('h2', '2', 'hearts')];
    const spadesVs = spadesState.variantState?.spades as {
      waitingForBids: boolean;
      playerBids: Array<number | null>;
    };
    spadesVs.waitingForBids = false;
    spadesVs.playerBids = [1, 1, 1, 1];
    spadesState.isPaused = true;
    expect(spades.playCard(spadesState, 1, 0)).toBe(false);
    expect(spadesState.players[1].hand).toHaveLength(1);
    spadesState.isPaused = false;
    expect(spades.playCard(spadesState, 1, 0)).toBe(true);

    const hearts = new HeartsGame();
    hearts.initialize(['A', 'B', 'C', 'D'], {});
    const heartsInternal = hearts as unknown as { state: GameState };
    const hs = heartsInternal.state;
    hs.waitingForRoundStart = false;
    hs.isFirstTrick = false;
    hs.currentPlayerIndex = 1;
    hs.currentTrick = [];
    hs.players[1].hand = [card('c2', '2', 'clubs')];
    const heartsVs = getHeartsState(hs);
    heartsVs.waitingForPass = false;
    heartsVs.passExchangeUntilMs = null;
    hs.variantState = { ...hs.variantState, hearts: heartsVs };
    hs.isPaused = true;
    expect(hearts.playCard(hs, 1, 0)).toBe(false);
    expect(hs.players[1].hand).toHaveLength(1);
    hs.isPaused = false;
    expect(hearts.playCard(hs, 1, 0)).toBe(true);

    const king = new KingPtGame();
    king.initialize(['A', 'B', 'C', 'D'], {});
    const kingInternal = king as unknown as { state: GameState };
    const ks = kingInternal.state;
    const kingPt = getKingPtState(ks);
    kingPt.phase = 'negative';
    ks.variantState = { ...ks.variantState, kingPt };
    ks.waitingForRoundStart = false;
    ks.currentPlayerIndex = 1;
    ks.currentTrick = [];
    ks.players[1].hand = [card('c2', '2', 'clubs')];
    ks.isPaused = true;
    expect(king.playCard(ks, 1, 0)).toBe(false);
    expect(ks.players[1].hand).toHaveLength(1);
    ks.isPaused = false;
    expect(king.playCard(ks, 1, 0)).toBe(true);
    expect(king.getCurrentState().players[1].hand).toHaveLength(0);
  });
});

describe('pause freezes Hearts pass exchange release', () => {
  it('keeps the exchange timestamp while paused and clears it once after resume', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const game = new HeartsGame();
    game.initialize(['A', 'B', 'C', 'D'], {});
    const internal = game as unknown as { state: GameState };
    const until = Date.now() + 800;
    const hearts = getHeartsState(internal.state);
    hearts.waitingForPass = false;
    hearts.passExchangeUntilMs = until;
    internal.state.variantState = { ...internal.state.variantState, hearts };
    internal.state.isPaused = true;
    game.releasePassExchange();
    expect(getHeartsState(game.getCurrentState()).passExchangeUntilMs).toBe(until);
    vi.advanceTimersByTime(10_000);
    game.releasePassExchange();
    expect(getHeartsState(game.getCurrentState()).passExchangeUntilMs).toBe(until);
    internal.state.isPaused = false;
    game.releasePassExchange();
    expect(getHeartsState(game.getCurrentState()).passExchangeUntilMs).toBeNull();
    game.releasePassExchange();
    expect(getHeartsState(game.getCurrentState()).passExchangeUntilMs).toBeNull();
    vi.useRealTimers();
  });
});

describe('pause freezes King festa AI', () => {
  function kingAt(mutate: (king: ReturnType<typeof getKingPtState>, state: GameState) => void) {
    const game = new KingPtGame();
    game.initialize(['Ana', 'Bruno', 'Carla', 'Diogo'], {});
    const internal = game as unknown as { state: GameState };
    const king = getKingPtState(internal.state);
    king.pauseFestaAiForDev = false;
    internal.state.waitingForRoundStart = true;
    internal.state.players.forEach((player, index) => {
      player.type = index === 0 ? 'human' : 'ai';
    });
    mutate(king, internal.state);
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };
    return { game, state: internal.state, king };
  }

  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not leave negotiation, 8-or-nulls, fallback, or setup while paused', () => {
    const cases = [
      (king: ReturnType<typeof getKingPtState>) => {
        king.festaPhase = 'negotiation';
        king.festaOwnerIndex = 1;
        king.bestBid = { bidderIndex: 2, bidType: 'positive', amount: 4 };
      },
      (king: ReturnType<typeof getKingPtState>) => {
        king.festaPhase = 'negotiation';
        king.festaOwnerIndex = 0;
        king.bestBid = { bidderIndex: 1, bidType: 'positive', amount: 4 };
        king.eightOrNullsPending = true;
        king.eightOrNullsTarget = 1;
      },
      (king: ReturnType<typeof getKingPtState>) => {
        king.festaPhase = 'fallback';
        king.waitingForFallback = true;
        king.festaOwnerIndex = 1;
        king.fallbackReason = 'negotiation_failed';
      },
      (king: ReturnType<typeof getKingPtState>) => {
        king.festaPhase = 'setup';
        king.waitingForFestaSetup = true;
        king.festaOwnerIndex = 1;
        king.benefitOwnerIndex = 1;
        king.festaMode = 'positive';
      }
    ];

    cases.forEach((mutate) => {
      const { game, state } = kingAt(mutate);
      const read = () => {
        const live = getKingPtState(game.getCurrentState());
        return JSON.stringify({
          phase: live.festaPhase,
          eight: live.eightOrNullsPending,
          fallback: live.waitingForFallback,
          setup: live.waitingForFestaSetup
        });
      };
      const before = read();
      state.isPaused = true;
      expect(game.tickFestaAi()).toBe(false);
      expect(read()).toBe(before);
      state.isPaused = false;
      expect(game.tickFestaAi()).toBe(true);
    });
  });
});

describe('trick auto-continue while paused', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEYS.AUTO_PAUSE_TRICK);
    localStorage.setItem('sueca-language', 'pt');
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
    vi.useRealTimers();
  });

  function render(isPaused: boolean) {
    const state = {
      waitingForTrickEnd: true,
      isGameOver: false,
      waitingForRoundEnd: false,
      waitingForRoundStart: false,
      waitingForGameStart: false,
      isPaused,
      currentTrick: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
    } as GameState;
    act(() => {
      ReactDOM.render(
        <GameActions gameState={state} variant="sueca" onContinueTrick={onContinue} />,
        container
      );
    });
  }

  const onContinue = vi.fn();

  it('does not clear the trick while paused and continues once after a fresh hold', () => {
    render(false);
    act(() => {
      vi.advanceTimersByTime((TRICK_AUTO_CONTINUE_SECONDS - 1) * 1000);
    });
    expect(onContinue).not.toHaveBeenCalled();
    render(true);
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(onContinue).not.toHaveBeenCalled();
    render(false);
    act(() => {
      vi.advanceTimersByTime(TRICK_AUTO_CONTINUE_SECONDS * 1000);
    });
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
