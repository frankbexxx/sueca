import React from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { getAvailableGames } from '../../constants/gameMetadata';
import { loadLocalStats, formatRelativeTime, getWinRate } from '../../services/gameSessionStorage';
import { ShellHeader } from '../navigation/ShellHeader';
import './HomeDashboard.css';
import '../../styles/shell-screens.css';

interface StatsScreenProps {
  showBack?: boolean;
  onBack?: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ showBack = false, onBack }) => {
  const { t, language } = useLanguage();
  const stats = loadLocalStats();
  const games = getAvailableGames();
  const winRate = getWinRate(stats);

  return (
    <div className="shell-screen screen-stats">
      <ShellHeader
        title={t.statsScreen.title}
        subtitle={t.statsScreen.subtitle}
        showBack={showBack}
        onBack={onBack}
      />

      <section className="shell-panel">
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat">
            <span className="dashboard-stat-value">{stats.gamesPlayed}</span>
            <span className="dashboard-stat-label">{t.dashboard.gamesPlayed}</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat-value">{stats.wins}</span>
            <span className="dashboard-stat-label">{t.dashboard.wins}</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat-value">{winRate !== null ? `${winRate}%` : '—'}</span>
            <span className="dashboard-stat-label">{t.dashboard.winRate}</span>
          </div>
        </div>
      </section>

      <section className="shell-panel">
        <h2 className="shell-section-title">{t.dashboard.perGameStats}</h2>
        <ul className="shell-list">
          {games.map((game) => {
            const variantStats = stats.byVariant[game.variant];
            return (
              <li key={game.variant} className="shell-list-row">
                <span>{game.name}</span>
                <span className="shell-list-row-meta">
                  {t.dashboard.playedShort}: {variantStats.played} · {t.dashboard.winsShort}:{' '}
                  {variantStats.wins}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="dashboard-last-played">
        {stats.lastPlayedAt ? (
          <>
            {t.dashboard.lastPlayed}: {formatRelativeTime(stats.lastPlayedAt, language)}
            {stats.lastPlayedVariant && (
              <> · {games.find((g) => g.variant === stats.lastPlayedVariant)?.name ?? stats.lastPlayedVariant}</>
            )}
          </>
        ) : (
          t.dashboard.lastPlayedNever
        )}
      </p>
    </div>
  );
};
