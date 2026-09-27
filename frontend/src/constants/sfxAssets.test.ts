import { describe, expect, it } from 'vitest';
import {
  BUNDLED_SFX_FILENAMES,
  CARD_PLAY_VARIANTS,
  getSfxPath,
  isSfxBundled,
  MISSING_SFX_ASSET_IDS,
  MISSING_SFX_PLANNED_FILES,
  SFX_PATHS
} from './sfxAssets';

describe('sfxAssets catalog', () => {
  it('bundled ids have paths; gaps never appear in SFX_PATHS', () => {
    for (const id of Object.keys(BUNDLED_SFX_FILENAMES) as Array<
      keyof typeof BUNDLED_SFX_FILENAMES
    >) {
      expect(isSfxBundled(id)).toBe(true);
      expect(getSfxPath(id)).toMatch(/\/assets\/sfx\//);
      expect(SFX_PATHS[id]).toBe(getSfxPath(id));
    }
    for (const id of MISSING_SFX_ASSET_IDS) {
      expect(isSfxBundled(id)).toBe(false);
      expect(getSfxPath(id)).toBeNull();
      expect(SFX_PATHS[id]).toBeUndefined();
      expect(MISSING_SFX_PLANNED_FILES[id]).toBeTruthy();
    }
  });

  it('card-play variants are documented gaps (no silent file reuse)', () => {
    expect(CARD_PLAY_VARIANTS).toEqual(['cardPlay1', 'cardPlay2', 'cardPlay3']);
    for (const id of CARD_PLAY_VARIANTS) {
      expect(MISSING_SFX_ASSET_IDS).toContain(id);
    }
  });
});
