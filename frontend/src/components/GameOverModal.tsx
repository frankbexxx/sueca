import React from 'react';
import { GameState, DealingMethod } from '../types/game';
import { PenteVisualization } from './PenteVisualization';
import { useLanguage } from '../i18n/useLanguage';
import './GameBoard.css';

interface GameOverModalProps {
  gameState: GameState;
  usTeam: 1 | 2;
  themTeam: 1 | 2;
  dealingMethod: DealingMethod;
  getTeamName: (team: 1 | 2) => string;
  onDealingMethodChange: (method: DealingMethod) => void;
  onNewGame: () => void;
}

/**
 * Modal displayed when the game ends
 * Shows final scores and allows starting a new game
 */
export const GameOverModal: React.FC<GameOverModalProps> = ({
  gameState,
  usTeam,
  themTeam,
  dealingMethod,
  getTeamName,
  onDealingMethodChange,
  onNewGame
}) => {
  const { t } = useLanguage();
  return (
    <div className="modal-overlay modal-overlay-game-over">
      <div className="modal-container modal-container-large">
        <h2 className="modal-title modal-title-large">{t.modals.gamesComplete}</h2>
        <p className="modal-winner-text">
          {getTeamName(gameState.winner!)} {t.modals.won}
        </p>
        
        <div className="modal-content">
          <p className="modal-section-title">{t.modals.finalGames}</p>
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
        
        <div className="modal-new-game-options">
          <label className="modal-select-label">
            <strong>{t.modals.dealingMethodNext}</strong>
            <select
              value={dealingMethod}
              onChange={(e) => onDealingMethodChange(e.target.value as DealingMethod)}
              className="modal-select"
            >
              <option value="A">{t.startMenu.methodA}</option>
              <option value="B">{t.startMenu.methodB}</option>
            </select>
          </label>
        </div>
        
        <button
          onClick={onNewGame}
          className="modal-button modal-button-new-game"
        >
          {t.modals.newGame}
        </button>
      </div>
    </div>
  );
};
