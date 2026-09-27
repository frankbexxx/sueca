import { publicUrl } from '../config/runtimeEnv';

/**
 * Canonical SFX ids used by audioService / useSound.
 * Presence of an id does not imply a bundled file exists.
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
 * Filenames that exist under `public/assets/sfx/`.
 * Only these are preloaded / requested at runtime.
 */
export const BUNDLED_SFX_FILENAMES: Partial<Record<SfxId, string>> = {
  shuffle: 'card-shuffle.ogg',
  deal: 'deal-1.ogg',
  trickCollect: 'trick-collect.ogg',
  roundStart: 'round-start.ogg',
  roundEnd: 'round-end.ogg',
  gameWin: 'game-win.ogg',
  gameLose: 'game-lose.ogg'
};

/**
 * Live UX events that still need sourced assets (documented gap).
 * Paths are intentionally omitted — runtime must not 404-spam these.
 *
 * Planned sources (docs/ASSETS.md): Kenney Casino / Interface packs.
 */
export const MISSING_SFX_ASSET_IDS = [
  'cardPlay1',
  'cardPlay2',
  'cardPlay3',
  'error',
  'uiClick'
] as const;

export type MissingSfxAssetId = (typeof MISSING_SFX_ASSET_IDS)[number];

/** Planned filenames for the gaps above (not on disk yet). */
export const MISSING_SFX_PLANNED_FILES: Readonly<Record<MissingSfxAssetId, string>> = {
  cardPlay1: 'card-play-1.ogg',
  cardPlay2: 'card-play-2.ogg',
  cardPlay3: 'card-play-3.ogg',
  error: 'error.ogg',
  uiClick: 'ui-click.ogg'
};

export function getSfxPath(id: SfxId): string | null {
  const file = BUNDLED_SFX_FILENAMES[id];
  return file ? `${base}/${file}` : null;
}

/** Paths for bundled SFX only (never includes missing-asset gaps). */
export const SFX_PATHS: Partial<Record<SfxId, string>> = (
  Object.keys(BUNDLED_SFX_FILENAMES) as SfxId[]
).reduce<Partial<Record<SfxId, string>>>((acc, id) => {
  const path = getSfxPath(id);
  if (path) acc[id] = path;
  return acc;
}, {});

export function isSfxBundled(id: SfxId): boolean {
  return getSfxPath(id) != null;
}

/** Variation pool for card-play (all currently asset-gapped). */
export const CARD_PLAY_VARIANTS: SfxId[] = ['cardPlay1', 'cardPlay2', 'cardPlay3'];
