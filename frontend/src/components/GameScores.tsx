import React from 'react';
import { GameState } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
import { getSpadesState } from '../models/games/SpadesGame';
import { getTeamBags, isBagsNearPenalty } from '../utils/spadesStatusDisplay';

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
  const teamNum = (isUs ? usTeam : themTeam) as 1 | 2;
  const scoreKey = teamNum === 1 ? 'team1' : 'team2';

  if (variant === 'spades') {
    const spades = getSpadesState(gameState);
    const bid = teamNum === 1 ? spades.team1Bid : spades.team2Bid;
    const bags = getTeamBags(spades, teamNum);
    const bagsWarn = isBagsNearPenalty(bags);
    return (
      <div className={`score-block ${isUs ? 'us' : 'them'}`}>
        <div className="label">{isUs ? t.gameBoard.us : t.gameBoard.them}</div>
        <div className="line">Bid: {bid ?? 0}</div>
        <div className="line">Score: {gameState.gameScore[scoreKey]}</div>
        <div
          className={`line spades-bags${bagsWarn ? ' spades-bags--warn' : ''}`}
          aria-label={t.spadesStatus.bagsLine(bags)}
        >
          {t.spadesStatus.bagsLine(bags)}
        </div>
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
