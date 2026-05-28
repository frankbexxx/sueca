import React from 'react';
import { GameState, GameVariant } from '../types/game';
import { PenteVisualization } from './PenteVisualization';
import { useLanguage } from '../i18n/useLanguage';
import './GameBoard.css';

interface RoundEndModalProps {
  gameState: GameState;
  variant: GameVariant;
  usTeam: 1 | 2;
  themTeam: 1 | 2;
  localPlayerIndex: number;
  onContinue: () => void;
}

function getKingRoundScores(gameState: GameState): {
  roundPts: number[];
  totals: number[];
} {
  const kingPt = gameState.variantState?.kingPt as
    | { playerScores?: number[]; lastRoundDeltas?: number[] }
    | undefined;
  const kingSimple = gameState.variantState?.kingSimplified as { playerScores?: number[] } | undefined;

  if (kingPt) {
    return {
      roundPts: kingPt.lastRoundDeltas ?? [0, 0, 0, 0],
      totals: kingPt.playerScores ?? [0, 0, 0, 0]
    };
  }

  return {
    roundPts: [0, 0, 0, 0],
    totals: kingSimple?.playerScores ?? [0, 0, 0, 0]
  };
}

function IndividualRoundEndModal({
  gameState,
  localPlayerIndex,
  title,
  roundSectionTitle,
  totalSectionTitle,
  roundPts,
  totals,
  onContinue,
  continueLabel
}: {
  gameState: GameState;
  localPlayerIndex: number;
  title: string;
  roundSectionTitle: string | null;
  totalSectionTitle: string;
  roundPts: number[];
  totals: number[];
  onContinue: () => void;
  continueLabel: string;
}) {
  const formatRoundDelta = (value: number) => (value > 0 ? `+${value}` : `${value}`);

  return (
    <div className="modal-overlay modal-overlay-round-end">
      <div className="modal-container modal-container-large shell-panel modal-container--flat">
        <h2 className="modal-title">{title}</h2>
        {roundSectionTitle && (
          <>
            <p className="modal-section-title">{roundSectionTitle}</p>
            <ul className="hearts-modal-scores">
              {gameState.players.map((player, index) => (
                <li
                  key={`round-${player.id}`}
                  className={`hearts-modal-score-row${index === localPlayerIndex ? ' hearts-modal-score-row--you' : ''}`}
                >
                  <span>{player.name}</span>
                  <span>{formatRoundDelta(roundPts[index] ?? 0)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="modal-section-title">{totalSectionTitle}</p>
        <ul className="hearts-modal-scores">
          {gameState.players.map((player, index) => (
            <li
              key={`total-${player.id}`}
              className={`hearts-modal-score-row${index === localPlayerIndex ? ' hearts-modal-score-row--you' : ''}`}
            >
              <span>{player.name}</span>
              <span>{totals[index] ?? 0}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onContinue}
          className="sueca-btn sueca-btn--primary sueca-btn--block modal-button-primary"
        >
          {continueLabel}
        </button>
      </div>
    </div>
  );
}

export const RoundEndModal: React.FC<RoundEndModalProps> = ({
  gameState,
  variant,
  usTeam,
  themTeam,
  localPlayerIndex,
  onContinue
}) => {
  const { t, tReplace } = useLanguage();
  const continueLabel = tReplace('modals.continueToGame', { nextRound: gameState.round + 1 });

  if (variant === 'hearts') {
    const hearts = gameState.variantState?.hearts as
      | { playerScores?: number[]; roundPoints?: number[] }
      | undefined;
    const totals = hearts?.playerScores ?? [0, 0, 0, 0];
    const roundPts = hearts?.roundPoints ?? [0, 0, 0, 0];

    return (
      <IndividualRoundEndModal
        gameState={gameState}
        localPlayerIndex={localPlayerIndex}
        title={t.modals.heartsRoundTitle}
        roundSectionTitle={t.modals.heartsRoundPoints}
        totalSectionTitle={t.modals.heartsTotalScores}
        roundPts={roundPts}
        totals={totals}
        onContinue={onContinue}
        continueLabel={continueLabel}
      />
    );
  }

  if (variant === 'king') {
    const { roundPts, totals } = getKingRoundScores(gameState);
    const hasRoundDeltas = roundPts.some((value) => value !== 0);

    return (
      <IndividualRoundEndModal
        gameState={gameState}
        localPlayerIndex={localPlayerIndex}
        title={tReplace('modals.roundComplete', { round: gameState.round })}
        roundSectionTitle={hasRoundDeltas ? t.modals.gamePoints : null}
        totalSectionTitle={t.modals.heartsTotalScores}
        roundPts={roundPts}
        totals={totals}
        onContinue={onContinue}
        continueLabel={continueLabel}
      />
    );
  }

  if (variant !== 'sueca' && variant !== 'spades') {
    return null;
  }

  return (
    <div className="modal-overlay modal-overlay-round-end">
      <div className="modal-container modal-container-large dobo-panel">
        <h2 className="modal-title">{tReplace('modals.roundComplete', { round: gameState.round })}</h2>

        <div className="modal-content">
          <p className="modal-section-title">{t.modals.gamePoints}</p>
          <div className="modal-scores-grid">
            <div className="modal-score-box modal-score-us">
              <strong className="modal-score-label">{t.gameBoard.us}</strong>
              <p className="modal-score-value">
                {gameState.scores[usTeam === 1 ? 'team1' : 'team2']}{' '}
                {t.gameBoard.points.toLowerCase().replace(':', '')}
              </p>
            </div>
            <div className="modal-score-box modal-score-them">
              <strong className="modal-score-label">{t.gameBoard.them}</strong>
              <p className="modal-score-value">
                {gameState.scores[themTeam === 1 ? 'team1' : 'team2']}{' '}
                {t.gameBoard.points.toLowerCase().replace(':', '')}
              </p>
            </div>
          </div>

          <div className="modal-games-section">
            <p className="modal-section-title">{t.modals.games}</p>
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
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="modal-button modal-button-primary dobo-btn"
        >
          {continueLabel}
        </button>
      </div>
    </div>
  );
};
