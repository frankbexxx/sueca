import React from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import './InGameBar.css';

interface InGameBarProps {
  playerName: string;
  gameLabel: string;
  metaLabel?: string;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onNewGame: () => void;
  onExit: () => void;
}

export const InGameBar: React.FC<InGameBarProps> = ({
  playerName,
  gameLabel,
  metaLabel,
  isPaused,
  onPause,
  onResume,
  onNewGame,
  onExit
}) => {
  const { t } = useLanguage();

  const handleNewGame = () => {
    if (window.confirm(t.inGame.newGameConfirm)) {
      onNewGame();
    }
  };

  const handleExit = () => {
    if (window.confirm(t.inGame.leaveConfirm)) {
      onExit();
    }
  };

  return (
    <div className="in-game-bar">
      <div className="in-game-bar-left">
        <div className="in-game-bar-title-row">
          <span className="in-game-bar-title">{gameLabel}</span>
          {metaLabel && <span className="in-game-bar-meta">{metaLabel}</span>}
        </div>
        <span className="in-game-bar-player">{playerName}</span>
      </div>
      <div className="in-game-bar-actions">
        <button
          type="button"
          className="sueca-btn sueca-btn--secondary sueca-btn--compact in-game-bar-btn"
          onClick={isPaused ? onResume : onPause}
        >
          {isPaused ? `▶ ${t.gameMenu.resume}` : `⏸ ${t.gameMenu.pause}`}
        </button>
        <button
          type="button"
          className="sueca-btn sueca-btn--secondary sueca-btn--compact in-game-bar-btn"
          onClick={handleNewGame}
        >
          {t.inGame.newGame}
        </button>
        <button
          type="button"
          className="sueca-btn sueca-btn--danger sueca-btn--compact in-game-bar-btn"
          onClick={handleExit}
        >
          {t.inGame.exit}
        </button>
      </div>
    </div>
  );
};
