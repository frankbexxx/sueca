import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameVariant } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
import { TRICK_AUTO_CONTINUE_SECONDS } from '../constants/gameConstants';
import { loadAutoPauseTrick, saveAutoPauseTrick } from '../utils/trickAutoContinue';

interface GameActionsProps {
  gameState: GameState;
  variant: GameVariant;
  onContinueTrick: () => void;
}

export const GameActions: React.FC<GameActionsProps> = ({
  gameState,
  variant,
  onContinueTrick
}) => {
  const { t } = useLanguage();
  const [autoPause, setAutoPause] = useState(() => loadAutoPauseTrick());
  const [countdown, setCountdown] = useState(TRICK_AUTO_CONTINUE_SECONDS);
  const onContinueRef = useRef(onContinueTrick);
  onContinueRef.current = onContinueTrick;

  const waiting = gameState.waitingForTrickEnd;

  useEffect(() => {
    if (!waiting || autoPause) {
      setCountdown(TRICK_AUTO_CONTINUE_SECONDS);
      return;
    }

    setCountdown(TRICK_AUTO_CONTINUE_SECONDS);
    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          onContinueRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [waiting, autoPause, variant, gameState.currentTrick?.length ?? 0]);

  const toggleAutoPause = useCallback(() => {
    setAutoPause((prev) => {
      const next = !prev;
      saveAutoPauseTrick(next);
      return next;
    });
  }, []);

  const continueLabel =
    waiting && !autoPause
      ? `${t.gameBoard.continue} (${countdown})`
      : t.gameBoard.continue;

  return (
    <div className="action-buttons-bar">
      <div className="action-buttons-group">
        <button
          type="button"
          className={`sueca-btn sueca-btn--primary sueca-btn--block action-continue-btn${
            waiting ? '' : ' sueca-btn--disabled'
          }`}
          onClick={onContinueTrick}
          disabled={!waiting}
        >
          {continueLabel}
        </button>
        <button
          type="button"
          className={`sueca-btn sueca-btn--compact action-auto-pause-btn${
            autoPause ? ' sueca-btn--toggle-on' : ' sueca-btn--secondary'
          }`}
          onClick={toggleAutoPause}
          aria-pressed={autoPause}
          title={t.gameBoard.autoPauseHint}
        >
          {t.gameBoard.autoPause}
        </button>
      </div>
    </div>
  );
};
