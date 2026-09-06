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
  round,
  dealingMethod,
  dealingDirection,
  onMethodChange,
  onDirectionChange,
  onConfirm
}) => {
  const { t } = useLanguage();
  return (
    <div className="variant-modal-overlay">
      <div className="variant-modal dobo-panel">
        <h2>
          {t.startMenu.dealingMethod} — #{round}
        </h2>
        <p className="variant-modal-hint">{t.startMenu.dealingMethod}</p>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="sueca-deal-method"
              checked={dealingMethod === 'A'}
              onChange={() => onMethodChange('A')}
            />
            <span>{t.startMenu.methodA}</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="sueca-deal-method"
              checked={dealingMethod === 'B'}
              onChange={() => onMethodChange('B')}
            />
            <span>{t.startMenu.methodB}</span>
          </label>
        </div>
        <p className="variant-modal-hint">Direção de distribuição</p>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="sueca-deal-dir"
              checked={dealingDirection === 'left'}
              onChange={() => onDirectionChange('left')}
            />
            <span>Esquerda (anti-horário)</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="sueca-deal-dir"
              checked={dealingDirection === 'right'}
              onChange={() => onDirectionChange('right')}
            />
            <span>Direita (horário)</span>
          </label>
        </div>
        <button type="button" className="variant-modal-primary dobo-btn" onClick={onConfirm}>
          {t.modals.startGame}
        </button>
      </div>
    </div>
  );
};
