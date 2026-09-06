import React, { useState } from 'react';
import { GameState, Suit } from '../types/game';
import { getKingPtState } from '../models/games/KingPtGame';
import { KingBidType, KingFestaChoice } from '../models/games/king/kingContracts';
import { canUseFourThreeThree, formatBid } from '../models/games/king/kingAuction';
import './VariantModals.css';

const FestaSheet: React.FC<{ children: React.ReactNode; compact?: boolean }> = ({
  children,
  compact = false
}) => (
  <div className="variant-modal-overlay variant-modal-overlay--bottom-sheet">
    <div
      className={`variant-modal variant-modal--bottom-sheet dobo-panel${compact ? ' variant-modal--festa-compact' : ''}`}
    >
      {children}
    </div>
  </div>
);

const SUITS: { id: Suit; label: string }[] = [
  { id: 'clubs', label: '♣ Paus' },
  { id: 'diamonds', label: '♦ Ouros' },
  { id: 'hearts', label: '♥ Copas' },
  { id: 'spades', label: '♠ Espadas' }
];

interface AuctionToolbarProps {
  bidType: KingBidType;
  bidAmount: number;
  onBidTypeChange: (type: KingBidType) => void;
  onBidAmountChange: (amount: number) => void;
  onOffer: () => void;
  onPass?: () => void;
  passLabel?: string;
  offerLabel?: string;
}

const AuctionToolbar: React.FC<AuctionToolbarProps> = ({
  bidType,
  bidAmount,
  onBidTypeChange,
  onBidAmountChange,
  onOffer,
  onPass,
  passLabel = 'Passar',
  offerLabel = 'Oferecer'
}) => (
  <div className="king-auction-toolbar">
    <select
      className="king-auction-toolbar__select"
      value={bidType}
      onChange={(e) => onBidTypeChange(e.target.value as KingBidType)}
      aria-label="Tipo de oferta"
    >
      <option value="positive">Positivas</option>
      <option value="null">Nulos</option>
    </select>
    <label className="king-auction-toolbar__amount">
      <span className="king-auction-toolbar__amount-label">Vazas</span>
      <input
        type="number"
        min={1}
        max={bidType === 'positive' ? 8 : 4}
        value={bidAmount}
        onChange={(e) => onBidAmountChange(Number(e.target.value))}
      />
    </label>
    <button type="button" className="sueca-btn sueca-btn--primary sueca-btn--compact" onClick={onOffer}>
      {offerLabel}
    </button>
    {onPass && (
      <button type="button" className="sueca-btn sueca-btn--secondary sueca-btn--compact" onClick={onPass}>
        {passLabel}
      </button>
    )}
  </div>
);

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
      <FestaSheet compact>
        <h2 className="king-festa-sheet-title">Leilão · festa de {owner?.name}</h2>
        <p className="variant-modal-hint king-auction-current-bid">
          {king.bestBid
            ? `Melhor oferta: ${formatBid(king.bestBid)} (${gameState.players[king.bestBid.bidderIndex]?.name})`
            : 'Ainda sem ofertas.'}
        </p>
        <AuctionToolbar
          bidType={bidType}
          bidAmount={bidAmount}
          onBidTypeChange={setBidType}
          onBidAmountChange={setBidAmount}
          onOffer={() => onAuctionBid(bidType, bidAmount)}
          onPass={onAuctionPass}
        />
      </FestaSheet>
    );
  }

  if (king.festaPhase === 'auction') {
    const waiting = gameState.players[currentAuctionPlayer ?? 0]?.name ?? '…';
    return (
      <FestaSheet compact>
        <h2 className="king-festa-sheet-title">Leilão · festa de {owner?.name}</h2>
        <p className="variant-modal-hint king-auction-current-bid">
          {king.bestBid
            ? `Melhor oferta: ${formatBid(king.bestBid)} (${gameState.players[king.bestBid.bidderIndex]?.name})`
            : 'A aguardar oferta de ' + waiting + '…'}
        </p>
      </FestaSheet>
    );
  }

  if (king.eightOrNullsPending) {
    if (king.eightOrNullsTarget === localPlayerIndex) {
      return (
        <FestaSheet>
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
        </FestaSheet>
      );
    }
    const targetName =
      king.eightOrNullsTarget !== null
        ? gameState.players[king.eightOrNullsTarget]?.name
        : '…';
    const waitingHint =
      king.festaOwnerIndex === localPlayerIndex
        ? `Declaraste «8 ou nulos». A aguardar resposta de ${targetName}…`
        : `A aguardar resposta de ${targetName} a «8 ou nulos»…`;
    return (
      <FestaSheet>
        <h2>A aguardar resposta</h2>
        <p className="variant-modal-hint">{waitingHint}</p>
      </FestaSheet>
    );
  }

  if (king.festaPhase === 'negotiation_counter' && king.bestBid && king.requestedBid) {
    const bidderIdx = king.bestBid.bidderIndex;
    if (king.festaOwnerIndex === localPlayerIndex) {
      return (
        <FestaSheet>
          <h2>A aguardar resposta</h2>
          <p className="variant-modal-hint">
            Pediste {formatBid(king.requestedBid)} a {gameState.players[bidderIdx]?.name}.
          </p>
        </FestaSheet>
      );
    }
    if (bidderIdx === localPlayerIndex) {
      return (
        <FestaSheet compact>
          <h2 className="king-festa-sheet-title">Pedido de subida</h2>
          <p className="variant-modal-hint king-auction-current-bid">
            {owner?.name} pede {formatBid(king.requestedBid)} (oferta actual: {formatBid(king.bestBid)}).
          </p>
          <AuctionToolbar
            bidType={raiseType}
            bidAmount={raiseAmount}
            onBidTypeChange={setRaiseType}
            onBidAmountChange={setRaiseAmount}
            onOffer={() => onRespondHigherBid(true, raiseType, raiseAmount)}
            onPass={() => onRespondHigherBid(false)}
            passLabel="Recusar subida"
            offerLabel="Subir oferta"
          />
        </FestaSheet>
      );
    }
  }

  if (king.festaPhase === 'negotiation' && !king.eightOrNullsPending && king.festaOwnerIndex === localPlayerIndex && king.bestBid) {
    const bidder = gameState.players[king.bestBid.bidderIndex];
    return (
      <FestaSheet>
        <h2>Negociação</h2>
        <p className="variant-modal-hint">
          {bidder?.name} oferece {formatBid(king.bestBid)}.
        </p>
        {showRaiseForm && (
          <div className="king-auction-bid-form">
            <AuctionToolbar
              bidType={raiseType}
              bidAmount={raiseAmount}
              onBidTypeChange={setRaiseType}
              onBidAmountChange={setRaiseAmount}
              onOffer={() => {
                onRequestHigherBid(raiseType, raiseAmount);
                setShowRaiseForm(false);
              }}
              offerLabel="Enviar pedido"
            />
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
      </FestaSheet>
    );
  }

  if (king.waitingForFallback && king.festaOwnerIndex === localPlayerIndex) {
    const allow433 = canUseFourThreeThree(king.bestBid);
    return (
      <FestaSheet>
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
      </FestaSheet>
    );
  }

  if (king.waitingForFestaSetup && (king.benefitOwnerIndex ?? king.festaOwnerIndex) === localPlayerIndex) {
    return (
      <FestaSheet>
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
          onClick={() => {
            const forceNoTrump = king.festaMode === 'negative_festa';
            onSetup(
              forceNoTrump || setupNoTrump ? null : setupTrump,
              forceNoTrump || setupNoTrump,
              firstPlayer
            );
          }}
        >
          Começar
        </button>
      </FestaSheet>
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
      <FestaSheet compact>
        <h2 className="king-festa-sheet-title">Festa de {owner?.name}</h2>
        <p className="variant-modal-hint">A aguardar decisão…</p>
      </FestaSheet>
    );
  }

  return null;
};
