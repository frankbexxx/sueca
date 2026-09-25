/**
 * Home — REL-HOME-01 production redesign.
 * Continue (active session) · Jogar 2×2 · last activity · 4-tab shell.
 */
import React, { useEffect, useState } from 'react';
import { GameVariant } from '../../types/game';
import type { RulesPresetId } from '../../constants/rulesPresets';
import { getGameMetadata } from '../../constants/gameMetadata';
import { getPreset } from '../../constants/rulesPresets';
import {
  loadAllGameSessions,
  loadLastConfig,
  loadLocalStats,
  SavedGameSession,
  isOfflineMultiplayerSession
} from '../../services/gameSessionStorage';
import { getP1Name } from '../../services/setupPreferences';
import { getKingPtState } from '../../models/games/KingPtGame';
import { kingHudMatchProgress } from '../../models/games/king/kingContracts';
import { isKingSyntheticPreset } from '../../models/games/king/kingSyntheticMode';
import './HomeDashboard.css';
import '../../styles/shell-screens.css';

type GameId = 'sueca' | 'spades' | 'hearts' | 'king';

const GAMES: { id: GameId; name: string; line: string }[] = [
  { id: 'sueca', name: 'Sueca', line: 'Parcerias' },
  { id: 'spades', name: 'Spades', line: 'Contratos' },
  { id: 'hearts', name: 'Hearts', line: 'Evitar pontos' },
  { id: 'king', name: 'King', line: 'Negativos e Festas' }
];

interface HomeDashboardProps {
  onContinue: (variant: GameVariant, session?: SavedGameSession | null) => void;
  onOpenSetup: (variant: GameVariant, rulesPresetId?: RulesPresetId) => void;
  onOpenActivity: () => void;
}

function TileSignature({ game }: { game: GameId }) {
  if (game === 'sueca') {
    return (
      <span className="home-tile-sig" aria-hidden>
        <span className="home-suit home-suit--heart">♥</span>
        <span className="home-sig-join">·</span>
        <span className="home-suit home-suit--spade">♠</span>
      </span>
    );
  }
  if (game === 'spades') {
    return (
      <span className="home-tile-sig" aria-hidden>
        <span className="home-suit home-suit--spade">♠</span>
        <span className="home-sig-cue">〃</span>
      </span>
    );
  }
  if (game === 'hearts') {
    return (
      <span className="home-tile-sig" aria-hidden>
        <span className="home-suit home-suit--heart">♥</span>
        <span className="home-sig-cue home-sig-cue--avoid">−</span>
      </span>
    );
  }
  return (
    <span className="home-tile-sig" aria-hidden>
      <span className="home-king-mark">
        K<span className="home-suit home-suit--heart">♥</span>
      </span>
    </span>
  );
}

function sessionHeadline(session: SavedGameSession, locale: 'pt' | 'en'): string {
  const variant = session.config.gameVariant;
  const meta = getGameMetadata(variant);
  if (variant === 'king') {
    const synthetic = isKingSyntheticPreset(session.config.rulesPresetId);
    const name = synthetic
      ? getPreset('king-pt-synthetic').namePt
      : getPreset('king-pt-normal').namePt;
    try {
      const king = getKingPtState(session.state);
      const progress = kingHudMatchProgress(king.gameIndex, locale, {
        syntheticSession: synthetic
      });
      return `${name} · ${progress}`;
    } catch {
      return name;
    }
  }
  return meta.name;
}

function pickResumableSession(): SavedGameSession | null {
  const all = loadAllGameSessions();
  let best: SavedGameSession | null = null;
  for (const session of Object.values(all)) {
    if (!session) continue;
    if (isOfflineMultiplayerSession(session)) continue;
    if (!best || session.savedAt > best.savedAt) best = session;
  }
  return best;
}

function lastActivityLabel(): string | null {
  const stats = loadLocalStats();
  if (!stats.lastPlayedVariant) return null;
  const variant = stats.lastPlayedVariant;
  const last = loadLastConfig();
  if (variant === 'king' && last?.gameVariant === 'king') {
    const synthetic = isKingSyntheticPreset(last.rulesPresetId);
    return synthetic
      ? getPreset('king-pt-synthetic').namePt
      : getPreset('king-pt-normal').namePt;
  }
  return getGameMetadata(variant).name;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onContinue,
  onOpenSetup,
  onOpenActivity
}) => {
  const [kingSheet, setKingSheet] = useState(false);
  const activeSession = pickResumableSession();
  const playerName = getP1Name();
  const lastLabel = lastActivityLabel();

  useEffect(() => {
    if (!kingSheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setKingSheet(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [kingSheet]);

  const onTile = (id: GameId) => {
    if (id === 'king') {
      setKingSheet(true);
      return;
    }
    onOpenSetup(id);
  };

  return (
    <div className={`screen-home${kingSheet ? ' screen-home--sheet-open' : ''}`}>
      <header className="home-header">
        <div>
          <h1 className="home-brand">Suecão</h1>
          <p className="home-greet">Olá, {playerName}</p>
        </div>
      </header>

      {activeSession && (
        <section className="home-continue" aria-label="Sessão activa">
          <div className="home-continue-copy">
            <p className="home-continue-kicker">Sessão activa</p>
            <p className="home-continue-title">
              {sessionHeadline(activeSession, 'pt')}
            </p>
          </div>
          <button
            type="button"
            className="home-continue-cta"
            onClick={() => onContinue(activeSession.config.gameVariant, activeSession)}
          >
            Continuar
          </button>
        </section>
      )}

      <section className="home-play" aria-labelledby="home-play-heading">
        <h2 id="home-play-heading" className="home-section-label">
          Jogar
        </h2>
        <div className="home-grid" role="list">
          {GAMES.map((g) => (
            <button
              key={g.id}
              type="button"
              role="listitem"
              className={`home-tile home-tile--${g.id}`}
              onClick={() => onTile(g.id)}
              aria-label={`${g.name}. ${g.line}`}
            >
              <span className="home-tile-inner">
                <TileSignature game={g.id} />
                <span className="home-tile-name">{g.name}</span>
                <span className="home-tile-line">{g.line}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {lastLabel && (
        <p className="home-last-activity">
          Última: {lastLabel} ·{' '}
          <button type="button" className="home-last-link" onClick={onOpenActivity}>
            Ver actividade
          </button>
        </p>
      )}

      {kingSheet && (
        <div className="home-sheet-root" role="presentation">
          <button
            type="button"
            className="home-sheet-scrim"
            aria-label="Fechar"
            onClick={() => setKingSheet(false)}
          />
          <div
            className="home-king-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-king-sheet-title"
          >
            <div className="home-sheet-handle" aria-hidden />
            <h2 id="home-king-sheet-title" className="home-sheet-title">
              Escolher King
            </h2>
            <button
              type="button"
              className="home-mode-option"
              onClick={() => {
                setKingSheet(false);
                onOpenSetup('king', 'king-pt-normal');
              }}
            >
              <span className="home-mode-name">King</span>
              <span className="home-mode-desc">
                {getPreset('king-pt-normal').descriptionPt}
              </span>
            </button>
            <button
              type="button"
              className="home-mode-option home-mode-option--emphasis"
              onClick={() => {
                setKingSheet(false);
                onOpenSetup('king', 'king-pt-synthetic');
              }}
            >
              <span className="home-mode-name">King Sintético</span>
              <span className="home-mode-desc">Todos os negativos + 4 Festas</span>
            </button>
            <button
              type="button"
              className="home-sheet-cancel"
              onClick={() => setKingSheet(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
