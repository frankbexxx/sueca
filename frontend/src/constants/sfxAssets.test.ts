import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  BUNDLED_SFX_FILENAMES,
  CARD_PLAY_VARIANTS,
  getSfxPath,
  isSfxBundled,
  MISSING_SFX_ASSET_IDS,
  SFX_PATHS,
  type SfxId
} from './sfxAssets';

const sfxDir = path.join(__dirname, '../../public/assets/sfx');

describe('sfxAssets catalog', () => {
  it('wires every SfxId including card-play / error / ui-click', () => {
    const expected: SfxId[] = [
      'cardPlay1',
      'cardPlay2',
      'cardPlay3',
      'shuffle',
      'deal',
      'trickCollect',
      'roundStart',
      'roundEnd',
      'gameWin',
      'gameLose',
      'error',
      'uiClick'
    ];
    expect(Object.keys(BUNDLED_SFX_FILENAMES).sort()).toEqual([...expected].sort());
    expect(MISSING_SFX_ASSET_IDS).toEqual([]);
    for (const id of expected) {
      expect(isSfxBundled(id)).toBe(true);
      expect(getSfxPath(id)).toMatch(/\/assets\/sfx\/.+\.ogg$/);
      expect(SFX_PATHS[id]).toBe(getSfxPath(id));
    }
  });

  it('card-play variants are bundled (no silent gap)', () => {
    expect(CARD_PLAY_VARIANTS).toEqual(['cardPlay1', 'cardPlay2', 'cardPlay3']);
    for (const id of CARD_PLAY_VARIANTS) {
      expect(isSfxBundled(id)).toBe(true);
      expect(BUNDLED_SFX_FILENAMES[id]).toMatch(/^card-play-[123]\.ogg$/);
    }
  });

  it('every bundled filename exists on disk under public/assets/sfx', () => {
    for (const file of Object.values(BUNDLED_SFX_FILENAMES)) {
      const full = path.join(sfxDir, file);
      expect(fs.existsSync(full), full).toBe(true);
      expect(fs.statSync(full).size).toBeGreaterThan(0);
    }
  });
});
