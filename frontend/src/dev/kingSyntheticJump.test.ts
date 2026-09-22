import {
  formatDevKingSyntheticBadge,
  isKingDevSyntheticEnabled,
  parseDevKingSyntheticParams,
  kingSyntheticRoundLabel
} from './kingSyntheticJump';
import {
  activateKingSynthetic,
  getKingSyntheticState,
  isKingSyntheticActive,
  markKingSyntheticSetupApplied,
  resetKingSyntheticControllerForTests,
  shouldEnableSyntheticAfterKoh
} from './kingSyntheticController';
import { enableKingSyntheticCombinedRound } from './kingSyntheticFixtures';
import { KingPtGame, getKingPtState, isDevSyntheticAllNegatives } from '../models/games/KingPtGame';
import { KING_NEGATIVE_GAMES } from '../models/games/king/kingContracts';

describe('kingSyntheticJump (combined)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('parses enabled flag in development (ignores synthContract)', () => {
    process.env.NODE_ENV = 'development';
    expect(parseDevKingSyntheticParams('?devKingSynthetic=1')).toEqual({ enabled: true });
    expect(parseDevKingSyntheticParams('?devKingSynthetic=1&synthContract=no_hearts')).toEqual({
      enabled: true
    });
  });

  it('returns null in production', () => {
    process.env.NODE_ENV = 'production';
    expect(isKingDevSyntheticEnabled()).toBe(false);
    expect(parseDevKingSyntheticParams('?devKingSynthetic=1')).toBeNull();
  });

  it('formats badge without contract cycling', () => {
    expect(formatDevKingSyntheticBadge()).toBe('DEV · KING SINTÉTICO');
    expect(kingSyntheticRoundLabel('pt')).toBe('Sintético · Todos os negativos');
  });
});

describe('kingSyntheticController (combined)', () => {
  beforeEach(() => {
    resetKingSyntheticControllerForTests();
  });

  it('activates and waits for KOH then enables', () => {
    activateKingSynthetic({ enabled: true });
    expect(isKingSyntheticActive()).toBe(true);
    expect(shouldEnableSyntheticAfterKoh()).toBe(true);
    markKingSyntheticSetupApplied();
    expect(getKingSyntheticState().setupApplied).toBe(true);
    expect(shouldEnableSyntheticAfterKoh()).toBe(false);
  });
});

describe('enableKingSyntheticCombinedRound', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('enables combined flag on a dealt negative round', () => {
    const game = new KingPtGame();
    game.initialize(['A', 'B', 'C', 'D'], { localPlayerIndex: 0 });
    game.confirmKohReveal();
    const state = enableKingSyntheticCombinedRound(game);
    const king = getKingPtState(state);
    expect(isDevSyntheticAllNegatives(king)).toBe(true);
    expect(king.gameIndex).toBe(0);
    expect(king.roundBreakdown.contractLabel).toBe('Sintético · Todos os negativos');
    expect(state.players.every((p) => p.hand.length === 13)).toBe(true);
  });

  it('is inert in production', () => {
    process.env.NODE_ENV = 'production';
    const game = new KingPtGame();
    game.initialize(['A', 'B', 'C', 'D'], { localPlayerIndex: 0 });
    game.confirmKohReveal();
    enableKingSyntheticCombinedRound(game);
    expect(isDevSyntheticAllNegatives(getKingPtState(game.getCurrentState()))).toBe(false);
  });
});

describe('combined synthetic → Festa handoff', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('continueToNextRound jumps to gameIndex 6 and clears synthetic flag', () => {
    const game = new KingPtGame();
    game.initialize(['A', 'B', 'C', 'D'], { localPlayerIndex: 0 });
    game.confirmKohReveal();
    enableKingSyntheticCombinedRound(game);

    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    const king = getKingPtState(internal.state);
    king.gameHistory = [
      {
        gameIndex: 0,
        title: 'Sintético · Todos os negativos',
        deltas: [-40, -20, 0, -10],
        scoresAfter: [-40, -20, 0, -10],
        breakdownLines: []
      }
    ];
    king.playerScores = [-40, -20, 0, -10];
    internal.state.waitingForRoundEnd = true;
    internal.state.variantState = { ...internal.state.variantState, kingPt: king };

    game.continueToNextRound(internal.state);
    const next = getKingPtState(game.getCurrentState());
    expect(next.gameIndex).toBe(KING_NEGATIVE_GAMES);
    expect(next.gameIndex).toBe(6);
    expect(isDevSyntheticAllNegatives(next)).toBe(false);
    expect(next.playerScores).toEqual([-40, -20, 0, -10]);
    expect(next.gameHistory).toHaveLength(1);
    expect(next.gameHistory[0].title).toBe('Sintético · Todos os negativos');
  });
});
