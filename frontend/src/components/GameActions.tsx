import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameVariant } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
import { TRICK_AUTO_CONTINUE_SECONDS } from '../constants/gameConstants';
import { loadAutoPauseTrick, saveAutoPauseTrick } from '../utils/trickAutoContinue';
import {
  shouldShowTrickContinueChrome,
  shouldShowTrickContinueCta
} from '../utils/continueFlowUi';

interface GameActionsProps {
  gameState: GameState;
  variant: GameVariant;
  onContinueTrick: () => void;
  /** Hearts pass / Spades bid / King festa — hide board Continue chrome. */
  flowOverlayActive?: boolean;
}

export const GameActions: React.FC<GameActionsProps> = ({
  gameState,
  variant,
  onContinueTrick,
  flowOverlayActive = false
}) => {
  const { t } = useLanguage();
  const [autoPause, setAutoPause] = useState(() => loadAutoPauseTrick());
  const [countdown, setCountdown] = useState(TRICK_AUTO_CONTINUE_SECONDS);
  const onContinueRef = useRef(onContinueTrick);
  onContinueRef.current = onContinueTrick;

  const overlays = { flowOverlayActive };
  const showChrome = shouldShowTrickContinueChrome(gameState, overlays);
  const showContinueCta = shouldShowTrickContinueCta(gameState, overlays);
  const currentTrickLength = gameState.currentTrick?.length ?? 0;

  useEffect(() => {
    if (!showContinueCta || autoPause) {
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
  }, [showContinueCta, autoPause, variant, currentTrickLength]);

  const toggleAutoPause = useCallback(() => {
    setAutoPause((prev) => {
      const next = !prev;
      saveAutoPauseTrick(next);
      return next;
    });
  }, []);

  if (!showChrome) {
    return <div className="action-buttons-bar action-buttons-bar--slot" aria-hidden="true" />;
  }

  const continueLabel =
    showContinueCta && !autoPause
      ? `${t.gameBoard.continue} (${countdown})`
      : t.gameBoard.continue;

  return (
    <div
      className={`action-buttons-bar action-buttons-bar--slot${
        showContinueCta ? ' action-buttons-bar--waiting' : ' action-buttons-bar--idle'
      }`}
    >
      <div className="action-buttons-group">
        {showContinueCta ? (
          <button
            type="button"
            className="sueca-btn sueca-btn--primary sueca-btn--block action-continue-btn"
            onClick={onContinueTrick}
            aria-disabled={false}
            aria-label={t.gameBoard.continueTrickAria}
          >
            <span className="action-continue-btn__label">{continueLabel}</span>
            <span className="action-continue-btn__hint">{t.gameBoard.continueTrickHint}</span>
          </button>
        ) : (
          <div className="action-continue-placeholder" aria-hidden="true" />
        )}
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
