import { STORAGE_KEYS } from '../constants/gameConstants';

/** When true, trick end requires manual Continue (no auto countdown). */
export function loadAutoPauseTrick(): boolean {
  return localStorage.getItem(STORAGE_KEYS.AUTO_PAUSE_TRICK) === 'true';
}

export function saveAutoPauseTrick(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEYS.AUTO_PAUSE_TRICK, String(enabled));
}
