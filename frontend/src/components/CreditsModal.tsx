import React from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { CreditsBody } from './CreditsBody';
import './CreditsModal.css';

interface CreditsModalProps {
  onClose: () => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ onClose }) => {
  const { t } = useLanguage();

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="credits-modal-overlay" onClick={handleBackdropClick}>
      <div className="credits-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="credits-modal-close"
          onClick={onClose}
          aria-label={t.aria.closeButton}
        >
          ×
        </button>

        <div className="credits-modal-card" data-testid="credits-modal">
          <CreditsBody titleAs="h1" />
        </div>
      </div>
    </div>
  );
};
