import React from 'react';
import { GameState, Card, GameVariant } from '../types/game';
import { getTablePositionForPlayer } from '../utils/tableLayout';
import { handleCardImageError } from '../utils/cardImageError';
import {
  clockwiseSeatAtTrickOffset,
  suecaSeatAtTrickOffset
} from '../models/games/suecaDeal';

interface TrickAreaProps {
  gameState: GameState;
  localPlayerIndex: number;
  getCardImage: (card: Card) => string;
  /** Required for correct Sueca ACW vs clockwise other-game seat mapping. */
  variant?: GameVariant;
}

export const TrickArea: React.FC<TrickAreaProps> = ({
  gameState,
  localPlayerIndex,
  getCardImage,
  variant
}) => {
  const effectiveVariant = variant ?? gameState.variant ?? 'sueca';

  return (
    <div className="trick-area-center">
      {(gameState.currentTrick?.length ?? 0) > 0 && (
        <div className="trick-cards-cross">
          {(gameState.currentTrick ?? []).map((card: Card, index: number) => {
            const playerIndex =
              effectiveVariant === 'sueca'
                ? suecaSeatAtTrickOffset(gameState.trickLeader, index)
                : clockwiseSeatAtTrickOffset(gameState.trickLeader, index);
            const position = getTablePositionForPlayer(playerIndex, localPlayerIndex);
            return (
              <div
                key={`${card.id}-${index}`}
                className={`trick-card-cross trick-from-${position} card-frame`}
              >
                <img
                  src={getCardImage(card)}
                  alt={`${card.rank} of ${card.suit}`}
                  className="card-frame__art trick-card-img"
                  draggable={false}
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
