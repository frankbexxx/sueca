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
import '../../styles/shell-screens.css';

interface HomeDashboardProps {
  onContinue: (variant: GameVariant) => void;
  onPlayVariant: (variant: GameVariant) => void;
  onConfigureVariant: (variant: GameVariant) => void;
  onViewRules?: (variant: GameVariant) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onContinue,
  onPlayVariant,
  onConfigureVariant,
  onViewRules,
}) => {
  const { t, language } = useLanguage();
  const lastConfig = loadLastConfig();
  const stats = loadLocalStats();
  const games = getAvailableGames();
  const lastVariant = lastConfig?.gameVariant ?? stats.lastPlayedVariant ?? 'sueca';
  const playerName = lastConfig?.playerNames[0] || 'Player 1';
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
      </header>

      <section className="dashboard-stats-summary shell-panel">
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
      </section>

      <section className="dashboard-game-list">
        <h2 className="dashboard-section-title">{t.dashboard.quickPickTitle}</h2>
        <ul className="dashboard-game-rows">
          {games.map((game) => {
            const saved = loadGameSession(game.variant);
            return (
              <li
                key={game.variant}
                className={`dashboard-game-row${
                  lastVariant === game.variant ? ' dashboard-game-row--active' : ''
                }`}
              >
                <span className="dashboard-game-row-name">{game.name}</span>
                <div className="dashboard-game-row-actions">
                  {saved && (
                    <button
                      type="button"
                      className="sueca-btn sueca-btn--secondary sueca-btn--compact"
                      onClick={() => onContinue(game.variant)}
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
                  {onViewRules && (
                    <button
                      type="button"
                      className="sueca-btn sueca-btn--ghost sueca-btn--icon"
                      onClick={() => onViewRules(game.variant)}
                      aria-label={`Regras de ${game.name}`}
                      title={`Regras de ${game.name}`}
                    >
                      ℹ️
                    </button>
                  )}
                </div>
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
