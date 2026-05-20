import React from 'react';
import { GameState } from '../types/game';
import './VariantModals.css';

interface HeartsPassModalProps {
  gameState: GameState;
  localPlayerIndex: number;
  passDirection: string;
  selectedIndices: number[];
  onToggleCard: (index: number) => void;
  onConfirm: () => void;
}

export const HeartsPassModal: React.FC<HeartsPassModalProps> = ({
  gameState,
  localPlayerIndex,
  passDirection,
  selectedIndices,
  onToggleCard,
  onConfirm
}) => {
  const hand = gameState.players[localPlayerIndex]?.hand ?? [];
  const ready = selectedIndices.length === 3;

  return (
    <div className="variant-modal-overlay">
      <div className="variant-modal variant-modal-wide">
        <h2>Hearts — Pass 3 cards</h2>
        <p className="variant-modal-hint">Pass to: {passDirection}. Select exactly 3 cards.</p>
        <div className="pass-card-grid">
          {hand.map((card, index) => (
            <button
              key={card.id}
              type="button"
              className={`pass-card-btn ${selectedIndices.includes(index) ? 'selected' : ''}`}
              onClick={() => onToggleCard(index)}
            >
              {card.rank}
              {card.suit === 'hearts' ? '♥' : card.suit === 'spades' ? '♠' : card.suit === 'diamonds' ? '♦' : '♣'}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="variant-modal-primary"
          disabled={!ready}
          onClick={onConfirm}
        >
          Pass cards ({selectedIndices.length}/3)
        </button>
      </div>
    </div>
  );
};
