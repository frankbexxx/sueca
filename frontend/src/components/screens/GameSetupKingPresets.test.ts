import { describe, expect, it } from 'vitest';
import { getPresetsForVariant } from '../../constants/rulesPresets';

describe('GameSetup King rules selector (UX-KING-01/02)', () => {
  it('exposes only King and King Sintético product labels', () => {
    const options = getPresetsForVariant('king');
    expect(options).toHaveLength(2);
    expect(options.map((p) => p.id)).toEqual(['king-pt-normal', 'king-pt-synthetic']);
    expect(options.map((p) => p.namePt)).toEqual(['King', 'King Sintético']);
    const joined = options.map((p) => `${p.name} ${p.namePt}`).join(' ');
    expect(joined).not.toMatch(/simplificado|simplified/i);
  });
});
