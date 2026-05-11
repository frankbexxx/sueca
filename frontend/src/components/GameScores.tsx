import React from 'react';
import { GameState, GameVariant } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';

interface GameScoresProps {
  gameState: GameState;
  variant: GameVariant;
  usTeam: number;
  themTeam: number;
}

/**
 * Generic game scores component that displays scores based on game variant
 * Adapts display format for different scoring systems
 */
export const GameScores: React.FC<GameScoresProps> = ({
  gameState,
  variant,
  usTeam,
  themTeam
}) => {
  const { t } = useLanguage();

  const renderSuecaScores = () => (
    <>
      <div className="score-block us">
        <div className="label">{t.gameBoard.us}</div>
        <div className="line">{t.gameBoard.points} {gameState.scores[usTeam === 1 ? 'team1' : 'team2']}</div>
        <div className="line">{t.gameBoard.games} {gameState.gameScore[usTeam === 1 ? 'team1' : 'team2']}</div>
      </div>
      <div className="score-block them">
        <div className="label">{t.gameBoard.them}</div>
        <div className="line">{t.gameBoard.points} {gameState.scores[themTeam === 1 ? 'team1' : 'team2']}</div>
        <div className="line">{t.gameBoard.games} {gameState.gameScore[themTeam === 1 ? 'team1' : 'team2']}</div>
      </div>
    </>
  );

  const renderSpadesScores = () => (
    <>
      <div className="score-block us">
        <div className="label">{t.gameBoard.us}</div>
        <div className="line">Bags: {gameState.scores[usTeam === 1 ? 'team1' : 'team2']}</div>
        <div className="line">Games: {gameState.gameScore[usTeam === 1 ? 'team1' : 'team2']}</div>
      </div>
      <div className="score-block them">
        <div className="label">{t.gameBoard.them}</div>
        <div className="line">Bags: {gameState.scores[themTeam === 1 ? 'team1' : 'team2']}</div>
        <div className="line">Games: {gameState.gameScore[themTeam === 1 ? 'team1' : 'team2']}</div>
      </div>
    </>
  );

  const renderHeartsScores = () => (
    <>
      <div className="score-block us">
        <div className="label">{t.gameBoard.us}</div>
        <div className="line">Hearts: {gameState.scores[usTeam === 1 ? 'team1' : 'team2']}</div>
        <div className="line">Games: {gameState.gameScore[usTeam === 1 ? 'team1' : 'team2']}</div>
      </div>
      <div className="score-block them">
        <div className="label">{t.gameBoard.them}</div>
        <div className="line">Hearts: {gameState.scores[themTeam === 1 ? 'team1' : 'team2']}</div>
        <div className="line">Games: {gameState.gameScore[themTeam === 1 ? 'team1' : 'team2']}</div>
      </div>
    </>
  );

  const renderKingScores = () => (
    <>
      <div className="score-block us">
        <div className="label">{t.gameBoard.us}</div>
        <div className="line">Tricks: {gameState.scores[usTeam === 1 ? 'team1' : 'team2']}</div>
        <div className="line">Games: {gameState.gameScore[usTeam === 1 ? 'team1' : 'team2']}</div>
      </div>
      <div className="score-block them">
        <div className="label">{t.gameBoard.them}</div>
        <div className="line">Tricks: {gameState.scores[themTeam === 1 ? 'team1' : 'team2']}</div>
        <div className="line">Games: {gameState.gameScore[themTeam === 1 ? 'team1' : 'team2']}</div>
      </div>
    </>
  );

  const renderScores = () => {
    switch (variant) {
      case 'sueca':
        return renderSuecaScores();
      case 'spades':
        return renderSpadesScores();
      case 'hearts':
        return renderHeartsScores();
      case 'king':
        return renderKingScores();
      default:
        return renderSuecaScores(); // fallback
    }
  };

  return (
    <div className="game-scores">
      {renderScores()}
    </div>
  );
};