import { getHeartsState } from '../models/games/HeartsGame';
import React from 'react';
import { GameState, GameVariant } from '../types/game';
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
      <div className="modal-container modal-container-large dobo-panel">
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
    const hearts = getHeartsState(gameState);
    const totals = hearts.playerScores;
    const roundPts = hearts.roundPoints;

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

  const usScore = gameState.scores[usTeam === 1 ? 'team1' : 'team2'];
  const themScore = gameState.scores[themTeam === 1 ? 'team1' : 'team2'];
  const usGames = gameState.gameScore[usTeam === 1 ? 'team1' : 'team2'];
  const themGames = gameState.gameScore[themTeam === 1 ? 'team1' : 'team2'];
  const pts = t.gameBoard.points.toLowerCase().replace(':', '');
  const isSpades = variant === 'spades';

  return (
    <div className="modal-overlay modal-overlay-round-end">
      <div className="modal-container modal-container-large dobo-panel">
        <h2 className="modal-title">{tReplace('modals.roundComplete', { round: gameState.round })}</h2>

        <p className="modal-section-title">{t.modals.gamePoints}</p>
        <ul className="hearts-modal-scores">
          <li className="hearts-modal-score-row">
            <span>{t.gameBoard.us}</span>
            <span>{usScore} {pts}</span>
          </li>
          <li className="hearts-modal-score-row">
            <span>{t.gameBoard.them}</span>
            <span>{themScore} {pts}</span>
          </li>
        </ul>

        <p className="modal-section-title">
          {isSpades ? t.modals.heartsTotalScores : t.modals.games}
        </p>
        <ul className="hearts-modal-scores">
          <li className="hearts-modal-score-row">
            <span>{t.gameBoard.us}</span>
            <span>{isSpades ? usGames : `${usGames}/4`}</span>
          </li>
          <li className="hearts-modal-score-row">
            <span>{t.gameBoard.them}</span>
            <span>{isSpades ? themGames : `${themGames}/4`}</span>
          </li>
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
};
