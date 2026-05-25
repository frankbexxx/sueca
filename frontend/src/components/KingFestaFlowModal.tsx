import React, { useState } from 'react';
import { GameState, Suit } from '../types/game';
import { getKingPtState } from '../models/games/KingPtGame';
import { KingBidType, KingFestaChoice } from '../models/games/king/kingContracts';
import { canUseFourThreeThree, formatBid } from '../models/games/king/kingAuction';
import './VariantModals.css';

const SUITS: { id: Suit; label: string }[] = [
  { id: 'clubs', label: '♣ Paus' },
  { id: 'diamonds', label: '♦ Ouros' },
  { id: 'hearts', label: '♥ Copas' },
  { id: 'spades', label: '♠ Espadas' }
];

interface KingFestaFlowModalProps {
  gameState: GameState;
  localPlayerIndex: number;
  onAuctionPass: () => void;
  onAuctionBid: (bidType: KingBidType, amount: number) => void;
  onAcceptContract: () => void;
  onRejectContract: () => void;
  onRequestHigherBid: (bidType: KingBidType, amount: number) => void;
  onRespondHigherBid: (raise: boolean, bidType?: KingBidType, amount?: number) => void;
  onEightOrNulls: () => void;
  onRespondEight: (offerEight: boolean) => void;
  onFallback: (choice: KingFestaChoice) => void;
  onSetup: (trump: Suit | null, noTrump: boolean, firstPlayer: number) => void;
}

export const KingFestaFlowModal: React.FC<KingFestaFlowModalProps> = ({
  gameState,
  localPlayerIndex,
  onAuctionPass,
  onAuctionBid,
  onAcceptContract,
  onRejectContract,
  onRequestHigherBid,
  onRespondHigherBid,
  onEightOrNulls,
  onRespondEight,
  onFallback,
  onSetup
}) => {
  const king = getKingPtState(gameState);
  const owner = gameState.players[king.festaOwnerIndex];
  const [bidType, setBidType] = useState<KingBidType>('positive');
  const [bidAmount, setBidAmount] = useState(3);
  const [setupTrump, setSetupTrump] = useState<Suit>('clubs');
  const [setupNoTrump, setSetupNoTrump] = useState(false);
  const [firstPlayer, setFirstPlayer] = useState(king.benefitOwnerIndex ?? king.festaOwnerIndex);
  const [showRaiseForm, setShowRaiseForm] = useState(false);
  const [raiseType, setRaiseType] = useState<KingBidType>('positive');
  const [raiseAmount, setRaiseAmount] = useState(5);

  const currentAuctionPlayer =
    king.festaPhase === 'auction'
      ? king.auctionOrder[king.auctionTurnIndex]
      : null;

  if (king.festaPhase === 'auction' && currentAuctionPlayer === localPlayerIndex) {
    return (
      <div className="variant-modal-overlay">
        <div className="variant-modal dobo-panel">
          <h2>Leilão · festa de {owner?.name}</h2>
          <p className="variant-modal-hint">
            {king.bestBid
              ? `Melhor oferta: ${formatBid(king.bestBid)} (${gameState.players[king.bestBid.bidderIndex]?.name})`
              : 'Ainda sem ofertas.'}
          </p>
          <div className="king-auction-bid-form">
            <label>
              Tipo
              <select value={bidType} onChange={(e) => setBidType(e.target.value as KingBidType)}>
                <option value="positive">Positivas</option>
                <option value="null">Nulos</option>
              </select>
            </label>
            <label>
              Quantidade
              <input
                type="number"
                min={1}
                max={bidType === 'positive' ? 8 : 4}
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="king-festa-actions">
            <button type="button" className="variant-modal-primary dobo-btn" onClick={() => onAuctionBid(bidType, bidAmount)}>
              Ofertar
            </button>
            <button type="button" className="dobo-btn" onClick={onAuctionPass}>
              Passar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (king.festaPhase === 'auction') {
    const waiting = gameState.players[currentAuctionPlayer ?? 0]?.name ?? '…';
    return (
      <div className="variant-modal-overlay">
        <div className="variant-modal dobo-panel">
          <h2>Leilão · festa de {owner?.name}</h2>
          <p className="variant-modal-hint">A aguardar oferta de {waiting}…</p>
        </div>
      </div>
    );
  }

  if (king.eightOrNullsPending && king.eightOrNullsTarget === localPlayerIndex) {
    return (
      <div className="variant-modal-overlay">
        <div className="variant-modal dobo-panel">
          <h2>8 ou nulos</h2>
          <p className="variant-modal-hint">{owner?.name} declarou «8 ou nulos». Ofereces 8 positivas?</p>
          <div className="king-festa-actions">
            <button type="button" className="variant-modal-primary dobo-btn" onClick={() => onRespondEight(true)}>
              Oferecer 8
            </button>
            <button type="button" className="dobo-btn" onClick={() => onRespondEight(false)}>
              Não ofereço 8
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (king.festaPhase === 'negotiation_counter' && king.bestBid && king.requestedBid) {
    const bidderIdx = king.bestBid.bidderIndex;
    if (king.festaOwnerIndex === localPlayerIndex) {
      return (
        <div className="variant-modal-overlay">
          <div className="variant-modal dobo-panel">
            <h2>A aguardar resposta</h2>
            <p className="variant-modal-hint">
              Pediste {formatBid(king.requestedBid)} a {gameState.players[bidderIdx]?.name}.
            </p>
          </div>
        </div>
      );
    }
    if (bidderIdx === localPlayerIndex) {
      return (
        <div className="variant-modal-overlay">
          <div className="variant-modal dobo-panel">
            <h2>Pedido de subida</h2>
            <p className="variant-modal-hint">
              {owner?.name} pede {formatBid(king.requestedBid)} (oferta actual: {formatBid(king.bestBid)}).
            </p>
            <div className="king-auction-bid-form">
              <label>
                Tipo
                <select value={raiseType} onChange={(e) => setRaiseType(e.target.value as KingBidType)}>
                  <option value="positive">Positivas</option>
                  <option value="null">Nulos</option>
                </select>
              </label>
              <label>
                Quantidade
                <input
                  type="number"
                  min={1}
                  max={raiseType === 'positive' ? 8 : 4}
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(Number(e.target.value))}
                />
              </label>
            </div>
            <div className="king-festa-actions">
              <button
                type="button"
                className="variant-modal-primary dobo-btn"
                onClick={() => onRespondHigherBid(true, raiseType, raiseAmount)}
              >
                Subir oferta
              </button>
              <button type="button" className="dobo-btn" onClick={() => onRespondHigherBid(false)}>
                Recusar subida
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  if (king.festaPhase === 'negotiation' && king.festaOwnerIndex === localPlayerIndex && king.bestBid) {
    const bidder = gameState.players[king.bestBid.bidderIndex];
    return (
      <div className="variant-modal-overlay">
        <div className="variant-modal dobo-panel">
          <h2>Negociação</h2>
          <p className="variant-modal-hint">
            {bidder?.name} oferece {formatBid(king.bestBid)}.
          </p>
          {showRaiseForm && (
            <div className="king-auction-bid-form">
              <label>
                Pedir mínimo
                <select value={raiseType} onChange={(e) => setRaiseType(e.target.value as KingBidType)}>
                  <option value="positive">Positivas</option>
                  <option value="null">Nulos</option>
                </select>
              </label>
              <label>
                Quantidade
                <input
                  type="number"
                  min={1}
                  max={raiseType === 'positive' ? 8 : 4}
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(Number(e.target.value))}
                />
              </label>
              <button
                type="button"
                className="dobo-btn"
                onClick={() => {
                  onRequestHigherBid(raiseType, raiseAmount);
                  setShowRaiseForm(false);
                }}
              >
                Enviar pedido
              </button>
            </div>
          )}
          <div className="king-festa-actions">
            <button type="button" className="variant-modal-primary dobo-btn" onClick={onAcceptContract}>
              Aceitar
            </button>
            <button type="button" className="dobo-btn" onClick={() => setShowRaiseForm(!showRaiseForm)}>
              Pedir mais
            </button>
            <button type="button" className="dobo-btn" onClick={onRejectContract}>
              Recusar
            </button>
            <button type="button" className="dobo-btn" onClick={onEightOrNulls}>
              8 ou nulos
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (king.waitingForFallback && king.festaOwnerIndex === localPlayerIndex) {
    const allow433 = canUseFourThreeThree(king.bestBid);
    return (
      <div className="variant-modal-overlay">
        <div className="variant-modal dobo-panel">
          <h2>Festa de {owner?.name}</h2>
          <p className="variant-modal-hint">Ninguém licitou. Escolhe como jogar.</p>
          <div className="king-festa-actions">
            <button type="button" className="variant-modal-primary dobo-btn" onClick={() => onFallback('trump')}>
              Trunfo
            </button>
            <button type="button" className="dobo-btn" onClick={() => onFallback('no_trump')}>
              Sem trunfo
            </button>
            <button type="button" className="dobo-btn" onClick={() => onFallback('nulos')}>
              Nulos
            </button>
            {allow433 && (
              <button type="button" className="dobo-btn" onClick={() => onFallback('four_by_three')}>
                4×3×3
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (king.waitingForFestaSetup && (king.benefitOwnerIndex ?? king.festaOwnerIndex) === localPlayerIndex) {
    return (
      <div className="variant-modal-overlay">
        <div className="variant-modal dobo-panel">
          <h2>Configurar festa</h2>
          {king.festaMode === 'positive' && (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={setupNoTrump}
                  onChange={(e) => setSetupNoTrump(e.target.checked)}
                />
                Sem trunfo
              </label>
              {!setupNoTrump && (
                <div className="king-festa-actions">
                  {SUITS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`dobo-btn${setupTrump === s.id ? ' variant-modal-primary' : ''}`}
                      onClick={() => setSetupTrump(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <label>
            Primeiro jogador
            <select value={firstPlayer} onChange={(e) => setFirstPlayer(Number(e.target.value))}>
              {gameState.players.map((p, i) => (
                <option key={p.id} value={i}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="variant-modal-primary dobo-btn"
            onClick={() => onSetup(setupNoTrump ? null : setupTrump, setupNoTrump, firstPlayer)}
          >
            Começar
          </button>
        </div>
      </div>
    );
  }

  if (
    king.festaPhase === 'negotiation' ||
    king.festaPhase === 'negotiation_counter' ||
    king.waitingForFallback ||
    king.waitingForFestaSetup ||
    king.eightOrNullsPending
  ) {
    return (
      <div className="variant-modal-overlay">
        <div className="variant-modal dobo-panel">
          <h2>Festa de {owner?.name}</h2>
          <p className="variant-modal-hint">A aguardar decisão…</p>
        </div>
      </div>
    );
  }

  return null;
};
