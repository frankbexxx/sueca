import React, { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { loadLastConfig } from '../../services/gameSessionStorage';
import { ShellHeader } from '../navigation/ShellHeader';
import '../../styles/shell-screens.css';
import './MoreScreen.css';

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

interface ProfileNameScreenProps {
  showBack: boolean;
  onBack: () => void;
}

export const ProfileNameScreen: React.FC<ProfileNameScreenProps> = ({
  showBack,
  onBack
}) => {
  const { t } = useLanguage();
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

  return (
    <div className="shell-screen screen-profile">
      <ShellHeader
        title={t.profileScreen.hubName}
        showBack={showBack}
        onBack={onBack}
      />
      <section className="shell-panel">
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
    </div>
  );
};
