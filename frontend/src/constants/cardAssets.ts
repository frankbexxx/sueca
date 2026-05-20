/**
 * Public card image assets (Create React App serves from public/).
 * Sueca 40-card deck uses cards2 with Title_Case suit names (e.g. Queen_of_Clubs.png).
 */
export const CARD_ASSETS_DIR = '/assets/cards2';

/** Prefer .png from commercial pack; fall back to repo placeholder .svg */
const CARD_EXT = process.env.REACT_APP_CARD_EXT === 'png' ? 'png' : 'svg';

export const CARD_BACK_PATH = `${CARD_ASSETS_DIR}/card_back.${CARD_EXT}`;

/**
 * Builds the public URL for a card image used by the Sueca UI.
 */
export function getCardImagePath(rankImageName: string, suitImageName: string, publicUrl = ''): string {
  const basePath = publicUrl && !publicUrl.endsWith('/') ? publicUrl : publicUrl || '';
  return `${basePath}${CARD_ASSETS_DIR}/${rankImageName}_of_${suitImageName}.${CARD_EXT}`;
}
