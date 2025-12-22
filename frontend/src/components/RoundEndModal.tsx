import React from 'react';
import { GameState } from '../types/game';
import { PenteVisualization } from './PenteVisualization';
import { useLanguage } from '../i18n/useLanguage';
import './GameBoard.css';

interface RoundEndModalProps {
  gameState: GameState;
  usTeam: 1 | 2;
  themTeam: 1 | 2;
  onContinue: () => void;
}

/**
 * Modal displayed when a round ends
 * Shows round scores and game progress
 */
export const RoundEndModal: React.FC<RoundEndModalProps> = ({
  gameState,
  usTeam,
  themTeam,
  onContinue
}) => {
  const { t, tReplace } = useLanguage();
  return (
    <div className="modal-overlay modal-overlay-round-end">
      <div className="modal-container modal-container-large">
        <h2 className="modal-title">{tReplace('modals.roundComplete', { round: gameState.round })}</h2>
        
        <div className="modal-content">
          <p className="modal-section-title">{t.modals.gamePoints}</p>
          <div className="modal-scores-grid">
            <div className="modal-score-box modal-score-us">
              <strong className="modal-score-label">{t.gameBoard.us}</strong>
              <p className="modal-score-value">
                {gameState.scores[usTeam === 1 ? 'team1' : 'team2']} {t.gameBoard.points.toLowerCase().replace(':', '')}
              </p>
            </div>
            <div className="modal-score-box modal-score-them">
              <strong className="modal-score-label">{t.gameBoard.them}</strong>
              <p className="modal-score-value">
                {gameState.scores[themTeam === 1 ? 'team1' : 'team2']} {t.gameBoard.points.toLowerCase().replace(':', '')}
              </p>
            </div>
          </div>
          
          <div className="modal-games-section">
            <p className="modal-section-title">{t.modals.games}</p>
            <div className="modal-games-content">
              <PenteVisualization
                team1Score={gameState.gameScore[usTeam === 1 ? 'team1' : 'team2']}
                team2Score={gameState.gameScore[themTeam === 1 ? 'team1' : 'team2']}
                team1Name={t.gameBoard.us}
                team2Name={t.gameBoard.them}
                pentes={gameState.completedPentes.map(pente => ({
                  team1: usTeam === 1 ? pente.team1 : pente.team2,
                  team2: themTeam === 1 ? pente.team1 : pente.team2
                }))}
              />
            </div>
          </div>
        </div>
        
        <button
          onClick={onContinue}
          className="modal-button modal-button-primary"
        >
          {tReplace('modals.continueToGame', { nextRound: gameState.round + 1 })}
        </button>
      </div>
    </div>
  );
};
