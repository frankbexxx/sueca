import React from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { publicUrl } from '../config/runtimeEnv';

type CreditsBodyProps = {
  /** Modal uses h1; profile screen uses h2. */
  titleAs?: 'h1' | 'h2';
  showCover?: boolean;
};

/**
 * Shared Credits body (modal + profile route).
 * Attribution text comes from i18n — keep in sync with root NOTICE + docs/legal/.
 */
export const CreditsBody: React.FC<CreditsBodyProps> = ({
  titleAs = 'h1',
  showCover = true
}) => {
  const { t } = useLanguage();
  const TitleTag = titleAs;

  return (
    <>
      <main className="credits-main">
        <div className="credits-title-block">
          <TitleTag className="credits-title">{t.credits.title}</TitleTag>
        </div>

        <div className="credits-media-and-text">
          {showCover ? (
            <div className="credits-media">
              <div className="credits-media-frame">
                <img
                  src={`${publicUrl()}/image/Buga Bark Sueca 2.gif`}
                  alt={t.credits.imageAlt}
                  className="credits-cover-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const placeholder = target.nextElementSibling as HTMLElement;
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                />
                <div className="credits-media-placeholder" style={{ display: 'none' }}>
                  <span className="credits-media-label">
                    {t.credits.imagePlaceholderLabel}
                  </span>
                  <span className="credits-media-format">
                    {t.credits.imagePlaceholderFormat}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="credits-description">
            <p className="credits-intro">{t.credits.subtitle}</p>
            <p className="credits-description-text">{t.credits.description}</p>
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
        <div className="credits-assets">
          <h3 className="credits-ack-title">{t.credits.assetsTitle}</h3>

          <h4 className="credits-section-title">{t.credits.sectionCards}</h4>
          <p className="credits-ack-text">{t.credits.assetsCards}</p>

          <h4 className="credits-section-title">{t.credits.sectionBacks}</h4>
          <p className="credits-ack-text">{t.credits.assetsBacks}</p>

          <h4 className="credits-section-title">{t.credits.sectionSfx}</h4>
          <p className="credits-ack-text">{t.credits.assetsSfx}</p>

          <h4 className="credits-section-title">{t.credits.sectionMusic}</h4>
          <p className="credits-ack-text">{t.credits.assetsMusic}</p>
        </div>

        <div className="credits-acknowledgments">
          <h3 className="credits-ack-title">{t.credits.acknowledgmentsTitle}</h3>
          <p className="credits-ack-text">{t.credits.acknowledgmentsText}</p>
        </div>

        <div className="credits-copyright">{t.credits.copyright}</div>
      </footer>
    </>
  );
};
