import React from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { passDirectionLabel } from './HeartsRulesHelper';
import './VariantModals.css';

interface HeartsPassModalProps {
  passDirection: string;
  selectedCount: number;
  onConfirm: () => void;
}

export const HeartsPassModal: React.FC<HeartsPassModalProps> = ({
  passDirection,
  selectedCount,
  onConfirm
}) => {
  const { language, t } = useLanguage();
  const locale = language === 'pt' ? 'pt' : 'en';
  const ready = selectedCount === 3;

  return (
    <div className="variant-modal-overlay variant-modal-overlay--bottom-sheet variant-modal-overlay--hearts-pass">
      <div className="variant-modal variant-modal--bottom-sheet variant-modal--hearts-pass dobo-panel">
        <h2 className="king-festa-sheet-title">{t.heartsPass.title}</h2>
        <p className="variant-modal-hint king-auction-current-bid">
          {t.heartsPass.passTo}{' '}
          <strong>{passDirectionLabel(passDirection, locale)}</strong>
        </p>
        <p className="variant-modal-hint">{t.heartsPass.selectOnHand}</p>
        <button
          type="button"
          className="sueca-btn sueca-btn--primary sueca-btn--block"
          disabled={!ready}
          onClick={onConfirm}
        >
          {t.heartsPass.confirm(selectedCount)}
        </button>
      </div>
    </div>
  );
};
