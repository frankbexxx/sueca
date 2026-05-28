import React, { useState } from 'react';
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
import { STORAGE_KEYS } from '../../constants/gameConstants';
import '../../styles/shell-screens.css';
import '../screens/MoreScreen.css';

interface SettingsScreenProps {
  darkMode: boolean;
  onDarkModeChange: (value: boolean) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ darkMode, onDarkModeChange }) => {
  const { language, setLanguage, t } = useLanguage();
  const [soundEnabled, setSoundEnabledState] = useState(() => isSoundEnabled());
  const [handPrefs, setHandPrefs] = useState(() => loadHandPreferences());
  const [autoPauseTrick, setAutoPauseTrick] = useState(() => loadAutoPauseTrick());

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setSoundEnabled(next);
  };

  const toggleDark = () => {
    const next = !darkMode;
    onDarkModeChange(next);
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(next));
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
    <div className="shell-screen screen-settings">
      <header className="shell-screen-header">
        <h1 className="screen-title">{t.settingsScreen.title}</h1>
        <p className="screen-subtitle">{t.settingsScreen.subtitle}</p>
      </header>

      <section className="shell-panel">
        <h2 className="shell-section-title">{t.moreScreen.settings}</h2>
        <label className="more-toggle">
          <input type="checkbox" checked={darkMode} onChange={toggleDark} />
          <span>{t.startMenu.darkMode}</span>
        </label>
        <label className="more-toggle">
          <input type="checkbox" checked={soundEnabled} onChange={toggleSound} />
          <span>{t.moreScreen.sound}</span>
        </label>
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

      <section className="shell-panel">
        <h2 className="shell-section-title">{t.moreScreen.handSort}</h2>
        <label className="more-toggle">
          <input
            type="checkbox"
            checked={handPrefs.sortEnabled}
            onChange={() => updateHandPrefs({ sortEnabled: !handPrefs.sortEnabled })}
          />
          <span>{t.moreScreen.sortHand}</span>
        </label>
        <label className="more-field" htmlFor="settings-suit-order">
          <span>{t.moreScreen.suitOrder}</span>
          <select
            id="settings-suit-order"
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
        <label className="more-field" htmlFor="settings-trump-position">
          <span>{t.moreScreen.trumpPosition}</span>
          <select
            id="settings-trump-position"
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
    </div>
  );
};
