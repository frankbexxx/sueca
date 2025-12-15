/**
 * Card mapping utilities
 * Centralized mappings for card rank/suit conversions
 */

/**
 * Maps suit names to single letter codes (for AI service communication)
 */
export const SUIT_TO_CODE: Record<string, string> = {
  clubs: 'C',
  diamonds: 'D',
  hearts: 'H',
  spades: 'S'
};

/**
 * Maps suit names to full names (for image paths)
 */
export const SUIT_TO_NAME: Record<string, string> = {
  clubs: 'clubs',
  diamonds: 'diamonds',
  hearts: 'hearts',
  spades: 'spades'
};

/**
 * Maps card ranks to image filename format
 */
export const RANK_TO_IMAGE_NAME: Record<string, string> = {
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  'Q': 'queen',
  'J': 'jack',
  'K': 'king',
  '7': '7',
  'A': 'ace'
};

/**
 * Maps suit names to emoji representations
 */
export const SUIT_TO_EMOJI: Record<string, string> = {
  clubs: '♣',
  diamonds: '♦',
  hearts: '♥',
  spades: '♠'
};

