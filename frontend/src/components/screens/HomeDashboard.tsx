import React from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { getAvailableGames } from '../../constants/gameMetadata';
import { loadGameSession, loadLastConfig, loadLocalStats } from '../../services/gameSessionStorage';
import { AppTab } from '../../types/navigation';
import './HomeDashboard.css';

interface HomeDashboardProps {
  onContinue: () => void;
  onPlayNow: () => void;
  onSelectTab: (tab: AppTab) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ onContinue, onPlayNow, onSelectTab }) => {
  const { t } = useLanguage();
  const saved = loadGameSession();
  const lastConfig = loadLastConfig();
  const stats = loadLocalStats();
  const games = getAvailableGames();
  const lastVariant = lastConfig?.gameVariant ?? 'sueca';
  const lastLabel = games.find((g) => g.variant === lastVariant)?.name ?? lastVariant;

  return (
    <div className="screen-home">
      <header className="screen-header">
        <h1 className="screen-title">{t.landing.title}</h1>
        <p className="screen-subtitle">{t.dashboard.greeting}, {lastConfig?.playerNames[0] || 'Player 1'}</p>
      </header>

      <section className="dashboard-actions">
        {saved && (
          <button type="button" className="dashboard-card dashboard-card-primary dobo-btn" onClick={onContinue}>
            <span className="dashboard-card-title">{t.dashboard.continueGame}</span>
            <span className="dashboard-card-hint">{t.dashboard.continueHint}</span>
          </button>
        )}

        <button type="button" className="dashboard-card dobo-panel" onClick={onPlayNow}>
          <span className="dashboard-card-title">{t.dashboard.playNow}</span>
          <span className="dashboard-card-hint">
            {t.dashboard.lastGame}: {lastLabel}
          </span>
        </button>
      </section>

      <section className="dashboard-stats dobo-panel">
        <h2 className="dashboard-section-title">{t.dashboard.statsTitle}</h2>
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat">
            <span className="dashboard-stat-value">{stats.gamesPlayed}</span>
            <span className="dashboard-stat-label">{t.dashboard.gamesPlayed}</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat-value">{stats.wins}</span>
            <span className="dashboard-stat-label">{t.dashboard.wins}</span>
          </div>
        </div>
      </section>

      {!saved && (
        <p className="dashboard-muted">{t.dashboard.noSavedGame}</p>
      )}

      <button type="button" className="dashboard-link" onClick={() => onSelectTab('play')}>
        → {t.nav.play}
      </button>
    </div>
  );
};
