import React from 'react';
import { GameState, DealingMethod } from '../types/game';
import { PenteVisualization } from './PenteVisualization';
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
  return (
    <div className="modal-overlay modal-overlay-game-over">
      <div className="modal-container modal-container-large">
        <h2 className="modal-title modal-title-large">🎉 Jogos Completos! 🎉</h2>
        <p className="modal-winner-text">
          {getTeamName(gameState.winner!)} Venceu!
        </p>
        
        <div className="modal-content">
          <p className="modal-section-title">Jogos Finais:</p>
          <div className="modal-games-content">
            <PenteVisualization
              team1Score={gameState.gameScore[usTeam === 1 ? 'team1' : 'team2']}
              team2Score={gameState.gameScore[themTeam === 1 ? 'team1' : 'team2']}
              team1Name="US"
              team2Name="THEM"
              pentes={gameState.completedPentes.map(pente => ({
                team1: usTeam === 1 ? pente.team1 : pente.team2,
                team2: themTeam === 1 ? pente.team1 : pente.team2
              }))}
            />
          </div>
        </div>
        
        <div className="modal-new-game-options">
          <label className="modal-select-label">
            <strong>Dealing Method for Next Game:</strong>
            <select
              value={dealingMethod}
              onChange={(e) => onDealingMethodChange(e.target.value as DealingMethod)}
              className="modal-select"
            >
              <option value="A">Method A (Standard)</option>
              <option value="B">Method B (Dealer First)</option>
            </select>
          </label>
        </div>
        
        <button
          onClick={onNewGame}
          className="modal-button modal-button-new-game"
        >
          Start New Game
        </button>
      </div>
    </div>
  );
};
