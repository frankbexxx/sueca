/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MISSING_SFX_ASSET_IDS,
  MISSING_SFX_PLANNED_FILES
} from '../constants/sfxAssets';
import { getDealDelayMs } from '../constants/dealAnimationPreferences';
import { STORAGE_KEYS } from '../constants/gameConstants';
import {
  __getUnavailableSfxForTests,
  __markSfxUnavailableForTests,
  getEffectiveMusicVolume,
  getMusicMode,
  getMusicSettings,
  getMusicVolumeLevel,
  getSfxGainMultiplier,
  getSfxVolumeLevel,
  isSoundEnabled,
  isSfxPlayable,
  playDealSound,
  playErrorSound,
  playMusic,
  playRandomCardPlay,
  playSfx,
  playUiClick,
  preloadSfx,
  resetAudioServiceForTests,
  setMusicMode,
  setMusicVolumeLevel,
  setSfxVolumeLevel,
  setSoundEnabled,
  updateMusicSettings
} from '../services/audioService';
import { MUSIC_VOLUME } from '../constants/musicCatalog';

function makeAudioMock() {
  const play = vi.fn().mockResolvedValue(undefined);
  const pause = vi.fn();
  const load = vi.fn();
  const listeners = new Map<string, Array<() => void>>();
  const audioMock: Record<string, unknown> = {
    loop: false,
    preload: '',
    volume: 1,
    pause,
    play,
    load,
    paused: true,
    currentTime: 0,
    src: '',
    addEventListener: (event: string, cb: () => void) => {
      const list = listeners.get(event) ?? [];
      list.push(cb);
      listeners.set(event, list);
    },
    cloneNode: () => ({ ...audioMock, play, volume: 1 })
  };
  return { audioMock, play, pause, load, listeners };
}

describe('audio coverage / missing SFX', () => {
  beforeEach(() => {
    resetAudioServiceForTests();
    localStorage.clear();
    vi.useRealTimers();
  });

  it('documents planned files for every missing SFX gap', () => {
    for (const id of MISSING_SFX_ASSET_IDS) {
      expect(MISSING_SFX_PLANNED_FILES[id]).toMatch(/\.ogg$/);
      expect(isSfxPlayable(id)).toBe(false);
    }
  });

  it('missing SFX and card-play variants fail gracefully without constructing Audio', () => {
    const ctor = vi.fn();
    // @ts-expect-error test mock
    global.Audio = ctor;
    expect(() => playRandomCardPlay()).not.toThrow();
    expect(() => playErrorSound()).not.toThrow();
    expect(() => playUiClick()).not.toThrow();
    expect(() => playSfx('cardPlay1')).not.toThrow();
    expect(() => playSfx('error')).not.toThrow();
    expect(() => playSfx('uiClick')).not.toThrow();
    expect(ctor).not.toHaveBeenCalled();
  });

  it('bundled deal SFX still plays through audioService', () => {
    const { audioMock, play } = makeAudioMock();
    // @ts-expect-error test mock
    global.Audio = vi.fn(() => audioMock);
    setSoundEnabled(true);
    setSfxVolumeLevel(100);
    playDealSound();
    expect(play).toHaveBeenCalled();
  });

  it('marks failed bundled SFX unavailable and does not retry play', () => {
    const { audioMock, play } = makeAudioMock();
    // @ts-expect-error test mock
    global.Audio = vi.fn(() => audioMock);
    setSoundEnabled(true);
    setSfxVolumeLevel(100);
    preloadSfx();
    __markSfxUnavailableForTests('deal');
    play.mockClear();
    playDealSound();
    playDealSound();
    expect(play).not.toHaveBeenCalled();
    expect(__getUnavailableSfxForTests()).toContain('deal');
    expect(isSfxPlayable('deal')).toBe(false);
  });

  it('deal cadence is independent of SFX availability', () => {
    localStorage.setItem(STORAGE_KEYS.DEAL_ANIMATION_SPEED, 'normal');
    const delay = getDealDelayMs();
    __markSfxUnavailableForTests('deal');
    expect(getDealDelayMs()).toBe(delay);
    expect(() => playDealSound()).not.toThrow();
  });
});

describe('master sound switch preserves channel prefs', () => {
  beforeEach(() => {
    resetAudioServiceForTests();
    localStorage.clear();
    const { audioMock } = makeAudioMock();
    // @ts-expect-error test mock
    global.Audio = vi.fn(() => audioMock);
  });

  it('master off silences without overwriting music/SFX levels or music mode', () => {
    setMusicVolumeLevel(75);
    setSfxVolumeLevel(25);
    updateMusicSettings({ mode: 'family', selectedFamily: 'Nordic / Arctic' });
    expect(getMusicVolumeLevel()).toBe(75);
    expect(getSfxVolumeLevel()).toBe(25);

    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    expect(getEffectiveMusicVolume()).toBe(0);
    expect(getSfxGainMultiplier()).toBe(0);
    expect(getMusicVolumeLevel()).toBe(75);
    expect(getSfxVolumeLevel()).toBe(25);
    expect(getMusicMode()).toBe('family');
    expect(getMusicSettings().selectedFamily).toBe('Nordic / Arctic');
    expect(localStorage.getItem(STORAGE_KEYS.MUSIC_VOLUME)).toBe('75');
    expect(localStorage.getItem(STORAGE_KEYS.SFX_VOLUME)).toBe('25');
  });

  it('master on restores effective gain from persisted levels', () => {
    setMusicVolumeLevel(50);
    setSfxVolumeLevel(75);
    setSoundEnabled(false);
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
    expect(getMusicVolumeLevel()).toBe(50);
    expect(getSfxVolumeLevel()).toBe(75);
    expect(getEffectiveMusicVolume()).toBeCloseTo(MUSIC_VOLUME * 0.5, 5);
    expect(getSfxGainMultiplier()).toBe(0.75);
  });
});

describe('music mode off vs music volume 0', () => {
  beforeEach(() => {
    resetAudioServiceForTests();
    localStorage.clear();
    const { audioMock } = makeAudioMock();
    // @ts-expect-error test mock
    global.Audio = vi.fn(() => audioMock);
    setSoundEnabled(true);
  });

  it('mode off stops music while SFX volume and music volume prefs remain', () => {
    setMusicVolumeLevel(100);
    setSfxVolumeLevel(50);
    setMusicMode('theme-default');
    playMusic();
    setMusicMode('off');
    expect(getMusicMode()).toBe('off');
    expect(getMusicVolumeLevel()).toBe(100);
    expect(getSfxVolumeLevel()).toBe(50);
    expect(getEffectiveMusicVolume()).toBeCloseTo(MUSIC_VOLUME, 5);
    expect(getSfxGainMultiplier()).toBe(0.5);
  });

  it('volume 0 silences bed but keeps mode; raising volume resumes apply path', () => {
    const { audioMock, play } = makeAudioMock();
    // @ts-expect-error test mock
    global.Audio = vi.fn(() => audioMock);
    setMusicMode('theme-default');
    setMusicVolumeLevel(0);
    expect(getMusicMode()).toBe('theme-default');
    expect(getEffectiveMusicVolume()).toBe(0);
    play.mockClear();
    setMusicVolumeLevel(50);
    expect(getMusicVolumeLevel()).toBe(50);
    expect(getMusicMode()).toBe('theme-default');
    expect(getEffectiveMusicVolume()).toBeCloseTo(MUSIC_VOLUME * 0.5, 5);
  });
});
