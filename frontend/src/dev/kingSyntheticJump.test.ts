import {
  formatDevKingSyntheticBadge,
  isKingDevSyntheticEnabled,
  parseDevKingSyntheticParams,
  nextSyntheticContract
} from './kingSyntheticJump';
import {
  activateKingSynthetic,
  deactivateKingSynthetic,
  getKingSyntheticContract,
  getKingSyntheticState,
  isKingSyntheticActive,
  markKingSyntheticSetupApplied,
  resetKingSyntheticControllerForTests,
  shouldApplyFixtureAfterKoh,
  skipToNextKingSyntheticContract
} from './kingSyntheticController';
import {
  applyKingSyntheticFixture,
  buildKingSyntheticSeed,
  listKingSyntheticSeeds,
  validateKingSyntheticSeed
} from './kingSyntheticFixtures';
import { KingPtGame, getKingPtState } from '../models/games/KingPtGame';
import { KING_NEGATIVE_CONTRACTS } from '../models/games/king/kingContracts';

describe('kingSyntheticJump (S1)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('parses enabled flag in development', () => {
    process.env.NODE_ENV = 'development';
    expect(parseDevKingSyntheticParams('?devKingSynthetic=1')).toEqual({
      enabled: true,
      contract: null
    });
    expect(parseDevKingSyntheticParams('?devKingSynthetic=1&synthContract=no_hearts')).toEqual({
      enabled: true,
      contract: 'no_hearts'
    });
  });

  it('falls back when synthContract is invalid', () => {
    process.env.NODE_ENV = 'development';
    expect(parseDevKingSyntheticParams('?devKingSynthetic=1&synthContract=nope')).toEqual({
      enabled: true,
      contract: null
    });
  });

  it('returns null in production', () => {
    process.env.NODE_ENV = 'production';
    expect(isKingDevSyntheticEnabled()).toBe(false);
    expect(parseDevKingSyntheticParams('?devKingSynthetic=1')).toBeNull();
  });

  it('formats badge', () => {
    expect(formatDevKingSyntheticBadge(null)).toBe('DEV · KING SINTÉTICO');
    expect(formatDevKingSyntheticBadge('no_hearts')).toMatch(/KING SINTÉTICO/);
    expect(formatDevKingSyntheticBadge('no_hearts')).toMatch(/COPAS/i);
  });

  it('cycles contracts', () => {
    expect(nextSyntheticContract('no_tricks')).toBe('no_hearts');
    expect(nextSyntheticContract('no_last_two')).toBe('no_tricks');
  });
});

describe('kingSyntheticController (S1)', () => {
  beforeEach(() => {
    resetKingSyntheticControllerForTests();
  });

  it('activates and tracks fixture setup', () => {
    activateKingSynthetic({ enabled: true, contract: null });
    expect(isKingSyntheticActive()).toBe(true);
    expect(shouldApplyFixtureAfterKoh()).toBe(true);
    expect(getKingSyntheticContract()).toBe('no_tricks');
    markKingSyntheticSetupApplied();
    expect(getKingSyntheticState().setupApplied).toBe(true);
    expect(shouldApplyFixtureAfterKoh()).toBe(false);
  });

  it('skip advances contract without scoring', () => {
    activateKingSynthetic({ enabled: true, contract: 'no_queens' });
    markKingSyntheticSetupApplied();
    const next = skipToNextKingSyntheticContract();
    expect(next).toBe('no_men');
    expect(getKingSyntheticState().setupApplied).toBe(false);
  });
});

describe('kingSyntheticFixtures (S2)', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('validates all seeds without duplicate cards', () => {
    for (const seed of listKingSyntheticSeeds()) {
      expect(validateKingSyntheticSeed(seed)).toEqual([]);
      expect(seed.hands.every((h) => h.length === seed.hands[0].length)).toBe(true);
    }
  });

  it('covers all six contracts', () => {
    const ids = new Set(listKingSyntheticSeeds().map((s) => s.contract));
    for (const def of KING_NEGATIVE_CONTRACTS) {
      expect(ids.has(def.id)).toBe(true);
    }
  });

  it('no_tricks loads and allows a legal lead', () => {
    const game = new KingPtGame();
    const state = applyKingSyntheticFixture(game, ['A', 'B', 'C', 'D'], 'no_tricks', {
      localPlayerIndex: 0
    });
    const king = getKingPtState(state);
    expect(king.contract).toBe('no_tricks');
    expect(game.canPlayCard(state, 0, 0)).toBe(true);
  });

  it('no_hearts blocks leading hearts when holding a non-heart', () => {
    const game = new KingPtGame();
    const state = applyKingSyntheticFixture(game, ['A', 'B', 'C', 'D'], 'no_hearts', {
      localPlayerIndex: 0
    });
    const hand = state.players[0].hand;
    const heartIdx = hand.findIndex((c) => c.suit === 'hearts');
    const nonHeartIdx = hand.findIndex((c) => c.suit !== 'hearts');
    expect(heartIdx).toBeGreaterThanOrEqual(0);
    expect(nonHeartIdx).toBeGreaterThanOrEqual(0);
    expect(game.canPlayCard(state, 0, heartIdx)).toBe(false);
    expect(game.canPlayCard(state, 0, nonHeartIdx)).toBe(true);
  });

  it('no_queens forces follow with the queen of clubs', () => {
    const game = new KingPtGame();
    const state = applyKingSyntheticFixture(game, ['A', 'B', 'C', 'D'], 'no_queens', {
      localPlayerIndex: 0
    });
    const hand = state.players[0].hand;
    const qIdx = hand.findIndex((c) => c.rank === 'Q' && c.suit === 'clubs');
    const offIdx = hand.findIndex((c) => c.suit !== 'clubs');
    expect(qIdx).toBeGreaterThanOrEqual(0);
    expect(game.canPlayCard(state, 0, qIdx)).toBe(true);
    expect(game.canPlayCard(state, 0, offIdx)).toBe(false);
  });

  it('no_men forces follow with the king of spades', () => {
    const game = new KingPtGame();
    const state = applyKingSyntheticFixture(game, ['A', 'B', 'C', 'D'], 'no_men', {
      localPlayerIndex: 0
    });
    const hand = state.players[0].hand;
    const kIdx = hand.findIndex((c) => c.rank === 'K' && c.suit === 'spades');
    const offIdx = hand.findIndex((c) => c.suit !== 'spades');
    expect(game.canPlayCard(state, 0, kIdx)).toBe(true);
    expect(game.canPlayCard(state, 0, offIdx)).toBe(false);
  });

  it('no_king_hearts follow precedence: K♥ illegal while holding led suit', () => {
    const game = new KingPtGame();
    const state = applyKingSyntheticFixture(game, ['A', 'B', 'C', 'D'], 'no_king_hearts', {
      localPlayerIndex: 0,
      beat: 'koh_follow_precedence'
    });
    const hand = state.players[0].hand;
    const kh = hand.findIndex((c) => c.rank === 'K' && c.suit === 'hearts');
    const club = hand.findIndex((c) => c.suit === 'clubs');
    expect(game.canPlayCard(state, 0, kh)).toBe(false);
    expect(game.canPlayCard(state, 0, club)).toBe(true);
  });

  it('no_king_hearts obligation: void must play K♥', () => {
    const game = new KingPtGame();
    const state = applyKingSyntheticFixture(game, ['A', 'B', 'C', 'D'], 'no_king_hearts', {
      localPlayerIndex: 0,
      beat: 'koh_obligation_void'
    });
    const hand = state.players[0].hand;
    const kh = hand.findIndex((c) => c.rank === 'K' && c.suit === 'hearts');
    const other = hand.findIndex((c) => !(c.rank === 'K' && c.suit === 'hearts'));
    expect(game.canPlayCard(state, 0, kh)).toBe(true);
    expect(game.canPlayCard(state, 0, other)).toBe(false);
  });

  it('no_last_two seeds trickNumber at 11', () => {
    const seed = buildKingSyntheticSeed('no_last_two');
    expect(seed.trickNumber).toBe(11);
    const game = new KingPtGame();
    const state = applyKingSyntheticFixture(game, ['A', 'B', 'C', 'D'], 'no_last_two', {
      localPlayerIndex: 0
    });
    expect(getKingPtState(state).trickNumber).toBe(11);
    expect(game.canPlayCard(state, 0, 0)).toBe(true);
  });

  it('production apply falls back without throwing', () => {
    process.env.NODE_ENV = 'production';
    const game = new KingPtGame();
    const state = applyKingSyntheticFixture(game, ['A', 'B', 'C', 'D'], 'no_tricks');
    expect(getKingPtState(state).phase).toBe('koh_reveal');
  });
});
