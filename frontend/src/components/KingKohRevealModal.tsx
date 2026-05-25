import React, { useEffect, useState } from 'react';
import { Card, GameState } from '../types/game';
import { getKingPtState } from '../models/games/KingPtGame';
import { getTablePosition } from '../utils/tableLayout';
import './VariantModals.css';

const KOH_DEAL_MS = 480;

interface KingKohRevealModalProps {
  gameState: GameState;
  getCardImage: (card: Card) => string;
  onNext: () => void;
  onConfirm: () => void;
}

export const KingKohRevealModal: React.FC<KingKohRevealModalProps> = ({
  gameState,
  getCardImage,
  onNext,
  onConfirm
}) => {
  const king = getKingPtState(gameState);
  const reveal = king.kohReveal;
  const [dealing, setDealing] = useState(false);

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
    if (!reveal || !dealing || isLast) return;
    const timer = window.setTimeout(() => onNext(), KOH_DEAL_MS);
    return () => window.clearTimeout(timer);
  }, [reveal, dealing, isLast, onNext]);

  if (!reveal) return null;

  return (
    <div className="king-koh-overlay">
      <div className="king-koh-table">
        {gameState.players.map((player, index) => {
          const position = getTablePosition(index);
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
                  />
                  {pile.count > 1 && <span className="king-koh-pile-count">{pile.count}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="king-koh-controls dobo-panel">
        <h2>Viragem do Rei de Copas</h2>
        {!dealing && !isLast && (
          <p className="variant-modal-hint">
            Primeiro jogador: {gameState.players[reveal.startPlayerIndex]?.name}. Viragem automática até sair o K♥.
          </p>
        )}
        {dealing && !isLast && current && (
          <p className="variant-modal-hint king-koh-dealing">
            {gameState.players[current.playerIndex]?.name} recebe uma carta…
          </p>
        )}
        {isLast && (
          <p className="variant-modal-hint king-koh-winner">
            {winner?.name} tirou o Rei de Copas — dono da 1.ª festa.
          </p>
        )}
        {!dealing && !isLast && (
          <button type="button" className="variant-modal-primary dobo-btn" onClick={() => setDealing(true)}>
            Iniciar viragem
          </button>
        )}
        {isLast && (
          <button type="button" className="variant-modal-primary dobo-btn" onClick={onConfirm}>
            Começar partida
          </button>
        )}
      </div>
    </div>
  );
};
