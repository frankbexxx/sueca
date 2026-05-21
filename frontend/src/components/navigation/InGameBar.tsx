import React from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import './InGameBar.css';

interface InGameBarProps {
  playerName: string;
  gameLabel: string;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onExit: () => void;
}

export const InGameBar: React.FC<InGameBarProps> = ({
  playerName,
  gameLabel,
  isPaused,
  onPause,
  onResume,
  onExit
}) => {
  const { t } = useLanguage();

  const handleExit = () => {
    if (window.confirm(t.inGame.exitConfirm)) {
      onExit();
    }
  };

  return (
    <div className="in-game-bar">
      <div className="in-game-bar-left">
        <span className="in-game-bar-title">{gameLabel}</span>
        <span className="in-game-bar-player">{playerName}</span>
      </div>
      <div className="in-game-bar-actions">
        <button
          type="button"
          className="in-game-bar-btn"
          onClick={isPaused ? onResume : onPause}
        >
          {isPaused ? `▶ ${t.gameMenu.resume}` : `⏸ ${t.gameMenu.pause}`}
        </button>
        <button type="button" className="in-game-bar-btn in-game-bar-btn-exit" onClick={handleExit}>
          {t.inGame.exit}
        </button>
      </div>
    </div>
  );
};
