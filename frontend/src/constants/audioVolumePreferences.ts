/**
 * Discrete audio volume levels for Personalização / Música e Som.
 * 0 = mute for that channel (no separate mute flag required).
 * Independent music vs SFX. Local-first — not sync-scoped.
 */

import { STORAGE_KEYS } from './gameConstants';

export const AUDIO_VOLUME_LEVELS = [0, 25, 50, 75, 100] as const;
export type AudioVolumeLevel = (typeof AUDIO_VOLUME_LEVELS)[number];

export const DEFAULT_MUSIC_VOLUME_LEVEL: AudioVolumeLevel = 100;
export const DEFAULT_SFX_VOLUME_LEVEL: AudioVolumeLevel = 100;

/**
 * Normalize any legacy / corrupted value to the nearest allowed step.
 * Midpoints round to the higher step (e.g. 12.5 → 25).
 * Invalid / NaN → fallback.
 */
export function normalizeAudioVolumeLevel(
  raw: unknown,
  fallback: AudioVolumeLevel = 100
): AudioVolumeLevel {
  const n =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string' && raw.trim() !== ''
        ? Number(raw)
        : NaN;
  if (!Number.isFinite(n)) return fallback;
  const clamped = Math.max(0, Math.min(100, n));
  const step = Math.round(clamped / 25) * 25;
  const normalized = Math.max(0, Math.min(100, step)) as AudioVolumeLevel;
  return AUDIO_VOLUME_LEVELS.includes(normalized) ? normalized : fallback;
}

export function audioLevelToGain(level: AudioVolumeLevel): number {
  return level / 100;
}

export function loadMusicVolumeLevel(): AudioVolumeLevel {
  if (typeof localStorage === 'undefined') return DEFAULT_MUSIC_VOLUME_LEVEL;
  return normalizeAudioVolumeLevel(
    localStorage.getItem(STORAGE_KEYS.MUSIC_VOLUME),
    DEFAULT_MUSIC_VOLUME_LEVEL
  );
}

export function loadSfxVolumeLevel(): AudioVolumeLevel {
  if (typeof localStorage === 'undefined') return DEFAULT_SFX_VOLUME_LEVEL;
  return normalizeAudioVolumeLevel(
    localStorage.getItem(STORAGE_KEYS.SFX_VOLUME),
    DEFAULT_SFX_VOLUME_LEVEL
  );
}

export function saveMusicVolumeLevel(level: AudioVolumeLevel): AudioVolumeLevel {
  const next = normalizeAudioVolumeLevel(level, DEFAULT_MUSIC_VOLUME_LEVEL);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.MUSIC_VOLUME, String(next));
  }
  return next;
}

export function saveSfxVolumeLevel(level: AudioVolumeLevel): AudioVolumeLevel {
  const next = normalizeAudioVolumeLevel(level, DEFAULT_SFX_VOLUME_LEVEL);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SFX_VOLUME, String(next));
  }
  return next;
}
