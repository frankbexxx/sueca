import React, { useEffect, useState } from 'react';
import { Card, GameState } from '../types/game';
import { getKingPtState } from '../models/games/KingPtGame';
import { getTablePositionForPlayer } from '../utils/tableLayout';
import { handleCardImageError } from '../utils/cardImageError';
import { isKingSyntheticSession } from '../models/games/king/kingSyntheticMode';
import { useLanguage } from '../i18n/useLanguage';
import {
  kingHudMatchProgress,
  kingSyntheticHudSubtitle,
  kingSyntheticProductName
} from '../models/games/king/kingContracts';
import './VariantModals.css';

const KOH_DEAL_MS = 480;

interface KingKohRevealModalProps {
  gameState: GameState;
  getCardImage: (card: Card) => string;
  onNext: () => void;
  onConfirm: () => void;
  /** Seat orientation relative to local player (matches live table). */
  localPlayerIndex?: number;
}

export const KingKohRevealModal: React.FC<KingKohRevealModalProps> = ({
  gameState,
  getCardImage,
  onNext,
  onConfirm,
  localPlayerIndex = 0
}) => {
  const { t, language } = useLanguage();
  const locale = language === 'en' ? 'en' : 'pt';
  const king = getKingPtState(gameState);
  const reveal = king.kohReveal;
  const [dealing, setDealing] = useState(false);
  const syntheticSession = isKingSyntheticSession(gameState);
  const syntheticHeadline = syntheticSession
    ? `${kingSyntheticProductName(locale)} — ${kingHudMatchProgress(0, locale, {
        syntheticSession: true
      })}`
    : null;
  const syntheticSub = syntheticSession ? kingSyntheticHudSubtitle(locale) : null;

  const current = reveal?.sequence[reveal.step];
  const isLast = reveal ? reveal.step >= reveal.sequence.length - 1 : false;
  const winner = reveal ? gameState.players[reveal.winnerIndex] : undefined;

  const piles: Record<number, { card: Card; count: number }> = {};
  if (reveal) {
    for (let i = 0; i <= reveal.step; i++) {
      const entry = reveal.sequence[i];
      if (!entry) continue;
      const prev = piles[entry.playerIndex];
      piles[entry.playerIndex] = { card: entry.card, count: (prev?.count ?? 0) + 1 };
    }
  }

  useEffect(() => {
    if (!reveal || !dealing || isLast || gameState.isPaused) return;
    const timer = window.setTimeout(() => {
      if (gameState.isPaused) return;
      onNext();
    }, KOH_DEAL_MS);
    return () => window.clearTimeout(timer);
  }, [reveal, dealing, isLast, onNext, gameState.isPaused]);

  if (!reveal) return null;

  return (
    <div className="king-koh-overlay">
      <div className="king-koh-table">
        {gameState.players.map((player, index) => {
          const position = getTablePositionForPlayer(index, localPlayerIndex);
          const pile = piles[index];
          return (
            <div key={player.id} className={`king-koh-seat king-koh-seat-${position}`}>
              <span className="king-koh-seat-name">{player.name}</span>
              {pile && (
                <div className="king-koh-pile">
                  <img
                    src={getCardImage(pile.card)}
                    alt=""
                    className={`king-koh-card-img${current?.playerIndex === index && !isLast ? ' king-koh-card-img--latest' : ''}`}
                    draggable={false}
                    onError={(event) => handleCardImageError(event, 'king-koh-pile')}
                  />
                  {pile.count > 1 && <span className="king-koh-pile-count">{pile.count}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="king-koh-controls">
        <h2>{syntheticHeadline ?? t.kingKoh.title}</h2>
        {syntheticSub ? (
          <p className="variant-modal-hint">{syntheticSub}</p>
        ) : null}
        {!syntheticSession && !dealing && !isLast && (
          <p className="variant-modal-hint">
            {t.kingKoh.firstPlayerAuto(gameState.players[reveal.startPlayerIndex]?.name ?? '')}
          </p>
        )}
        {syntheticSession && !dealing && !isLast && (
          <p className="variant-modal-hint">
            {t.kingKoh.syntheticFirstPlayer(gameState.players[reveal.startPlayerIndex]?.name ?? '')}
          </p>
        )}
        {dealing && !isLast && current && (
          <p className="variant-modal-hint king-koh-dealing">
            {t.kingKoh.receivingCard(gameState.players[current.playerIndex]?.name ?? '')}
          </p>
        )}
        {isLast && (
          <p className="variant-modal-hint king-koh-winner">
            {t.kingKoh.winnerFesta(winner?.name ?? '')}
          </p>
        )}
        {!dealing && !isLast && (
          <button type="button" className="sueca-btn sueca-btn--primary" onClick={() => setDealing(true)}>
            {t.kingKoh.startDraw}
          </button>
        )}
        {isLast && (
          <button type="button" className="sueca-btn sueca-btn--primary" onClick={onConfirm}>
            {syntheticSession ? t.kingKoh.startHand : t.kingKoh.startMatch}
          </button>
        )}
      </div>
    </div>
  );
};
