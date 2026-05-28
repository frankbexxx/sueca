import React from 'react';
import { GameState } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
import { getSpadesState } from '../models/games/SpadesGame';

interface TeamScoreBlockProps {
  gameState: GameState;
  variant: 'sueca' | 'spades';
  team: 'us' | 'them';
  usTeam: number;
  themTeam: number;
}

export const TeamScoreBlock: React.FC<TeamScoreBlockProps> = ({
  gameState,
  variant,
  team,
  usTeam,
  themTeam
}) => {
  const { t } = useLanguage();
  const isUs = team === 'us';
  const teamNum = isUs ? usTeam : themTeam;
  const scoreKey = teamNum === 1 ? 'team1' : 'team2';

  if (variant === 'spades') {
    const spades = getSpadesState(gameState);
    const bid = teamNum === 1 ? spades.team1Bid : spades.team2Bid;
    return (
      <div className={`score-block ${isUs ? 'us' : 'them'}`}>
        <div className="label">{isUs ? t.gameBoard.us : t.gameBoard.them}</div>
        <div className="line">Bid: {bid ?? 0}</div>
        <div className="line">Score: {gameState.gameScore[scoreKey]}</div>
      </div>
    );
  }

  return (
    <div className={`score-block ${isUs ? 'us' : 'them'}`}>
      <div className="label">{isUs ? t.gameBoard.us : t.gameBoard.them}</div>
      <div className="line">
        {t.gameBoard.points} {gameState.scores[scoreKey]}
      </div>
      <div className="line">
        {t.gameBoard.games} {gameState.gameScore[scoreKey]}
      </div>
    </div>
  );
};
