import React, { useEffect, useId, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import {
  loadHandPreferences,
  saveHandPreferences,
  SUIT_ORDER_PRESETS,
  SuitOrderPresetId,
  TrumpPosition
} from '../../constants/handPreferences';
import { loadAutoPauseTrick, saveAutoPauseTrick } from '../../utils/trickAutoContinue';
import { isSoundEnabled, setSoundEnabled } from '../../services/audioService';
import { MusicSettingsControls } from '../screens/MusicSettingsControls';
import '../screens/MoreScreen.css';
import './InGameSettingsOverlay.css';

export interface InGameSettingsOverlayProps {
  onClose: () => void;
}

/**
 * Lightweight in-game settings overlay (GLOBAL-UI-02).
 * Game stays mounted — no shell navigation.
 *
 * Included: sound, music mode controls, auto-pause trick, language, hand sort prefs.
 * Excluded: profile/name, credits, feedback, exit app, themes, Stage 10 personalisation.
 */
export const InGameSettingsOverlay: React.FC<InGameSettingsOverlayProps> = ({ onClose }) => {
  const { language, setLanguage, t } = useLanguage();
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [soundEnabled, setSoundEnabledState] = useState(() => isSoundEnabled());
  const [autoPauseTrick, setAutoPauseTrick] = useState(() => loadAutoPauseTrick());
  const [handPrefs, setHandPrefs] = useState(() => loadHandPreferences());

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setSoundEnabled(next);
  };

  const updateHandPrefs = (patch: Parameters<typeof saveHandPreferences>[0]) => {
    saveHandPreferences(patch);
    setHandPrefs(loadHandPreferences());
  };

  const suitPresetOptions = Object.entries(SUIT_ORDER_PRESETS) as [
    SuitOrderPresetId,
    (typeof SUIT_ORDER_PRESETS)[SuitOrderPresetId]
  ][];

  return (
    <div
      className="in-game-settings-overlay"
      role="presentation"
      onClick={onClose}
      data-testid="in-game-settings-overlay"
    >
      <div
        className="in-game-settings-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        data-testid="in-game-settings-sheet"
      >
        <header className="in-game-settings-header">
          <h2 id={titleId}>{t.moreScreen.settings}</h2>
        </header>

        <section className="in-game-settings-section more-section">
          <h3 className="more-section-title">{t.settingsScreen.hubGeneral}</h3>
          <label className="more-toggle">
            <input type="checkbox" checked={soundEnabled} onChange={toggleSound} />
            <span>{t.moreScreen.sound}</span>
          </label>
          <MusicSettingsControls />
          <label className="more-toggle">
            <input
              type="checkbox"
              checked={autoPauseTrick}
              onChange={() => {
                const next = !autoPauseTrick;
                setAutoPauseTrick(next);
                saveAutoPauseTrick(next);
              }}
            />
            <span>{t.moreScreen.autoPauseTrick}</span>
          </label>
          <div className="more-lang">
            <span>{t.moreScreen.language}</span>
            <div className="language-selector">
              <button
                type="button"
                className={`lang-btn ${language === 'pt' ? 'active' : ''}`}
                onClick={() => setLanguage('pt')}
              >
                PT
              </button>
              <button
                type="button"
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
            </div>
          </div>
        </section>

        <section className="in-game-settings-section more-section">
          <h3 className="more-section-title">{t.settingsScreen.hubHand}</h3>
          <label className="more-toggle">
            <input
              type="checkbox"
              checked={handPrefs.sortEnabled}
              onChange={() => updateHandPrefs({ sortEnabled: !handPrefs.sortEnabled })}
            />
            <span>{t.moreScreen.sortHand}</span>
          </label>
          <label className="more-field" htmlFor="in-game-suit-order">
            <span>{t.moreScreen.suitOrder}</span>
            <select
              id="in-game-suit-order"
              className="more-select form-input"
              value={handPrefs.suitOrderPreset}
              onChange={(e) =>
                updateHandPrefs({ suitOrderPreset: e.target.value as SuitOrderPresetId })
              }
            >
              {suitPresetOptions.map(([id, preset]) => (
                <option key={id} value={id}>
                  {language === 'pt' ? preset.labelPt : preset.labelEn}
                </option>
              ))}
            </select>
          </label>
          <label className="more-field" htmlFor="in-game-trump-position">
            <span>{t.moreScreen.trumpPosition}</span>
            <select
              id="in-game-trump-position"
              className="more-select form-input"
              value={handPrefs.trumpPosition}
              onChange={(e) =>
                updateHandPrefs({ trumpPosition: e.target.value as TrumpPosition })
              }
            >
              <option value="left">{t.moreScreen.trumpLeft}</option>
              <option value="right">{t.moreScreen.trumpRight}</option>
              <option value="natural">{t.moreScreen.trumpNatural}</option>
            </select>
          </label>
        </section>

        <button
          type="button"
          className="sueca-btn sueca-btn--secondary sueca-btn--block in-game-settings-close"
          onClick={onClose}
          data-testid="in-game-settings-close"
        >
          {t.credits.close}
        </button>
      </div>
    </div>
  );
};
