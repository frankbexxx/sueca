import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { getAvailableGames } from '../../constants/gameMetadata';
import { GameVariant } from '../../types/game';
import {
  loadAllGameSessions,
  loadGameSession,
  formatRelativeTime,
  SavedGameSession
} from '../../services/gameSessionStorage';
import {
  loadFinishedGames,
  loadPinnedSessions,
  loadPinnedSession,
  pinGameSession,
  unpinGameSession
} from '../../services/gameHistoryStorage';
import { ShellHeader } from '../navigation/ShellHeader';
import { ShellHubList } from '../navigation/ShellHubList';
import './HistoryScreen.css';
import '../../styles/shell-screens.css';

interface HistoryHubScreenProps {
  showBack: boolean;
  onBack: () => void;
  onOpenSection: (section: 'continue' | 'pinned' | 'finished') => void;
}

export const HistoryHubScreen: React.FC<HistoryHubScreenProps> = ({
  showBack,
  onBack,
  onOpenSection
}) => {
  const { t } = useLanguage();
  const continueCount = Object.keys(loadAllGameSessions()).length;
  const pinnedCount = Object.keys(loadPinnedSessions()).length;
  const finishedCount = loadFinishedGames().length;

  return (
    <div className="shell-screen screen-history">
      <ShellHeader
        title={t.historyScreen.title}
        subtitle={t.historyScreen.subtitle}
        showBack={showBack}
        onBack={onBack}
      />
      <ShellHubList
        items={[
          {
            id: 'continue',
            label: t.historyScreen.continueSection,
            hint: t.historyScreen.hubContinueHint(continueCount),
            onClick: () => onOpenSection('continue')
          },
          {
            id: 'pinned',
            label: t.historyScreen.pinnedSection,
            hint: t.historyScreen.hubPinnedHint(pinnedCount),
            onClick: () => onOpenSection('pinned')
          },
          {
            id: 'finished',
            label: t.historyScreen.finishedSection,
            hint: t.historyScreen.hubFinishedHint(finishedCount),
            onClick: () => onOpenSection('finished')
          }
        ]}
      />
    </div>
  );
};

interface HistoryListScreenProps {
  section: 'continue' | 'pinned' | 'finished';
  showBack: boolean;
  onBack: () => void;
  onContinue: (variant: GameVariant, session?: SavedGameSession | null) => void;
}

export const HistoryListScreen: React.FC<HistoryListScreenProps> = ({
  section,
  showBack,
  onBack,
  onContinue
}) => {
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

  const title =
    section === 'continue'
      ? t.historyScreen.continueSection
      : section === 'pinned'
        ? t.historyScreen.pinnedSection
        : t.historyScreen.finishedSection;

  return (
    <div className="shell-screen screen-history">
      <ShellHeader title={title} showBack={showBack} onBack={onBack} />

      {section === 'continue' && (
        <section className="shell-panel">
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
      )}

      {section === 'pinned' && (
        <section className="shell-panel">
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
      )}

      {section === 'finished' && (
        <section className="shell-panel">
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
      )}
    </div>
  );
};
