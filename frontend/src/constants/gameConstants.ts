/**
 * Game constants - centralized configuration values
 */

// AI and timing
export const AI_PLAY_DELAY_MS = 1500; // Delay before AI plays a card (1.5s)

// Card layout
export const CARD_SPACING = 18; // Spacing between cards in hand (70% of 26px)
export const MAX_CARDS_IN_HAND = 10; // Maximum cards a player can hold
export const SELECTED_CARD_Z_INDEX = 1000; // Z-index for selected card

// Modal z-indexes
export const MODAL_Z_INDEX_ROUND_END = 2000;
export const MODAL_Z_INDEX_GAME_START = 1000;
export const MODAL_Z_INDEX_GAME_OVER = 1001;

// Game delays
export const GAME_OVER_DELAY_MS = 3000; // Delay before showing start menu after game over (3s)
export const TRICK_WIN_DELAY_MS = 200;
export const SHUFFLE_DELAY_MS = 250;

// Card layout thresholds
export const HAND_SCROLL_THRESHOLD = 8;

export const TRICK_AUTO_CONTINUE_SECONDS = 5;

// LocalStorage keys
export const STORAGE_KEYS = {
  DEALING_METHOD: 'sueca-dealing-method',
  PLAYER_NAMES: 'sueca-player-names',
  AI_DIFFICULTY: 'sueca-ai-difficulty',
  SORT_HAND: 'sueca-sort-hand',
  HAND_SUIT_ORDER: 'sueca-hand-suit-order',
  TRUMP_POSITION: 'sueca-trump-position',
  AUTO_PAUSE_TRICK: 'sueca-auto-pause-trick'
} as const;

// Default values
export const DEFAULT_PLAYER_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
export const DEFAULT_DEALING_METHOD = 'A' as const;
export const DEFAULT_AI_DIFFICULTY = 'medium' as const;
