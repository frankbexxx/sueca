import React from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const handleStart = () => {
    onStart();
  };

  return (
    <div className="landing-root" onClick={handleStart}>
      <div
        className="landing-background"
        aria-hidden="true"
      />

      <div className="landing-content" role="button" tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleStart();
          }
        }}
      >
        <div className="landing-card">
          <header className="landing-header">
            <div className="landing-publisher">
              <div className="landing-publisher-logo placeholder-logo">
                OXS
              </div>
              <div className="landing-publisher-text">
                <span className="landing-publisher-label">editora</span>
                <span className="landing-publisher-name">OXS · Oeiras Xtreme Software</span>
              </div>
            </div>
          </header>

          <main className="landing-main">
            <div className="landing-title-block">
              <h1 className="landing-title">
                SUECÃO
              </h1>
            </div>

            <div className="landing-media-and-text">
              <div className="landing-media">
                <div className="landing-media-frame">
                  <img 
                    src={`${process.env.PUBLIC_URL || ''}/image/Buga Bark Sueca 2.gif`}
                    alt="SUECÃO - Capa do Jogo"
                    className="landing-cover-image"
                    onError={(e) => {
                      // Fallback se o GIF não carregar
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const placeholder = target.nextElementSibling as HTMLElement;
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                  <div className="landing-media-placeholder" style={{ display: 'none' }}>
                    <span className="landing-media-label">
                      capa / animação
                    </span>
                    <span className="landing-media-format">
                      jpg · png · gif
                    </span>
                  </div>
                </div>
              </div>

              <div className="landing-description">
                <p className="landing-intro">Um jogo de Sueca</p>
                <p className="landing-description-text">
                  Versão digital do clássico jogo de cartas português, pensada para jogar a solo contra a IA
                  ou em modo cooperativo com amigos ao redor da mesa.
                </p>
                <div className="landing-meta-list">
                  <div className="landing-meta-item">4 JOGADORES</div>
                  <div className="landing-meta-item">2 equipas</div>
                  <div className="landing-meta-item">40 cartas</div>
                  <div className="landing-meta-item">4 jogos</div>
                </div>
              </div>
            </div>
          </main>

          <footer className="landing-footer">
            <div className="landing-tap-hint">
              <span className="tap-icon">▶</span>
              <span className="tap-text">toque ou clique para começar a jogar</span>
            </div>
            <div className="landing-small-print">
              Obrigado ao Cursor, ao Buga, ao Tico, à Maria Francisca e à Maria João.
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};


