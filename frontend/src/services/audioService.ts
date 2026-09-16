import { CARD_PLAY_VARIANTS, SfxId, SFX_PATHS } from '../constants/sfxAssets';
import {
  FALLBACK_MUSIC_TRACK_ID,
  MUSIC_VOLUME,
  MusicTrackId,
  getMusicTrack,
  getMusicTrackUrl,
  isMusicTrackId
} from '../constants/musicCatalog';
import { initMusicCache } from '../audio/musicCacheService';
import {
  ResolvedMusicTrack,
  resolveMusicTrack,
  resolveThemeMusic
} from '../audio/musicResolver';
import { ensureRemotePlayable } from '../audio/musicRemotePrepare';
import { bootstrapMusicRemoteAtStartup } from '../audio/musicRemoteBootstrap';
import { getRemoteMusicTrack } from '../audio/remoteMusicCatalog';
import {
  FAMILY_CORE_TRACK,
  getThemeMusicPreference
} from '../constants/musicThemeMap';
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
/** Current music id (core or remote). */
let currentTrackId: string = FALLBACK_MUSIC_TRACK_ID;
let fadeTimer: ReturnType<typeof setInterval> | null = null;
let switchToken = 0;
/** Prevents infinite fallback loops on error (max 1 remote→core per switch). */
let fallbackUsedForToken = -1;

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
    musicAudio = new Audio(getMusicTrackUrl(FALLBACK_MUSIC_TRACK_ID));
    musicAudio.loop = true;
    musicAudio.preload = 'auto';
    musicAudio.volume = MUSIC_VOLUME;
    musicAudio.addEventListener('error', () => {
      void handleMusicPlaybackError();
    });
  }
  return musicAudio;
}

async function handleMusicPlaybackError(): Promise<void> {
  if (fallbackUsedForToken === switchToken) return;
  if (currentTrackId === FALLBACK_MUSIC_TRACK_ID) return;

  fallbackUsedForToken = switchToken;
  let fallbackId: MusicTrackId = FALLBACK_MUSIC_TRACK_ID;
  if (!isMusicTrackId(currentTrackId)) {
    const remote = getRemoteMusicTrack(currentTrackId);
    fallbackId = remote
      ? FAMILY_CORE_TRACK[remote.family] ?? FALLBACK_MUSIC_TRACK_ID
      : getThemeMusicPreference(getActiveTheme()).fallbackCoreTrackId;
  }

  await applyCoreTrack(fallbackId, { forceRestart: true, fromError: true });
}

export function getCurrentMusicTrack(): string {
  return currentTrackId;
}

type ApplyOptions = {
  forceRestart?: boolean;
  fromError?: boolean;
  /** Skip prepare when URL already known (internal). */
  playableUrl?: string;
};

async function resolvePlayableTarget(
  trackId: string
): Promise<{ id: string; url: string; remoteAttempted: boolean }> {
  const resolved = resolveMusicTrack(trackId);
  if (resolved.source === 'core') {
    return {
      id: resolved.id,
      url: resolved.playableUrl,
      remoteAttempted: false
    };
  }

  // One remote prepare attempt per call.
  const prepared = await ensureRemotePlayable(resolved.id);
  if (prepared.ok) {
    return {
      id: resolved.id,
      url: prepared.url,
      remoteAttempted: true
    };
  }

  const fallback = getMusicTrack(resolved.fallbackTrackId);
  return {
    id: fallback.id,
    url: getMusicTrackUrl(fallback.id),
    remoteAttempted: true
  };
}

function applySrcToAudio(
  audio: HTMLAudioElement,
  token: number,
  nextId: string,
  nextUrl: string,
  wasPlaying: boolean
): void {
  if (token !== switchToken) return;
  currentTrackId = nextId;
  audio.src = nextUrl;
  audio.loop = true;
  audio.load();
  if (
    wasPlaying ||
    (isSoundEnabled() && getMusicMode() === 'theme-default' && musicPlaying)
  ) {
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
}

async function applyCoreTrack(
  trackId: MusicTrackId | string,
  options?: ApplyOptions
): Promise<void> {
  if (typeof window === 'undefined') return;
  const next = getMusicTrack(trackId).id;
  if (next === currentTrackId && !options?.forceRestart) {
    return;
  }

  const token = options?.fromError ? switchToken : ++switchToken;
  if (!options?.fromError) {
    fallbackUsedForToken = -1;
  }
  const audio = ensureMusicAudio();
  const wasPlaying =
    musicPlaying &&
    !audio.paused &&
    isSoundEnabled() &&
    getMusicMode() === 'theme-default';
  const url = options?.playableUrl ?? getMusicTrackUrl(next);

  const apply = () => applySrcToAudio(audio, token, next, url, wasPlaying);

  if (wasPlaying && !audio.paused) {
    fadeTo(audio, 0, FADE_MS, () => {
      if (token !== switchToken) return;
      audio.pause();
      apply();
    });
  } else {
    apply();
  }
}

/**
 * Play a resolved hybrid track. Remotes are prepared (download/stream) BEFORE
 * fading out the current bed to avoid long silence during Android download.
 */
export async function playResolvedMusic(
  resolved: ResolvedMusicTrack,
  options?: { forceRestart?: boolean }
): Promise<void> {
  if (typeof window === 'undefined') return;
  if (getMusicMode() === 'off' || !isSoundEnabled()) {
    if (resolved.source === 'core' && resolved.id === currentTrackId) return;
  }

  if (
    resolved.id === currentTrackId &&
    !options?.forceRestart &&
    resolved.source === 'core'
  ) {
    return;
  }

  const token = ++switchToken;
  fallbackUsedForToken = -1;
  const audio = ensureMusicAudio();
  const wasPlaying =
    musicPlaying &&
    !audio.paused &&
    isSoundEnabled() &&
    getMusicMode() === 'theme-default';

  let nextId = resolved.id;
  let nextUrl = resolved.playableUrl;

  if (resolved.source === 'remote') {
    // Keep current audio playing while preparing remote.
    const prepared = await ensureRemotePlayable(resolved.id);
    if (token !== switchToken) return;
    if (prepared.ok) {
      nextId = resolved.id;
      nextUrl = prepared.url;
    } else {
      const core = getMusicTrack(resolved.fallbackTrackId);
      nextId = core.id;
      nextUrl = getMusicTrackUrl(core.id);
      fallbackUsedForToken = token;
    }
  } else {
    nextId = resolved.id;
    nextUrl = getMusicTrackUrl(resolved.id as MusicTrackId);
  }

  if (nextId === currentTrackId && !options?.forceRestart && audio.src) {
    // Same bed already playing (e.g. remote failed → same core as current).
    return;
  }

  const apply = () => applySrcToAudio(audio, token, nextId, nextUrl, wasPlaying);

  if (wasPlaying && !audio.paused) {
    fadeTo(audio, 0, FADE_MS, () => {
      if (token !== switchToken) return;
      audio.pause();
      apply();
    });
  } else {
    apply();
  }
}

export async function setMusicTrack(
  trackId: string,
  options?: { forceRestart?: boolean }
): Promise<void> {
  if (typeof window === 'undefined') return;

  if (isMusicTrackId(trackId)) {
    await applyCoreTrack(trackId, options);
    return;
  }

  const remote = getRemoteMusicTrack(trackId);
  const fallbackTrackId = remote
    ? FAMILY_CORE_TRACK[remote.family] ?? FALLBACK_MUSIC_TRACK_ID
    : FALLBACK_MUSIC_TRACK_ID;
  const resolved = resolveMusicTrack(trackId, { fallbackTrackId });
  await playResolvedMusic(resolved, options);
}

export function syncMusicToTheme(themeId: ThemeId): void {
  const resolved = resolveThemeMusic(themeId);
  void playResolvedMusic(resolved);
}

export function preloadMusic(): void {
  if (typeof window === 'undefined') return;
  const resolved = resolveThemeMusic(getActiveTheme());
  currentTrackId =
    resolved.source === 'core' ? resolved.id : resolved.fallbackTrackId;
  ensureMusicAudio();
  void initMusicCache();
  void bootstrapMusicRemoteAtStartup();
}

/** @deprecated Use preloadMusic */
export function preloadAmbiance(): void {
  preloadMusic();
}

export function playMusic(): void {
  if (typeof window === 'undefined' || !isSoundEnabled() || getMusicMode() === 'off') {
    return;
  }

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
  fallbackUsedForToken = -1;
}

/** Exposed for tests — resolve playable target with one remote attempt. */
export async function __resolvePlayableTargetForTests(trackId: string) {
  return resolvePlayableTarget(trackId);
}
