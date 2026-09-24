import { KingGame } from '../KingGame';
import { getKingPtState, isSyntheticAllNegatives } from '../KingPtGame';
import { KING_NEGATIVE_GAMES } from './kingContracts';
import {
  isKingSyntheticPreset,
  isKingSyntheticSession,
  readKingRulesPresetId
} from './kingSyntheticMode';
import { kingHudMatchProgress } from './kingContracts';
import { resolvePresetId } from '../../../constants/rulesPresets';

const names = ['A', 'B', 'C', 'D'];

describe('King Sintético product mode (king-pt-synthetic)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('is a distinct preset from normal (not the deleted simplified mode)', () => {
    expect(isKingSyntheticPreset('king-pt-synthetic')).toBe(true);
    expect(isKingSyntheticPreset('king-pt-normal')).toBe(false);
    expect(isKingSyntheticPreset('king-simplified')).toBe(false);
    expect(resolvePresetId('king', 'king-pt-synthetic')).toBe('king-pt-synthetic');
  });

  it('starts without DEV query and works in production NODE_ENV', () => {
    process.env.NODE_ENV = 'production';
    const game = new KingGame();
    const state = game.initialize(names, {
      rulesPresetId: 'king-pt-synthetic',
      localPlayerIndex: 0
    });
    expect(readKingRulesPresetId(state)).toBe('king-pt-synthetic');
    expect(state.variantState?.kingSimplified).toBeUndefined();

    game.confirmKohReveal();
    const after = game.getCurrentState();
    const king = getKingPtState(after);
    expect(isSyntheticAllNegatives(king)).toBe(true);
    expect(isKingSyntheticSession(after)).toBe(true);
    expect(kingHudMatchProgress(king.gameIndex, 'pt', { syntheticSession: true })).toBe(
      'Jogo 1/5'
    );
    expect(after.players.every((p) => p.hand.length === 13)).toBe(true);
  });

  it('preserves preset and combined flag across save/restore mid-round', () => {
    process.env.NODE_ENV = 'production';
    const game = new KingGame();
    game.initialize(names, { rulesPresetId: 'king-pt-synthetic', localPlayerIndex: 0 });
    game.confirmKohReveal();
    const mid = structuredClone(game.getCurrentState());
    expect(isSyntheticAllNegatives(getKingPtState(mid))).toBe(true);

    const resumed = new KingGame();
    const restored = resumed.restoreState(mid);
    expect(readKingRulesPresetId(restored)).toBe('king-pt-synthetic');
    expect(isSyntheticAllNegatives(getKingPtState(restored))).toBe(true);
    expect(isKingSyntheticSession(restored)).toBe(true);
  });

  it('after combined round continue: Festa with 2/5 and preset retained', () => {
    process.env.NODE_ENV = 'production';
    const game = new KingGame();
    game.initialize(names, { rulesPresetId: 'king-pt-synthetic', localPlayerIndex: 0 });
    game.confirmKohReveal();

    const waiting = structuredClone(game.getCurrentState());
    waiting.waitingForRoundEnd = true;
    const k = getKingPtState(waiting);
    k.syntheticAllNegatives = true;
    k.gameIndex = 0;
    waiting.variantState = {
      ...waiting.variantState,
      kingPt: k,
      rulesPresetId: 'king-pt-synthetic'
    };
    game.restoreState(waiting);
    game.continueToNextRound(game.getCurrentState());

    const next = game.getCurrentState();
    const nextKing = getKingPtState(next);
    expect(readKingRulesPresetId(next)).toBe('king-pt-synthetic');
    expect(nextKing.gameIndex).toBe(KING_NEGATIVE_GAMES);
    expect(isSyntheticAllNegatives(nextKing)).toBe(false);
    expect(isKingSyntheticSession(next)).toBe(true);
    expect(
      kingHudMatchProgress(nextKing.gameIndex, 'pt', { syntheticSession: true })
    ).toBe('Jogo 2/5');
  });

  it('normal King remains 10-game and not synthetic', () => {
    const game = new KingGame();
    const state = game.initialize(names, { rulesPresetId: 'king-pt-normal' });
    expect(readKingRulesPresetId(state)).toBe('king-pt-normal');
    game.confirmKohReveal();
    const king = getKingPtState(game.getCurrentState());
    expect(isSyntheticAllNegatives(king)).toBe(false);
    expect(isKingSyntheticSession(game.getCurrentState())).toBe(false);
    expect(kingHudMatchProgress(0, 'pt')).toBe('Jogo 1/10');
  });

  it('maps obsolete king-simplified initialize to king-pt-normal', () => {
    const game = new KingGame();
    const state = game.initialize(names, { rulesPresetId: 'king-simplified' });
    expect(state.variantState?.kingSimplified).toBeUndefined();
    expect(state.variantState?.kingPt).toBeDefined();
    expect(readKingRulesPresetId(state)).toBe('king-pt-normal');
    expect(isKingSyntheticPreset(state.variantState?.rulesPresetId as string)).toBe(false);
  });
});
