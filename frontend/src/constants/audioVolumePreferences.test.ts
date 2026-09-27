import { beforeEach, describe, expect, it } from 'vitest';
import {
  AUDIO_VOLUME_LEVELS,
  audioLevelToGain,
  loadMusicVolumeLevel,
  loadSfxVolumeLevel,
  normalizeAudioVolumeLevel,
  saveMusicVolumeLevel,
  saveSfxVolumeLevel
} from './audioVolumePreferences';
import { STORAGE_KEYS } from './gameConstants';

describe('audioVolumePreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('allows only 0/25/50/75/100', () => {
    expect(AUDIO_VOLUME_LEVELS).toEqual([0, 25, 50, 75, 100]);
  });

  it('normalizes legacy / invalid values to nearest step', () => {
    expect(normalizeAudioVolumeLevel(63)).toBe(75);
    expect(normalizeAudioVolumeLevel(12)).toBe(0);
    expect(normalizeAudioVolumeLevel(13)).toBe(25);
    expect(normalizeAudioVolumeLevel(50)).toBe(50);
    expect(normalizeAudioVolumeLevel('100')).toBe(100);
    expect(normalizeAudioVolumeLevel('nope')).toBe(100);
    expect(normalizeAudioVolumeLevel(NaN, 50)).toBe(50);
    expect(normalizeAudioVolumeLevel(null, 25)).toBe(25);
  });

  it('persists music and SFX independently', () => {
    saveMusicVolumeLevel(25);
    saveSfxVolumeLevel(75);
    expect(loadMusicVolumeLevel()).toBe(25);
    expect(loadSfxVolumeLevel()).toBe(75);
    expect(localStorage.getItem(STORAGE_KEYS.MUSIC_VOLUME)).toBe('25');
    expect(localStorage.getItem(STORAGE_KEYS.SFX_VOLUME)).toBe('75');
    saveMusicVolumeLevel(0);
    expect(loadMusicVolumeLevel()).toBe(0);
    expect(loadSfxVolumeLevel()).toBe(75);
  });

  it('maps level to linear gain 0–1', () => {
    expect(audioLevelToGain(0)).toBe(0);
    expect(audioLevelToGain(50)).toBe(0.5);
    expect(audioLevelToGain(100)).toBe(1);
  });
});
