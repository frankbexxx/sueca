import React from 'react';
import { GameState, GameVariant } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
interface GameScoresProps {
  gameState: GameState;
  variant: GameVariant;
  usTeam: number;
  themTeam: number;
}

export const GameScores: React.FC<GameScoresProps> = ({ gameState, variant, usTeam, themTeam }) => {
  const { t } = useLanguage();

  const renderSuecaScores = () => (
    <>
      <div className="score-block us">
        <div className="label">{t.gameBoard.us}</div>
        <div className="line">
          {t.gameBoard.points} {gameState.scores[usTeam === 1 ? 'team1' : 'team2']}
        </div>
        <div className="line">
          {t.gameBoard.games} {gameState.gameScore[usTeam === 1 ? 'team1' : 'team2']}
        </div>
      </div>
      <div className="score-block them">
        <div className="label">{t.gameBoard.them}</div>
        <div className="line">
          {t.gameBoard.points} {gameState.scores[themTeam === 1 ? 'team1' : 'team2']}
        </div>
        <div className="line">
          {t.gameBoard.games} {gameState.gameScore[themTeam === 1 ? 'team1' : 'team2']}
        </div>
      </div>
    </>
  );

  const renderSpadesScores = () => {
    const spades = gameState.variantState?.spades as
      | { team1Bid?: number; team2Bid?: number; playerBids?: number[] }
      | undefined;
    return (
      <>
        <div className="score-block us">
          <div className="label">{t.gameBoard.us}</div>
          <div className="line">Bid: {spades?.team1Bid ?? 0}</div>
          <div className="line">Score: {gameState.gameScore[usTeam === 1 ? 'team1' : 'team2']}</div>
        </div>
        <div className="score-block them">
          <div className="label">{t.gameBoard.them}</div>
          <div className="line">Bid: {spades?.team2Bid ?? 0}</div>
          <div className="line">Score: {gameState.gameScore[themTeam === 1 ? 'team1' : 'team2']}</div>
        </div>
      </>
    );
  };

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
    case 'sueca':
      return <div className="game-scores">{renderSuecaScores()}</div>;
    case 'spades':
      return <div className="game-scores">{renderSpadesScores()}</div>;
    case 'hearts':
      return <div className="game-scores">{renderIndividualScores('Hearts')}</div>;
    case 'king':
      return <div className="game-scores">{renderIndividualScores('King')}</div>;
    default:
      return <div className="game-scores">{renderSuecaScores()}</div>;
  }
};
