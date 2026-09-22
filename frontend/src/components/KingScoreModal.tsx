import React from 'react';
import { GameState } from '../types/game';
import { getKingPtState } from '../models/games/KingPtGame';
import { kingHudMatchProgress } from '../models/games/king/kingContracts';
import { isKingSyntheticActive } from '../dev/kingSyntheticController';
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
  const breakdown = king.roundBreakdown.lines;
  const syntheticSession =
    isKingSyntheticActive() || Boolean(king.devSyntheticAllNegatives);
  const matchLabel = kingHudMatchProgress(king.gameIndex, 'pt', { syntheticSession });

  return (
    <div className="variant-modal-overlay">
      <div className="variant-modal king-score-modal variant-modal-wide">
        <h2>Pontuação · {matchLabel}</h2>
        {king.activeContract && (
          <p className="variant-modal-hint">
            Contrato: {king.activeContract.amount}{' '}
            {king.activeContract.bidType === 'positive' ? 'positivas' : 'nulos'} ·{' '}
            {gameState.players[king.activeContract.bidderIndex]?.name}
          </p>
        )}
        {king.nullAuctionStartNote && (
          <p className="variant-modal-hint">{king.nullAuctionStartNote}</p>
        )}
        {king.festaMode === 'negative_festa' && !king.activeContract && (
          <p className="variant-modal-hint">Nulos</p>
        )}
        {breakdown.length > 0 && (
          <ul className="king-score-breakdown">
            {breakdown.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
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
          <button type="button" className="sueca-btn" onClick={onDismiss}>
            OK
          </button>
          {showContinue && onContinue && (
            <button type="button" className="sueca-btn sueca-btn--primary" onClick={onContinue}>
              Próximo jogo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
