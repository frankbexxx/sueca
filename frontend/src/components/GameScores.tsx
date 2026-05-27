import React from 'react';
import { GameState, GameVariant } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';

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
    const spades = gameState.variantState?.spades as
      | { team1Bid?: number; team2Bid?: number }
      | undefined;
    const bid = teamNum === 1 ? spades?.team1Bid : spades?.team2Bid;
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

interface GameScoresProps {
  gameState: GameState;
  variant: GameVariant;
  usTeam: number;
  themTeam: number;
}

export const GameScores: React.FC<GameScoresProps> = ({ gameState, variant, usTeam, themTeam }) => {
  const renderIndividualScores = (label: string) => {
    const kingPt = gameState.variantState?.kingPt as { playerScores?: number[] } | undefined;
    const kingSimple = gameState.variantState?.kingSimplified as { playerScores?: number[] } | undefined;
    const hearts = gameState.variantState?.hearts as { playerScores?: number[] } | undefined;
    const scores =
      variant === 'hearts'
        ? hearts?.playerScores
        : kingPt?.playerScores ?? kingSimple?.playerScores ?? [0, 0, 0, 0];

    return (
      <div className="score-block-individual">
        <div className="label">{label}</div>
        {gameState.players.map((player, index) => (
          <div key={player.id} className="line">
            {player.name}: {scores?.[index] ?? 0}
          </div>
        ))}
      </div>
    );
  };

  switch (variant) {
    case 'hearts':
      return <div className="game-scores">{renderIndividualScores('Hearts')}</div>;
    case 'king':
      return <div className="game-scores">{renderIndividualScores('King')}</div>;
    default:
      return (
        <div className="game-scores game-scores--teams">
          <TeamScoreBlock
            gameState={gameState}
            variant="sueca"
            team="us"
            usTeam={usTeam}
            themTeam={themTeam}
          />
          <TeamScoreBlock
            gameState={gameState}
            variant="sueca"
            team="them"
            usTeam={usTeam}
            themTeam={themTeam}
          />
        </div>
      );
  }
};
