import React from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { getAvailableGames } from '../../constants/gameMetadata';
import {
  loadGameSession,
  loadLastConfig,
  loadLocalStats,
  formatRelativeTime,
  getWinRate
} from '../../services/gameSessionStorage';
import { GameVariant } from '../../types/game';
import { BUILD_VERSION } from '../../generated/buildInfo';
import './HomeDashboard.css';

interface HomeDashboardProps {
  onContinue: () => void;
  onPlayVariant: (variant: GameVariant) => void;
  onConfigureVariant: (variant: GameVariant) => void;
  onOpenProfile: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onContinue,
  onPlayVariant,
  onConfigureVariant,
  onOpenProfile
}) => {
  const { t, language } = useLanguage();
  const saved = loadGameSession();
  const lastConfig = loadLastConfig();
  const stats = loadLocalStats();
  const games = getAvailableGames();
  const lastVariant = lastConfig?.gameVariant ?? stats.lastPlayedVariant ?? 'sueca';
  const playerName = lastConfig?.playerNames[0] || 'Player 1';
  const avatarInitial = playerName.trim().charAt(0).toUpperCase() || 'P';
  const winRate = getWinRate(stats);

  return (
    <div className="screen-home">
      <header className="dashboard-header">
        <div className="dashboard-header-text">
          <h1 className="screen-title">{t.landing.title}</h1>
          <p className="screen-subtitle">
            {t.dashboard.greeting}, {playerName}
          </p>
        </div>
        <button
          type="button"
          className="sueca-btn sueca-btn--ghost dashboard-profile-btn"
          onClick={onOpenProfile}
          aria-label={t.dashboard.viewProfile}
        >
          <span className="dashboard-profile-avatar" aria-hidden>
            {avatarInitial}
          </span>
          <span className="dashboard-profile-label">{t.dashboard.viewProfile}</span>
        </button>
      </header>

      <section className="dashboard-game-list">
        <h2 className="dashboard-section-title">{t.dashboard.quickPickTitle}</h2>
        <ul className="dashboard-game-rows">
          {games.map((game) => (
            <li
              key={game.variant}
              className={`dashboard-game-row${
                lastVariant === game.variant ? ' dashboard-game-row--active' : ''
              }`}
            >
              <span className="dashboard-game-row-name">{game.name}</span>
              <div className="dashboard-game-row-actions">
                {saved?.config.gameVariant === game.variant && (
                  <button
                    type="button"
                    className="sueca-btn sueca-btn--secondary sueca-btn--compact"
                    onClick={onContinue}
                    title={t.dashboard.savedAgo(formatRelativeTime(saved.savedAt, language))}
                  >
                    {t.dashboard.continueShort}
                  </button>
                )}
                <button
                  type="button"
                  className="sueca-btn sueca-btn--primary sueca-btn--compact"
                  onClick={() => onPlayVariant(game.variant)}
                >
                  {t.dashboard.playGame}
                </button>
                <button
                  type="button"
                  className="sueca-btn sueca-btn--secondary sueca-btn--icon"
                  onClick={() => onConfigureVariant(game.variant)}
                  aria-label={t.dashboard.configureGame(game.name)}
                  title={t.dashboard.configureGame(game.name)}
                >
                  ⚙
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-stats">
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
          <div className="dashboard-stat">
            <span className="dashboard-stat-value">{winRate !== null ? `${winRate}%` : '—'}</span>
            <span className="dashboard-stat-label">{t.dashboard.winRate}</span>
          </div>
        </div>

        <h3 className="dashboard-subsection-title">{t.dashboard.perGameStats}</h3>
        <ul className="dashboard-per-game-list">
          {games.map((game) => {
            const variantStats = stats.byVariant[game.variant];
            return (
              <li key={game.variant} className="dashboard-per-game-row">
                <span className="dashboard-per-game-name">{game.name}</span>
                <span className="dashboard-per-game-counts">
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

      <p className="dashboard-version" aria-label={`${t.dashboard.buildVersion} ${BUILD_VERSION}`}>
        {t.dashboard.buildVersion}: <code>{BUILD_VERSION}</code>
      </p>
    </div>
  );
};
