import React, { useState } from 'react';
import { CreditsModal } from '../CreditsModal';
import { useLanguage } from '../../i18n/useLanguage';
import { loadLastConfig } from '../../services/gameSessionStorage';
import { FEEDBACK_ISSUE_URL } from '../../constants/feedback';
import { exitAppToLanding } from '../../services/appLifecycle';
import '../../styles/shell-screens.css';
import '../screens/MoreScreen.css';

const LAST_CONFIG_KEY = 'sueca-last-config';

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

interface ProfileScreenProps {
  darkMode: boolean;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ darkMode }) => {
  const { t } = useLanguage();
  const [showCredits, setShowCredits] = useState(false);
  const [playerName, setPlayerName] = useState(() => loadPlayerNames()[0] || 'Player 1');

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

  const handleExitApp = () => {
    if (window.confirm(t.profileScreen.exitConfirm)) {
      exitAppToLanding();
    }
  };

  return (
    <div className="shell-screen screen-profile">
      <header className="shell-screen-header">
        <h1 className="screen-title">{t.profileScreen.title}</h1>
        <p className="screen-subtitle">{t.profileScreen.subtitle}</p>
      </header>

      <section className="shell-panel">
        <h2 className="shell-section-title">{t.moreScreen.profile}</h2>
        <label className="more-name-label" htmlFor="profile-player-name">
          {t.moreScreen.editName}
        </label>
        <div className="more-name-row">
          <input
            id="profile-player-name"
            type="text"
            className="more-name-input form-input"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
            placeholder={t.moreScreen.playerName}
          />
          <button
            type="button"
            className="sueca-btn sueca-btn--primary sueca-btn--block more-save-name"
            onClick={savePlayerName}
          >
            {t.moreScreen.saveName}
          </button>
        </div>
      </section>

      <section className="shell-panel">
        <button
          type="button"
          className="sueca-btn sueca-btn--secondary sueca-btn--block more-link-btn"
          onClick={() => setShowCredits(true)}
        >
          {t.moreScreen.credits}
        </button>
        <a
          href={FEEDBACK_ISSUE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="sueca-btn sueca-btn--ghost sueca-btn--block more-feedback-link"
        >
          Feedback / reportar bug
        </a>
      </section>

      <section className="shell-panel">
        <button
          type="button"
          className="sueca-btn sueca-btn--danger sueca-btn--block"
          onClick={handleExitApp}
        >
          {t.profileScreen.exitApp}
        </button>
      </section>

      {showCredits && <CreditsModal onClose={() => setShowCredits(false)} darkMode={darkMode} />}
    </div>
  );
};
