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
import { useLanguage } from '../i18n/useLanguage';
import './VariantModals.css';

function festaLocale(language: string): 'pt' | 'en' {
  return language === 'en' ? 'en' : 'pt';
}

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
  selected?: boolean;
}

const FestaActionButton: React.FC<FestaActionButtonProps> = ({
  label,
  onClick,
  primary = false,
  enabled = true,
  disabledReason,
  selected
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
        className={`sueca-btn${primary ? ' sueca-btn--primary' : ''}${
          selected ? ' sueca-btn--toggle-on' : ''
        }`}
        aria-pressed={selected}
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
  locale?: 'pt' | 'en';
}

/** UX-FESTA-02 — compact − / value / + (no native number spinner). */
const BidAmountStepper: React.FC<{
  value: number;
  min: number;
  max: number;
  locale: 'pt' | 'en';
  onChange: (next: number) => void;
}> = ({ value, min, max, locale, onChange }) => (
  <div
    className="king-auction-amount-stepper"
    role="group"
    aria-label={locale === 'en' ? 'Number of tricks' : 'Número de vazas'}
  >
    <button
      type="button"
      className="king-auction-amount-stepper__btn"
      aria-label={locale === 'en' ? 'Fewer tricks' : 'Diminuir vazas'}
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
      aria-label={locale === 'en' ? 'More tricks' : 'Aumentar vazas'}
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
  offerLabel = 'Oferecer',
  locale = 'pt'
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

  const positiveLabel = locale === 'en' ? 'Positive' : 'Positivas';
  const nullLabel = locale === 'en' ? 'Nulls' : 'Nulos';
  const typeLabel = locale === 'en' ? 'Offer type' : 'Tipo de oferta';

  return (
    <div className="king-auction-toolbar">
      <div className="king-auction-type" role="group" aria-label={typeLabel}>
        {(['positive', 'null'] as KingBidType[]).map((type) => {
          const selected = bidType === type;
          return (
            <button
              key={type}
              type="button"
              className={`king-festa-choice-btn king-auction-type__btn${
                selected ? ' king-festa-choice-btn--selected' : ''
              }`}
              aria-pressed={selected}
              onClick={() => handleTypeChange(type)}
            >
              {type === 'positive' ? positiveLabel : nullLabel}
            </button>
          );
        })}
      </div>
      <BidAmountStepper
        value={bidAmount}
        min={min}
        max={max}
        locale={locale}
        onChange={handleAmountChange}
      />
      <span className="king-auction-toolbar__vazas" aria-hidden="true">
        {locale === 'en' ? 'Tricks' : 'Vazas'}
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
  const { language } = useLanguage();
  const locale = festaLocale(language);
  const en = locale === 'en';
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
            <h2 className="king-festa-sheet-title">
              {en ? `Auction · ${owner?.name}'s festa` : `Leilão · festa de ${owner?.name}`}
            </h2>
            <p className="king-festa-actor">
              {en ? `Your bid, ${gameState.players[localPlayerIndex]?.name}` : `A tua licitação, ${gameState.players[localPlayerIndex]?.name}`}
            </p>
            <p className="variant-modal-hint king-auction-current-bid">
              {king.bestBid
                ? en
                  ? `Best offer: ${formatBid(king.bestBid, 'en')} (${gameState.players[king.bestBid.bidderIndex]?.name})`
                  : `Melhor oferta: ${formatBid(king.bestBid)} (${gameState.players[king.bestBid.bidderIndex]?.name})`
                : en
                  ? 'No offers yet.'
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
              offerLabel={en ? 'Offer' : 'Oferecer'}
              passLabel={en ? 'Pass' : 'Passar'}
              locale={locale}
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
            <h2 className="king-festa-sheet-title">
              {en ? `Auction · ${owner?.name}'s festa` : `Leilão · festa de ${owner?.name}`}
            </h2>
            <p className="king-festa-actor">
              {en ? `Bidding: ${waiting}` : `A licitar: ${waiting}`}
            </p>
            <p className="variant-modal-hint king-auction-current-bid">
              {king.bestBid
                ? en
                  ? `Best offer: ${formatBid(king.bestBid, 'en')} (${gameState.players[king.bestBid.bidderIndex]?.name})`
                  : `Melhor oferta: ${formatBid(king.bestBid)} (${gameState.players[king.bestBid.bidderIndex]?.name})`
                : en
                  ? `Waiting for ${waiting} to bid.`
                  : `A aguardar a licitação de ${waiting}.`}
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
            }, locale);
    return (
      <FestaSheet
        compact
        header={
          <>
            <h2 className="king-festa-sheet-title">
              {en ? `Auction · ${owner?.name}'s festa` : `Leilão · festa de ${owner?.name}`}
            </h2>
            <p className="variant-modal-hint king-auction-current-bid">
              {last
                ? `${lastName} · ${lastLabel}`
                : en
                  ? 'Voice recorded.'
                  : 'Voz registada.'}
            </p>
          </>
        }
        footer={
          <div className="king-festa-actions king-festa-actions--dominant">
            <FestaActionButton primary label={en ? 'Continue' : 'Continuar'} onClick={onAuctionContinue} />
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
        header={
          <>
            <h2 className="king-festa-sheet-title">{en ? 'Auction complete' : 'Leilão concluído'}</h2>
            <p className="king-festa-actor">
              {en ? `Beneficiary: ${owner?.name}` : `Beneficiário: ${owner?.name}`}
            </p>
          </>
        }
        footer={
          <div className="king-festa-actions king-festa-actions--dominant">
            <FestaActionButton
              primary
              label={
                king.bestBid
                  ? en
                    ? 'Continue to negotiation'
                    : 'Prosseguir para negociação'
                  : en
                    ? 'Choose the festa'
                    : 'Escolher a festa'
              }
              onClick={onAuctionContinue}
            />
          </div>
        }
      >
        <div className="king-festa-winner-box">
          {king.bestBid && winnerName ? (
            <>
              <p className="king-festa-winner-box__line">
                <strong>{en ? 'Winner:' : 'Vencedor:'}</strong> {winnerName}
              </p>
              <p className="king-festa-winner-box__line">
                <strong>{en ? 'Offer:' : 'Oferta:'}</strong> {formatBid(king.bestBid, locale)}
              </p>
            </>
          ) : (
            <p className="king-festa-winner-box__line">
              <strong>{en ? 'No offers' : 'Sem ofertas'}</strong>
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
            <h2 className="king-festa-sheet-title">{en ? '8 or nulls' : '8 ou nulos'}</h2>
            <p className="king-festa-actor">
              {en ? `${owner?.name} declared. Your answer.` : `${owner?.name} declarou. A tua resposta.`}
            </p>
            <p className="variant-modal-hint king-festa-context-hint">
              {en
                ? `Offer 8 positive tricks, or refuse. Refusing returns the festa to ${owner?.name}. It does not choose nulls.`
                : `Oferece 8 positivas, ou recusa. Recusar devolve a festa a ${owner?.name}. Não escolhe nulos.`}
            </p>
          </>
        }
        footer={
          <div className="king-festa-actions king-festa-actions--dominant">
            <FestaActionButton
              primary
              label={en ? 'Offer 8' : 'Oferecer 8'}
              onClick={() => onRespondEight(true)}
            />
            <FestaActionButton label={en ? 'Refuse 8' : 'Recusar 8'} onClick={() => onRespondEight(false)} />
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
    return (
      <FestaSheet
        header={
          <>
            <h2 className="king-festa-sheet-title">{en ? 'Waiting for an answer' : 'A aguardar resposta'}</h2>
            <p className="variant-modal-hint king-festa-context-hint">
              {king.festaOwnerIndex === localPlayerIndex
                ? en
                  ? `You declared 8 or nulls. Waiting for ${targetName}. Refusal does not choose nulls.`
                  : `Declaraste 8 ou nulos. A aguardar ${targetName}. Recusar não escolhe nulos.`
                : en
                  ? `Waiting for ${targetName} to answer ${owner?.name}'s 8 or nulls.`
                  : `A aguardar a resposta de ${targetName} a ${owner?.name}.`}
            </p>
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
            <h2 className="king-festa-sheet-title">{en ? 'Waiting for an answer' : 'A aguardar resposta'}</h2>
            <p className="king-festa-actor">
              {en ? `Bidder: ${gameState.players[bidderIdx]?.name}` : `Licitante: ${gameState.players[bidderIdx]?.name}`}
            </p>
            <p className="variant-modal-hint king-festa-context-hint">
              {en
                ? `You asked ${gameState.players[bidderIdx]?.name} for ${formatBid(king.requestedBid, 'en')}.`
                : `Pediste ${formatBid(king.requestedBid)} a ${gameState.players[bidderIdx]?.name}.`}
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
            <h2 className="king-festa-sheet-title">{en ? 'Raise request' : 'Pedido de subida'}</h2>
            <p className="king-festa-actor">
              {en
                ? `Your answer, ${gameState.players[localPlayerIndex]?.name}`
                : `A tua resposta, ${gameState.players[localPlayerIndex]?.name}`}
            </p>
            <p className="variant-modal-hint king-auction-current-bid">
              {en
                ? `${owner?.name} asks ${formatBid(king.requestedBid, 'en')} (current offer: ${formatBid(king.bestBid, 'en')}).`
                : `${owner?.name} pede ${formatBid(king.requestedBid)} (oferta actual: ${formatBid(king.bestBid)}).`}
            </p>
            <AuctionToolbar
              bidType={raiseType}
              bidAmount={raiseAmount}
              amountFloor={raiseAmountFloor}
              onBidTypeChange={setRaiseType}
              onBidAmountChange={setRaiseAmount}
              onOffer={() => onRespondHigherBid(true, raiseType, raiseAmount)}
              onPass={() => onRespondHigherBid(false)}
              passLabel={en ? 'Refuse raise' : 'Recusar subida'}
              offerLabel={en ? 'Raise offer' : 'Subir oferta'}
              locale={locale}
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
            <h2 className="king-festa-sheet-title">
              {en ? `Negotiation · ${owner?.name}'s festa` : `Negociação · festa de ${owner?.name}`}
            </h2>
            <p className="king-festa-actor">
              {en
                ? `Beneficiary: ${owner?.name} · Bidder: ${bidder?.name}`
                : `Beneficiário: ${owner?.name} · Licitante: ${bidder?.name}`}
            </p>
            <p className="variant-modal-hint king-festa-context-hint">
              {en
                ? `${bidder?.name} offers ${formatBid(king.bestBid, 'en')}.`
                : `${bidder?.name} oferece ${formatBid(king.bestBid)}.`}
            </p>
          </>
        }
        footer={
          <div className="king-festa-actions king-festa-actions--dominant">
            <FestaActionButton
              primary
              label={en ? 'Accept' : 'Aceitar'}
              enabled={actions.accept.enabled}
              disabledReason={actions.accept.disabledReason}
              onClick={onAcceptContract}
            />
            <FestaActionButton
              label={en ? 'Ask for more' : 'Pedir mais'}
              selected={showRaiseForm}
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
              label={en ? 'Reject' : 'Recusar'}
              enabled={actions.reject.enabled}
              disabledReason={actions.reject.disabledReason}
              onClick={onRejectContract}
            />
            <FestaActionButton
              label={en ? '8 or nulls' : '8 ou nulos'}
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
              offerLabel={en ? 'Send request' : 'Enviar pedido'}
              locale={locale}
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
      locale,
      king.highestEquivalentValue
    );
    return (
      <FestaSheet
        header={
          <>
            <h2 className="king-festa-sheet-title">
              {en ? `Choose the contract · ${owner?.name}` : `Escolha de contrato · ${owner?.name}`}
            </h2>
            <p className="king-festa-actor">
              {en
                ? `Beneficiary: ${owner?.name}`
                : `Festa de ${owner?.name} · Beneficiário`}
            </p>
            <p className="variant-modal-hint king-festa-context-hint">
              {kingFallbackBody(
                king.fallbackReason,
                !!king.bestBid,
                fallbackActions.fourByThree.enabled,
                locale
              )}
            </p>
          </>
        }
        footer={
          <div className="king-festa-actions king-festa-actions--dominant">
            <FestaActionButton
              primary
              label={en ? 'Trump' : 'Trunfo'}
              enabled={fallbackActions.trump.enabled}
              onClick={() => onFallback('trump')}
            />
            <FestaActionButton
              label={en ? 'No trump' : 'Sem trunfo'}
              enabled={fallbackActions.noTrump.enabled}
              onClick={() => onFallback('no_trump')}
            />
            <FestaActionButton
              label={en ? 'Nulls' : 'Nulos'}
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
        header={
          <>
            <h2 className="king-festa-sheet-title">{en ? 'Final contract' : 'Contrato final'}</h2>
            <p className="king-festa-actor">
              {en ? `Beneficiary: ${owner?.name}` : `Beneficiário: ${owner?.name}`}
            </p>
          </>
        }
        footer={
          <div className="king-festa-actions">
            <FestaActionButton label={en ? 'Back' : 'Voltar'} onClick={() => setSetupConfirm(false)} />
            <FestaActionButton
              primary
              label={en ? 'Start play' : 'Iniciar jogo'}
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
        header={
          <>
            <h2 className="king-festa-sheet-title">{en ? 'Set up the festa' : 'Configurar festa'}</h2>
            <p className="king-festa-actor">
              {en ? `Beneficiary: ${owner?.name}` : `Beneficiário: ${owner?.name}`}
            </p>
          </>
        }
        footer={
          <div className="king-festa-actions">
            <FestaActionButton
              primary
              label={en ? 'Review contract' : 'Rever contrato'}
              onClick={() => setSetupConfirm(true)}
            />
          </div>
        }
      >
        {king.festaMode === 'positive' && (
          <div className="king-festa-choice-grid" role="group" aria-label={en ? 'Trump' : 'Trunfo'}>
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
              {en ? 'No trump' : 'Sem trunfo'}
            </button>
          </div>
        )}
        {forceNoTrump ? (
          <p className="variant-modal-hint king-festa-setup-hint">
            {en ? 'Nulls · no trump' : 'Nulos · sem trunfo'}
          </p>
        ) : null}
        <div className="king-festa-setup-row">
          <span className="king-festa-setup-row__label">{en ? 'First player' : '1.º jogador'}</span>
          <div className="king-festa-choice-grid" role="group" aria-label={en ? 'First player' : 'Primeiro jogador'}>
            {gameState.players.map((p, i) => {
              const selected = firstPlayer === i;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`king-festa-choice-btn${
                    selected ? ' king-festa-choice-btn--selected' : ''
                  }`}
                  aria-pressed={selected}
                  onClick={() => setFirstPlayer(i)}
                >
                  {i === localPlayerIndex ? (en ? 'You' : 'Tu') : p.name}
                </button>
              );
            })}
          </div>
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
            <h2 className="king-festa-sheet-title">
              {en ? `${owner?.name}'s festa` : `Festa de ${owner?.name}`}
            </h2>
            <p className="variant-modal-hint king-festa-context-hint">
              {en ? 'Waiting for a decision…' : 'A aguardar decisão…'}
            </p>
          </>
        }
      >
        {auctionTimeline}
      </FestaSheet>
    );
  }

  return null;
};
