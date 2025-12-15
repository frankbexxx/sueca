import React from 'react';
import './PenteVisualization.css';

interface PenteVisualizationProps {
  team1Score: number; // 0-4
  team2Score: number; // 0-4
  team1Name: string;
  team2Name: string;
}

/**
 * Visualizes the pente (comb) score
 * Format:
 * US       __|__|__|__|__
 * THEM     |   |   |   |
 * Each filled position (●) represents 1 victory
 */
export const PenteVisualization: React.FC<PenteVisualizationProps> = ({
  team1Score,
  team2Score,
  team1Name,
  team2Name
}) => {
  const renderPenteLine = (score: number, isTop: boolean) => {
    const positions = [0, 1, 2, 3];
    return (
      <div className={`pente-line ${isTop ? 'pente-top' : 'pente-bottom'}`}>
        {positions.map((pos) => {
          const isFilled = score > pos;
          return (
            <React.Fragment key={pos}>
              {isTop ? (
                // Top line: horizontal bar (__ or ●) with vertical separator
                <>
                  <span className="pente-bar">{isFilled ? '●' : '__'}</span>
                  {pos < 3 && <span className="pente-separator">|</span>}
                </>
              ) : (
                // Bottom line: vertical separator only (aligned with separators above)
                <>
                  <span className="pente-bar">{isFilled ? '●' : ' '}</span>
                  {pos < 3 && <span className="pente-separator">|</span>}
                </>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="pente-container">
      <div className="pente-label">{team1Name}</div>
      {renderPenteLine(team1Score, true)}
      {renderPenteLine(team2Score, false)}
      <div className="pente-label">{team2Name}</div>
    </div>
  );
};

