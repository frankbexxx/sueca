import { CARD_PLAY_VARIANTS, SFX_PATHS } from '../constants/sfxAssets';
import { AMBIANCE_PATH } from '../constants/musicAssets';
import {
  isSoundEnabled,
  playDealSound,
  playShuffleSound,
  playSfx,
  playTrickCollectSound,
  preloadSfx,
  resetAudioServiceForTests,
  setSoundEnabled,
  startAmbiance,
  stopAmbiance
} from './audioService';

describe('audioService', () => {
  beforeEach(() => {
    resetAudioServiceForTests();
    localStorage.clear();
  });

  it('exports non-empty sfx paths including deal, shuffle, trick-collect', () => {
    Object.values(SFX_PATHS).forEach((path) => {
      expect(path).toMatch(/\/assets\/sfx\/.*\.ogg$/);
    });
    expect(SFX_PATHS.deal).toMatch(/\/deal-1\.ogg$/);
    expect(SFX_PATHS.shuffle).toMatch(/\/card-shuffle\.ogg$/);
    expect(SFX_PATHS.trickCollect).toMatch(/\/trick-collect\.ogg$/);
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

  it('playSfx does not throw when sound is disabled', () => {
    localStorage.setItem('sueca-sound-enabled', 'false');
    expect(() => playSfx('uiClick')).not.toThrow();
    expect(() => playDealSound()).not.toThrow();
    expect(() => playShuffleSound()).not.toThrow();
    expect(() => playTrickCollectSound()).not.toThrow();
  });

  it('mute blocks deal/shuffle/trick-collect play attempts', () => {
    const play = jest.fn().mockResolvedValue(undefined);
    const audioMock = {
      loop: false,
      preload: '',
      volume: 1,
      pause: jest.fn(),
      play,
      paused: true,
      currentTime: 0,
      cloneNode: () => ({ ...audioMock, play, volume: 1 })
    };
    // @ts-expect-error test mock
    global.Audio = jest.fn(() => audioMock);

    localStorage.setItem('sueca-sound-enabled', 'false');
    playDealSound();
    playShuffleSound();
    playTrickCollectSound();
    expect(play).not.toHaveBeenCalled();
  });

  it('preloadSfx can be called without throwing', () => {
    expect(() => preloadSfx()).not.toThrow();
  });

  it('exports ambiance path', () => {
    expect(AMBIANCE_PATH).toMatch(/\/assets\/music\/ambiance\.ogg$/);
  });

  it('setSoundEnabled stops ambiance when disabled', () => {
    const pause = jest.fn();
    const play = jest.fn().mockResolvedValue(undefined);
    const audioMock = { loop: false, preload: '', volume: 1, pause, play, paused: false, currentTime: 0 };
    // @ts-expect-error test mock
    global.Audio = jest.fn(() => audioMock);

    startAmbiance();
    setSoundEnabled(false);
    expect(pause).toHaveBeenCalled();
    expect(isSoundEnabled()).toBe(false);
    stopAmbiance();
  });
});
