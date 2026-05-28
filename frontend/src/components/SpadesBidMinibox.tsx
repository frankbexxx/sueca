import React, { useState } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { SpadesBidType } from '../models/games/spades/spadesRules';
import './VariantModals.css';

interface SpadesBidMiniboxProps {
  currentBidderName: string;
  nilEnabled: boolean;
  blindNilEnabled: boolean;
  onConfirm: (bid: number, bidType: SpadesBidType) => void;
}

export const SpadesBidMinibox: React.FC<SpadesBidMiniboxProps> = ({
  currentBidderName,
  nilEnabled,
  blindNilEnabled,
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

  const handleBlindNil = () => {
    setBidType('blindNil');
    setBid(0);
  };

  const handleConfirm = () => {
    if (bidType === 'nil' || bidType === 'blindNil') {
      onConfirm(0, bidType);
      return;
    }
    onConfirm(bid, 'normal');
  };

  return (
    <div className="spades-bid-dock shell-panel">
      <div className="spades-bid-dock__header">
        <span className="spades-bid-title">{t.spadesBid.title}</span>
        <span className="spades-bid-hint spades-bid-hint--primary">
          {t.spadesBid.yourTurn(currentBidderName)}
        </span>
      </div>
      <div className="spades-bid-dock__row">
        {bidType === 'normal' && (
          <label className="spades-bid-control">
            <span className="spades-bid-control__label">{t.spadesBid.selectBid}</span>
            <select
              className="spades-bid-select"
              value={bid}
              onChange={(e) => handleNormalBidChange(Number(e.target.value))}
            >
              {Array.from({ length: 14 }, (_, value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        )}
        {(bidType === 'nil' || bidType === 'blindNil') && (
          <span className="spades-bid-hint">
            {bidType === 'nil' ? t.spadesBid.nilSelected : t.spadesBid.blindNilSelected}
          </span>
        )}
        <button
          type="button"
          className="sueca-btn sueca-btn--primary sueca-btn--compact spades-bid-dock__confirm"
          onClick={handleConfirm}
        >
          {t.spadesBid.confirm}
        </button>
      </div>
      {(nilEnabled || blindNilEnabled) && (
        <div className="spades-bid-special">
          {nilEnabled && (
            <button
              type="button"
              className={`sueca-btn sueca-btn--compact${bidType === 'nil' ? ' sueca-btn--primary' : ''}`}
              onClick={handleNil}
            >
              {t.spadesBid.nil}
            </button>
          )}
          {blindNilEnabled && (
            <button
              type="button"
              className={`sueca-btn sueca-btn--compact${bidType === 'blindNil' ? ' sueca-btn--primary' : ''}`}
              onClick={handleBlindNil}
            >
              {t.spadesBid.blindNil}
            </button>
          )}
          {bidType !== 'normal' && (
            <button
              type="button"
              className="sueca-btn sueca-btn--compact"
              onClick={() => {
                setBidType('normal');
                setBid(4);
              }}
            >
              {t.spadesBid.normalBid}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
