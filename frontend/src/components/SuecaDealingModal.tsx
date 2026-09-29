import React from 'react';
import { DealAlignment, PlayDirection } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
import './VariantModals.css';

interface SuecaDealingModalProps {
  round: number;
  playDirection: PlayDirection;
  dealAlignment: DealAlignment;
  onAlignmentChange: (alignment: DealAlignment) => void;
  onConfirm: () => void;
}

/** Shown before each Sueca deal — per-hand DealAlignment only (ARCH-SUECA-06). */
export const SuecaDealingModal: React.FC<SuecaDealingModalProps> = ({
  playDirection,
  dealAlignment,
  onAlignmentChange,
  onConfirm
}) => {
  const { t } = useLanguage();
  const play = playDirection === 'left' ? 'left' : 'right';

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

        <p className="dealing-modal-play-readonly" aria-live="polite">
          {play === 'right' ? t.modals.playDirectionReadonlyRight : t.modals.playDirectionReadonlyLeft}
        </p>

        <div className="dealing-modal-section">
          <div className="dealing-modal-label">{t.modals.dealAlignmentLabel}</div>
          <div
            className="dealing-modal-radios"
            role="radiogroup"
            aria-label={t.modals.dealAlignmentLabel}
          >
            <label className="dealing-modal-radio">
              <input
                type="radio"
                name="sueca-deal-alignment"
                checked={dealAlignment === 'same'}
                onChange={() => onAlignmentChange('same')}
              />
              <span>
                <strong>{t.modals.dealAlignmentSame}</strong>
                <span className="dealing-modal-hint">{t.modals.dealAlignmentSameHint}</span>
              </span>
            </label>
            <label className="dealing-modal-radio">
              <input
                type="radio"
                name="sueca-deal-alignment"
                checked={dealAlignment === 'opposite'}
                onChange={() => onAlignmentChange('opposite')}
              />
              <span>
                <strong>{t.modals.dealAlignmentOpposite}</strong>
                <span className="dealing-modal-hint">{t.modals.dealAlignmentOppositeHint}</span>
              </span>
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
