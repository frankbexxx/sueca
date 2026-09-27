/**
 * Compact discrete volume control — 0 / 25 / 50 / 75 / 100.
 */

import React from 'react';
import {
  AUDIO_VOLUME_LEVELS,
  type AudioVolumeLevel
} from '../../constants/audioVolumePreferences';
import './AudioVolumeControl.css';

export interface AudioVolumeControlProps {
  label: string;
  value: AudioVolumeLevel;
  onChange: (level: AudioVolumeLevel) => void;
  testIdPrefix: string;
}

export const AudioVolumeControl: React.FC<AudioVolumeControlProps> = ({
  label,
  value,
  onChange,
  testIdPrefix
}) => {
  return (
    <div className="audio-volume" data-testid={`${testIdPrefix}-control`}>
      <div className="audio-volume__label">{label}</div>
      <div
        className="audio-volume__row"
        role="radiogroup"
        aria-label={label}
      >
        {AUDIO_VOLUME_LEVELS.map((level) => {
          const active = value === level;
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={active}
              className={`audio-volume__btn${active ? ' audio-volume__btn--active' : ''}`}
              data-testid={`${testIdPrefix}-${level}`}
              data-active={active ? 'true' : 'false'}
              onClick={() => onChange(level)}
            >
              {level}
            </button>
          );
        })}
      </div>
    </div>
  );
};
