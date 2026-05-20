/**
 * Public card image assets (Create React App serves from public/).
 * Sueca 40-card deck uses cards2 with Title_Case suit names (e.g. Queen_of_Clubs.png).
 */
export const CARD_ASSETS_DIR = '/assets/cards2';

/**
 * Builds the public URL for a card image used by the Sueca UI.
 */
export function getCardImagePath(rankImageName: string, suitImageName: string, publicUrl = ''): string {
  const basePath = publicUrl && !publicUrl.endsWith('/') ? publicUrl : publicUrl || '';
  return `${basePath}${CARD_ASSETS_DIR}/${rankImageName}_of_${suitImageName}.png`;
}
