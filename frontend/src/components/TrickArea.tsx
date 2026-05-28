import React from 'react';
import { GameState, Card, GameVariant } from '../types/game';
import { getTablePositionForPlayer } from '../utils/tableLayout';

interface TrickAreaProps {
  gameState: GameState;
  variant: GameVariant;
  localPlayerIndex: number;
  getCardImage: (card: Card) => string;
}

export const TrickArea: React.FC<TrickAreaProps> = ({
  gameState,
  variant,
  localPlayerIndex,
  getCardImage
}) => {
  const renderCrossFormation = () => {
    if (gameState.currentTrick.length === 0) return null;

    return (
      <div className="trick-cards-cross">
        {gameState.currentTrick.map((card: Card, index: number) => {
          const playerIndex = (gameState.trickLeader + index) % 4;
          const position = getTablePositionForPlayer(playerIndex, localPlayerIndex);
          if (variant === 'hearts' && position === 'south') return null;
          const isWinning =
            gameState.lastTrickWinner === playerIndex &&
            index === gameState.currentTrick.length - 1;
          return (
            <div
              key={`${card.id}-${index}`}
              className={`trick-card-cross trick-from-${position} ${isWinning ? 'winning' : ''}`}
            >
              <img
                src={getCardImage(card)}
                alt={`${card.rank} of ${card.suit}`}
                className="trick-card-img"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`trick-area-center${variant === 'hearts' ? ' trick-area-center--hearts' : ''}`}>
      {renderCrossFormation()}
    </div>
  );
};
