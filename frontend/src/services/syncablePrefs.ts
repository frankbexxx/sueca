/**
 * SYNC-01A — syncable prefs adapter (strategy A).
 *
 * Existing keys remain source of truth for UX.
 * `sueca-syncable-prefs-v1` holds only local mutation revision metadata
 * (not cross-device authority). `buildSyncablePrefsDocument()` assembles
 * the future sync payload from live keys.
 */

import { STORAGE_KEYS } from '../constants/gameConstants';
import { loadHandPreferences, type HandPreferences } from '../constants/handPreferences';
import { getActiveTheme } from './billingService';
import { loadSetupPrefs, type SetupPrefsV1 } from './setupPreferences';
import {
  getLocalPrefsRevision,
  getSyncablePrefsMeta,
  bumpSyncablePrefsRevision,
  __resetSyncablePrefsMetaForTests,
  SYNCABLE_PREFS_META_KEY,
  type SyncablePrefsMetaV1
} from './syncablePrefsRevision';

export {
  SYNCABLE_PREFS_META_KEY,
  getSyncablePrefsMeta,
  bumpSyncablePrefsRevision,
  getLocalPrefsRevision,
  __resetSyncablePrefsMetaForTests
};
export type { SyncablePrefsMetaV1 };

export type SyncablePrefsDataV1 = {
  setup: SetupPrefsV1;
  hand: HandPreferences;
  dealingMethod: string | null;
  autoPauseTrick: boolean;
  activeTheme: string;
};

export type SyncablePrefsDocumentV1 = {
  schemaVersion: 1;
  localPrefsRevision: number;
  localUpdatedAt: number;
  data: SyncablePrefsDataV1;
};

/** Assemble future sync payload from live existing keys + local revision meta. */
export function buildSyncablePrefsDocument(): SyncablePrefsDocumentV1 {
  const meta = getSyncablePrefsMeta();
  const dealing = (() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.DEALING_METHOD);
    } catch {
      return null;
    }
  })();
  const autoPause = (() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTO_PAUSE_TRICK) === 'true';
    } catch {
      return false;
    }
  })();

  return {
    schemaVersion: 1,
    localPrefsRevision: meta.localPrefsRevision,
    localUpdatedAt: meta.localUpdatedAt,
    data: {
      setup: loadSetupPrefs(),
      hand: loadHandPreferences(),
      dealingMethod: dealing,
      autoPauseTrick: autoPause,
      activeTheme: getActiveTheme()
    }
  };
}
