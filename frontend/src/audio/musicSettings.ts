import type { MusicFamily } from '../constants/musicCatalog';

export const MUSIC_SETTINGS_KEY = 'sueca-music-settings';
/** Legacy key (Theme Default / Off only). */
export const LEGACY_MUSIC_MODE_KEY = 'sueca-music-mode';

export type MusicMode =
  | 'theme-default'
  | 'off'
  | 'random'
  | 'random-streaming-safe'
  | 'family'
  | 'specific';

export type MusicSettings = {
  mode: MusicMode;
  selectedFamily: MusicFamily | null;
  selectedTrackId: string | null;
};

export const DEFAULT_MUSIC_SETTINGS: MusicSettings = {
  mode: 'theme-default',
  selectedFamily: null,
  selectedTrackId: null
};

const MODES = new Set<string>([
  'theme-default',
  'off',
  'random',
  'random-streaming-safe',
  'family',
  'specific'
]);

function isMusicMode(v: unknown): v is MusicMode {
  return typeof v === 'string' && MODES.has(v);
}

function normalizeSettings(raw: Partial<MusicSettings> | null | undefined): MusicSettings {
  const mode = isMusicMode(raw?.mode) ? raw!.mode : 'theme-default';
  const selectedFamily =
    typeof raw?.selectedFamily === 'string' && raw.selectedFamily.trim()
      ? (raw.selectedFamily as MusicFamily)
      : null;
  const selectedTrackId =
    typeof raw?.selectedTrackId === 'string' && raw.selectedTrackId.trim()
      ? raw.selectedTrackId.trim()
      : null;
  return { mode, selectedFamily, selectedTrackId };
}

/** Migrate legacy `sueca-music-mode` string into typed settings. */
export function migrateLegacyMusicMode(legacy: string | null): MusicSettings {
  if (legacy === 'off') {
    return { ...DEFAULT_MUSIC_SETTINGS, mode: 'off' };
  }
  return { ...DEFAULT_MUSIC_SETTINGS };
}

export function parseMusicSettingsJson(raw: string | null): MusicSettings | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<MusicSettings>;
    if (!parsed || typeof parsed !== 'object') return null;
    return normalizeSettings(parsed);
  } catch {
    return null;
  }
}

export function loadMusicSettings(): MusicSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_MUSIC_SETTINGS };
  const fromJson = parseMusicSettingsJson(localStorage.getItem(MUSIC_SETTINGS_KEY));
  if (fromJson) return fromJson;

  const legacy = localStorage.getItem(LEGACY_MUSIC_MODE_KEY);
  const migrated = migrateLegacyMusicMode(legacy);
  // Persist migration so subsequent loads are stable.
  try {
    localStorage.setItem(MUSIC_SETTINGS_KEY, JSON.stringify(migrated));
  } catch {
    /* ignore quota */
  }
  return migrated;
}

export function saveMusicSettings(next: MusicSettings): MusicSettings {
  const normalized = normalizeSettings(next);
  if (typeof window === 'undefined') return normalized;
  try {
    localStorage.setItem(MUSIC_SETTINGS_KEY, JSON.stringify(normalized));
    // Keep legacy key in sync for Theme Default / Off readers during rollout.
    if (normalized.mode === 'off') {
      localStorage.setItem(LEGACY_MUSIC_MODE_KEY, 'off');
    } else {
      localStorage.setItem(LEGACY_MUSIC_MODE_KEY, 'theme-default');
    }
  } catch {
    /* ignore */
  }
  return normalized;
}

export function patchMusicSettings(
  patch: Partial<MusicSettings>
): MusicSettings {
  return saveMusicSettings({ ...loadMusicSettings(), ...patch });
}
