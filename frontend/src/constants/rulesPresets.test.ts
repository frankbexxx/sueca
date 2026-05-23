import {
  getDefaultPresetId,
  getPresetsForVariant,
  resolvePresetId,
  RULES_PRESETS
} from './rulesPresets';

describe('rulesPresets', () => {
  it('returns default preset per variant', () => {
    expect(getDefaultPresetId('sueca')).toBe('sueca-pt-normal');
    expect(getDefaultPresetId('king')).toBe('king-pt-normal');
  });

  it('lists king variants including simplified', () => {
    const kingPresets = getPresetsForVariant('king');
    expect(kingPresets.map((p) => p.id)).toEqual(['king-pt-normal', 'king-simplified']);
  });

  it('falls back to default when preset invalid for variant', () => {
    expect(resolvePresetId('sueca', 'king-pt-normal')).toBe('sueca-pt-normal');
    expect(resolvePresetId('king', 'king-simplified')).toBe('king-simplified');
  });

  it('every preset has bullets in both languages', () => {
    Object.values(RULES_PRESETS).forEach((preset) => {
      expect(preset.bullets.length).toBeGreaterThan(0);
      expect(preset.bulletsPt.length).toBe(preset.bullets.length);
    });
  });
});
