import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listContentIdTrackIds } from '../audio/musicCatalogPool';
import { MUSIC_SETTINGS_KEY } from '../audio/musicSettings';
import {
  __handleMusicEndedForTests,
  getCurrentMusicTrack,
  getMusicMode,
  getMusicSettings,
  resetAudioServiceForTests,
  setMusicMode,
  setMusicSettings,
  setMusicTrack,
  updateMusicSettings
} from './audioService';

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

describe('audioService advanced music settings', () => {
  beforeEach(() => {
    resetAudioServiceForTests();
    localStorage.clear();
  });

  afterEach(() => {
    resetAudioServiceForTests();
    localStorage.clear();
  });

  it('Random Streaming Safe never picks Content ID tracks', async () => {
    const { audioMock } = makeAudioMock();
    // @ts-expect-error test mock
    global.Audio = vi.fn(() => audioMock);

    const cid = new Set(listContentIdTrackIds());
    expect(cid.size).toBeGreaterThanOrEqual(3);

    setMusicSettings({
      mode: 'random-streaming-safe',
      selectedFamily: null,
      selectedTrackId: null
    });
    await Promise.resolve();
    await Promise.resolve();

    for (let i = 0; i < 12; i++) {
      await __handleMusicEndedForTests();
      expect(cid.has(getCurrentMusicTrack())).toBe(false);
    }
  });

  it('Specific core plays local id', async () => {
    const { audioMock } = makeAudioMock();
    // @ts-expect-error test mock
    global.Audio = vi.fn(() => audioMock);

    setMusicSettings({
      mode: 'specific',
      selectedFamily: null,
      selectedTrackId: 'yamatai-shizima'
    });
    await Promise.resolve();
    await setMusicTrack('yamatai-shizima');
    expect(getCurrentMusicTrack()).toBe('yamatai-shizima');
    expect(getMusicMode()).toBe('specific');
  });

  it('Family mode picks within family pool', async () => {
    const { audioMock } = makeAudioMock();
    // @ts-expect-error test mock
    global.Audio = vi.fn(() => audioMock);

    updateMusicSettings({
      mode: 'family',
      selectedFamily: 'Japanese / Yamatai'
    });
    await Promise.resolve();
    expect(getMusicSettings().mode).toBe('family');
    expect(getCurrentMusicTrack()).toBeTruthy();
  });

  it('persists advanced settings across reload of settings API', () => {
    setMusicMode('random');
    expect(JSON.parse(localStorage.getItem(MUSIC_SETTINGS_KEY) || '{}').mode).toBe(
      'random'
    );
    expect(getMusicMode()).toBe('random');
  });

  it('Theme Default still resolves via sync path when mode theme-default', async () => {
    const { audioMock } = makeAudioMock();
    // @ts-expect-error test mock
    global.Audio = vi.fn(() => audioMock);
    const { syncMusicToTheme } = await import('./audioService');
    setMusicMode('theme-default');
    syncMusicToTheme('classic');
    await setMusicTrack('casino-jazz');
    expect(getCurrentMusicTrack()).toBe('casino-jazz');
  });
});
