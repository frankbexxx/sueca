import React, { useState } from 'react';
import { CreditsModal } from '../CreditsModal';
import { useLanguage } from '../../i18n/useLanguage';
import { loadLastConfig } from '../../services/gameSessionStorage';
import { FEEDBACK_ISSUE_URL } from '../../constants/feedback';
import { STORAGE_KEYS } from '../../constants/gameConstants';
import './MoreScreen.css';

const LAST_CONFIG_KEY = 'sueca-last-config';

interface MoreScreenProps {
  darkMode: boolean;
  onDarkModeChange: (value: boolean) => void;
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

export const MoreScreen: React.FC<MoreScreenProps> = ({ darkMode, onDarkModeChange }) => {
  const { language, setLanguage, t } = useLanguage();
  const [showCredits, setShowCredits] = useState(false);
  const [playerName, setPlayerName] = useState(() => loadPlayerNames()[0] || 'Player 1');
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem('sueca-sound-enabled') !== 'false'
  );

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
    setSoundEnabled(next);
    localStorage.setItem('sueca-sound-enabled', String(next));
  };

  const toggleDark = () => {
    const next = !darkMode;
    onDarkModeChange(next);
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(next));
  };

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
          <button type="button" className="more-save-name dobo-btn" onClick={savePlayerName}>
            {t.moreScreen.saveName}
          </button>
        </div>
      </section>

      <section className="more-section dobo-panel">
        <h2 className="more-section-title">{t.moreScreen.settings}</h2>
        <label className="more-toggle">
          <input type="checkbox" checked={darkMode} onChange={toggleDark} />
          <span>{t.startMenu.darkMode}</span>
        </label>
        <label className="more-toggle">
          <input type="checkbox" checked={soundEnabled} onChange={toggleSound} />
          <span>{t.moreScreen.sound}</span>
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
        <button type="button" className="more-link-btn dobo-btn" onClick={() => setShowCredits(true)}>
          {t.moreScreen.credits}
        </button>
        <a href={FEEDBACK_ISSUE_URL} target="_blank" rel="noopener noreferrer" className="more-feedback-link">
          Feedback / reportar bug
        </a>
      </section>

      {showCredits && <CreditsModal onClose={() => setShowCredits(false)} darkMode={darkMode} />}
    </div>
  );
};
