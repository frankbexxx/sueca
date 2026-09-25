import React, { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { getP1Name, setP1Name } from '../../services/setupPreferences';
import { ShellHeader } from '../navigation/ShellHeader';
import '../../styles/shell-screens.css';
import './MoreScreen.css';

interface ProfileNameScreenProps {
  showBack: boolean;
  onBack: () => void;
}

export const ProfileNameScreen: React.FC<ProfileNameScreenProps> = ({
  showBack,
  onBack
}) => {
  const { t } = useLanguage();
  const [playerName, setPlayerName] = useState(() => getP1Name());

  const savePlayerName = () => {
    const trimmed = playerName.trim() || 'Player 1';
    setPlayerName(trimmed);
    setP1Name(trimmed);
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
