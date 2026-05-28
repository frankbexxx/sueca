import React from 'react';
import { GameState, Card } from '../types/game';
import { getTablePositionForPlayer } from '../utils/tableLayout';
import { handleCardImageError } from '../utils/cardImageError';

interface TrickAreaProps {
  gameState: GameState;
  localPlayerIndex: number;
  getCardImage: (card: Card) => string;
}

export const TrickArea: React.FC<TrickAreaProps> = ({
  gameState,
  localPlayerIndex,
  getCardImage
}) => {
  return (
    <div className="trick-area-center">
      {gameState.currentTrick.length > 0 && (
        <div className="trick-cards-cross">
          {gameState.currentTrick.map((card: Card, index: number) => {
            const playerIndex = (gameState.trickLeader + index) % 4;
            const position = getTablePositionForPlayer(playerIndex, localPlayerIndex);
            return (
              <div
                key={`${card.id}-${index}`}
                className={`trick-card-cross trick-from-${position}`}
              >
                <img
                  src={getCardImage(card)}
                  alt={`${card.rank} of ${card.suit}`}
                  className="trick-card-img"
                  onError={(event) => handleCardImageError(event, `${card.rank}-${card.suit}`)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
