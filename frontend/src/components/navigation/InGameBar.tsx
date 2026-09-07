import React, { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { ConfirmDialog } from '../common/ConfirmDialog';
import './InGameBar.css';

type PendingConfirm = 'newGame' | 'exit' | null;

interface InGameBarProps {
  playerName: string;
  gameLabel: string;
  metaLabel?: string;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onNewGame: () => void;
  onPinGame?: () => void;
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
  onPinGame,
  onExit
}) => {
  const { t } = useLanguage();
  const [pending, setPending] = useState<PendingConfirm>(null);

  const closeDialog = () => setPending(null);

  const handleConfirm = () => {
    const kind = pending;
    setPending(null);
    if (kind === 'newGame') onNewGame();
    if (kind === 'exit') onExit();
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
          data-testid="in-game-pause"
        >
          {isPaused ? `▶ ${t.gameMenu.resume}` : `⏸ ${t.gameMenu.pause}`}
        </button>
        {onPinGame && (
          <button
            type="button"
            className="sueca-btn sueca-btn--secondary sueca-btn--compact in-game-bar-btn"
            onClick={onPinGame}
            title={t.inGame.pinGame}
            aria-label={t.inGame.pinGame}
          >
            📌
          </button>
        )}
        <button
          type="button"
          className="sueca-btn sueca-btn--secondary sueca-btn--compact in-game-bar-btn"
          onClick={() => setPending('newGame')}
          data-testid="in-game-new-game"
        >
          {t.inGame.newGame}
        </button>
        <button
          type="button"
          className="sueca-btn sueca-btn--danger sueca-btn--compact in-game-bar-btn"
          onClick={() => setPending('exit')}
          data-testid="in-game-exit"
        >
          {t.inGame.exit}
        </button>
      </div>

      <ConfirmDialog
        open={pending === 'newGame'}
        title={t.inGame.newGame}
        message={t.inGame.newGameConfirm}
        confirmLabel={t.inGame.newGame}
        cancelLabel={t.gameMenu.cancel}
        destructive
        onConfirm={handleConfirm}
        onCancel={closeDialog}
      />
      <ConfirmDialog
        open={pending === 'exit'}
        title={t.inGame.exit}
        message={t.inGame.leaveConfirm}
        confirmLabel={t.inGame.exit}
        cancelLabel={t.gameMenu.cancel}
        destructive
        onConfirm={handleConfirm}
        onCancel={closeDialog}
      />
    </div>
  );
};
