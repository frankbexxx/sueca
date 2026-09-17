import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_MUSIC_SETTINGS,
  LEGACY_MUSIC_MODE_KEY,
  MUSIC_SETTINGS_KEY,
  loadMusicSettings,
  migrateLegacyMusicMode,
  parseMusicSettingsJson,
  patchMusicSettings,
  saveMusicSettings
} from './musicSettings';

describe('musicSettings', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to theme-default', () => {
    expect(loadMusicSettings()).toEqual(DEFAULT_MUSIC_SETTINGS);
  });

  it('migrates legacy off without breaking Theme Default users', () => {
    expect(migrateLegacyMusicMode('off').mode).toBe('off');
    expect(migrateLegacyMusicMode('theme-default').mode).toBe('theme-default');
    expect(migrateLegacyMusicMode(null).mode).toBe('theme-default');

    localStorage.setItem(LEGACY_MUSIC_MODE_KEY, 'off');
    expect(loadMusicSettings().mode).toBe('off');
    expect(localStorage.getItem(MUSIC_SETTINGS_KEY)).toBeTruthy();
  });

  it('persists advanced fields', () => {
    saveMusicSettings({
      mode: 'family',
      selectedFamily: 'Celtic',
      selectedTrackId: null
    });
    expect(loadMusicSettings()).toEqual({
      mode: 'family',
      selectedFamily: 'Celtic',
      selectedTrackId: null
    });

    patchMusicSettings({ mode: 'specific', selectedTrackId: 'celtic-traveler' });
    expect(loadMusicSettings().mode).toBe('specific');
    expect(loadMusicSettings().selectedTrackId).toBe('celtic-traveler');
  });

  it('rejects malformed JSON / modes', () => {
    expect(parseMusicSettingsJson('{')).toBeNull();
    expect(parseMusicSettingsJson(JSON.stringify({ mode: 'nope' }))?.mode).toBe(
      'theme-default'
    );
  });
});
