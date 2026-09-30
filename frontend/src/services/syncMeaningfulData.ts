/**
 * SYNC-01D — “meaningful” Class A data detectors (local + cloud).
 *
 * LocalGuest / auth metadata alone are NEVER meaningful.
 */

import { DEFAULT_PLAYER_NAMES, DEFAULT_AI_DIFFICULTY } from '../constants/gameConstants';
import { loadHandPreferences } from '../constants/handPreferences';
import { getActiveTheme } from './billingService';
import { loadLegacyStatsSeed } from './legacyStatsSeed';
import { loadMatchHistory } from './matchHistoryStorage';
import { loadSetupPrefs, type SetupPrefsV1 } from './setupPreferences';
import { buildSyncablePrefsDocument } from './syncablePrefs';
import type { SyncSnapshotResponse, SyncStatusResponse } from './syncApiClient';
import { STORAGE_KEYS } from '../constants/gameConstants';

const VARIANTS = ['sueca', 'spades', 'hearts', 'king'] as const;

function seedMetricsNonZero(seed: ReturnType<typeof loadLegacyStatsSeed>): boolean {
  if (!seed?.metrics) return false;
  if (seed.metrics.gamesPlayed > 0 || seed.metrics.wins > 0) return true;
  for (const v of VARIANTS) {
    const row = seed.metrics.byVariant?.[v];
    if (row && (row.played > 0 || row.wins > 0)) return true;
  }
  return false;
}

function setupLooksDefault(prefs: SetupPrefsV1): boolean {
  if (prefs.p1Name.trim() !== DEFAULT_PLAYER_NAMES[0]) return false;
  for (const v of VARIANTS) {
    const bots = prefs.botNamesByVariant[v];
    if (
      !bots ||
      bots[0] !== DEFAULT_PLAYER_NAMES[1] ||
      bots[1] !== DEFAULT_PLAYER_NAMES[2] ||
      bots[2] !== DEFAULT_PLAYER_NAMES[3]
    ) {
      return false;
    }
    if (prefs.difficultyByVariant[v] !== DEFAULT_AI_DIFFICULTY) return false;
  }
  return true;
}

function handLooksDefault(): boolean {
  const hand = loadHandPreferences();
  return (
    hand.sortEnabled === true &&
    hand.suitOrderPreset === 'vpvp' &&
    hand.trumpPosition === 'left'
  );
}

export function hasMeaningfulLocalHistory(): boolean {
  return loadMatchHistory().length > 0;
}

export function hasMeaningfulLocalSeed(): boolean {
  return seedMetricsNonZero(loadLegacyStatsSeed());
}

/** Prefs differ from product defaults (setup / hand / theme / auto-pause). */
export function hasMeaningfulLocalPrefs(): boolean {
  const setup = loadSetupPrefs();
  if (!setupLooksDefault(setup)) return true;
  if (!handLooksDefault()) return true;
  if (getActiveTheme() !== 'classic') return true;
  try {
    if (localStorage.getItem(STORAGE_KEYS.AUTO_PAUSE_TRICK) === 'true') return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function hasMeaningfulLocalSyncData(): boolean {
  return (
    hasMeaningfulLocalHistory() ||
    hasMeaningfulLocalPrefs() ||
    hasMeaningfulLocalSeed()
  );
}

export function hasMeaningfulCloudHistory(
  snapshot: SyncSnapshotResponse | null | undefined
): boolean {
  return Boolean(snapshot?.history && snapshot.history.length > 0);
}

export function hasMeaningfulCloudSeed(
  status: SyncStatusResponse | null | undefined,
  snapshot: SyncSnapshotResponse | null | undefined
): boolean {
  if (status?.hasLegacyStatsSeed) return true;
  const seed = snapshot?.legacyStatsSeed;
  if (!seed?.payload) return false;
  const metrics = (seed.payload as { metrics?: { gamesPlayed?: number; wins?: number } }).metrics;
  if (!metrics) return false;
  return (metrics.gamesPlayed ?? 0) > 0 || (metrics.wins ?? 0) > 0;
}

export function hasMeaningfulCloudPrefs(
  status: SyncStatusResponse | null | undefined,
  snapshot: SyncSnapshotResponse | null | undefined
): boolean {
  if (status && status.prefsRevision > 0) return true;
  if (snapshot?.prefs && snapshot.prefs.payload) return true;
  return false;
}

export function hasMeaningfulCloudSyncData(
  status: SyncStatusResponse | null | undefined,
  snapshot: SyncSnapshotResponse | null | undefined
): boolean {
  return (
    hasMeaningfulCloudHistory(snapshot) ||
    hasMeaningfulCloudPrefs(status, snapshot) ||
    hasMeaningfulCloudSeed(status, snapshot)
  );
}

/** Debug/test: current local Class A summary. */
export function summarizeLocalClassA(): {
  historyCount: number;
  prefsMeaningful: boolean;
  seedMeaningful: boolean;
  prefsRevision: number;
} {
  const doc = buildSyncablePrefsDocument();
  return {
    historyCount: loadMatchHistory().length,
    prefsMeaningful: hasMeaningfulLocalPrefs(),
    seedMeaningful: hasMeaningfulLocalSeed(),
    prefsRevision: doc.localPrefsRevision
  };
}
