import React, { useEffect, useRef, useState } from 'react';
import { GameState, Card } from '../types/game';
import { useHandLayout } from '../hooks/useMobileLayout';
import { LayoutSnapshot } from '../hooks/useLayoutSnapshot';
import { handleCardImageError } from '../utils/cardImageError';
import {
  handCardVisualClassName,
  resolveHandCardVisualState
} from '../utils/handCardVisual';

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
 * Generic player hand component that displays player's cards.
 * Spacing follows GLOBAL-CARDS-01 shared adaptive expose curve.
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
  const barRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = barRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setAvailableWidth(w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { isNarrow, cardSpacing, useScrollLayout } = useHandLayout(
    cardCount,
    layoutSnapshot,
    availableWidth
  );
  if (!player) return null;

  const playableFlags = player.hand.map((_, cardIndex) => !readOnly && canPlayCard(cardIndex));
  const handHasPlayable = playableFlags.some(Boolean);

  return (
    <div
      ref={barRef}
      className={`player-hand-bar ${isNarrow ? 'player-hand-bar--narrow' : ''}${
        handHasPlayable && !readOnly ? '' : ' player-hand-bar--inactive'
      }`}
    >
      <div className={`hand-row${useScrollLayout ? ' hand-row--scroll' : ''}`}>
        {player.hand.map((card: Card, cardIndex: number) => {
          const isPlayable = playableFlags[cardIndex];
          const isSelected = selectedCard === cardIndex;
          const isPassSelected = selectedPassIndices?.includes(cardIndex) ?? false;
          const visualState = resolveHandCardVisualState({
            readOnly,
            isPlayable,
            handHasPlayable,
            isPassSelected
          });
          const visualClass = handCardVisualClassName(visualState);

          let fixedTransform: string | undefined;
          if (!useScrollLayout) {
            const centerOffset = ((Math.max(cardCount, 1) - 1) * cardSpacing) / 2;
            const cardPosition = cardIndex * cardSpacing;
            const lift = isSelected || isPassSelected ? ' translateY(-16px)' : '';
            fixedTransform = `translateX(${cardPosition - centerOffset}px)${lift}`;
          } else if (isSelected || isPassSelected) {
            fixedTransform = 'translateY(-16px)';
          }

          return (
            <img
              key={card.id}
              src={getCardImage(card)}
              alt={`${card.rank} of ${card.suit}`}
              className={`card-hand ${visualClass} ${isSelected ? 'selected' : ''} ${
                isPassSelected ? 'card-hand--pass-selected' : ''
              }`}
              style={{
                transform: fixedTransform,
                zIndex: cardIndex + 1
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
