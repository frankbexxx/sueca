import React from 'react';
import { DealingDirection, DealingMethod } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
import './VariantModals.css';

export type { DealingDirection };

interface SuecaDealingModalProps {
  round: number;
  dealingMethod: DealingMethod;
  dealingDirection: DealingDirection;
  onMethodChange: (method: DealingMethod) => void;
  onDirectionChange: (direction: DealingDirection) => void;
  onConfirm: () => void;
}

/** Shown before each Sueca deal — method + direction (outside rules preset). */
export const SuecaDealingModal: React.FC<SuecaDealingModalProps> = ({
  dealingMethod,
  dealingDirection,
  onMethodChange,
  onDirectionChange,
  onConfirm
}) => {
  const { t } = useLanguage();

  return (
    <div className="variant-modal-overlay dealing-modal-overlay">
      <div
        className="variant-modal dealing-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dealing-modal-title"
      >
        <h2 id="dealing-modal-title" className="dealing-modal-title">
          {t.modals.dealingTitle}
        </h2>

        <div className="dealing-modal-section">
          <div className="dealing-modal-label">{t.modals.dealingMethodLabel}</div>
          <div className="dealing-modal-radios" role="radiogroup" aria-label={t.modals.dealingMethodLabel}>
            <label className="dealing-modal-radio">
              <input
                type="radio"
                name="sueca-deal-method"
                checked={dealingMethod === 'A'}
                onChange={() => onMethodChange('A')}
              />
              <span>{t.modals.dealingMethodA}</span>
            </label>
            <label className="dealing-modal-radio">
              <input
                type="radio"
                name="sueca-deal-method"
                checked={dealingMethod === 'B'}
                onChange={() => onMethodChange('B')}
              />
              <span>{t.modals.dealingMethodB}</span>
            </label>
          </div>
        </div>

        <div className="dealing-modal-section">
          <div className="dealing-modal-label">{t.modals.dealingDirectionLabel}</div>
          <div className="dealing-modal-radios" role="radiogroup" aria-label={t.modals.dealingDirectionLabel}>
            <label className="dealing-modal-radio">
              <input
                type="radio"
                name="sueca-deal-dir"
                checked={dealingDirection === 'left'}
                onChange={() => onDirectionChange('left')}
              />
              <span>{t.modals.dealingDirLeft}</span>
            </label>
            <label className="dealing-modal-radio">
              <input
                type="radio"
                name="sueca-deal-dir"
                checked={dealingDirection === 'right'}
                onChange={() => onDirectionChange('right')}
              />
              <span>{t.modals.dealingDirRight}</span>
            </label>
          </div>
        </div>

        <button type="button" className="sueca-btn sueca-btn--primary dealing-modal-start" onClick={onConfirm}>
          {t.modals.startGame}
        </button>
      </div>
    </div>
  );
};
