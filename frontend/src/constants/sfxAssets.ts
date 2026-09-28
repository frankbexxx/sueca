import { publicUrl } from '../config/runtimeEnv';

/**
 * Canonical SFX ids used by audioService / useSound.
 */
export type SfxId =
  | 'cardPlay1'
  | 'cardPlay2'
  | 'cardPlay3'
  | 'shuffle'
  | 'deal'
  | 'trickCollect'
  | 'roundStart'
  | 'roundEnd'
  | 'gameWin'
  | 'gameLose'
  | 'error'
  | 'uiClick';

const base = `${publicUrl()}/assets/sfx`;

/**
 * Filenames under `public/assets/sfx/` that are wired for preload/playback.
 * Source notes: docs/ASSETS.md (Kenney / Freesound / Suecão synth).
 */
export const BUNDLED_SFX_FILENAMES: Record<SfxId, string> = {
  cardPlay1: 'card-play-1.ogg',
  cardPlay2: 'card-play-2.ogg',
  cardPlay3: 'card-play-3.ogg',
  shuffle: 'card-shuffle.ogg',
  deal: 'deal-1.ogg',
  trickCollect: 'trick-collect.ogg',
  roundStart: 'round-start.ogg',
  roundEnd: 'round-end.ogg',
  gameWin: 'game-win.ogg',
  gameLose: 'game-lose.ogg',
  error: 'error.ogg',
  uiClick: 'ui-click.ogg'
};

/**
 * Genuinely absent bundled SFX (none after REL-AUDIO wire).
 * Kept as an empty list so tests/docs can assert debt explicitly.
 */
export const MISSING_SFX_ASSET_IDS = [] as const;

export type MissingSfxAssetId = (typeof MISSING_SFX_ASSET_IDS)[number];

/** @deprecated Empty — all planned mesa SFX are bundled. */
export const MISSING_SFX_PLANNED_FILES: Readonly<Record<string, string>> = {};

export function getSfxPath(id: SfxId): string | null {
  const file = BUNDLED_SFX_FILENAMES[id];
  return file ? `${base}/${file}` : null;
}

/** Paths for every bundled SFX id. */
export const SFX_PATHS: Record<SfxId, string> = (
  Object.keys(BUNDLED_SFX_FILENAMES) as SfxId[]
).reduce(
  (acc, id) => {
    const path = getSfxPath(id);
    if (path) acc[id] = path;
    return acc;
  },
  {} as Record<SfxId, string>
);

export function isSfxBundled(id: SfxId): boolean {
  return getSfxPath(id) != null;
}

/** Variation pool for legal card-play feedback. */
export const CARD_PLAY_VARIANTS: readonly SfxId[] = [
  'cardPlay1',
  'cardPlay2',
  'cardPlay3'
];
