/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  SettingsAudioScreen,
  SettingsGeneralScreen
} from '../screens/SettingsScreens';
import {
  getEffectiveMusicVolume,
  getMusicVolumeLevel,
  getSfxGainMultiplier,
  getSfxVolumeLevel,
  playSfx,
  resetAudioServiceForTests,
  setMusicVolumeLevel,
  setSfxVolumeLevel,
  setSoundEnabled
} from '../../services/audioService';
import { MUSIC_VOLUME } from '../../constants/musicCatalog';
import { getDealDelayMs } from '../../constants/dealAnimationPreferences';
import { STORAGE_KEYS } from '../../constants/gameConstants';

vi.mock('../../i18n/useLanguage', () => ({
  useLanguage: () => ({
    language: 'pt',
    setLanguage: () => undefined,
    t: {
      shell: { back: 'Voltar' },
      settingsScreen: {
        hubGeneral: 'Geral',
        subtitle: 'Idioma e preferências'
      },
      moreScreen: {
        language: 'Idioma',
        music: 'Música',
        musicThemeDefault: 'Tema',
        musicOff: 'Desligada',
        musicRandom: 'Aleatória',
        musicRandomSafe: 'Aleatória segura',
        musicFamily: 'Família',
        musicSpecific: 'Faixa',
        musicFamilyLabel: 'Família',
        musicTrackLabel: 'Faixa',
        musicStreamingSafeHint: 'hint',
        musicContentIdBadge: 'CID'
      }
    }
  })
}));

function stubAudio(): void {
  const audioMock: Record<string, unknown> = {
    volume: 1,
    loop: false,
    paused: true,
    currentTime: 0,
    preload: 'auto',
    src: '',
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    load: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    cloneNode: () => ({
      volume: 1,
      play: vi.fn(() => Promise.resolve()),
      pause: vi.fn()
    })
  };
  global.Audio = vi.fn(() => audioMock) as unknown as typeof Audio;
}

describe('SettingsAudioScreen / Música e Som', () => {
  beforeEach(() => {
    localStorage.clear();
    stubAudio();
    resetAudioServiceForTests();
    setSoundEnabled(true);
  });

  it('exposes music and SFX volume steps without Idioma or Auto entre vazas', () => {
    render(<SettingsAudioScreen showBack onBack={() => undefined} />);
    expect(screen.getByTestId('audio-settings-screen')).toBeTruthy();
    expect(screen.getByTestId('music-volume-50')).toBeTruthy();
    expect(screen.getByTestId('sfx-volume-75')).toBeTruthy();
    expect(screen.queryByText('Idioma')).toBeNull();
    expect(screen.queryByText(/Pausa auto/i)).toBeNull();
    expect(screen.queryByText(/Auto-pause/i)).toBeNull();
  });

  it('persists independent music and SFX levels', () => {
    render(<SettingsAudioScreen showBack onBack={() => undefined} />);
    fireEvent.click(screen.getByTestId('music-volume-25'));
    fireEvent.click(screen.getByTestId('sfx-volume-100'));
    expect(getMusicVolumeLevel()).toBe(25);
    expect(getSfxVolumeLevel()).toBe(100);
    expect(localStorage.getItem(STORAGE_KEYS.MUSIC_VOLUME)).toBe('25');
    expect(localStorage.getItem(STORAGE_KEYS.SFX_VOLUME)).toBe('100');
  });
});

describe('SettingsGeneralScreen / Definições gerais', () => {
  it('exposes Idioma only — no volume steppers or music mode chrome', () => {
    render(<SettingsGeneralScreen showBack onBack={() => undefined} />);
    expect(screen.getByTestId('settings-general-screen')).toBeTruthy();
    expect(screen.getByText('Idioma')).toBeTruthy();
    expect(screen.queryByTestId('music-volume-control')).toBeNull();
    expect(screen.queryByTestId('sfx-volume-control')).toBeNull();
    expect(screen.queryByText(/Efeitos sonoros/i)).toBeNull();
  });
});

describe('audio volume runtime', () => {
  beforeEach(() => {
    localStorage.clear();
    stubAudio();
    resetAudioServiceForTests();
    setSoundEnabled(true);
  });

  it('scales music and SFX independently; 0 mutes that channel', () => {
    setMusicVolumeLevel(50);
    setSfxVolumeLevel(100);
    expect(getEffectiveMusicVolume()).toBeCloseTo(MUSIC_VOLUME * 0.5, 5);
    expect(getSfxGainMultiplier()).toBe(1);

    setSfxVolumeLevel(0);
    expect(getSfxGainMultiplier()).toBe(0);
    expect(getEffectiveMusicVolume()).toBeCloseTo(MUSIC_VOLUME * 0.5, 5);

    setMusicVolumeLevel(0);
    expect(getEffectiveMusicVolume()).toBe(0);
  });

  it('deal cadence is independent from SFX volume', () => {
    localStorage.setItem(STORAGE_KEYS.DEAL_ANIMATION_SPEED, 'paused');
    const delayAtLoud = getDealDelayMs();
    setSfxVolumeLevel(0);
    expect(getDealDelayMs()).toBe(delayAtLoud);
    setSfxVolumeLevel(100);
    expect(getDealDelayMs()).toBe(delayAtLoud);
  });

  it('playSfx no-ops at zero SFX volume without throwing', () => {
    setSfxVolumeLevel(0);
    expect(() => playSfx('deal')).not.toThrow();
  });
});
