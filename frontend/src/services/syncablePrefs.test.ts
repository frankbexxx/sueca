/**
 * @vitest-environment jsdom
 * SYNC-01A — syncable prefs revision + adapter
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { saveHandPreferences } from '../constants/handPreferences';
import { setActiveTheme } from './billingService';
import { persistSetupPrefs, loadSetupPrefs } from './setupPreferences';
import { saveAutoPauseTrick } from '../utils/trickAutoContinue';
import {
  __resetSyncablePrefsMetaForTests,
  buildSyncablePrefsDocument,
  getLocalPrefsRevision
} from './syncablePrefs';
import { MUSIC_SETTINGS_KEY } from '../audio/musicSettings';

describe('SYNC-01A syncable prefs', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetSyncablePrefsMetaForTests();
  });

  it('increments localPrefsRevision on syncable preference mutations', () => {
    // loadSetupPrefs may migrate+persist once; measure deltas from a known baseline.
    const prefs = loadSetupPrefs();
    const baseline = getLocalPrefsRevision();

    persistSetupPrefs({ ...prefs, p1Name: 'Alice' });
    expect(getLocalPrefsRevision()).toBe(baseline + 1);

    saveHandPreferences({ sortEnabled: false });
    expect(getLocalPrefsRevision()).toBe(baseline + 2);

    setActiveTheme('forest');
    expect(getLocalPrefsRevision()).toBe(baseline + 3);

    saveAutoPauseTrick(true);
    expect(getLocalPrefsRevision()).toBe(baseline + 4);
  });

  it('does not increment on unrelated local-only prefs', () => {
    persistSetupPrefs({ ...loadSetupPrefs(), p1Name: 'Bob' });
    const after = getLocalPrefsRevision();
    localStorage.setItem(MUSIC_SETTINGS_KEY, JSON.stringify({ volume: 0.5 }));
    localStorage.setItem('sueca-language', 'en');
    localStorage.setItem('sueca-sound-enabled', 'false');
    expect(getLocalPrefsRevision()).toBe(after);
  });

  it('buildSyncablePrefsDocument reads live keys + revision meta', () => {
    persistSetupPrefs({ ...loadSetupPrefs(), p1Name: 'Carol' });
    setActiveTheme('midnight');
    const doc = buildSyncablePrefsDocument();
    expect(doc.schemaVersion).toBe(1);
    expect(doc.localPrefsRevision).toBeGreaterThan(0);
    expect(doc.data.setup.p1Name).toBe('Carol');
    expect(doc.data.activeTheme).toBe('midnight');
  });
});
