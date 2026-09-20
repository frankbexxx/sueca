import React from 'react';
import { useLanguage } from '../i18n/useLanguage';
import './PenteVisualization.css';

interface PenteVisualizationProps {
  team1Score: number; // 0-4
  team2Score: number; // 0-4
  team1Name: string;
  team2Name: string;
  // Optional: support for multiple pentes
  pentes?: Array<{ team1: number; team2: number }>; // Array of completed pentes
}

/**
 * Simple visualization of games (victories) score
 * Shows only text-based score tracking - no complex SVG structure
 * Compatible with mobile/Android
 *
 * Team colours are game-semantic Us/Them (fixed), not theme accent /
 * legacy purple.
 */
export const PenteVisualization: React.FC<PenteVisualizationProps> = ({
  team1Score,
  team2Score,
  team1Name,
  team2Name,
  pentes = []
}) => {
  const { t } = useLanguage();
  
  // Calculate total victories including completed pentes
  const totalTeam1Victories = pentes.reduce((sum, p) => sum + p.team1, 0) + team1Score;
  const totalTeam2Victories = pentes.reduce((sum, p) => sum + p.team2, 0) + team2Score;

  return (
    <div className="pente-container-simple">
      {/* Current Games Score */}
      <div className="pente-score-section">
        <div className="pente-score-item">
          <span className="pente-team-label pente-team--us">{team1Name}:</span>
          <span className="pente-score-value pente-team--us">
            {team1Score}/4
          </span>
        </div>
        <div className="pente-score-item">
          <span className="pente-team-label pente-team--them">{team2Name}:</span>
          <span className="pente-score-value pente-team--them">
            {team2Score}/4
          </span>
        </div>
      </div>

      {/* Total Victories (if there are completed pentes) */}
      {pentes.length > 0 && (
        <div className="pente-total-section">
          <div className="pente-total-label">{t.pente.totalVictories}</div>
          <div className="pente-total-scores">
            <div className="pente-total-item">
              <span className="pente-team-label pente-team--us">{team1Name}:</span>
              <span className="pente-total-value pente-team--us">
                {totalTeam1Victories}
              </span>
            </div>
            <div className="pente-total-item">
              <span className="pente-team-label pente-team--them">{team2Name}:</span>
              <span className="pente-total-value pente-team--them">
                {totalTeam2Victories}
              </span>
            </div>
          </div>
          {pentes.length > 0 && (
            <div className="pente-completed-info">
              {t.pente.gamesComplete(pentes.length)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
