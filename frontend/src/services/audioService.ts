import { CARD_PLAY_VARIANTS, SfxId, SFX_PATHS } from '../constants/sfxAssets';
import {
  FALLBACK_MUSIC_TRACK_ID,
  MUSIC_VOLUME,
  MusicTrackId,
  getMusicTrack,
  getMusicTrackUrl
} from '../constants/musicCatalog';
import { resolveMusicTrackIdForTheme } from '../constants/musicThemeMap';
import type { ThemeId } from './billingService';
import { getActiveTheme } from './billingService';

const SOUND_ENABLED_KEY = 'sueca-sound-enabled';
const MUSIC_MODE_KEY = 'sueca-music-mode';
const FADE_MS = 450;

export type MusicMode = 'theme-default' | 'off';

const DEFAULT_VOLUMES: Record<SfxId, number> = {
  cardPlay1: 0.55,
  cardPlay2: 0.55,
  cardPlay3: 0.55,
  shuffle: 0.6,
  deal: 0.55,
  trickCollect: 0.52,
  roundStart: 0.36,
  roundEnd: 0.46,
  gameWin: 0.55,
  gameLose: 0.44,
  error: 0.65,
  uiClick: 0.4
};

const audioPool = new Map<SfxId, HTMLAudioElement>();
let preloaded = false;

let musicAudio: HTMLAudioElement | null = null;
let musicPlaying = false;
let currentTrackId: MusicTrackId = FALLBACK_MUSIC_TRACK_ID;
let fadeTimer: ReturnType<typeof setInterval> | null = null;
let switchToken = 0;

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SOUND_ENABLED_KEY) !== 'false';
}

export function getMusicMode(): MusicMode {
  if (typeof window === 'undefined') return 'theme-default';
  return localStorage.getItem(MUSIC_MODE_KEY) === 'off' ? 'off' : 'theme-default';
}

export function setMusicMode(mode: MusicMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MUSIC_MODE_KEY, mode);
  if (mode === 'off' || !isSoundEnabled()) {
    stopMusic();
  } else {
    syncMusicToTheme(getActiveTheme());
    playMusic();
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  if (enabled) {
    if (getMusicMode() === 'theme-default') {
      syncMusicToTheme(getActiveTheme());
      playMusic();
    }
  } else {
    stopMusic();
  }
}

function clearFade(): void {
  if (fadeTimer != null) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }
}

function fadeTo(
  audio: HTMLAudioElement,
  targetVolume: number,
  durationMs: number,
  onDone?: () => void
): void {
  clearFade();
  const start = audio.volume;
  const delta = targetVolume - start;
  if (durationMs <= 0 || Math.abs(delta) < 0.001) {
    audio.volume = targetVolume;
    onDone?.();
    return;
  }
  const startedAt = Date.now();
  fadeTimer = setInterval(() => {
    const t = Math.min(1, (Date.now() - startedAt) / durationMs);
    audio.volume = Math.max(0, Math.min(1, start + delta * t));
    if (t >= 1) {
      clearFade();
      onDone?.();
    }
  }, 32);
}

function ensureMusicAudio(): HTMLAudioElement {
  if (!musicAudio) {
    musicAudio = new Audio(getMusicTrackUrl(currentTrackId));
    musicAudio.loop = true;
    musicAudio.preload = 'auto';
    musicAudio.volume = MUSIC_VOLUME;
    musicAudio.addEventListener('error', () => {
      if (currentTrackId === FALLBACK_MUSIC_TRACK_ID) return;
      void setMusicTrack(FALLBACK_MUSIC_TRACK_ID, { forceRestart: true });
    });
  }
  return musicAudio;
}

export function getCurrentMusicTrack(): MusicTrackId {
  return currentTrackId;
}

export async function setMusicTrack(
  trackId: string,
  options?: { forceRestart?: boolean }
): Promise<void> {
  if (typeof window === 'undefined') return;
  const next = getMusicTrack(trackId).id;
  if (next === currentTrackId && !options?.forceRestart) {
    return;
  }

  const token = ++switchToken;
  const audio = ensureMusicAudio();
  const wasPlaying = musicPlaying && !audio.paused && isSoundEnabled() && getMusicMode() === 'theme-default';

  const applySrc = () => {
    if (token !== switchToken) return;
    currentTrackId = next;
    audio.src = getMusicTrackUrl(next);
    audio.loop = true;
    audio.load();
    if (wasPlaying || (isSoundEnabled() && getMusicMode() === 'theme-default' && musicPlaying)) {
      audio.volume = 0;
      void audio
        .play()
        .then(() => {
          if (token !== switchToken) return;
          musicPlaying = true;
          fadeTo(audio, MUSIC_VOLUME, FADE_MS);
        })
        .catch(() => {
          musicPlaying = false;
        });
    } else {
      audio.volume = MUSIC_VOLUME;
    }
  };

  if (wasPlaying && !audio.paused) {
    fadeTo(audio, 0, FADE_MS, () => {
      if (token !== switchToken) return;
      audio.pause();
      applySrc();
    });
  } else {
    applySrc();
  }
}

export function syncMusicToTheme(themeId: ThemeId): void {
  const trackId = resolveMusicTrackIdForTheme(themeId);
  void setMusicTrack(trackId);
}

export function preloadMusic(): void {
  if (typeof window === 'undefined') return;
  currentTrackId = resolveMusicTrackIdForTheme(getActiveTheme());
  ensureMusicAudio();
}

/** @deprecated Use preloadMusic */
export function preloadAmbiance(): void {
  preloadMusic();
}

export function playMusic(): void {
  if (typeof window === 'undefined' || !isSoundEnabled() || getMusicMode() === 'off') return;

  try {
    const audio = ensureMusicAudio();
    if (musicPlaying && !audio.paused) return;
    audio.volume = MUSIC_VOLUME;
    void audio
      .play()
      .then(() => {
        musicPlaying = true;
      })
      .catch(() => {
        /* autoplay restrictions */
      });
  } catch {
    /* silently ignore */
  }
}

/** @deprecated Use playMusic */
export function startAmbiance(): void {
  playMusic();
}

export function pauseMusic(): void {
  if (!musicAudio) return;
  clearFade();
  musicAudio.pause();
  musicPlaying = false;
}

export function stopMusic(): void {
  if (!musicAudio) return;
  clearFade();
  musicAudio.pause();
  musicAudio.currentTime = 0;
  musicPlaying = false;
}

/** @deprecated Use stopMusic */
export function stopAmbiance(): void {
  stopMusic();
}

export function preloadSfx(): void {
  if (typeof window === 'undefined' || preloaded) return;
  preloaded = true;

  (Object.keys(SFX_PATHS) as SfxId[]).forEach((id) => {
    const audio = new Audio(SFX_PATHS[id]);
    audio.preload = 'auto';
    audioPool.set(id, audio);
  });
}

export function playSfx(id: SfxId, options?: { volume?: number }): void {
  if (!isSoundEnabled()) return;

  try {
    preloadSfx();
    const template = audioPool.get(id);
    if (!template) return;

    const audio = template.cloneNode(true) as HTMLAudioElement;
    audio.volume = options?.volume ?? DEFAULT_VOLUMES[id];
    void audio.play().catch(() => {
      /* autoplay restrictions or missing file */
    });
  } catch {
    /* silently ignore */
  }
}

export function playRandomCardPlay(): void {
  const id = CARD_PLAY_VARIANTS[Math.floor(Math.random() * CARD_PLAY_VARIANTS.length)];
  playSfx(id);
}

export function playShuffleSound(): void {
  playSfx('shuffle');
}

export function playDealSound(): void {
  playSfx('deal');
}

export function playTrickCollectSound(): void {
  playSfx('trickCollect');
}

export function playRoundStartSound(): void {
  playSfx('roundStart');
}

export function playRoundEndSound(): void {
  playSfx('roundEnd');
}

export function playGameWinSound(): void {
  playSfx('gameWin');
}

export function playGameLoseSound(): void {
  playSfx('gameLose');
}

export function playErrorSound(): void {
  playSfx('error');
}

export function playUiClick(): void {
  playSfx('uiClick');
}

/** Test helper */
export function resetAudioServiceForTests(): void {
  stopMusic();
  clearFade();
  audioPool.clear();
  musicAudio = null;
  musicPlaying = false;
  currentTrackId = FALLBACK_MUSIC_TRACK_ID;
  preloaded = false;
  switchToken = 0;
}
