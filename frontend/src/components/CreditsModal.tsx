import React from 'react';
import { useLanguage } from '../i18n/useLanguage';
import './CreditsModal.css';

interface CreditsModalProps {
  onClose: () => void;
  darkMode: boolean;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ onClose, darkMode }) => {
  const { t } = useLanguage();
  
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`credits-modal-overlay ${darkMode ? 'dark-mode' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className="credits-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="credits-modal-close" onClick={onClose} aria-label={t.aria.closeButton}>
          ×
        </button>

        <div className="credits-modal-card">
          <main className="credits-main">
            <div className="credits-title-block">
              <h1 className="credits-title">{t.credits.title}</h1>
            </div>

            <div className="credits-media-and-text">
              <div className="credits-media">
                <div className="credits-media-frame">
                  <img 
                    src={`${process.env.PUBLIC_URL || ''}/image/Buga Bark Sueca 2.gif`}
                    alt={t.credits.imageAlt}
                    className="credits-cover-image"
                    onError={(e) => {
                      // Fallback se o GIF não carregar
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const placeholder = target.nextElementSibling as HTMLElement;
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                  <div className="credits-media-placeholder" style={{ display: 'none' }}>
                    <span className="credits-media-label">{t.credits.imagePlaceholderLabel}</span>
                    <span className="credits-media-format">{t.credits.imagePlaceholderFormat}</span>
                  </div>
                </div>
              </div>

              <div className="credits-description">
                <p className="credits-intro">{t.credits.subtitle}</p>
                <p className="credits-description-text">
                  {t.credits.description}
                </p>
                <div className="credits-meta-list">
                  <div className="credits-meta-item">{t.credits.metaPlayers}</div>
                  <div className="credits-meta-item">{t.credits.metaTeams}</div>
                  <div className="credits-meta-item">{t.credits.metaCards}</div>
                  <div className="credits-meta-item">{t.credits.metaGames}</div>
                </div>
              </div>
            </div>
          </main>

          <footer className="credits-footer">
            <div className="credits-acknowledgments">
              <h3 className="credits-ack-title">{t.credits.acknowledgmentsTitle}</h3>
              <p className="credits-ack-text">
                {t.credits.acknowledgmentsText}
              </p>
            </div>
            <div className="credits-copyright">
              {t.credits.copyright}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

