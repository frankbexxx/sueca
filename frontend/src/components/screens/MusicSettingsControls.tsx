import React, { useMemo, useState } from 'react';
import type { MusicFamily } from '../../constants/musicCatalog';
import {
  listAvailableMusicEntries,
  listMusicFamiliesPresent
} from '../../audio/musicCatalogPool';
import type { MusicMode, MusicSettings } from '../../audio/musicSettings';
import {
  getMusicSettings,
  updateMusicSettings
} from '../../services/audioService';
import { useLanguage } from '../../i18n/useLanguage';
import './MusicSettingsControls.css';

const MODE_ORDER: MusicMode[] = [
  'theme-default',
  'off',
  'random',
  'random-streaming-safe',
  'family',
  'specific'
];

function modeLabel(
  mode: MusicMode,
  t: ReturnType<typeof useLanguage>['t']
): string {
  switch (mode) {
    case 'theme-default':
      return t.moreScreen.musicThemeDefault;
    case 'off':
      return t.moreScreen.musicOff;
    case 'random':
      return t.moreScreen.musicRandom;
    case 'random-streaming-safe':
      return t.moreScreen.musicRandomSafe;
    case 'family':
      return t.moreScreen.musicFamily;
    case 'specific':
      return t.moreScreen.musicSpecific;
    default:
      return mode;
  }
}

/**
 * Compact music mode controls for More / Settings General.
 */
export const MusicSettingsControls: React.FC = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<MusicSettings>(() => getMusicSettings());

  const families = useMemo(() => listMusicFamiliesPresent(), [settings.mode]);
  const tracks = useMemo(() => listAvailableMusicEntries(), [settings.mode]);

  const apply = (patch: Partial<MusicSettings>) => {
    updateMusicSettings(patch);
    setSettings(getMusicSettings());
  };

  return (
    <div className="music-settings" role="group" aria-label={t.moreScreen.music}>
      <span className="music-settings__label">{t.moreScreen.music}</span>
      <select
        className="music-settings__select"
        aria-label={t.moreScreen.music}
        value={settings.mode}
        onChange={(e) => {
          const mode = e.target.value as MusicMode;
          const patch: Partial<MusicSettings> = { mode };
          if (mode === 'family' && !settings.selectedFamily && families[0]) {
            patch.selectedFamily = families[0];
          }
          if (mode === 'specific' && !settings.selectedTrackId && tracks[0]) {
            patch.selectedTrackId = tracks[0].id;
          }
          apply(patch);
        }}
      >
        {MODE_ORDER.map((mode) => (
          <option key={mode} value={mode}>
            {modeLabel(mode, t)}
          </option>
        ))}
      </select>

      {settings.mode === 'random-streaming-safe' ? (
        <p className="music-settings__hint">{t.moreScreen.musicStreamingSafeHint}</p>
      ) : null}

      {settings.mode === 'family' ? (
        <label className="music-settings__field">
          <span>{t.moreScreen.musicFamilyLabel}</span>
          <select
            className="music-settings__select"
            value={settings.selectedFamily ?? families[0] ?? ''}
            onChange={(e) =>
              apply({ selectedFamily: e.target.value as MusicFamily })
            }
          >
            {families.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {settings.mode === 'specific' ? (
        <label className="music-settings__field">
          <span>{t.moreScreen.musicTrackLabel}</span>
          <select
            className="music-settings__select"
            value={settings.selectedTrackId ?? tracks[0]?.id ?? ''}
            onChange={(e) => apply({ selectedTrackId: e.target.value })}
          >
            {tracks.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.title}
                {tr.contentId ? ` · ${t.moreScreen.musicContentIdBadge}` : ''}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
};
