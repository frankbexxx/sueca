/**
 * Public card image assets (Vite serves from public/).
 * Sueca 40-card deck uses cards2 with Title_Case suit names (e.g. Queen_of_Clubs.png).
 */
import { publicUrl, readViteEnv } from '../config/runtimeEnv';

export const CARD_ASSETS_DIR = '/assets/cards2';

/** PNG pack in public/assets/cards2; override via VITE_CARD_EXT if needed */
const CARD_EXT = readViteEnv('VITE_CARD_EXT') === 'svg' ? 'svg' : 'png';

/** Documented path for Suecão card back (UX-P3.1 prototype pending visual approval). */
export const CARD_BACK_PATH = `${CARD_ASSETS_DIR}/card_back.${CARD_EXT}`;
export const CARD_BACK_TEXTURE_KEY = 'card-back';

/** Alternate back (Hazmat red) — future theme / IAP */
export const CARD_BACK_RED_PATH = `${CARD_ASSETS_DIR}/card_back_red.${CARD_EXT}`;

export function getPublicAssetPath(
  relativePath: string,
  publicBase = publicUrl()
): string {
  const base = publicBase && !publicBase.endsWith('/') ? publicBase : publicBase || '';
  return `${base}${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`;
}

/**
 * Builds the public URL for a card image used by the Sueca UI.
 */
export function getCardImagePath(rankImageName: string, suitImageName: string, publicBase = ''): string {
  const basePath = publicBase && !publicBase.endsWith('/') ? publicBase : publicBase || '';
  return `${basePath}${CARD_ASSETS_DIR}/${rankImageName}_of_${suitImageName}.${CARD_EXT}`;
}
