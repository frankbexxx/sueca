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
    <div className="variant-modal-overlay variant-modal-overlay--bottom-sheet variant-modal-overlay--spades-bid">
      <div className="variant-modal variant-modal--bottom-sheet variant-modal--spades-bid shell-panel">
        <h2 className="spades-bid-title">{t.spadesBid.title}</h2>
        <p className="spades-bid-hint spades-bid-hint--primary">
          {t.spadesBid.yourTurn(currentBidderName)}
        </p>
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
          <p className="spades-bid-hint">
            {bidType === 'nil' ? t.spadesBid.nilSelected : t.spadesBid.blindNilSelected}
          </p>
        )}
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
        <button
          type="button"
          className="sueca-btn sueca-btn--primary sueca-btn--block sueca-btn--compact"
          onClick={handleConfirm}
        >
          {t.spadesBid.confirm}
        </button>
      </div>
    </div>
  );
};
