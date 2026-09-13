/**
 * Public card image assets (Vite serves from public/).
 * Faces: active deck from `cardDeckRegistry` (Casino Normal in cards3).
 * Back: independent Suecão navy (`suecao-navy`) — not tied to face pack swap.
 */
import {
  resolveActiveBack,
  resolveActiveDeck
} from './cardDeckRegistry';
import { publicUrl, readViteEnv } from '../config/runtimeEnv';

/** Active face pack directory (e.g. `/assets/cards3`). */
export const CARD_ASSETS_DIR = resolveActiveDeck().facePath;

/** PNG pack; override via VITE_CARD_EXT if needed */
const CARD_EXT = readViteEnv('VITE_CARD_EXT') === 'svg' ? 'svg' : 'png';

/** Suecão navy card back — independent of face deck. */
export const CARD_BACK_PATH = `${resolveActiveBack().assetPathBase}.${CARD_EXT}`;
export const CARD_BACK_TEXTURE_KEY = 'card-back';

/** Alternate back (Hazmat red) — future theme / IAP */
export const CARD_BACK_RED_PATH = `${resolveActiveBack('hazmat-red').assetPathBase}.${CARD_EXT}`;

export function getPublicAssetPath(
  relativePath: string,
  publicBase = publicUrl()
): string {
  const base = publicBase && !publicBase.endsWith('/') ? publicBase : publicBase || '';
  return `${base}${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`;
}

/**
 * Builds the public URL for a card face image.
 * Back assets must use CARD_BACK_PATH, not this helper.
 */
export function getCardImagePath(
  rankImageName: string,
  suitImageName: string,
  publicBase = ''
): string {
  const basePath = publicBase && !publicBase.endsWith('/') ? publicBase : publicBase || '';
  return `${basePath}${CARD_ASSETS_DIR}/${rankImageName}_of_${suitImageName}.${CARD_EXT}`;
}
