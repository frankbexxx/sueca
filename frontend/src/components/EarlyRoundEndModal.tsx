import React from 'react';
import { useLanguage } from '../i18n/useLanguage';
import './VariantModals.css';

interface EarlyRoundEndModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export const EarlyRoundEndModal: React.FC<EarlyRoundEndModalProps> = ({ onAccept, onDecline }) => {
  const { t } = useLanguage();

  return (
    <div className="variant-modal-overlay">
      <div className="variant-modal dobo-panel">
        <h2>{t.earlyRoundEnd.title}</h2>
        <p className="variant-modal-hint">{t.earlyRoundEnd.body}</p>
        <div className="king-festa-actions">
          <button type="button" className="sueca-btn sueca-btn--primary" onClick={onAccept}>
            {t.earlyRoundEnd.accept}
          </button>
          <button type="button" className="sueca-btn sueca-btn--danger" onClick={onDecline}>
            {t.earlyRoundEnd.decline}
          </button>
        </div>
      </div>
    </div>
  );
};
