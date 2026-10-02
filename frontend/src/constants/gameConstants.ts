/**
 * Game constants - centralized configuration values
 */

// AI and timing
/** Card-play delay for Spades, Hearts, and King. Not the Spades bid delay. */
export const AI_PLAY_DELAY_MS = 1500;
/** Spades AI bid pause. Same duration as card play today; a separate beat. */
export const SPADES_AI_BID_DELAY_MS = 1500;
/** Hearts receipt beat after a real pass. Not the Sueca follow delay. */
export const HEARTS_PASS_EXCHANGE_MS = 800;
/** Non-auction festa AI steps (negotiation, fallback, setup). */
export const FESTA_AI_STEP_DELAY_MS = 350;

// Game delays
export const GAME_OVER_DELAY_MS = 3000; // Delay before showing start menu after game over (3s)
/** Delay after trick completes before trick-collect SFX. */
export const TRICK_COLLECT_DELAY_MS = 200;
/**
 * Shuffle leads the shared deal/round cue (short delay for WebView stability).
 */
export const SHUFFLE_DELAY_MS = 50;
/**
 * Deal SFX after the same hands-appeared / round-start cue as shuffle.
 * One short deal cue (not per-card).
 */
export const DEAL_DELAY_MS = 600;
/**
 * Soft round-start cue after shuffle→deal (audio only; no gameplay delay).
 */
export const ROUND_START_SFX_DELAY_MS = 1000;

/**
 * UX-ROUND-01 — hold table + restrained cue after synthetic negatives,
 * before opening the King score sheet (800–1200 ms band).
 */
export const SYNTHETIC_ROUND_COMPLETE_HOLD_MS = 1000;

export const TRICK_AUTO_CONTINUE_SECONDS = 5;

// LocalStorage keys
export const STORAGE_KEYS = {
  /**
   * @deprecated Compatibility-only — clearLocalUserData may still remove this key.
   * No active Sueca writer (ARCH-SUECA-09).
   */
  DEALING_METHOD: 'sueca-dealing-method',
  /** Session play direction preference (`'right'` | `'left'`). */
  PLAY_DIRECTION: 'sueca-play-direction',
  PLAYER_NAMES: 'sueca-player-names',
  AI_DIFFICULTY: 'sueca-ai-difficulty',
  SORT_HAND: 'sueca-sort-hand',
  HAND_SUIT_ORDER: 'sueca-hand-suit-order',
  TRUMP_POSITION: 'sueca-trump-position',
  AUTO_PAUSE_TRICK: 'sueca-auto-pause-trick',
  CARD_FRONT: 'suecao-card-front',
  CARD_BACK: 'suecao-card-back',
  DEAL_ANIMATION_SPEED: 'suecao-deal-animation-speed',
  MUSIC_VOLUME: 'suecao-music-volume',
  SFX_VOLUME: 'suecao-sfx-volume'
} as const;

// Default values
export const DEFAULT_PLAYER_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
export const DEFAULT_AI_DIFFICULTY = 'medium' as const;
