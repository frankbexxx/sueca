import React from 'react';
import { GameState, Card } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
import './GameBoard.css';

interface GameStartModalProps {
  gameState: GameState;
  getCardImage: (card: Card) => string;
  getSuitEmoji: (suit: string) => string;
  onStart: () => void;
}

/**
 * Modal displayed when a new game/round starts
 * Shows trump card and dealer information
 */
export const GameStartModal: React.FC<GameStartModalProps> = ({
  gameState,
  getCardImage,
  getSuitEmoji,
  onStart
}) => {
  const { t, tReplace } = useLanguage();
  return (
    <div className="modal-overlay modal-overlay-game-start">
      <div className="modal-container modal-container-medium">
        <h2 className="modal-title">{tReplace('modals.gameReady', { round: gameState.round })}</h2>
        
        {gameState.trumpCard && (
          <div className="modal-trump-section">
            <p className="modal-section-title">{t.modals.trumpSuit}:</p>
            <img
              src={getCardImage(gameState.trumpCard)}
              alt={`Trump: ${gameState.trumpCard.rank} of ${gameState.trumpCard.suit}`}
              className="modal-trump-card"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <p className="modal-trump-suit">
              {getSuitEmoji(gameState.trumpSuit!)} {gameState.trumpSuit!.toUpperCase()}
            </p>
            <p className="modal-trump-note">
              {t.modals.trumpNote}
            </p>
          </div>
        )}
        
        <p className="modal-dealer-info">
          {t.modals.dealer}: <strong>{gameState.players[gameState.dealerIndex].name}</strong>
        </p>
        
        <button
          onClick={onStart}
          className="modal-button modal-button-primary modal-button-hover"
        >
          {t.modals.startGame}
        </button>
      </div>
    </div>
  );
};
