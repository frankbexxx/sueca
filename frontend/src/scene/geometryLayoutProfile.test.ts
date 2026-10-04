import { describe, expect, it } from 'vitest';
import { resolveGeometryLayoutProfile } from './geometryLayoutProfile';

describe('resolveGeometryLayoutProfile', () => {
  it('Sueca + Phaser → suecaPortraitV3', () => {
    expect(
      resolveGeometryLayoutProfile({ variant: 'sueca', tableRenderer: 'phaser' })
    ).toBe('suecaPortraitV3');
  });

  it('Sueca + DOM (multiplayer / forced DOM) → default', () => {
    expect(
      resolveGeometryLayoutProfile({ variant: 'sueca', tableRenderer: 'dom' })
    ).toBe('default');
  });

  it('Spades / Hearts / King Phaser → default', () => {
    for (const variant of ['spades', 'hearts', 'king'] as const) {
      expect(
        resolveGeometryLayoutProfile({ variant, tableRenderer: 'phaser' })
      ).toBe('default');
    }
  });
});
