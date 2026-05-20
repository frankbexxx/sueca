import React from 'react';
import { GameState, Card, GameVariant } from '../types/game';
import { MAX_CARDS_IN_HAND, SELECTED_CARD_Z_INDEX } from '../constants/gameConstants';
import { useMobileLayout } from '../hooks/useMobileLayout';

interface PlayerHandProps {
  gameState: GameState;
  variant: GameVariant;
  localPlayerIndex: number;
  selectedCard: number | null;
  canPlayCard: (cardIndex: number) => boolean;
  onCardClick: (cardIndex: number) => void;
  getCardImage: (card: Card) => string;
}

/**
 * Generic player hand component that displays player's cards
 * Adapts based on game variant and player state
 */
export const PlayerHand: React.FC<PlayerHandProps> = ({
  gameState,
  variant,
  localPlayerIndex,
  selectedCard,
  canPlayCard,
  onCardClick,
  getCardImage
}) => {
  const player = gameState.players[localPlayerIndex];
  const { isNarrow, cardSpacing, handMinWidth } = useMobileLayout();
  if (!player) return null;

  return (
    <div className={`player-hand-bar ${isNarrow ? 'player-hand-bar--narrow' : ''}`}>
      <div className="hand-row" style={{ minWidth: handMinWidth }}>
        {player.hand.map((card: Card, cardIndex: number) => {
          const CENTER_OFFSET = ((MAX_CARDS_IN_HAND - 1) * cardSpacing) / 2;
          const cardPosition = cardIndex * cardSpacing;
          const translateX = cardPosition - CENTER_OFFSET;
          const fixedTransform = `translateX(${translateX}px)`;

          // Card state for UI feedback
          const isPlayable = canPlayCard(cardIndex);
          const isSelected = selectedCard === cardIndex;

          return (
            <img
              key={card.id}
              src={getCardImage(card)}
              alt={`${card.rank} of ${card.suit}`}
              className={`card-hand ${isSelected ? 'selected' : ''} ${!isPlayable ? 'not-playable' : ''}`}
              style={{
                transform: fixedTransform,
                zIndex: isSelected ? SELECTED_CARD_Z_INDEX : cardIndex + 1
              }}
              onClick={() => onCardClick(cardIndex)}
              role="button"
              tabIndex={isPlayable ? 0 : -1}
              aria-disabled={!isPlayable}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          );
        })}
      </div>
    </div>
  );
};