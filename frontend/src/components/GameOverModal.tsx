import { getHeartsState } from '../models/games/HeartsGame';
import { GameState, DealingMethod, GameVariant } from '../types/game';
import { PenteVisualization } from './PenteVisualization';
import { useLanguage } from '../i18n/useLanguage';
import './GameBoard.css';

interface GameOverModalProps {
  gameState: GameState;
  variant: GameVariant;
  usTeam: 1 | 2;
  themTeam: 1 | 2;
  localPlayerIndex: number;
  dealingMethod: DealingMethod;
  getTeamName: (team: 1 | 2) => string;
  onDealingMethodChange: (method: DealingMethod) => void;
  onNewGame: () => void;
}

function getIndividualFinalScores(gameState: GameState, variant: 'hearts' | 'king'): number[] {
  if (variant === 'hearts') {
    return getHeartsState(gameState).playerScores;
  }

  const kingPt = gameState.variantState?.kingPt as { playerScores?: number[] } | undefined;
  const kingSimple = gameState.variantState?.kingSimplified as { playerScores?: number[] } | undefined;
  return kingPt?.playerScores ?? kingSimple?.playerScores ?? [0, 0, 0, 0];
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
  winnerIndex,
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
  winnerIndex: number;
  onNewGame: () => void;
  newGameLabel: string;
}) {
  return (
    <div className="modal-overlay modal-overlay-game-over">
      <div className="modal-container modal-container-large shell-panel modal-container--flat">
        <h2 className="modal-title modal-title-large">{title}</h2>
        <p className="modal-winner-text">{winnerName}</p>
        {showLoser && <p className="modal-section-title">{loserName}</p>}
        <p className="modal-section-title">{scoresLabel}</p>
        <ul className="hearts-modal-scores">
          {gameState.players.map((player, index) => (
            <li
              key={player.id}
              className={`hearts-modal-score-row${index === localPlayerIndex ? ' hearts-modal-score-row--you' : ''}${
                index === winnerIndex ? ' hearts-modal-score-row--winner' : ''
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
  dealingMethod,
  getTeamName,
  onDealingMethodChange,
  onNewGame
}) => {
  const { t } = useLanguage();

  if (variant === 'hearts') {
    const scores = getIndividualFinalScores(gameState, 'hearts');
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const winnerIndex = scores.indexOf(minScore);
    const loserIndex = scores.indexOf(maxScore);
    const winnerName = gameState.players[winnerIndex]?.name ?? 'Player';
    const loserName = gameState.players[loserIndex]?.name ?? 'Player';

    return (
      <IndividualGameOverModal
        gameState={gameState}
        localPlayerIndex={localPlayerIndex}
        title={t.modals.heartsGameOverTitle}
        winnerName={t.modals.heartsWinner(winnerName)}
        loserName={t.modals.heartsLoser(loserName)}
        showLoser={loserIndex !== winnerIndex}
        scoresLabel={t.modals.heartsFinalScores}
        scores={scores}
        winnerIndex={winnerIndex}
        onNewGame={onNewGame}
        newGameLabel={t.modals.newGame}
      />
    );
  }

  if (variant === 'king') {
    const scores = getIndividualFinalScores(gameState, 'king');
    const winnerIndex = scores.indexOf(Math.max(...scores));

    return (
      <IndividualGameOverModal
        gameState={gameState}
        localPlayerIndex={localPlayerIndex}
        title={t.modals.gamesComplete}
        winnerName={`${gameState.players[winnerIndex]?.name ?? 'Player'} ${t.modals.won}`}
        loserName=""
        showLoser={false}
        scoresLabel={t.modals.heartsFinalScores}
        scores={scores}
        winnerIndex={winnerIndex}
        onNewGame={onNewGame}
        newGameLabel={t.modals.newGame}
      />
    );
  }

  if (variant !== 'sueca' && variant !== 'spades') {
    return null;
  }

  return (
    <div className="modal-overlay modal-overlay-game-over">
      <div className="modal-container modal-container-large dobo-panel">
        <h2 className="modal-title modal-title-large">{t.modals.gamesComplete}</h2>
        <p className="modal-winner-text">
          {getTeamName(gameState.winner!)} {t.modals.won}
        </p>

        <div className="modal-content">
          <p className="modal-section-title">{t.modals.finalGames}</p>
          <div className="modal-games-content">
            <PenteVisualization
              team1Score={gameState.gameScore[usTeam === 1 ? 'team1' : 'team2']}
              team2Score={gameState.gameScore[themTeam === 1 ? 'team1' : 'team2']}
              team1Name={t.gameBoard.us}
              team2Name={t.gameBoard.them}
              pentes={gameState.completedPentes.map((pente) => ({
                team1: usTeam === 1 ? pente.team1 : pente.team2,
                team2: themTeam === 1 ? pente.team1 : pente.team2
              }))}
            />
          </div>
        </div>

        <div className="modal-new-game-options">
          <label className="modal-select-label">
            <strong>{t.modals.dealingMethodNext}</strong>
            <select
              value={dealingMethod}
              onChange={(e) => onDealingMethodChange(e.target.value as DealingMethod)}
              className="modal-select"
            >
              <option value="A">{t.startMenu.methodA}</option>
              <option value="B">{t.startMenu.methodB}</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={onNewGame}
          className="modal-button modal-button-new-game dobo-btn"
        >
          {t.modals.newGame}
        </button>
      </div>
    </div>
  );
};
