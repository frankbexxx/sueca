/**
 * Public card image assets (Vite serves from public/).
 * Faces: resolved per theme via `resolveCardDeckForTheme` (default casino → cards3).
 * Back: resolved per theme via `resolveCardBackForTheme` (fallback suecao-navy).
 * deckId and backId are independent.
 */
import {
  DEFAULT_CARD_BACK_ID,
  readActiveThemeIdFromDom,
  resolveActiveBack,
  resolveActiveDeck,
  resolveCardBackForTheme,
  resolveCardDeckForTheme
} from './cardDeckRegistry';
import { publicUrl, readViteEnv } from '../config/runtimeEnv';

/**
 * Default face pack directory (casino / cards3).
 * Prefer `getCardAssetsDir(themeId)` at call sites that may gain per-theme decks.
 */
export const CARD_ASSETS_DIR = resolveActiveDeck().facePath;

/** PNG pack; override via VITE_CARD_EXT if needed */
const CARD_EXT = readViteEnv('VITE_CARD_EXT') === 'svg' ? 'svg' : 'png';

/**
 * Default back path (suecao-navy). Prefer `getCardBackPath()` / theme resolution
 * at render time so theme changes swap backs.
 */
export const CARD_BACK_PATH = `${resolveActiveBack(DEFAULT_CARD_BACK_ID).assetPathBase}.${CARD_EXT}`;
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

/** Face directory for a theme (falls back to casino). */
export function getCardAssetsDir(themeId?: string | null): string {
  return resolveCardDeckForTheme(themeId).facePath;
}

/** Relative public path for a theme's card back (with extension). */
export function getCardBackPath(themeId?: string | null): string {
  const back = resolveCardBackForTheme(themeId);
  return `${back.assetPathBase}.${CARD_EXT}`;
}

/** Back path for the currently active shell theme. */
export function getActiveThemeCardBackPath(
  root?: Element | null
): string {
  return getCardBackPath(readActiveThemeIdFromDom(root ?? undefined));
}

/**
 * Builds the public URL for a card face image.
 * Uses theme deck resolver (currently always casino / cards3).
 * Back assets must use getCardBackPath / CARD_BACK_PATH, not this helper.
 */
export function getCardImagePath(
  rankImageName: string,
  suitImageName: string,
  publicBase = '',
  themeId?: string | null
): string {
  const basePath = publicBase && !publicBase.endsWith('/') ? publicBase : publicBase || '';
  const resolvedTheme =
    themeId === undefined ? readActiveThemeIdFromDom() : themeId;
  const dir = getCardAssetsDir(resolvedTheme);
  return `${basePath}${dir}/${rankImageName}_of_${suitImageName}.${CARD_EXT}`;
}
