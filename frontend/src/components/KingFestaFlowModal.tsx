import React, { useState } from 'react';
import { GameState, Suit } from '../types/game';
import { getKingPtState } from '../models/games/KingPtGame';
import { KingBidType, KingFestaChoice } from '../models/games/king/kingContracts';
import {
  amountAfterBidTypeChange,
  clampBidAmountForType,
  defaultBidAmountForType,
  formatBid,
  maxBidAmountForType,
  minBidToBeat
} from '../models/games/king/kingAuction';
import { kingFallbackBody } from '../models/games/king/kingFestaFallbackCopy';
import {
  resolveFallbackActionsAvailability,
  resolveKingFestaUiView,
  resolveNegotiationOwnerActionsAvailability
} from '../models/games/king/kingFestaActionAvailability';
import { buildFestaSetupSummaryLines } from '../models/games/king/kingFestaSetupSummary';
import { KingAuctionTimeline } from './KingAuctionTimeline';
import './VariantModals.css';

/**
 * UX-FESTA-01 — shared Festa shell:
 * overlay (100dvh) → flex spacer (table) → sheet (header / scroll body / pinned footer).
 */
const FestaSheet: React.FC<{
  header?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  compact?: boolean;
  setup?: boolean;
}> = ({ header, children, footer, compact = false, setup = false }) => (
  <div className="variant-modal-overlay variant-modal-overlay--bottom-sheet variant-modal-overlay--king-festa">
    <div
      className={`variant-modal variant-modal--bottom-sheet king-festa-sheet${
        compact ? ' variant-modal--festa-compact' : ''
      }${setup ? ' variant-modal--festa-setup' : ''}`}
      data-testid="king-festa-sheet"
    >
      {header ? (
        <div className="king-festa-sheet__header" data-testid="king-festa-sheet-header">
          {header}
        </div>
      ) : null}
      <div className="king-festa-sheet__body" data-testid="king-festa-sheet-body">
        {children}
      </div>
      {footer ? (
        <div className="king-festa-sheet__footer" data-testid="king-festa-sheet-footer">
          {footer}
        </div>
      ) : null}
    </div>
  </div>
);

const SUITS: { id: Suit; label: string; short: string }[] = [
  { id: 'clubs', label: '♣ Paus', short: '♣ Paus' },
  { id: 'diamonds', label: '♦ Ouros', short: '♦ Ouros' },
  { id: 'hearts', label: '♥ Copas', short: '♥ Copas' },
  { id: 'spades', label: '♠ Espadas', short: '♠ Espadas' }
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
}) => {
  // KING DENSITY — hide unavailable actions instead of large disabled groups.
  if (!enabled) {
    void disabledReason;
    return null;
  }
  return (
    <div className="king-festa-action-wrap">
      <button
        type="button"
        className={`sueca-btn${primary ? ' sueca-btn--primary' : ''}`}
        onClick={onClick}
      >
        {label}
      </button>
    </div>
  );
};

interface AuctionToolbarProps {
  bidType: KingBidType;
  bidAmount: number;
  /** Legal floor for the current type (auction must beat standing). */
  amountFloor?: number;
  onBidTypeChange: (type: KingBidType) => void;
  onBidAmountChange: (amount: number) => void;
  onOffer: () => void;
  onPass?: () => void;
  passLabel?: string;
  offerLabel?: string;
}

/** UX-FESTA-02 — compact − / value / + (no native number spinner). */
const BidAmountStepper: React.FC<{
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}> = ({ value, min, max, onChange }) => (
  <div className="king-auction-amount-stepper" role="group" aria-label="Número de vazas">
    <button
      type="button"
      className="king-auction-amount-stepper__btn"
      aria-label="Diminuir vazas"
      disabled={value <= min}
      onClick={() => onChange(value - 1)}
    >
      −
    </button>
    <span className="king-auction-amount-stepper__value" aria-live="polite" aria-atomic="true">
      {value}
    </span>
    <button
      type="button"
      className="king-auction-amount-stepper__btn"
      aria-label="Aumentar vazas"
      disabled={value >= max}
      onClick={() => onChange(value + 1)}
    >
      +
    </button>
  </div>
);

const AuctionToolbar: React.FC<AuctionToolbarProps> = ({
  bidType,
  bidAmount,
  amountFloor = 1,
  onBidTypeChange,
  onBidAmountChange,
  onOffer,
  onPass,
  passLabel = 'Passar',
  offerLabel = 'Oferecer'
}) => {
  const min = Math.max(1, amountFloor);
  const max = maxBidAmountForType(bidType);
  const handleTypeChange = (type: KingBidType) => {
    onBidTypeChange(type);
    onBidAmountChange(amountAfterBidTypeChange(type, amountFloor));
  };
  const handleAmountChange = (next: number) => {
    onBidAmountChange(clampBidAmountForType(bidType, next, amountFloor));
  };

  return (
    <div className="king-auction-toolbar">
      <select
        className="king-auction-toolbar__select"
        value={bidType}
        onChange={(e) => handleTypeChange(e.target.value as KingBidType)}
        aria-label="Tipo de oferta"
      >
        <option value="positive">Positivas</option>
        <option value="null">Nulos</option>
      </select>
      <BidAmountStepper
        value={bidAmount}
        min={min}
        max={max}
        onChange={handleAmountChange}
      />
      <span className="king-auction-toolbar__vazas" aria-hidden="true">
        Vazas
      </span>
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
};

interface KingFestaFlowModalProps {
  gameState: GameState;
  localPlayerIndex: number;
  onAuctionPass: () => void;
  onAuctionBid: (bidType: KingBidType, amount: number) => void;
  onAuctionContinue: () => void;
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
  onAuctionContinue,
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
  const [raiseAmount, setRaiseAmount] = useState(() => defaultBidAmountForType('positive'));
  const [setupConfirm, setSetupConfirm] = useState(false);

  const view = resolveKingFestaUiView(king, localPlayerIndex);
  const currentAuctionPlayer =
    king.festaPhase === 'auction'
      ? (king.currentBidder ?? king.auctionOrder[king.auctionTurnIndex] ?? null)
      : null;
  const auctionAmountFloor = (() => {
    if (!king.bestBid) return 1;
    const min = minBidToBeat(king.bestBid, king.auctionOrder, localPlayerIndex);
    if (!min || min.bidType !== bidType) return 1;
    return min.amount;
  })();
  const raiseAmountFloor = (() => {
    const standing = king.requestedBid ?? king.bestBid;
    if (!standing) return 1;
    const order = king.auctionOrder.length ? king.auctionOrder : [0, 1, 2, 3];
    const seat =
      view === 'counter_bidder' ? localPlayerIndex : king.bestBid?.bidderIndex ?? localPlayerIndex;
    const min = minBidToBeat(standing, order, seat);
    if (!min || min.bidType !== raiseType) return 1;
    return min.amount;
  })();
  const playerNames = gameState.players.map((p) => p.name);
  const auctionTimeline = (
    <KingAuctionTimeline
      history={king.auctionHistory}
      playerNames={playerNames}
      festaPhase={king.festaPhase}
      bestBid={king.bestBid}
    />
  );

  if (view === 'auction_turn') {
    return (
      <FestaSheet
        compact
        header={
          <>
            <h2 className="king-festa-sheet-title">Leilão · festa de {owner?.name}</h2>
            <p className="variant-modal-hint king-auction-current-bid">
              {king.bestBid
                ? `Melhor oferta: ${formatBid(king.bestBid)} (${gameState.players[king.bestBid.bidderIndex]?.name})`
                : 'Ainda sem ofertas.'}
            </p>
            <AuctionToolbar
              bidType={bidType}
              bidAmount={bidAmount}
              amountFloor={auctionAmountFloor}
              onBidTypeChange={setBidType}
              onBidAmountChange={setBidAmount}
              onOffer={() => onAuctionBid(bidType, bidAmount)}
              onPass={onAuctionPass}
            />
          </>
        }
      >
        {auctionTimeline}
      </FestaSheet>
    );
  }

  if (view === 'auction_waiting') {
    const waiting = gameState.players[currentAuctionPlayer ?? 0]?.name ?? '…';
    return (
      <FestaSheet
        compact
        header={
          <>
            <h2 className="king-festa-sheet-title">Leilão · festa de {owner?.name}</h2>
            <p className="variant-modal-hint king-auction-current-bid">
              {king.bestBid
                ? `Melhor oferta: ${formatBid(king.bestBid)} (${gameState.players[king.bestBid.bidderIndex]?.name})`
                : 'A aguardar oferta de ' + waiting + '…'}
            </p>
          </>
        }
      >
        {auctionTimeline}
      </FestaSheet>
    );
  }

  if (view === 'auction_continue') {
    const last = king.auctionHistory[king.auctionHistory.length - 1];
    const lastName =
      last != null ? gameState.players[last.seat]?.name ?? `P${last.seat + 1}` : '…';
    const lastLabel =
      last == null
        ? ''
        : last.action === 'pass'
          ? 'PASS'
          : formatBid({
              bidderIndex: last.seat,
              bidType: last.bidType ?? 'positive',
              amount: last.amount ?? 0
            });
    return (
      <FestaSheet
        compact
        header={
          <>
            <h2 className="king-festa-sheet-title">Leilão · festa de {owner?.name}</h2>
            <p className="variant-modal-hint king-auction-current-bid">
              {last ? `${lastName} · ${lastLabel}` : 'Oferta registada.'}
            </p>
          </>
        }
        footer={
          <div className="king-festa-actions king-festa-actions--dominant">
            <FestaActionButton primary label="Continuar" onClick={onAuctionContinue} />
          </div>
        }
      >
        {auctionTimeline}
      </FestaSheet>
    );
  }

  if (view === 'auction_result') {
    const winnerName = king.bestBid
      ? gameState.players[king.bestBid.bidderIndex]?.name ?? '…'
      : null;
    return (
      <FestaSheet
        compact
        header={<h2 className="king-festa-sheet-title">Leilão concluído</h2>}
        footer={
          <div className="king-festa-actions king-festa-actions--dominant">
            <FestaActionButton
              primary
              label={king.bestBid ? 'Continuar para negociação' : 'Continuar'}
              onClick={onAuctionContinue}
            />
          </div>
        }
      >
        <div className="king-festa-winner-box">
          {king.bestBid && winnerName ? (
            <>
              <p className="king-festa-winner-box__line">
                <strong>Vencedor:</strong> {winnerName}
              </p>
              <p className="king-festa-winner-box__line">
                <strong>Oferta:</strong> {formatBid(king.bestBid)}
              </p>
            </>
          ) : (
            <p className="king-festa-winner-box__line">
              <strong>Sem ofertas</strong>
            </p>
          )}
        </div>
        {auctionTimeline}
      </FestaSheet>
    );
  }

  if (view === 'eight_respond') {
    return (
      <FestaSheet
        header={
          <>
            <h2 className="king-festa-sheet-title">8 ou nulos</h2>
            <p className="variant-modal-hint king-festa-context-hint">
              {owner?.name} declarou «8 ou nulos». Ofereces 8 positivas?
            </p>
          </>
        }
        footer={
          <div className="king-festa-actions king-festa-actions--dominant">
            <FestaActionButton
              primary
              label="Oferecer 8"
              onClick={() => onRespondEight(true)}
            />
            <FestaActionButton label="Não ofereço 8" onClick={() => onRespondEight(false)} />
          </div>
        }
      />
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
      <FestaSheet
        header={
          <>
            <h2 className="king-festa-sheet-title">A aguardar resposta</h2>
            <p className="variant-modal-hint king-festa-context-hint">{waitingHint}</p>
          </>
        }
      />
    );
  }

  if (view === 'counter_owner_waiting' && king.bestBid && king.requestedBid) {
    const bidderIdx = king.bestBid.bidderIndex;
    return (
      <FestaSheet
        header={
          <>
            <h2 className="king-festa-sheet-title">A aguardar resposta</h2>
            <p className="variant-modal-hint king-festa-context-hint">
              Pediste {formatBid(king.requestedBid)} a {gameState.players[bidderIdx]?.name}.
            </p>
          </>
        }
      >
        {auctionTimeline}
      </FestaSheet>
    );
  }

  if (view === 'counter_bidder' && king.bestBid && king.requestedBid) {
    return (
      <FestaSheet
        compact
        header={
          <>
            <h2 className="king-festa-sheet-title">Pedido de subida</h2>
            <p className="variant-modal-hint king-auction-current-bid">
              {owner?.name} pede {formatBid(king.requestedBid)} (oferta actual: {formatBid(king.bestBid)}).
            </p>
            <AuctionToolbar
              bidType={raiseType}
              bidAmount={raiseAmount}
              amountFloor={raiseAmountFloor}
              onBidTypeChange={setRaiseType}
              onBidAmountChange={setRaiseAmount}
              onOffer={() => onRespondHigherBid(true, raiseType, raiseAmount)}
              onPass={() => onRespondHigherBid(false)}
              passLabel="Recusar subida"
              offerLabel="Subir oferta"
            />
          </>
        }
      >
        {auctionTimeline}
      </FestaSheet>
    );
  }

  if (view === 'negotiation_owner' && king.bestBid) {
    const bidder = gameState.players[king.bestBid.bidderIndex];
    const actions = resolveNegotiationOwnerActionsAvailability(king.eightOrNullsPending);
    return (
      <FestaSheet
        header={
          <>
            <h2 className="king-festa-sheet-title">Negociação · festa de {owner?.name}</h2>
            <p className="variant-modal-hint king-festa-context-hint">
              {bidder?.name} oferece {formatBid(king.bestBid)}.
            </p>
          </>
        }
        footer={
          <div className="king-festa-actions king-festa-actions--dominant">
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
              onClick={() => {
                const opening = !showRaiseForm;
                setShowRaiseForm(opening);
                if (opening) {
                  setRaiseType('positive');
                  setRaiseAmount(amountAfterBidTypeChange('positive', raiseAmountFloor));
                }
              }}
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
        }
      >
        {showRaiseForm && actions.askMore.enabled && (
          <div className="king-auction-bid-form">
            <AuctionToolbar
              bidType={raiseType}
              bidAmount={raiseAmount}
              amountFloor={raiseAmountFloor}
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
        {auctionTimeline}
      </FestaSheet>
    );
  }

  if (view === 'fallback_owner') {
    const fallbackActions = resolveFallbackActionsAvailability(
      king.bestBid,
      'pt',
      king.highestEquivalentValue
    );
    return (
      <FestaSheet
        header={
          <>
            <h2 className="king-festa-sheet-title">Festa de {owner?.name}</h2>
            <p className="variant-modal-hint king-festa-context-hint">
              {kingFallbackBody(
                king.fallbackReason,
                !!king.bestBid,
                fallbackActions.fourByThree.enabled,
                'pt'
              )}
            </p>
          </>
        }
        footer={
          <div className="king-festa-actions king-festa-actions--dominant">
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
        }
      />
    );
  }

  if (view === 'setup_owner') {
    const forceNoTrump = king.festaMode === 'negative_festa';
    const effectiveNoTrump = forceNoTrump || setupNoTrump;
    const effectiveTrump = effectiveNoTrump ? null : setupTrump;
    const winnerIdx = king.bestBid?.bidderIndex ?? king.benefitOwnerIndex;
    const summary = buildFestaSetupSummaryLines({
      winnerName:
        winnerIdx != null
          ? gameState.players[winnerIdx]?.name ?? `P${winnerIdx + 1}`
          : '—',
      winnerIndex: winnerIdx,
      localPlayerIndex,
      bid: king.bestBid,
      festaMode: king.festaMode,
      noTrump: effectiveNoTrump,
      trump: effectiveTrump,
      firstPlayerName: gameState.players[firstPlayer]?.name ?? `P${firstPlayer + 1}`,
      firstPlayerIndex: firstPlayer
    });

    if (setupConfirm) {
      return (
        <FestaSheet
          compact
          setup
          header={<h2 className="king-festa-sheet-title">Contrato final</h2>}
          footer={
            <div className="king-festa-actions">
              <FestaActionButton label="Voltar" onClick={() => setSetupConfirm(false)} />
              <FestaActionButton
                primary
                label="Continuar"
                onClick={() => {
                  onSetup(effectiveTrump, effectiveNoTrump, firstPlayer);
                  setSetupConfirm(false);
                }}
              />
            </div>
          }
        >
          <div className="king-festa-winner-box king-festa-winner-box--setup">
            <p className="king-festa-winner-box__line">{summary.winnerLine}</p>
            <p className="king-festa-winner-box__line">
              <strong>{summary.contractLine}</strong>
            </p>
            <p className="king-festa-winner-box__line">{summary.firstPlayerLine}</p>
          </div>
        </FestaSheet>
      );
    }

    return (
      <FestaSheet
        compact
        setup
        header={<h2 className="king-festa-sheet-title">Configurar festa</h2>}
        footer={
          <div className="king-festa-actions">
            <FestaActionButton primary label="Continuar" onClick={() => setSetupConfirm(true)} />
          </div>
        }
      >
        {king.festaMode === 'positive' && (
          <div className="king-festa-choice-grid" role="group" aria-label="Trunfo">
            {SUITS.map((s) => {
              const selected = !setupNoTrump && setupTrump === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`king-festa-choice-btn${
                    selected ? ' king-festa-choice-btn--selected' : ''
                  }`}
                  aria-pressed={selected}
                  onClick={() => {
                    setSetupNoTrump(false);
                    setSetupTrump(s.id);
                  }}
                >
                  {s.label}
                </button>
              );
            })}
            <button
              type="button"
              className={`king-festa-choice-btn${
                setupNoTrump ? ' king-festa-choice-btn--selected' : ''
              }`}
              aria-pressed={setupNoTrump}
              onClick={() => setSetupNoTrump(true)}
            >
              Sem trunfo
            </button>
          </div>
        )}
        {forceNoTrump ? (
          <p className="variant-modal-hint king-festa-setup-hint">Nulos · sem trunfo</p>
        ) : null}
        <div className="king-festa-setup-row">
          <span className="king-festa-setup-row__label">1.º jogador</span>
          <select
            className="king-festa-setup-select"
            value={firstPlayer}
            aria-label="Primeiro jogador"
            onChange={(e) => setFirstPlayer(Number(e.target.value))}
          >
            {gameState.players.map((p, i) => (
              <option key={p.id} value={i}>
                {i === localPlayerIndex ? 'Tu' : p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="king-festa-winner-box king-festa-winner-box--setup king-festa-winner-box--preview">
          <p className="king-festa-winner-box__line">{summary.contractLine}</p>
          <p className="king-festa-winner-box__line">{summary.firstPlayerLine}</p>
        </div>
      </FestaSheet>
    );
  }

  if (view === 'spectator_waiting') {
    return (
      <FestaSheet
        compact
        header={
          <>
            <h2 className="king-festa-sheet-title">Festa de {owner?.name}</h2>
            <p className="variant-modal-hint king-festa-context-hint">A aguardar decisão…</p>
          </>
        }
      >
        {auctionTimeline}
      </FestaSheet>
    );
  }

  return null;
};
