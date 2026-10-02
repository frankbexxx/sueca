import React from 'react';
import { getHeartsState } from '../models/games/HeartsGame';
import { modalFocusFromMatchResult } from '../models/matchResult';
import { GameState, GameVariant } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
import './GameBoard.css';

interface GameOverModalProps {
  gameState: GameState;
  variant: GameVariant;
  usTeam: 1 | 2;
  themTeam: 1 | 2;
  localPlayerIndex: number;
  getTeamName: (team: 1 | 2) => string;
  onNewGame: () => void;
}

function getIndividualFinalScores(gameState: GameState, variant: 'hearts' | 'king'): number[] {
  if (variant === 'hearts') {
    return getHeartsState(gameState).playerScores;
  }

  const kingPt = gameState.variantState?.kingPt as { playerScores?: number[] } | undefined;
  return kingPt?.playerScores ?? [0, 0, 0, 0];
}

function IndividualGameOverModal({
  gameState,
  localPlayerIndex,
  title,
  winnerName,
  loserName,
  showLoser,
  scoresLabel,
  scores,
  winnerSeats,
  onNewGame,
  newGameLabel
}: {
  gameState: GameState;
  localPlayerIndex: number;
  title: string;
  winnerName: string;
  loserName: string;
  showLoser: boolean;
  scoresLabel: string;
  scores: number[];
  winnerSeats: number[];
  onNewGame: () => void;
  newGameLabel: string;
}) {
  return (
    <div className="modal-overlay modal-overlay-game-over">
      <div className="modal-container modal-container-large">
        <h2 className="modal-title modal-title-large">{title}</h2>
        <p className="modal-winner-text">{winnerName}</p>
        {showLoser && <p className="modal-section-title">{loserName}</p>}
        <p className="modal-section-title">{scoresLabel}</p>
        <ul className="hearts-modal-scores">
          {gameState.players.map((player, index) => (
            <li
              key={player.id}
              className={`hearts-modal-score-row${index === localPlayerIndex ? ' hearts-modal-score-row--you' : ''}${
                winnerSeats.includes(index) ? ' hearts-modal-score-row--winner' : ''
              }`}
            >
              <span>{player.name}</span>
              <span>{scores[index] ?? 0}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onNewGame}
          className="sueca-btn sueca-btn--primary sueca-btn--block modal-button-new-game"
        >
          {newGameLabel}
        </button>
      </div>
    </div>
  );
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  gameState,
  variant,
  usTeam,
  themTeam,
  localPlayerIndex,
  getTeamName,
  onNewGame
}) => {
  const { t } = useLanguage();

  if (variant === 'hearts') {
    const scores = getIndividualFinalScores(gameState, 'hearts');
    const focus = modalFocusFromMatchResult(gameState.matchResult);
    const maxScore = Math.max(...scores);
    const loserIndex = scores.indexOf(maxScore);
    const uniqueSeat = !focus.draw && focus.winnerSeats.length === 1 ? focus.winnerSeats[0] : null;
    const winnerName =
      uniqueSeat != null
        ? t.modals.heartsWinner(gameState.players[uniqueSeat]?.name ?? 'Player')
        : focus.draw
          ? t.modals.resultTie
          : '';
    const loserName = gameState.players[loserIndex]?.name ?? 'Player';

    return (
      <IndividualGameOverModal
        gameState={gameState}
        localPlayerIndex={localPlayerIndex}
        title={t.modals.heartsGameOverTitle}
        winnerName={winnerName}
        loserName={t.modals.heartsLoser(loserName)}
        showLoser={loserIndex >= 0 && !focus.winnerSeats.includes(loserIndex)}
        scoresLabel={t.modals.heartsFinalScores}
        scores={scores}
        winnerSeats={focus.winnerSeats}
        onNewGame={onNewGame}
        newGameLabel={t.modals.newGame}
      />
    );
  }

  if (variant === 'king') {
    const scores = getIndividualFinalScores(gameState, 'king');
    const focus = modalFocusFromMatchResult(gameState.matchResult);
    const uniqueSeat = !focus.draw && focus.winnerSeats.length === 1 ? focus.winnerSeats[0] : null;
    const winnerName =
      uniqueSeat != null
        ? `${gameState.players[uniqueSeat]?.name ?? 'Player'} ${t.modals.won}`
        : focus.draw
          ? t.modals.resultTie
          : '';

    return (
      <IndividualGameOverModal
        gameState={gameState}
        localPlayerIndex={localPlayerIndex}
        title={t.modals.gamesComplete}
        winnerName={winnerName}
        loserName=""
        showLoser={false}
        scoresLabel={t.modals.heartsFinalScores}
        scores={scores}
        winnerSeats={focus.winnerSeats}
        onNewGame={onNewGame}
        newGameLabel={t.modals.newGame}
      />
    );
  }

  if (variant !== 'sueca' && variant !== 'spades') {
    return null;
  }

  const usGames = gameState.gameScore[usTeam === 1 ? 'team1' : 'team2'];
  const themGames = gameState.gameScore[themTeam === 1 ? 'team1' : 'team2'];
  const isSpades = variant === 'spades';
  const pts = t.gameBoard.points.toLowerCase().replace(':', '');

  const focus = modalFocusFromMatchResult(gameState.matchResult);
  const winningTeam = focus.winnerTeam;

  return (
    <div className="modal-overlay modal-overlay-game-over">
      <div className="modal-container modal-container-large">
        <h2 className="modal-title modal-title-large">
          {isSpades ? t.modals.heartsFinalScores : t.modals.gamesComplete}
        </h2>
        {winningTeam === 1 || winningTeam === 2 ? (
          <p className="modal-winner-text">
            {getTeamName(winningTeam)} {t.modals.won}
          </p>
        ) : null}

        <p className="modal-section-title">
          {isSpades ? t.modals.heartsTotalScores : t.modals.finalGames}
        </p>
        <ul className="hearts-modal-scores">
          <li
            className={`hearts-modal-score-row${
              winningTeam === usTeam ? ' hearts-modal-score-row--winner' : ''
            }`}
          >
            <span>{t.gameBoard.us}</span>
            <span>{isSpades ? `${usGames} ${pts}` : `${usGames}/4`}</span>
          </li>
          <li
            className={`hearts-modal-score-row${
              winningTeam === themTeam ? ' hearts-modal-score-row--winner' : ''
            }`}
          >
            <span>{t.gameBoard.them}</span>
            <span>{isSpades ? `${themGames} ${pts}` : `${themGames}/4`}</span>
          </li>
        </ul>

        <button
          type="button"
          onClick={onNewGame}
          className="sueca-btn sueca-btn--primary sueca-btn--block modal-button-new-game"
        >
          {t.modals.newGame}
        </button>
      </div>
    </div>
  );
};
