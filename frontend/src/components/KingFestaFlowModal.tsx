import React, { useState } from 'react';
import { GameState, Suit } from '../types/game';
import { getKingPtState } from '../models/games/KingPtGame';
import { KingBidType, KingFestaChoice } from '../models/games/king/kingContracts';
import { formatBid } from '../models/games/king/kingAuction';
import { kingFallbackBody } from '../models/games/king/kingFestaFallbackCopy';
import {
  resolveFallbackActionsAvailability,
  resolveKingFestaUiView,
  resolveNegotiationOwnerActionsAvailability
} from '../models/games/king/kingFestaActionAvailability';
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

interface FestaActionButtonProps {
  label: string;
  onClick: () => void;
  primary?: boolean;
  enabled?: boolean;
  disabledReason?: string;
}

const FestaActionButton: React.FC<FestaActionButtonProps> = ({
  label,
  onClick,
  primary = false,
  enabled = true,
  disabledReason
}) => (
  <div className={`king-festa-action-wrap${!enabled ? ' king-festa-action-wrap--disabled' : ''}`}>
    <button
      type="button"
      className={`dobo-btn${primary ? ' variant-modal-primary' : ''}${
        !enabled ? ' king-festa-action--disabled' : ''
      }`}
      disabled={!enabled}
      aria-disabled={!enabled}
      title={!enabled ? disabledReason : undefined}
      onClick={enabled ? onClick : undefined}
    >
      {label}
    </button>
    {!enabled && disabledReason ? (
      <span className="king-festa-action-hint">{disabledReason}</span>
    ) : null}
  </div>
);

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

  const view = resolveKingFestaUiView(king, localPlayerIndex);
  const currentAuctionPlayer =
    king.festaPhase === 'auction' ? king.auctionOrder[king.auctionTurnIndex] : null;

  if (view === 'auction_turn') {
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

  if (view === 'auction_waiting') {
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

  if (view === 'eight_respond') {
    return (
      <FestaSheet>
        <h2>8 ou nulos</h2>
        <p className="variant-modal-hint">{owner?.name} declarou «8 ou nulos». Ofereces 8 positivas?</p>
        <div className="king-festa-actions">
          <FestaActionButton
            primary
            label="Oferecer 8"
            onClick={() => onRespondEight(true)}
          />
          <FestaActionButton label="Não ofereço 8" onClick={() => onRespondEight(false)} />
        </div>
      </FestaSheet>
    );
  }

  if (view === 'eight_waiting') {
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

  if (view === 'counter_owner_waiting' && king.bestBid && king.requestedBid) {
    const bidderIdx = king.bestBid.bidderIndex;
    return (
      <FestaSheet>
        <h2>A aguardar resposta</h2>
        <p className="variant-modal-hint">
          Pediste {formatBid(king.requestedBid)} a {gameState.players[bidderIdx]?.name}.
        </p>
      </FestaSheet>
    );
  }

  if (view === 'counter_bidder' && king.bestBid && king.requestedBid) {
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

  if (view === 'negotiation_owner' && king.bestBid) {
    const bidder = gameState.players[king.bestBid.bidderIndex];
    const actions = resolveNegotiationOwnerActionsAvailability(king.eightOrNullsPending);
    return (
      <FestaSheet>
        <h2>Negociação</h2>
        <p className="variant-modal-hint">
          {bidder?.name} oferece {formatBid(king.bestBid)}.
        </p>
        {showRaiseForm && actions.askMore.enabled && (
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
          <FestaActionButton
            primary
            label="Aceitar"
            enabled={actions.accept.enabled}
            disabledReason={actions.accept.disabledReason}
            onClick={onAcceptContract}
          />
          <FestaActionButton
            label="Pedir mais"
            enabled={actions.askMore.enabled}
            disabledReason={actions.askMore.disabledReason}
            onClick={() => setShowRaiseForm(!showRaiseForm)}
          />
          <FestaActionButton
            label="Recusar"
            enabled={actions.reject.enabled}
            disabledReason={actions.reject.disabledReason}
            onClick={onRejectContract}
          />
          <FestaActionButton
            label="8 ou nulos"
            enabled={actions.eightOrNulls.enabled}
            disabledReason={actions.eightOrNulls.disabledReason}
            onClick={onEightOrNulls}
          />
        </div>
      </FestaSheet>
    );
  }

  if (view === 'fallback_owner') {
    const fallbackActions = resolveFallbackActionsAvailability(king.bestBid, 'pt');
    return (
      <FestaSheet>
        <h2>Festa de {owner?.name}</h2>
        <p className="variant-modal-hint">
          {kingFallbackBody(
            king.fallbackReason,
            !!king.bestBid,
            fallbackActions.fourByThree.enabled,
            'pt'
          )}
        </p>
        <div className="king-festa-actions">
          <FestaActionButton
            primary
            label="Trunfo"
            enabled={fallbackActions.trump.enabled}
            onClick={() => onFallback('trump')}
          />
          <FestaActionButton
            label="Sem trunfo"
            enabled={fallbackActions.noTrump.enabled}
            onClick={() => onFallback('no_trump')}
          />
          <FestaActionButton
            label="Nulos"
            enabled={fallbackActions.nulos.enabled}
            onClick={() => onFallback('nulos')}
          />
          <FestaActionButton
            label="4×3×3"
            enabled={fallbackActions.fourByThree.enabled}
            disabledReason={fallbackActions.fourByThree.disabledReason}
            onClick={() => onFallback('four_by_three')}
          />
        </div>
      </FestaSheet>
    );
  }

  if (view === 'setup_owner') {
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

  if (view === 'spectator_waiting') {
    return (
      <FestaSheet compact>
        <h2 className="king-festa-sheet-title">Festa de {owner?.name}</h2>
        <p className="variant-modal-hint">A aguardar decisão…</p>
      </FestaSheet>
    );
  }

  return null;
};
