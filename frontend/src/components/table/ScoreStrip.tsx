import React from 'react';
import { GameState, GameVariant } from '../../types/game';
import { GameScores } from '../GameScores';
import { GameInfo } from '../GameInfo';
import { useLanguage } from '../../i18n/useLanguage';

export interface ScoreStripProps {
  gameState: GameState;
  variant: GameVariant;
  usTeam: 1 | 2;
  themTeam: 1 | 2;
}

export const ScoreStrip: React.FC<ScoreStripProps> = ({ gameState, variant, usTeam, themTeam }) => {
  const { t } = useLanguage();
  return (
    <div className="top-strip">
      <GameScores gameState={gameState} variant={variant} usTeam={usTeam} themTeam={themTeam} />
      <div className="round-block">
        <div>
          {t.gameBoard.game} {gameState.round}
        </div>
        <GameInfo gameState={gameState} variant={variant} />
      </div>
    </div>
  );
};
