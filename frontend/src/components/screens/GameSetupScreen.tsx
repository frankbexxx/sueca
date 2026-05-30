import React, { useState, useEffect } from 'react';
import { AIDifficulty, DealingMethod, GameVariant } from '../../types/game';
import { GameConfig } from '../../types/gameConfig';
import { GameSelector } from '../GameSelector';
import { useLanguage } from '../../i18n/useLanguage';
import { useGameSetup } from '../../hooks/useGameSetup';
import { MULTIPLAYER_ENABLED, USE_LOCAL_AI_ONLY } from '../../config/features';
import { saveLastConfig } from '../../services/gameSessionStorage';
import { getAvailableGames } from '../../constants/gameMetadata';
import {
  createSession,
  joinSession,
  subscribeToJoinedCount,
} from '../../services/multiplayerClient';
import '../screens/PlaySetup.css';
import { ShellHeader } from '../navigation/ShellHeader';

type MultiplayerMode = 'none' | 'choose' | 'creating' | 'waiting-host' | 'joining' | 'joined';

interface GameSetupScreenProps {
  onStartGame: (config: GameConfig) => void;
  initialVariant?: GameVariant | null;
  lockVariant?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

export const GameSetupScreen: React.FC<GameSetupScreenProps> = ({
  onStartGame,
  initialVariant,
  lockVariant = false,
  showBack = false,
  onBack
}) => {
  const { t } = useLanguage();
  const setup = useGameSetup(initialVariant ?? undefined);
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const gameName =
    getAvailableGames().find((g) => g.variant === setup.gameVariant)?.name ?? setup.gameVariant;

  // Multiplayer lobby state
  const [mpMode, setMpMode] = useState<MultiplayerMode>('none');
  const [sessionCode, setSessionCode] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinedCount, setJoinedCount] = useState(1);
  const [mpBusy, setMpBusy] = useState(false);
  const [mpError, setMpError] = useState<string | null>(null);
  // State set when joining
  const [joinResult, setJoinResult] = useState<{
    localPlayerIndex: number;
    variant: GameVariant;
    playerNames: string[];
  } | null>(null);

  // Subscribe to joined count when waiting as host
  useEffect(() => {
    if (mpMode !== 'waiting-host' || !sessionCode) return;
    const unsub = subscribeToJoinedCount(sessionCode, (count) => setJoinedCount(count));
    return unsub;
  }, [mpMode, sessionCode]);

  const handleCreateRoom = async () => {
    setMpBusy(true);
    setMpError(null);
    try {
      const cleanNames = setup.playerNames.map((n, i) => n.trim() || `Player ${i + 1}`);
      const code = await createSession(setup.gameVariant, cleanNames);
      setSessionCode(code);
      setJoinedCount(1);
      setMpMode('waiting-host');
    } catch (err) {
      setMpError('Failed to create room. Check your connection.');
    } finally {
      setMpBusy(false);
    }
  };

  const handleJoinRoom = async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) { setMpError('Enter a room code.'); return; }
    setMpBusy(true);
    setMpError(null);
    try {
      const result = await joinSession(code);
      setJoinResult(result);
      setSessionCode(code);
      setMpMode('joined');
    } catch (err) {
      setMpError(err instanceof Error ? err.message : 'Failed to join room.');
    } finally {
      setMpBusy(false);
    }
  };

  const handleStartAsHost = () => {
    const cleanNames = setup.playerNames.map((n, i) => n.trim() || `Player ${i + 1}`);
    const config: GameConfig = {
      ...setup.buildConfig(),
      playerNames: cleanNames,
      multiplayerEnabled: true,
      multiplayerSessionId: sessionCode,
      localPlayerIndex: 0,
    };
    saveLastConfig(config);
    onStartGame(config);
  };

  const handleStartAsJoiner = () => {
    if (!joinResult) return;
    const config: GameConfig = {
      ...setup.buildConfig(),
      playerNames: joinResult.playerNames,
      gameVariant: joinResult.variant,
      multiplayerEnabled: true,
      multiplayerSessionId: sessionCode,
      localPlayerIndex: joinResult.localPlayerIndex,
    };
    saveLastConfig(config);
    onStartGame(config);
  };

  const handleStart = () => {
    setError(null);
    if (!setup.playerNames[0]?.trim()) {
      setError(t.startMenu.errorPlayer1Required);
      return;
    }
    const config = setup.buildConfig();
    saveLastConfig(config);
    onStartGame(config);
  };

  return (
    <div className="screen-play shell-screen">
      <ShellHeader
        title={lockVariant ? gameName : t.playSetup.title}
        subtitle={
          lockVariant ? t.playSetup.subtitleVariant(gameName) : t.playSetup.subtitle
        }
        showBack={showBack}
        onBack={onBack}
      />

      <div className="play-setup-card shell-panel">
        {!lockVariant && (
          <GameSelector selectedGame={setup.gameVariant} onSelectGame={setup.setGameVariant} />
        )}

        <div className="play-setup-section">
          <div className="play-setup-label">{t.startMenu.playerNames}</div>
          <div className="player-buttons-row">
            {[0, 1, 2, 3].map((index) => {
              const inputId = `play-player-${index}`;
              const isEditing = editingPlayerIndex === index;
              return (
                <div key={index} className="player-name-item">
                  {!isEditing ? (
                    <button
                      type="button"
                      className="player-name-button"
                      onClick={() => setEditingPlayerIndex(index)}
                    >
                      {setup.playerNames[index] || t.startMenu.playerPlaceholder(index)}
                    </button>
                  ) : (
                    <input
                      id={inputId}
                      type="text"
                      className="form-input player-name-input"
                      value={setup.playerNames[index] || ''}
                      onChange={(e) => {
                        const copy = [...setup.playerNames];
                        copy[index] = e.target.value;
                        setup.setPlayerNames(copy);
                        setError(null);
                      }}
                      placeholder={t.startMenu.playerPlaceholder(index)}
                      maxLength={20}
                      onBlur={() => setEditingPlayerIndex(null)}
                      autoFocus
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="play-setup-section">
          <label className="play-setup-label" htmlFor="play-ai-difficulty">
            {t.startMenu.aiDifficulty}
          </label>
          <select
            id="play-ai-difficulty"
            className="form-select"
            value={setup.aiDifficulty}
            onChange={(e) => setup.setAIDifficulty(e.target.value as AIDifficulty)}
          >
            <option value="easy">{t.startMenu.difficultyEasy}</option>
            <option value="medium">{t.startMenu.difficultyMedium}</option>
            <option value="hard">{t.startMenu.difficultyHard}</option>
          </select>
          {!USE_LOCAL_AI_ONLY && setup.gameVariant === 'sueca' && setup.aiDifficulty === 'hard' && (
            <p className="play-setup-ai-hint">
              ★ Hard — Dedicated AI
            </p>
          )}
        </div>

        {setup.presetOptions.length > 1 && (
          <div className="play-setup-section">
            <label className="play-setup-label" htmlFor="play-rules-preset">
              {t.playSetup.rulesPreset}
            </label>
            <select
              id="play-rules-preset"
              className="form-select"
              value={setup.rulesPresetId}
              onChange={(e) => setup.setRulesPresetId(e.target.value as typeof setup.rulesPresetId)}
            >
              {setup.presetOptions.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.namePt}
                </option>
              ))}
            </select>
          </div>
        )}

        {setup.gameVariant === 'sueca' && (
          <div className="play-setup-section">
            <div className="play-setup-label">{t.startMenu.dealingMethod}</div>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="play-dealing"
                  value="A"
                  checked={setup.dealingMethod === 'A'}
                  onChange={() => setup.setDealingMethod('A' as DealingMethod)}
                />
                <span>{t.startMenu.methodA}</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="play-dealing"
                  value="B"
                  checked={setup.dealingMethod === 'B'}
                  onChange={() => setup.setDealingMethod('B' as DealingMethod)}
                />
                <span>{t.startMenu.methodB}</span>
              </label>
            </div>
          </div>
        )}

        {MULTIPLAYER_ENABLED && mpMode === 'none' && (
          <div className="play-setup-section">
            <div className="play-setup-label">Multiplayer</div>
            <div className="mp-lobby-buttons">
              <button
                type="button"
                className="sueca-btn sueca-btn--secondary"
                onClick={() => setMpMode('choose')}
              >
                🌐 Jogar Online
              </button>
            </div>
          </div>
        )}

        {MULTIPLAYER_ENABLED && mpMode === 'choose' && (
          <div className="play-setup-section mp-lobby">
            <div className="play-setup-label">Online</div>
            <div className="mp-lobby-buttons">
              <button
                type="button"
                className="sueca-btn sueca-btn--primary"
                disabled={mpBusy}
                onClick={handleCreateRoom}
              >
                {mpBusy ? '…' : '🏠 Criar sala'}
              </button>
              <button
                type="button"
                className="sueca-btn sueca-btn--secondary"
                onClick={() => setMpMode('joining')}
              >
                🔗 Entrar com código
              </button>
              <button
                type="button"
                className="sueca-btn sueca-btn--ghost"
                onClick={() => { setMpMode('none'); setMpError(null); }}
              >
                Cancelar
              </button>
            </div>
            {mpError && <div className="play-setup-error">{mpError}</div>}
          </div>
        )}

        {MULTIPLAYER_ENABLED && mpMode === 'joining' && (
          <div className="play-setup-section mp-lobby">
            <div className="play-setup-label">Entrar na sala</div>
            <input
              type="text"
              className="form-input"
              placeholder="Código da sala (ex: AB3CD)"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              maxLength={5}
              autoFocus
            />
            <div className="mp-lobby-buttons" style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                className="sueca-btn sueca-btn--primary"
                disabled={mpBusy}
                onClick={handleJoinRoom}
              >
                {mpBusy ? '…' : 'Entrar'}
              </button>
              <button
                type="button"
                className="sueca-btn sueca-btn--ghost"
                onClick={() => { setMpMode('choose'); setMpError(null); }}
              >
                Voltar
              </button>
            </div>
            {mpError && <div className="play-setup-error">{mpError}</div>}
          </div>
        )}

        {MULTIPLAYER_ENABLED && mpMode === 'waiting-host' && (
          <div className="play-setup-section mp-lobby">
            <div className="play-setup-label">Sala criada</div>
            <div className="mp-room-code">{sessionCode}</div>
            <p className="mp-lobby-hint">
              Partilha este código. Jogadores conectados: {joinedCount} / 4
            </p>
            <div className="mp-lobby-buttons">
              <button
                type="button"
                className="sueca-btn sueca-btn--primary"
                onClick={handleStartAsHost}
              >
                ▶ Começar jogo
              </button>
              <button
                type="button"
                className="sueca-btn sueca-btn--ghost"
                onClick={() => { setMpMode('none'); setSessionCode(''); }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {MULTIPLAYER_ENABLED && mpMode === 'joined' && joinResult && (
          <div className="play-setup-section mp-lobby">
            <div className="play-setup-label">Sessão encontrada</div>
            <p className="mp-lobby-hint">
              Jogo: <strong>{joinResult.variant}</strong> · Jogador {joinResult.localPlayerIndex + 1}
            </p>
            <div className="mp-lobby-buttons">
              <button
                type="button"
                className="sueca-btn sueca-btn--primary"
                onClick={handleStartAsJoiner}
              >
                ▶ Entrar no jogo
              </button>
              <button
                type="button"
                className="sueca-btn sueca-btn--ghost"
                onClick={() => { setMpMode('none'); setJoinResult(null); setSessionCode(''); }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {(mpMode === 'none' || !MULTIPLAYER_ENABLED) && (
          <>
            {error && <div className="play-setup-error">{error}</div>}
            <button
              type="button"
              className="play-start-btn sueca-btn sueca-btn--primary sueca-btn--block"
              onClick={handleStart}
            >
              {t.startMenu.startGame}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/** @deprecated Use GameSetupScreen */
export const PlaySetup = GameSetupScreen;
