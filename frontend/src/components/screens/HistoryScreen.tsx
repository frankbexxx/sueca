import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { getAvailableGames } from '../../constants/gameMetadata';
import { GameVariant } from '../../types/game';
import {
  loadAllGameSessions,
  loadGameSession,
  formatRelativeTime
} from '../../services/gameSessionStorage';
import {
  loadFinishedGames,
  loadPinnedSessions,
  loadPinnedSession,
  pinGameSession,
  unpinGameSession
} from '../../services/gameHistoryStorage';
import './HistoryScreen.css';
import '../../styles/shell-screens.css';

import { SavedGameSession } from '../../services/gameSessionStorage';

interface HistoryScreenProps {
  onContinue: (variant: GameVariant, session?: SavedGameSession | null) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onContinue }) => {
  const { t, language } = useLanguage();
  const [, tick] = useState(0);
  const games = getAvailableGames();
  const continueSessions = loadAllGameSessions();
  const pinnedSessions = loadPinnedSessions();
  const finishedGames = loadFinishedGames();

  const refresh = () => tick((n) => n + 1);

  const continueRows = useMemo(
    () =>
      games
        .map((game) => ({ game, session: continueSessions[game.variant] }))
        .filter((row) => row.session),
    [continueSessions, games]
  );

  const pinnedRows = useMemo(
    () =>
      games
        .map((game) => ({ game, session: pinnedSessions[game.variant] }))
        .filter((row) => row.session),
    [pinnedSessions, games]
  );

  const handlePinFromContinue = (variant: GameVariant) => {
    const session = loadGameSession(variant);
    if (!session) return;
    pinGameSession(session.config, session.state);
    refresh();
  };

  return (
    <div className="shell-screen screen-history">
      <header className="shell-screen-header">
        <h1 className="screen-title">{t.historyScreen.title}</h1>
        <p className="screen-subtitle">{t.historyScreen.subtitle}</p>
      </header>

      <section className="shell-panel">
        <h2 className="shell-section-title">{t.historyScreen.continueSection}</h2>
        {continueRows.length === 0 ? (
          <p className="shell-empty">{t.historyScreen.emptyContinue}</p>
        ) : (
          <ul className="shell-list">
            {continueRows.map(({ game, session }) => (
              <li key={game.variant} className="history-row">
                <div>
                  <strong>{game.name}</strong>
                  <div className="shell-list-row-meta">
                    {t.dashboard.savedAgo(formatRelativeTime(session!.savedAt, language))}
                  </div>
                </div>
                <div className="history-row-actions">
                  <button
                    type="button"
                    className="sueca-btn sueca-btn--secondary sueca-btn--compact"
                    onClick={() => onContinue(game.variant)}
                  >
                    {t.dashboard.continueShort}
                  </button>
                  <button
                    type="button"
                    className="sueca-btn sueca-btn--ghost sueca-btn--compact"
                    onClick={() => handlePinFromContinue(game.variant)}
                    title={t.historyScreen.pinCopy}
                  >
                    📌
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="shell-panel">
        <h2 className="shell-section-title">{t.historyScreen.pinnedSection}</h2>
        {pinnedRows.length === 0 ? (
          <p className="shell-empty">{t.historyScreen.emptyPinned}</p>
        ) : (
          <ul className="shell-list">
            {pinnedRows.map(({ game, session }) => (
              <li key={game.variant} className="history-row">
                <div>
                  <strong>{game.name}</strong>
                  <div className="shell-list-row-meta">
                    {t.historyScreen.pinnedAt(formatRelativeTime(session!.pinnedAt, language))}
                  </div>
                </div>
                <div className="history-row-actions">
                  <button
                    type="button"
                    className="sueca-btn sueca-btn--secondary sueca-btn--compact"
                    onClick={() => {
                      const pinned = loadPinnedSession(game.variant);
                      if (pinned) onContinue(game.variant, pinned);
                    }}
                  >
                    {t.dashboard.continueShort}
                  </button>
                  <button
                    type="button"
                    className="sueca-btn sueca-btn--ghost sueca-btn--compact"
                    onClick={() => {
                      unpinGameSession(game.variant);
                      refresh();
                    }}
                  >
                    {t.historyScreen.unpin}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="shell-panel">
        <h2 className="shell-section-title">{t.historyScreen.finishedSection}</h2>
        {finishedGames.length === 0 ? (
          <p className="shell-empty">{t.historyScreen.emptyFinished}</p>
        ) : (
          <ul className="shell-list">
            {finishedGames.map((entry) => (
              <li key={`${entry.variant}-${entry.finishedAt}`} className="shell-list-row">
                <span>
                  {games.find((g) => g.variant === entry.variant)?.name ?? entry.variant}
                </span>
                <span className="shell-list-row-meta">
                  {formatRelativeTime(entry.finishedAt, language)} · {entry.summary}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
