import React from 'react';
import './CreditsModal.css';

interface CreditsModalProps {
  onClose: () => void;
  darkMode: boolean;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ onClose, darkMode }) => {
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
        <button className="credits-modal-close" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <div className="credits-modal-card">
          <header className="credits-header">
            <div className="credits-publisher">
              <div className="credits-publisher-logo placeholder-logo">
                OXS
              </div>
              <div className="credits-publisher-text">
                <span className="credits-publisher-label">editora</span>
                <span className="credits-publisher-name">OXS · Oeiras Xtreme Software</span>
              </div>
            </div>
          </header>

          <main className="credits-main">
            <div className="credits-title-block">
              <h1 className="credits-title">SUECÃO</h1>
            </div>

            <div className="credits-media-and-text">
              <div className="credits-media">
                <div className="credits-media-frame">
                  <img 
                    src={`${process.env.PUBLIC_URL || ''}/image/Buga Bark Sueca 2.gif`}
                    alt="SUECÃO - Capa do Jogo"
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
                    <span className="credits-media-label">capa / animação</span>
                    <span className="credits-media-format">jpg · png · gif</span>
                  </div>
                </div>
              </div>

              <div className="credits-description">
                <p className="credits-intro">Um jogo de Sueca</p>
                <p className="credits-description-text">
                  Versão digital do clássico jogo de cartas português, pensada para jogar a solo contra a IA
                  ou em modo cooperativo com amigos ao redor da mesa.
                </p>
                <div className="credits-meta-list">
                  <div className="credits-meta-item">4 JOGADORES</div>
                  <div className="credits-meta-item">2 equipas</div>
                  <div className="credits-meta-item">40 cartas</div>
                  <div className="credits-meta-item">4 jogos</div>
                </div>
              </div>
            </div>
          </main>

          <footer className="credits-footer">
            <div className="credits-acknowledgments">
              <h3 className="credits-ack-title">Agradecimentos</h3>
              <p className="credits-ack-text">
                Obrigado ao Cursor, ao Buga, ao Tico, à Maria Francisca e à Maria João.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

