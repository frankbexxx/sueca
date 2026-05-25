import React from 'react';
import { GameState, Card, GameVariant } from '../types/game';
import { SELECTED_CARD_Z_INDEX } from '../constants/gameConstants';
import { useMobileLayout } from '../hooks/useMobileLayout';

interface PlayerHandProps {
  gameState: GameState;
  variant: GameVariant;
  localPlayerIndex: number;
  selectedCard: number | null;
  canPlayCard: (cardIndex: number) => boolean;
  onCardClick: (cardIndex: number) => void;
  getCardImage: (card: Card) => string;
  readOnly?: boolean;
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
  getCardImage,
  readOnly = false
}) => {
  const player = gameState.players[localPlayerIndex];
  const cardCount = player?.hand.length ?? 0;
  const { isNarrow, cardSpacing, useScrollLayout } = useMobileLayout(cardCount);
  if (!player) return null;

  return (
    <div className={`player-hand-bar ${isNarrow ? 'player-hand-bar--narrow' : ''}`}>
      <div className={`hand-row${useScrollLayout ? ' hand-row--scroll' : ''}`}>
        {player.hand.map((card: Card, cardIndex: number) => {
          const isPlayable = !readOnly && canPlayCard(cardIndex);
          const isSelected = selectedCard === cardIndex;

          let fixedTransform: string | undefined;
          if (!useScrollLayout) {
            const centerOffset = ((Math.max(cardCount, 1) - 1) * cardSpacing) / 2;
            const cardPosition = cardIndex * cardSpacing;
            fixedTransform = `translateX(${cardPosition - centerOffset}px)`;
          }

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
              onClick={readOnly ? undefined : () => onCardClick(cardIndex)}
              role={readOnly ? 'presentation' : 'button'}
              tabIndex={readOnly ? -1 : isPlayable ? 0 : -1}
              aria-disabled={readOnly || !isPlayable}
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
