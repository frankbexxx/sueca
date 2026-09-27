/**
 * AUTH-01E — selective wipe of durable local *user* data.
 *
 * NEVER call localStorage.clear().
 * Language preference is kept (device UX, not career data).
 * Music filesystem cache is cleared when available (best-effort).
 */

import { STORAGE_KEYS } from '../constants/gameConstants';
import { LOCAL_GUEST_KEY, __resetLocalGuestCacheForTests } from './localGuestIdentity';
import { AUTH_REFRESH_STORAGE_KEY } from './authSessionStorage';
import { STATS_KEY, SESSIONS_KEY, LEGACY_SESSION_KEY, LAST_CONFIG_KEY } from './gameSessionStorage';
import { MATCH_HISTORY_KEY } from './matchHistoryStorage';
import { PINNED_KEY, FINISHED_KEY } from './gameHistoryStorage';
import { SETUP_PREFS_KEY } from './setupPreferences';
import { DIAGNOSTIC_LS_KEY } from '../diagnostics/store';
import {
  DURABLE_BACKUP_REGISTRY_KEY,
  DURABLE_QUARANTINE_KEY
} from './durableLocalStorage';
import { MUSIC_SETTINGS_KEY, LEGACY_MUSIC_MODE_KEY } from '../audio/musicSettings';
import { SYNC_META_KEY } from './syncMetadata';
import { SYNCABLE_PREFS_META_KEY } from './syncablePrefsRevision';
import { LEGACY_STATS_SEED_KEY } from './legacyStatsSeed';
import { SYNC_OUTBOX_KEY } from './syncOutbox';

/** Custom themes storage key (customThemeStorage). */
export const CUSTOM_THEMES_KEY = 'suecao-custom-themes';

/** Card Intelligence diagnostic fallback (dev/debug). */
export const CARD_INTELLIGENCE_LOG_FALLBACK_KEY = 'card-intelligence-log-events-fallback';

const SOUND_ENABLED_KEY = 'sueca-sound-enabled';

/**
 * Exact keys removed on "Também apagar dados locais".
 * Keep: sueca-language (and anything not listed).
 */
export const LOCAL_USER_DATA_KEYS: readonly string[] = [
  // Identity + account link metadata
  LOCAL_GUEST_KEY,
  AUTH_REFRESH_STORAGE_KEY,
  // Sync metadata (SYNC-01A/01C)
  SYNC_META_KEY,
  SYNCABLE_PREFS_META_KEY,
  LEGACY_STATS_SEED_KEY,
  SYNC_OUTBOX_KEY,
  // Career / history / sessions
  STATS_KEY,
  MATCH_HISTORY_KEY,
  SESSIONS_KEY,
  LEGACY_SESSION_KEY,
  PINNED_KEY,
  FINISHED_KEY,
  // Setup / profile prefs
  SETUP_PREFS_KEY,
  LAST_CONFIG_KEY,
  STORAGE_KEYS.PLAYER_NAMES,
  STORAGE_KEYS.AI_DIFFICULTY,
  STORAGE_KEYS.DEALING_METHOD,
  STORAGE_KEYS.SORT_HAND,
  STORAGE_KEYS.HAND_SUIT_ORDER,
  `${STORAGE_KEYS.HAND_SUIT_ORDER}-custom`,
  STORAGE_KEYS.TRUMP_POSITION,
  STORAGE_KEYS.AUTO_PAUSE_TRICK,
  'sueca-game-variant',
  'sueca-rules-preset',
  // Themes
  CUSTOM_THEMES_KEY,
  'suecao-theme',
  // Audio prefs (not language)
  MUSIC_SETTINGS_KEY,
  LEGACY_MUSIC_MODE_KEY,
  SOUND_ENABLED_KEY,
  // Diagnostics
  DIAGNOSTIC_LS_KEY,
  CARD_INTELLIGENCE_LOG_FALLBACK_KEY,
  // Durable helper ledgers tied to wiped keys
  DURABLE_BACKUP_REGISTRY_KEY,
  DURABLE_QUARANTINE_KEY
];

export type ClearLocalUserDataResult = {
  removedKeys: string[];
  musicCacheCleared: boolean;
};

function removeKey(key: string): boolean {
  try {
    if (localStorage.getItem(key) == null) return false;
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Wipe listed local user-data keys only. Does not use localStorage.clear().
 * Resets in-memory LocalGuest cache so the next ensure() mints a fresh guest.
 */
export function clearLocalUserData(): ClearLocalUserDataResult {
  const removedKeys: string[] = [];
  for (const key of LOCAL_USER_DATA_KEYS) {
    if (removeKey(key)) removedKeys.push(key);
  }
  __resetLocalGuestCacheForTests();
  return { removedKeys, musicCacheCleared: false };
}

/**
 * Async variant: also best-effort clear Capacitor music cache.
 */
export async function clearLocalUserDataAsync(): Promise<ClearLocalUserDataResult> {
  const base = clearLocalUserData();
  let musicCacheCleared = false;
  try {
    const { clearAllMusicCache } = await import('../audio/musicCacheService');
    await clearAllMusicCache();
    musicCacheCleared = true;
  } catch {
    /* web / unavailable — ok */
  }
  return { ...base, musicCacheCleared };
}
