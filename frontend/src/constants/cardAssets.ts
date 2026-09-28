/**
 * Public card image assets (Vite serves from public/).
 * Faces: user override → theme deck → default (cardmeister); optional `?deck=` wins.
 * Back: user override → theme back → suecao-navy.
 * deckId and backId are independent. Casino removed (REL-DECK-01B).
 */
import {
  DEFAULT_CARD_BACK_ID,
  readActiveThemeIdFromDom,
  resolveActiveBack,
  resolveActiveDeck,
  resolveEffectiveBack,
  resolveEffectiveDeck
} from './cardDeckRegistry';
import { publicUrl, readViteEnv } from '../config/runtimeEnv';

/**
 * Default face pack directory (cardmeister).
 * Prefer `getCardAssetsDir(themeId)` at call sites that may use per-theme decks.
 */
export const CARD_ASSETS_DIR = resolveActiveDeck().facePath;

/** PNG pack; override via VITE_CARD_EXT if needed */
const CARD_EXT = readViteEnv('VITE_CARD_EXT') === 'svg' ? 'svg' : 'png';

/**
 * Default back path (suecao-navy). Prefer `getCardBackPath()` / theme resolution
 * at render time so theme / user overrides swap backs.
 */
export const CARD_BACK_PATH = `${resolveActiveBack(DEFAULT_CARD_BACK_ID).assetPathBase}.${CARD_EXT}`;
export const CARD_BACK_TEXTURE_KEY = 'card-back';

export function getPublicAssetPath(
  relativePath: string,
  publicBase = publicUrl()
): string {
  const base = publicBase && !publicBase.endsWith('/') ? publicBase : publicBase || '';
  return `${base}${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`;
}

/**
 * Face directory (user override → theme → default).
 * Honors optional `?deck=` query when `search` omitted (browser) or passed (tests).
 */
export function getCardAssetsDir(
  themeId?: string | null,
  search?: string | null,
  userFront?: string | null
): string {
  return resolveEffectiveDeck(themeId, search, userFront).facePath;
}

/** Relative public path for effective card back (user override → theme). */
export function getCardBackPath(
  themeId?: string | null,
  userBack?: string | null
): string {
  const back = resolveEffectiveBack(themeId, userBack);
  return `${back.assetPathBase}.${CARD_EXT}`;
}

/** Back path for the currently active shell theme (+ user override). */
export function getActiveThemeCardBackPath(
  root?: Element | null
): string {
  return getCardBackPath(readActiveThemeIdFromDom(root ?? undefined));
}

/**
 * Builds the public URL for a card face image.
 * Uses effective deck resolver (user / theme / optional `?deck=`).
 * Back assets must use getCardBackPath / CARD_BACK_PATH, not this helper.
 */
export function getCardImagePath(
  rankImageName: string,
  suitImageName: string,
  publicBase = '',
  themeId?: string | null,
  search?: string | null
): string {
  const basePath = publicBase && !publicBase.endsWith('/') ? publicBase : publicBase || '';
  const resolvedTheme =
    themeId === undefined ? readActiveThemeIdFromDom() : themeId;
  const dir = getCardAssetsDir(resolvedTheme, search);
  return `${basePath}${dir}/${rankImageName}_of_${suitImageName}.${CARD_EXT}`;
}
