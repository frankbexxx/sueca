import React, { useState } from 'react';
import { CreditsModal } from '../CreditsModal';
import { useLanguage } from '../../i18n/useLanguage';
import { loadLastConfig, loadLocalStats } from '../../services/gameSessionStorage';
import { FEEDBACK_ISSUE_URL } from '../../constants/feedback';
import { STORAGE_KEYS } from '../../constants/gameConstants';
import './MoreScreen.css';

interface MoreScreenProps {
  darkMode: boolean;
  onDarkModeChange: (value: boolean) => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ darkMode, onDarkModeChange }) => {
  const { language, setLanguage, t } = useLanguage();
  const [showCredits, setShowCredits] = useState(false);
  const lastConfig = loadLastConfig();
  const stats = loadLocalStats();
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem('sueca-sound-enabled') !== 'false'
  );

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
        <p className="more-profile-name">
          {t.moreScreen.playerName}: <strong>{lastConfig?.playerNames[0] || 'Player 1'}</strong>
        </p>
        <p className="more-stats-line">
          {t.dashboard.gamesPlayed}: {stats.gamesPlayed} · {t.dashboard.wins}: {stats.wins}
        </p>
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
