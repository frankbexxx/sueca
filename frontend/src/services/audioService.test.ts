import { CARD_PLAY_VARIANTS, SFX_PATHS } from '../constants/sfxAssets';
import { AMBIANCE_PATH } from '../constants/musicAssets';
import {
  isSoundEnabled,
  playSfx,
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

  it('exports non-empty sfx paths', () => {
    Object.values(SFX_PATHS).forEach((path) => {
      expect(path).toMatch(/\/assets\/sfx\/.*\.ogg$/);
    });
    expect(CARD_PLAY_VARIANTS).toHaveLength(3);
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
  });
});
