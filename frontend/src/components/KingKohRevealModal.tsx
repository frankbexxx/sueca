import React from 'react';
import { GameState } from '../types/game';
import { getKingPtState } from '../models/games/KingPtGame';
import { SUIT_TO_NAME, RANK_TO_IMAGE_NAME } from '../utils/cardMappings';
import './VariantModals.css';

interface KingKohRevealModalProps {
  gameState: GameState;
  onNext: () => void;
  onConfirm: () => void;
}

export const KingKohRevealModal: React.FC<KingKohRevealModalProps> = ({
  gameState,
  onNext,
  onConfirm
}) => {
  const king = getKingPtState(gameState);
  const reveal = king.kohReveal;
  if (!reveal) return null;

  const current = reveal.sequence[reveal.step];
  const isLast = reveal.step >= reveal.sequence.length - 1;
  const winner = gameState.players[reveal.winnerIndex];

  return (
    <div className="variant-modal-overlay">
      <div className="variant-modal dobo-panel">
        <h2>Viragem do Rei de Copas</h2>
        <p className="variant-modal-hint">
          Carta {reveal.step + 1} de {reveal.sequence.length}
        </p>
        {current && (
          <div className="king-koh-card">
            <p>
              <strong>{gameState.players[current.playerIndex]?.name}</strong> —{' '}
              {RANK_TO_IMAGE_NAME[current.card.rank] ?? current.card.rank}{' '}
              {SUIT_TO_NAME[current.card.suit]}
            </p>
          </div>
        )}
        {isLast && (
          <p className="variant-modal-hint king-koh-winner">
            {winner?.name} tirou o Rei de Copas — dono da 1.ª festa.
          </p>
        )}
        <button
          type="button"
          className="variant-modal-primary dobo-btn"
          onClick={isLast ? onConfirm : onNext}
        >
          {isLast ? 'Começar partida' : 'Seguinte carta'}
        </button>
      </div>
    </div>
  );
};
