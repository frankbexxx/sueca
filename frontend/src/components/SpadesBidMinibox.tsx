import React, { useState } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { SpadesBidType } from '../models/games/spades/spadesRules';
import { CanonicalDecisionSurface } from './CanonicalDecisionSurface';
import './VariantModals.css';

interface SpadesBidMiniboxProps {
  currentBidderName: string;
  nilEnabled: boolean;
  /** Pre-view decision. Blind Nil is not offered again after this is false. */
  blindDecisionPending?: boolean;
  onDeclineBlindNil?: () => void;
  onConfirm: (bid: number, bidType: SpadesBidType) => void;
}

const NUMERIC_BIDS = Array.from({ length: 14 }, (_, value) => value);

export const SpadesBidMinibox: React.FC<SpadesBidMiniboxProps> = ({
  currentBidderName,
  nilEnabled,
  blindDecisionPending = false,
  onDeclineBlindNil,
  onConfirm
}) => {
  const { t } = useLanguage();
  const [bid, setBid] = useState(4);
  const [bidType, setBidType] = useState<SpadesBidType>('normal');

  const handleNormalBidChange = (value: number) => {
    setBidType('normal');
    setBid(Math.max(0, Math.min(13, value)));
  };

  const handleNil = () => {
    setBidType('nil');
    setBid(0);
  };

  const handleConfirm = () => {
    if (bidType === 'nil') {
      onConfirm(0, 'nil');
      return;
    }
    onConfirm(bid, 'normal');
  };

  const selectedLabel = bidType === 'nil' ? t.spadesBid.nilSelected : String(bid);

  return (
    <CanonicalDecisionSurface zone="decisionSheetRect" align="end">
    <div
      className="spades-bid-dock shell-panel"
      data-testid="spades-bid-surface"
      data-surface={blindDecisionPending ? 'preview' : 'normal'}
    >
      <div className="spades-bid-dock__header">
        <span className="spades-bid-title">{t.spadesBid.title}</span>
        <span className="spades-bid-hint spades-bid-hint--primary">
          {t.spadesBid.yourTurn(currentBidderName)}
        </span>
      </div>
      {blindDecisionPending ? (
        <div className="spades-bid-dock__row">
          <button
            type="button"
            className="sueca-btn sueca-btn--primary sueca-btn--compact"
            onClick={() => onConfirm(0, 'blindNil')}
          >
            {t.spadesBid.blindNil}
          </button>
          <button
            type="button"
            className="sueca-btn sueca-btn--compact"
            onClick={onDeclineBlindNil}
          >
            {t.spadesBid.seeHand}
          </button>
        </div>
      ) : (
        <>
          <p className="spades-bid-readout" aria-live="polite">
            {selectedLabel}
          </p>
          <div
            className="spades-bid-options"
            role="group"
            aria-label={t.spadesBid.selectBid}
          >
            {NUMERIC_BIDS.map((value) => {
              const selected = bidType === 'normal' && bid === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={`sueca-btn sueca-btn--compact spades-bid-option${
                    selected ? ' sueca-btn--toggle-on spades-bid-option--selected' : ''
                  }`}
                  aria-pressed={selected}
                  onClick={() => handleNormalBidChange(value)}
                >
                  {value}
                </button>
              );
            })}
            {nilEnabled && (
              <button
                type="button"
                className={`sueca-btn sueca-btn--compact spades-bid-option spades-bid-option--nil${
                  bidType === 'nil' ? ' sueca-btn--toggle-on spades-bid-option--selected' : ''
                }`}
                aria-pressed={bidType === 'nil'}
                onClick={handleNil}
              >
                {t.spadesBid.nil}
              </button>
            )}
          </div>
          <button
            type="button"
            className="sueca-btn sueca-btn--primary sueca-btn--compact spades-bid-dock__confirm"
            onClick={handleConfirm}
          >
            {t.spadesBid.confirm}
          </button>
        </>
      )}
    </div>
    </CanonicalDecisionSurface>
  );
};
