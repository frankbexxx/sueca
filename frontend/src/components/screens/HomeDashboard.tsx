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
  onPlayLast: () => void;
  onChooseGame: () => void;
  onPickVariant: (variant: GameVariant) => void;
  onOpenProfile: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onContinue,
  onPlayLast,
  onChooseGame,
  onPickVariant,
  onOpenProfile
}) => {
  const { t, language } = useLanguage();
  const saved = loadGameSession();
  const lastConfig = loadLastConfig();
  const stats = loadLocalStats();
  const games = getAvailableGames();
  const lastVariant = lastConfig?.gameVariant ?? stats.lastPlayedVariant ?? 'sueca';
  const lastLabel = games.find((g) => g.variant === lastVariant)?.name ?? lastVariant;
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
        <button type="button" className="dashboard-profile" onClick={onOpenProfile} aria-label={t.dashboard.viewProfile}>
          <span className="dashboard-profile-avatar" aria-hidden>
            {avatarInitial}
          </span>
          <span className="dashboard-profile-label">{t.dashboard.viewProfile}</span>
        </button>
      </header>

      {saved && (
        <section className="dashboard-context">
          <button type="button" className="dashboard-card dashboard-card-primary dobo-btn" onClick={onContinue}>
            <span className="dashboard-card-title">{t.dashboard.continueGame}</span>
            <span className="dashboard-card-hint">
              {t.dashboard.savedAgo(formatRelativeTime(saved.savedAt, language))}
            </span>
          </button>
        </section>
      )}

      <section className="dashboard-primary-action">
        <button
          type="button"
          className="dashboard-play-last dobo-btn"
          onClick={lastConfig ? onPlayLast : onChooseGame}
        >
          {lastConfig ? t.dashboard.playLastGame(lastLabel) : t.dashboard.chooseGame}
        </button>
        {lastConfig && (
          <button type="button" className="dashboard-other-game" onClick={onChooseGame}>
            {t.dashboard.otherGame}
          </button>
        )}
      </section>

      <section className="dashboard-quick-pick">
        <h2 className="dashboard-section-title">{t.dashboard.quickPickTitle}</h2>
        <div className="dashboard-quick-pick-grid">
          {games.map((game) => (
            <button
              key={game.variant}
              type="button"
              className={`dashboard-game-tile ${lastVariant === game.variant ? 'dashboard-game-tile--active' : ''}`}
              onClick={() => onPickVariant(game.variant)}
            >
              {game.name}
            </button>
          ))}
        </div>
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
                  {t.dashboard.playedShort}: {variantStats.played} · {t.dashboard.winsShort}: {variantStats.wins}
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
