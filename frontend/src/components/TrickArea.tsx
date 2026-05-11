import React from 'react';
import { GameState, Card, GameVariant } from '../types/game';

interface TrickAreaProps {
  gameState: GameState;
  variant: GameVariant;
  getCardImage: (card: Card) => string;
  getTablePosition: (playerIndex: number) => string;
}

/**
 * Generic trick area component that displays current trick cards
 * Adapts layout based on game variant and number of cards
 */
export const TrickArea: React.FC<TrickAreaProps> = ({
  gameState,
  variant,
  getCardImage,
  getTablePosition
}) => {
  // For now, use cross formation for all games
  // This can be extended to support different layouts per game
  const renderCrossFormation = () => {
    if (gameState.currentTrick.length === 0) return null;

    return (
      <div className="trick-cards-cross">
        {gameState.currentTrick.map((card: Card, index: number) => {
          // Calculate which player played this card (based on trick leader + order)
          const playerIndex = (gameState.trickLeader + index) % 4;
          const position = getTablePosition(playerIndex);
          // Highlight winning card if this is the last card and player won
          const isWinning =
            gameState.lastTrickWinner === playerIndex &&
            index === gameState.currentTrick.length - 1;
          return (
            <div
              key={index}
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
    <div className="trick-area-center">
      {renderCrossFormation()}
    </div>
  );
};