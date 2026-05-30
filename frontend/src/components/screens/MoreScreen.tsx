import React, { useState } from 'react';
import { CreditsModal } from '../CreditsModal';
import { useLanguage } from '../../i18n/useLanguage';
import { loadLastConfig } from '../../services/gameSessionStorage';
import { FEEDBACK_ISSUE_URL } from '../../constants/feedback';
import {
  loadHandPreferences,
  saveHandPreferences,
  SUIT_ORDER_PRESETS,
  SuitOrderPresetId,
  TrumpPosition
} from '../../constants/handPreferences';
import { loadAutoPauseTrick, saveAutoPauseTrick } from '../../utils/trickAutoContinue';
import { isSoundEnabled, setSoundEnabled } from '../../services/audioService';
import './MoreScreen.css';

const LAST_CONFIG_KEY = 'sueca-last-config';

interface MoreScreenProps {
  // dark mode removed
}

function loadPlayerNames(): string[] {
  const saved = localStorage.getItem('sueca-player-names');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 4) return parsed;
    } catch {
      /* ignore */
    }
  }
  const last = loadLastConfig();
  return last?.playerNames ?? ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
}

export const MoreScreen: React.FC<MoreScreenProps> = () => {
  const { language, setLanguage, t } = useLanguage();
  const [showCredits, setShowCredits] = useState(false);
  const [playerName, setPlayerName] = useState(() => loadPlayerNames()[0] || 'Player 1');
  const [soundEnabled, setSoundEnabledState] = useState(() => isSoundEnabled());
  const [handPrefs, setHandPrefs] = useState(() => loadHandPreferences());
  const [autoPauseTrick, setAutoPauseTrick] = useState(() => loadAutoPauseTrick());

  const savePlayerName = () => {
    const trimmed = playerName.trim() || 'Player 1';
    setPlayerName(trimmed);
    const names = loadPlayerNames();
    names[0] = trimmed;
    localStorage.setItem('sueca-player-names', JSON.stringify(names));
    const last = loadLastConfig();
    if (last) {
      const updatedNames = [...last.playerNames];
      updatedNames[0] = trimmed;
      localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify({ ...last, playerNames: updatedNames }));
    }
  };

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
    <div className="screen-more">
      <header className="screen-header">
        <h1 className="screen-title">{t.moreScreen.title}</h1>
      </header>

      <section className="more-section dobo-panel">
        <h2 className="more-section-title">{t.moreScreen.profile}</h2>
        <label className="more-name-label" htmlFor="more-player-name">
          {t.moreScreen.editName}
        </label>
        <div className="more-name-row">
          <input
            id="more-player-name"
            type="text"
            className="more-name-input form-input"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
            placeholder={t.moreScreen.playerName}
          />
          <button type="button" className="sueca-btn sueca-btn--primary sueca-btn--block more-save-name" onClick={savePlayerName}>
            {t.moreScreen.saveName}
          </button>
        </div>
      </section>

      <section className="more-section dobo-panel">
        <h2 className="more-section-title">{t.moreScreen.settings}</h2>
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

      <section className="more-section dobo-panel">
        <h2 className="more-section-title">{t.moreScreen.handSort}</h2>
        <label className="more-toggle">
          <input
            type="checkbox"
            checked={handPrefs.sortEnabled}
            onChange={() => updateHandPrefs({ sortEnabled: !handPrefs.sortEnabled })}
          />
          <span>{t.moreScreen.sortHand}</span>
        </label>
        <label className="more-field" htmlFor="more-suit-order">
          <span>{t.moreScreen.suitOrder}</span>
          <select
            id="more-suit-order"
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
        <label className="more-field" htmlFor="more-trump-position">
          <span>{t.moreScreen.trumpPosition}</span>
          <select
            id="more-trump-position"
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

      <section className="more-section dobo-panel">
        <button type="button" className="sueca-btn sueca-btn--secondary sueca-btn--block more-link-btn" onClick={() => setShowCredits(true)}>
          {t.moreScreen.credits}
        </button>
        <a href={FEEDBACK_ISSUE_URL} target="_blank" rel="noopener noreferrer" className="sueca-btn sueca-btn--ghost sueca-btn--block more-feedback-link">
          Feedback / reportar bug
        </a>
      </section>

      {showCredits && <CreditsModal onClose={() => setShowCredits(false)} />}
    </div>
  );
};
