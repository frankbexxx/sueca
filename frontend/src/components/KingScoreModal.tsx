import React from 'react';
import { GameState } from '../types/game';
import { getKingPtState } from '../models/games/KingPtGame';
import './VariantModals.css';

interface KingScoreModalProps {
  gameState: GameState;
  onDismiss: () => void;
  onContinue?: () => void;
  showContinue?: boolean;
}

export const KingScoreModal: React.FC<KingScoreModalProps> = ({
  gameState,
  onDismiss,
  onContinue,
  showContinue
}) => {
  const king = getKingPtState(gameState);
  return (
    <div className="variant-modal-overlay">
      <div className="variant-modal dobo-panel king-score-modal">
        <h2>Pontuação · jogo {king.gameIndex + 1}/10</h2>
        {king.activeContract && (
          <p className="variant-modal-hint">
            Contrato: {king.activeContract.amount}{' '}
            {king.activeContract.bidType === 'positive' ? 'positivas' : 'nulos'} ·{' '}
            {gameState.players[king.activeContract.bidderIndex]?.name}
          </p>
        )}
        {king.festaMode === 'negative_festa' && !king.activeContract && (
          <p className="variant-modal-hint">Nulos</p>
        )}
        <table className="king-score-table">
          <thead>
            <tr>
              <th>Jogador</th>
              <th>Ronda</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {gameState.players.map((player, index) => (
              <tr key={player.id}>
                <td>{player.name}</td>
                <td>{king.lastRoundDeltas[index] >= 0 ? '+' : ''}{king.lastRoundDeltas[index]}</td>
                <td>{king.playerScores[index]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="king-score-actions">
          <button type="button" className="dobo-btn" onClick={onDismiss}>
            OK
          </button>
          {showContinue && onContinue && (
            <button type="button" className="variant-modal-primary dobo-btn" onClick={onContinue}>
              Próximo jogo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
