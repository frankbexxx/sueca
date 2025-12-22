import React from 'react';
import { useLanguage } from '../i18n/useLanguage';
import './LandingPage.css';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const { t } = useLanguage();
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
          <main className="landing-main">
            <div className="landing-title-block">
              <h1 className="landing-title">
                {t.landing.title}
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
                <p className="landing-intro">{t.landing.subtitle}</p>
                <p className="landing-description-text">
                  {t.landing.description}
                </p>
                <div className="landing-meta-list">
                  <div className="landing-meta-item">{t.landing.metaPlayers}</div>
                  <div className="landing-meta-item">{t.landing.metaTeams}</div>
                  <div className="landing-meta-item">{t.landing.metaCards}</div>
                  <div className="landing-meta-item">{t.landing.metaGames}</div>
                </div>
              </div>
            </div>
          </main>

          <footer className="landing-footer">
            <div className="landing-tap-hint">
              <span className="tap-icon">▶</span>
              <span className="tap-text">{t.landing.tapHint}</span>
            </div>
            <div className="landing-small-print">
              {t.landing.credits}
            </div>
            <div className="landing-copyright">
              {t.landing.copyright}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};


