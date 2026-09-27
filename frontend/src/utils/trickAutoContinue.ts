import { STORAGE_KEYS } from '../constants/gameConstants';
import { bumpSyncablePrefsRevision } from '../services/syncablePrefsRevision';

/** When true, trick end requires manual Continue (no auto countdown). */
export function loadAutoPauseTrick(): boolean {
  return localStorage.getItem(STORAGE_KEYS.AUTO_PAUSE_TRICK) === 'true';
}

export function saveAutoPauseTrick(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEYS.AUTO_PAUSE_TRICK, String(enabled));
  // SYNC-01A — local prefs mutation counter (not cross-device authority).
  bumpSyncablePrefsRevision();
}
