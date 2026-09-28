/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CARD_PLAY_VARIANTS, MISSING_SFX_ASSET_IDS } from '../constants/sfxAssets';
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
import { resolveUiClickTarget, UI_CLICK_SELECTOR } from '../uiClickSfx';

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

describe('wired SFX coverage', () => {
  beforeEach(() => {
    resetAudioServiceForTests();
    localStorage.clear();
    vi.useRealTimers();
  });

  it('has no missing mesa SFX ids; card-play / error / uiClick are playable', () => {
    expect(MISSING_SFX_ASSET_IDS).toEqual([]);
    for (const id of [...CARD_PLAY_VARIANTS, 'error', 'uiClick'] as const) {
      expect(isSfxPlayable(id)).toBe(true);
    }
  });

  it('legal card-play variant plays through audioService from CARD_PLAY_VARIANTS', () => {
    const { audioMock, play } = makeAudioMock();
    const AudioCtor = vi.fn((src?: string) => {
      audioMock.src = src ?? '';
      return audioMock;
    });
    // @ts-expect-error test mock
    global.Audio = AudioCtor;
    setSoundEnabled(true);
    setSfxVolumeLevel(100);
    play.mockClear();
    playRandomCardPlay();
    expect(play).toHaveBeenCalledTimes(1);
    const constructed = AudioCtor.mock.calls.map((c) => String(c[0] ?? ''));
    expect(constructed.some((p) => /card-play-[123]\.ogg/.test(p))).toBe(true);
  });

  it('error and ui-click play when enabled; silence at SFX 0 and master off', () => {
    const { audioMock, play } = makeAudioMock();
    // @ts-expect-error test mock
    global.Audio = vi.fn(() => audioMock);
    setSoundEnabled(true);
    setSfxVolumeLevel(100);
    play.mockClear();
    playErrorSound();
    playUiClick();
    expect(play).toHaveBeenCalledTimes(2);

    play.mockClear();
    setSfxVolumeLevel(0);
    playErrorSound();
    playUiClick();
    expect(play).not.toHaveBeenCalled();

    setSfxVolumeLevel(50);
    setSoundEnabled(false);
    playErrorSound();
    playUiClick();
    playRandomCardPlay();
    expect(play).not.toHaveBeenCalled();
    expect(getSfxVolumeLevel()).toBe(50);
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

  it('deal cadence is independent of SFX volume and availability', () => {
    localStorage.setItem(STORAGE_KEYS.DEAL_ANIMATION_SPEED, 'normal');
    const delay = getDealDelayMs();
    setSfxVolumeLevel(0);
    expect(getDealDelayMs()).toBe(delay);
    __markSfxUnavailableForTests('deal');
    expect(getDealDelayMs()).toBe(delay);
    expect(() => playDealSound()).not.toThrow();
  });
});

describe('UI click targeting', () => {
  it('keeps selector narrow to sueca-btn and lang-btn', () => {
    expect(UI_CLICK_SELECTOR).toBe('.sueca-btn, .lang-btn');
  });

  it('resolves sueca-btn / lang-btn; skips unrelated, disabled, and .disabled', () => {
    const btn = document.createElement('button');
    btn.className = 'sueca-btn';
    document.body.appendChild(btn);
    expect(resolveUiClickTarget(btn)).toBe(btn);

    const nest = document.createElement('span');
    btn.appendChild(nest);
    expect(resolveUiClickTarget(nest)).toBe(btn);

    const lang = document.createElement('button');
    lang.className = 'lang-btn';
    document.body.appendChild(lang);
    expect(resolveUiClickTarget(lang)).toBe(lang);

    const plain = document.createElement('button');
    document.body.appendChild(plain);
    expect(resolveUiClickTarget(plain)).toBeNull();

    btn.disabled = true;
    expect(resolveUiClickTarget(btn)).toBeNull();

    const soft = document.createElement('button');
    soft.className = 'sueca-btn disabled';
    document.body.appendChild(soft);
    expect(resolveUiClickTarget(soft)).toBeNull();
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
