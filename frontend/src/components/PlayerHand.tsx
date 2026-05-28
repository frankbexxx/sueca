import React from 'react';
import { GameState, Card } from '../types/game';
import { SELECTED_CARD_Z_INDEX } from '../constants/gameConstants';
import { useHandLayout } from '../hooks/useMobileLayout';
import { LayoutSnapshot } from '../hooks/useLayoutSnapshot';
import { handleCardImageError } from '../utils/cardImageError';

interface PlayerHandProps {
  gameState: GameState;
  localPlayerIndex: number;
  selectedCard: number | null;
  canPlayCard: (cardIndex: number) => boolean;
  onCardClick: (cardIndex: number) => void;
  getCardImage: (card: Card) => string;
  readOnly?: boolean;
  selectedPassIndices?: number[];
  layoutSnapshot: LayoutSnapshot;
}

/**
 * Generic player hand component that displays player's cards
 * Adapts based on game variant and player state
 */
export const PlayerHand: React.FC<PlayerHandProps> = ({
  gameState,
  localPlayerIndex,
  selectedCard,
  canPlayCard,
  onCardClick,
  getCardImage,
  readOnly = false,
  selectedPassIndices,
  layoutSnapshot
}) => {
  const player = gameState.players[localPlayerIndex];
  const cardCount = player?.hand.length ?? 0;
  const { isNarrow, cardSpacing, useScrollLayout } = useHandLayout(cardCount, layoutSnapshot);
  if (!player) return null;

  return (
    <div className={`player-hand-bar ${isNarrow ? 'player-hand-bar--narrow' : ''}`}>
      <div className={`hand-row${useScrollLayout ? ' hand-row--scroll' : ''}`}>
        {player.hand.map((card: Card, cardIndex: number) => {
          const isPlayable = !readOnly && canPlayCard(cardIndex);
          const isSelected = selectedCard === cardIndex;
          const isPassSelected = selectedPassIndices?.includes(cardIndex) ?? false;

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
              className={`card-hand ${isSelected ? 'selected' : ''} ${isPassSelected ? 'card-hand--pass-selected' : ''} ${!isPlayable && !isPassSelected ? 'not-playable' : ''}`}
              style={{
                transform: fixedTransform,
                zIndex: isSelected ? SELECTED_CARD_Z_INDEX : cardIndex + 1
              }}
              onClick={readOnly ? undefined : () => onCardClick(cardIndex)}
              role={readOnly ? 'presentation' : 'button'}
              tabIndex={readOnly ? -1 : isPlayable ? 0 : -1}
              aria-disabled={readOnly || !isPlayable}
              onError={(event) =>
                handleCardImageError(event, `${card.rank}-${card.suit}`)
              }
            />
          );
        })}
      </div>
    </div>
  );
};
