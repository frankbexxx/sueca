import {
  getDefaultPresetId,
  getPresetsForVariant,
  isObsoleteKingPresetId,
  resolvePresetId,
  RULES_PRESETS
} from './rulesPresets';

describe('rulesPresets', () => {
  it('returns default preset per variant', () => {
    expect(getDefaultPresetId('sueca')).toBe('sueca-pt-normal');
    expect(getDefaultPresetId('king')).toBe('king-pt-normal');
  });

  it('lists only live King product presets (normal + synthetic)', () => {
    const kingPresets = getPresetsForVariant('king');
    expect(kingPresets.map((p) => p.id)).toEqual(['king-pt-normal', 'king-pt-synthetic']);
    expect(kingPresets.map((p) => p.namePt)).toEqual(['King', 'King Sintético']);
    expect(kingPresets.some((p) => /simplificado/i.test(p.namePt))).toBe(false);
  });

  it('falls back to default when preset invalid for variant', () => {
    expect(resolvePresetId('sueca', 'king-pt-normal')).toBe('sueca-pt-normal');
  });

  it('maps obsolete king-simplified to king-pt-normal (not a product preset)', () => {
    expect(isObsoleteKingPresetId('king-simplified')).toBe(true);
    expect(resolvePresetId('king', 'king-simplified')).toBe('king-pt-normal');
    expect(RULES_PRESETS).not.toHaveProperty('king-simplified');
  });

  it('every preset has bullets in both languages', () => {
    Object.values(RULES_PRESETS).forEach((preset) => {
      expect(preset.bullets.length).toBeGreaterThan(0);
      expect(preset.bulletsPt.length).toBe(preset.bullets.length);
    });
  });
});
