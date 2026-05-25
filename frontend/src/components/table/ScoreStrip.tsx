import React from 'react';
import { GameState, GameVariant } from '../../types/game';
import { GameScores } from '../GameScores';
import { GameInfo } from '../GameInfo';
import { UnifiedGameStatusPanel } from './UnifiedGameStatusPanel';
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

  if (variant === 'king' || variant === 'hearts') {
    return (
      <UnifiedGameStatusPanel
        gameState={gameState}
        variant={variant}
        rulesPresetId={rulesPresetId}
      />
    );
  }

  return (
    <div className="top-strip">
      <GameScores gameState={gameState} variant={variant} usTeam={usTeam} themTeam={themTeam} />
      <div className="round-block">
        <div>{t.gameBoard.game} {gameState.round}</div>
        <GameInfo gameState={gameState} variant={variant} rulesPresetId={rulesPresetId} />
      </div>
    </div>
  );
};
