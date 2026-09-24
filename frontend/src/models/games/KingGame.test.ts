import { KingGame } from './KingGame';
import { isKingPtEnginePreset } from './king/kingSyntheticMode';

describe('KingGame product presets', () => {
  const names = ['A', 'B', 'C', 'D'];

  it('launches king-pt-normal on KingPtGame', () => {
    const game = new KingGame();
    const state = game.initialize(names, { rulesPresetId: 'king-pt-normal' });
    expect(state.variantState?.kingPt).toBeDefined();
    expect(state.variantState?.kingSimplified).toBeUndefined();
    expect(state.variantState?.rulesPresetId).toBe('king-pt-normal');
  });

  it('launches king-pt-synthetic on KingPtGame', () => {
    const game = new KingGame();
    const state = game.initialize(names, { rulesPresetId: 'king-pt-synthetic' });
    expect(state.variantState?.kingPt).toBeDefined();
    expect(isKingPtEnginePreset('king-pt-synthetic')).toBe(true);
    expect(state.variantState?.rulesPresetId).toBe('king-pt-synthetic');
  });

  it('maps obsolete king-simplified to king-pt-normal (no simplified engine)', () => {
    const game = new KingGame();
    const state = game.initialize(names, { rulesPresetId: 'king-simplified' });
    expect(state.variantState?.kingPt).toBeDefined();
    expect(state.variantState?.kingSimplified).toBeUndefined();
    expect(state.variantState?.rulesPresetId).toBe('king-pt-normal');
  });
});
