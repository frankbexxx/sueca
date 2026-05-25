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
  rulesPresetId?: string;
}

export const ScoreStrip: React.FC<ScoreStripProps> = ({
  gameState,
  variant,
  usTeam,
  themTeam,
  rulesPresetId
}) => {
  const { t } = useLanguage();
  const isKing = variant === 'king';
  return (
    <div className={`top-strip${isKing ? ' top-strip--king' : ''}`}>
      <GameScores gameState={gameState} variant={variant} usTeam={usTeam} themTeam={themTeam} />
      <div className={`round-block${isKing ? ' round-block--king' : ''}`}>
        {!isKing && <div>{t.gameBoard.game} {gameState.round}</div>}
        <GameInfo gameState={gameState} variant={variant} rulesPresetId={rulesPresetId} />
      </div>
    </div>
  );
};
