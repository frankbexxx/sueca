import React from 'react';
import { GameState, GameVariant } from '../../types/game';
import { GameInfo } from '../GameInfo';
import { TeamScoreBlock } from '../GameScores';
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

  const teamVariant = variant === 'spades' ? 'spades' : 'sueca';

  return (
    <div className="top-strip top-strip--teams">
      <TeamScoreBlock
        gameState={gameState}
        variant={teamVariant}
        team="us"
        usTeam={usTeam}
        themTeam={themTeam}
      />
      <div className="round-block round-block--center">
        <div className="round-block__game">
          {t.gameBoard.game} {gameState.round}
        </div>
        <GameInfo gameState={gameState} variant={variant} rulesPresetId={rulesPresetId} />
      </div>
      <TeamScoreBlock
        gameState={gameState}
        variant={teamVariant}
        team="them"
        usTeam={usTeam}
        themTeam={themTeam}
      />
    </div>
  );
};
