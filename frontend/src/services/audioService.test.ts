import { vi } from 'vitest';
import { CARD_PLAY_VARIANTS, SFX_PATHS } from '../constants/sfxAssets';
import { coreTrackPath } from '../constants/musicAssets';
import { FALLBACK_MUSIC_TRACK_ID } from '../constants/musicCatalog';
import {
  getCurrentMusicTrack,
  getMusicMode,
  isSoundEnabled,
  playDealSound,
  playGameLoseSound,
  playGameWinSound,
  playMusic,
  playRoundEndSound,
  playRoundStartSound,
  playShuffleSound,
  playSfx,
  playTrickCollectSound,
  preloadMusic,
  preloadSfx,
  resetAudioServiceForTests,
  setMusicMode,
  setMusicTrack,
  setSoundEnabled,
  stopMusic,
  syncMusicToTheme
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

describe('audioService', () => {
  beforeEach(() => {
    resetAudioServiceForTests();
    localStorage.clear();
    vi.useRealTimers();
  });

  it('exports non-empty sfx paths including deal, shuffle, trick-collect, round/game cues', () => {
    Object.values(SFX_PATHS).forEach((path) => {
      expect(path).toMatch(/\/assets\/sfx\/.*\.ogg$/);
    });
    expect(SFX_PATHS.deal).toMatch(/\/deal-1\.ogg$/);
    expect(SFX_PATHS.shuffle).toMatch(/\/card-shuffle\.ogg$/);
    expect(SFX_PATHS.trickCollect).toMatch(/\/trick-collect\.ogg$/);
    expect(SFX_PATHS.roundStart).toMatch(/\/round-start\.ogg$/);
    expect(SFX_PATHS.roundEnd).toMatch(/\/round-end\.ogg$/);
    expect(SFX_PATHS.gameWin).toMatch(/\/game-win\.ogg$/);
    expect(SFX_PATHS.gameLose).toMatch(/\/game-lose\.ogg$/);
    expect(CARD_PLAY_VARIANTS).toHaveLength(3);
  });

  it('does not expose trick-win path', () => {
    expect(Object.values(SFX_PATHS).join('\n')).not.toMatch(/trick-win/);
    expect(SFX_PATHS).not.toHaveProperty('trickWin');
  });

  it('isSoundEnabled defaults to true', () => {
    expect(isSoundEnabled()).toBe(true);
  });

  it('isSoundEnabled respects localStorage toggle', () => {
    localStorage.setItem('sueca-sound-enabled', 'false');
    expect(isSoundEnabled()).toBe(false);
    localStorage.setItem('sueca-sound-enabled', 'true');
    expect(isSoundEnabled()).toBe(true);
  });

  it('music mode defaults to theme-default and persists Off', () => {
    expect(getMusicMode()).toBe('theme-default');
    setMusicMode('off');
    expect(getMusicMode()).toBe('off');
    expect(localStorage.getItem('sueca-music-mode')).toBe('off');
  });

  it('playSfx does not throw when sound is disabled', () => {
    localStorage.setItem('sueca-sound-enabled', 'false');
    expect(() => playSfx('uiClick')).not.toThrow();
    expect(() => playDealSound()).not.toThrow();
    expect(() => playShuffleSound()).not.toThrow();
    expect(() => playTrickCollectSound()).not.toThrow();
    expect(() => playRoundStartSound()).not.toThrow();
    expect(() => playRoundEndSound()).not.toThrow();
    expect(() => playGameWinSound()).not.toThrow();
    expect(() => playGameLoseSound()).not.toThrow();
  });

  it('mute blocks deal/shuffle/trick-collect and round/game cues', () => {
    const { audioMock, play } = makeAudioMock();
    // @ts-expect-error test mock
    global.Audio = vi.fn(() => audioMock);

    localStorage.setItem('sueca-sound-enabled', 'false');
    playDealSound();
    playShuffleSound();
    playTrickCollectSound();
    playRoundStartSound();
    playRoundEndSound();
    playGameWinSound();
    playGameLoseSound();
    expect(play).not.toHaveBeenCalled();
  });

  it('preloadSfx / preloadMusic can be called without throwing', () => {
    expect(() => preloadSfx()).not.toThrow();
    expect(() => preloadMusic()).not.toThrow();
  });

  it('core track paths use /assets/music/core/', () => {
    expect(coreTrackPath('casino-jazz.ogg')).toMatch(/\/assets\/music\/core\/casino-jazz\.ogg$/);
  });

  it('setSoundEnabled stops music when disabled', async () => {
    const { audioMock, pause, play } = makeAudioMock();
    // @ts-expect-error test mock
    global.Audio = vi.fn(() => audioMock);

    playMusic();
    expect(play).toHaveBeenCalled();
    setSoundEnabled(false);
    expect(pause).toHaveBeenCalled();
    expect(isSoundEnabled()).toBe(false);
    stopMusic();
  });

  it('syncMusicToTheme changes track and skips restart for same bed', async () => {
    const { audioMock, load } = makeAudioMock();
    // @ts-expect-error test mock
    global.Audio = vi.fn(() => audioMock);

    syncMusicToTheme('classic');
    await setMusicTrack('casino-jazz');
    expect(getCurrentMusicTrack()).toBe('casino-jazz');
    const loadsAfterClassic = load.mock.calls.length;

    syncMusicToTheme('classic');
    await setMusicTrack('casino-jazz');
    expect(load.mock.calls.length).toBe(loadsAfterClassic);

    syncMusicToTheme('yamatai');
    await Promise.resolve();
    expect(getCurrentMusicTrack()).toBe('yamatai-shizima');
  });

  it('music Off stops playback while SFX can still play when unmuted', async () => {
    const { audioMock, play, pause } = makeAudioMock();
    // @ts-expect-error test mock
    global.Audio = vi.fn(() => audioMock);

    playMusic();
    setMusicMode('off');
    expect(pause).toHaveBeenCalled();
    play.mockClear();
    playDealSound();
    expect(play).toHaveBeenCalled();
  });

  it('failed unknown track id falls back to casino-jazz via getMusicTrack', async () => {
    const { audioMock } = makeAudioMock();
    // @ts-expect-error test mock
    global.Audio = vi.fn(() => audioMock);
    await setMusicTrack('not-real');
    expect(getCurrentMusicTrack()).toBe(FALLBACK_MUSIC_TRACK_ID);
  });
});
