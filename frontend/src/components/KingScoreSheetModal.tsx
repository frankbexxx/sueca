import React from 'react';
import { GameState } from '../types/game';
import { getKingPtState } from '../models/games/KingPtGame';
import { useLanguage } from '../i18n/useLanguage';
import { buildKingScoreSheet, formatScoreCell } from '../models/games/king/kingScoreSheet';
import { kingHudMatchProgress } from '../models/games/king/kingContracts';
import { isKingSyntheticActive } from '../dev/kingSyntheticController';
import './VariantModals.css';

interface KingScoreSheetModalProps {
  gameState: GameState;
  onDismiss: () => void;
  onContinue?: () => void;
  showContinue?: boolean;
}

export const KingScoreSheetModal: React.FC<KingScoreSheetModalProps> = ({
  gameState,
  onDismiss,
  onContinue,
  showContinue
}) => {
  const { language } = useLanguage();
  const locale = language === 'pt' ? 'pt' : 'en';
  const king = getKingPtState(gameState);
  const { rows, totals } = buildKingScoreSheet(gameState, locale);
  const breakdown = king.roundBreakdown.lines;
  const syntheticSession =
    isKingSyntheticActive() || Boolean(king.devSyntheticAllNegatives);
  const matchLabel = kingHudMatchProgress(king.gameIndex, locale, { syntheticSession });

  return (
    <div className="variant-modal-overlay">
      <div className="variant-modal king-score-modal variant-modal-wide">
        <h2>
          {locale === 'pt' ? 'Folha de pontuação' : 'Score sheet'} · {matchLabel}
        </h2>

        <div className="king-score-sheet-wrap">
          <table className="king-score-sheet">
            <thead>
              <tr>
                <th>{locale === 'pt' ? 'Jogo' : 'Game'}</th>
                {gameState.players.map((p) => (
                  <th key={p.id}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.gameIndex}
                  className={row.isHighlighted ? 'king-score-sheet-row--active' : undefined}
                >
                  <td className="king-score-sheet-label">{row.label}</td>
                  {row.deltas.map((delta, i) => (
                    <td key={i}>{formatScoreCell(delta)}</td>
                  ))}
                </tr>
              ))}
              <tr className="king-score-sheet-total">
                <td>Total</td>
                {totals.map((total, i) => (
                  <td key={i}>{total >= 0 ? `+${total}` : total}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {breakdown.length > 0 && (
          <div className="king-score-round-detail">
            <h3>{locale === 'pt' ? 'Detalhe desta ronda' : 'This round'}</h3>
            <ul className="king-score-breakdown">
              {breakdown.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="king-score-actions">
          <button type="button" className="sueca-btn" onClick={onDismiss}>
            OK
          </button>
          {showContinue && onContinue && (
            <button type="button" className="sueca-btn sueca-btn--primary" onClick={onContinue}>
              {locale === 'pt' ? 'Próximo jogo' : 'Next game'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
