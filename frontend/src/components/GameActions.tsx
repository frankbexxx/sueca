import React from 'react';
import { GameState, GameVariant } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';

interface GameActionsProps {
  gameState: GameState;
  variant: GameVariant;
  onContinueTrick: () => void;
  onContinueRound?: () => void;
  onSpecialAction?: () => void;
}

/**
 * Generic game actions component that displays action buttons based on game state
 * Adapts available actions based on current game variant and state
 */
export const GameActions: React.FC<GameActionsProps> = ({
  gameState,
  variant,
  onContinueTrick,
  onContinueRound,
  onSpecialAction
}) => {
  const { t } = useLanguage();

  const renderSuecaActions = () => (
    <div className="action-buttons-group">
      <button
        className={`continue-button ${gameState.waitingForTrickEnd ? 'enabled' : 'disabled'}`}
        onClick={onContinueTrick}
        disabled={!gameState.waitingForTrickEnd}
      >
        {t.gameBoard.continue}
      </button>
    </div>
  );

  const renderSpadesActions = () => (
    <div className="action-buttons-group">
      <button
        className={`continue-button ${gameState.waitingForTrickEnd ? 'enabled' : 'disabled'}`}
        onClick={onContinueTrick}
        disabled={!gameState.waitingForTrickEnd}
      >
        {t.gameBoard.continue}
      </button>
      {/* Spades might have additional actions like bidding */}
    </div>
  );

  const renderHeartsActions = () => (
    <div className="action-buttons-group">
      <button
        className={`continue-button ${gameState.waitingForTrickEnd ? 'enabled' : 'disabled'}`}
        onClick={onContinueTrick}
        disabled={!gameState.waitingForTrickEnd}
      >
        {t.gameBoard.continue}
      </button>
      {/* Hearts might show "Hearts Broken" status */}
    </div>
  );

  const renderKingActions = () => (
    <div className="action-buttons-group">
      <button
        className={`continue-button ${gameState.waitingForTrickEnd ? 'enabled' : 'disabled'}`}
        onClick={onContinueTrick}
        disabled={!gameState.waitingForTrickEnd}
      >
        {t.gameBoard.continue}
      </button>
    </div>
  );

  const renderActions = () => {
    switch (variant) {
      case 'sueca':
        return renderSuecaActions();
      case 'spades':
        return renderSpadesActions();
      case 'hearts':
        return renderHeartsActions();
      case 'king':
        return renderKingActions();
      default:
        return renderSuecaActions(); // fallback
    }
  };

  return (
    <div className="action-buttons-bar">
      {renderActions()}
    </div>
  );
};