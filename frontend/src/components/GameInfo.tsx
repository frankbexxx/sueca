import React from 'react';
import { GameState, GameVariant } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
import { SUIT_TO_EMOJI } from '../utils/cardMappings';

interface GameInfoProps {
  gameState: GameState;
  variant: GameVariant;
}

/**
 * Generic game information component that displays game-specific info
 * Adapts display based on the current game variant
 */
export const GameInfo: React.FC<GameInfoProps> = ({ gameState, variant }) => {
  const { t } = useLanguage();

  const getTrumpColorClass = (suit: string): string => {
    switch (suit.toLowerCase()) {
      case 'hearts': return 'hearts';
      case 'diamonds': return 'diamonds';
      case 'clubs': return 'clubs';
      case 'spades': return 'spades';
      default: return '';
    }
  };

  const getSuitEmoji = (suit: string): string => {
    return SUIT_TO_EMOJI[suit] || suit;
  };

  // Render different info based on game variant
  const renderGameSpecificInfo = () => {
    switch (variant) {
      case 'sueca':
        return (
          <>
            {/* Trump information for Sueca */}
            {gameState.trumpSuit && gameState.trumpCard && (
              <div className="trump-info-in-team">
                <span className="dealer-name">{gameState.players[gameState.dealerIndex]?.name}</span>
                <span className={`trump-minimal ${getTrumpColorClass(gameState.trumpSuit)}`}>
                  {gameState.trumpCard.rank}{getSuitEmoji(gameState.trumpSuit)}
                </span>
              </div>
            )}
          </>
        );

      case 'spades':
        return (
          <>
            {/* Spades specific info - could show current bid, bags, etc. */}
            <div className="spades-info">
              <span>♠ Spades</span>
            </div>
          </>
        );

      case 'hearts':
        return (
          <>
            {/* Hearts specific info - could show hearts broken status */}
            <div className="hearts-info">
              <span>♥ Hearts</span>
            </div>
          </>
        );

      case 'king':
        return (
          <>
            {/* King specific info */}
            <div className="king-info">
              <span>👑 King</span>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="game-info">
      {renderGameSpecificInfo()}
    </div>
  );
};