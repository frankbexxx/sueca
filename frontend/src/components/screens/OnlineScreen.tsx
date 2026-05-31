import React, { useState, useEffect } from 'react';
import { GameVariant, AIDifficulty, DealingMethod } from '../../types/game';
import { GameConfig } from '../../types/gameConfig';
import { GameSelector } from '../GameSelector';
import { useLanguage } from '../../i18n/useLanguage';
import { useGameSetup } from '../../hooks/useGameSetup';
import { MULTIPLAYER_ENABLED } from '../../config/features';
import { saveLastConfig } from '../../services/gameSessionStorage';
import { getAvailableGames } from '../../constants/gameMetadata';
import {
  SessionSlot,
  createSession,
  joinSession,
  startSession,
  subscribeToSlots,
} from '../../services/multiplayerClient';
import { ShellHeader } from '../navigation/ShellHeader';
import '../screens/PlaySetup.css';
import './OnlineScreen.css';

type OnlinePhase =
  | 'choose'
  | 'create-config'
  | 'waiting-host'
  | 'join-input'
  | 'waiting-joiner';

interface OnlineScreenProps {
  onStartGame: (config: GameConfig) => void;
  showBack?: boolean;
  onBack?: () => void;
}

const SLOT_NAMES = ['Tu', 'Amigo 1', 'Amigo 2', 'Amigo 3'];

export const OnlineScreen: React.FC<OnlineScreenProps> = ({
  onStartGame,
  showBack = false,
  onBack,
}) => {
  const { t } = useLanguage();
  const setup = useGameSetup();

  const [phase, setPhase] = useState<OnlinePhase>('choose');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Slot configuration (host)
  const [slots, setSlots] = useState<SessionSlot[]>([
    { type: 'human', name: 'Tu', joined: true },
    { type: 'human', name: 'Amigo 1', joined: false },
    { type: 'ai', name: 'Bot', joined: true },
    { type: 'ai', name: 'Bot', joined: true },
  ]);

  // Session
  const [sessionCode, setSessionCode] = useState('');
  const [liveSlots, setLiveSlots] = useState<SessionSlot[]>([]);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinResult, setJoinResult] = useState<{
    localPlayerIndex: number;
    variant: GameVariant;
    slots: SessionSlot[];
  } | null>(null);

  // Subscribe to slots when in lobby
  useEffect(() => {
    if ((phase !== 'waiting-host' && phase !== 'waiting-joiner') || !sessionCode) return;
    const unsub = subscribeToSlots(sessionCode, setLiveSlots);
    return unsub;
  }, [phase, sessionCode]);

  const setSlotType = (index: number, type: 'human' | 'ai') => {
    setSlots((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const name = type === 'ai' ? 'Bot' : (SLOT_NAMES[i] ?? `Amigo ${i}`);
        return { ...s, type, name, joined: type === 'ai' };
      })
    );
  };

  const setSlotName = (index: number, name: string) => {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, name } : s)));
  };

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    const cleanedSlots = slots.map((s, i) => ({
      ...s,
      name: s.name.trim() || (s.type === 'ai' ? 'Bot' : SLOT_NAMES[i] ?? `Jogador ${i + 1}`),
    }));
    try {
      const code = await createSession(setup.gameVariant, cleanedSlots);
      setSessionCode(code);
      setLiveSlots(cleanedSlots);
      setPhase('waiting-host');
    } catch {
      setError('Erro ao criar sala. Verifica a ligação.');
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) { setError('Introduz o código da sala.'); return; }
    setBusy(true);
    setError(null);
    try {
      const result = await joinSession(code);
      setJoinResult(result);
      setSessionCode(code);
      setLiveSlots(result.slots);
      setPhase('waiting-joiner');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar na sala.');
    } finally {
      setBusy(false);
    }
  };

  const handleStartAsHost = async () => {
    await startSession(sessionCode);
    const cleanNames = liveSlots.map((s) => s.name);
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
      playerNames: liveSlots.map((s) => s.name),
      gameVariant: joinResult.variant,
      multiplayerEnabled: true,
      multiplayerSessionId: sessionCode,
      localPlayerIndex: joinResult.localPlayerIndex,
    };
    saveLastConfig(config);
    onStartGame(config);
  };

  const reset = () => {
    setPhase('choose');
    setError(null);
    setSessionCode('');
    setJoinCodeInput('');
    setJoinResult(null);
  };

  if (!MULTIPLAYER_ENABLED) {
    return (
      <div className="screen-play shell-screen">
        <ShellHeader title="Online" showBack={showBack} onBack={onBack} />
        <div className="shell-panel online-unavailable">
          <p>Multiplayer não está disponível nesta versão.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-play shell-screen">
      <ShellHeader
        title="Online"
        subtitle={phase === 'choose' ? 'Joga com amigos em dispositivos diferentes' : undefined}
        showBack={showBack}
        onBack={phase === 'choose' ? onBack : reset}
      />

      <div className="play-setup-card shell-panel">

        {/* ── CHOOSE ── */}
        {phase === 'choose' && (
          <div className="online-choose">
            <button
              className="online-big-btn sueca-btn sueca-btn--primary"
              onClick={() => setPhase('create-config')}
            >
              <span className="online-big-icon">🏠</span>
              <span className="online-big-label">Criar Mesa</span>
              <span className="online-big-sub">Define o jogo e convida amigos</span>
            </button>
            <button
              className="online-big-btn sueca-btn sueca-btn--secondary"
              onClick={() => setPhase('join-input')}
            >
              <span className="online-big-icon">🔗</span>
              <span className="online-big-label">Entrar com Código</span>
              <span className="online-big-sub">Junta-te a uma mesa existente</span>
            </button>
          </div>
        )}

        {/* ── CREATE CONFIG ── */}
        {phase === 'create-config' && (
          <>
            <div className="play-setup-section">
              <div className="play-setup-label">Jogo</div>
              <GameSelector selectedGame={setup.gameVariant} onSelectGame={setup.setGameVariant} />
            </div>

            <div className="play-setup-section">
              <div className="play-setup-label">Lugares</div>
              <div className="online-slots">
                {slots.map((slot, i) => (
                  <div key={i} className="online-slot">
                    <div className="online-slot-num">{i + 1}</div>
                    {i === 0 ? (
                      <div className="online-slot-host">
                        <input
                          className="form-input online-slot-name"
                          value={slot.name}
                          onChange={(e) => setSlotName(i, e.target.value)}
                          maxLength={20}
                          placeholder="O teu nome"
                        />
                        <span className="online-slot-badge online-slot-badge--host">Host</span>
                      </div>
                    ) : (
                      <div className="online-slot-row">
                        <div className="online-slot-toggle">
                          <button
                            type="button"
                            className={`online-toggle-btn ${slot.type === 'human' ? 'active' : ''}`}
                            onClick={() => setSlotType(i, 'human')}
                          >
                            👤
                          </button>
                          <button
                            type="button"
                            className={`online-toggle-btn ${slot.type === 'ai' ? 'active' : ''}`}
                            onClick={() => setSlotType(i, 'ai')}
                          >
                            🤖
                          </button>
                        </div>
                        {slot.type === 'human' ? (
                          <input
                            className="form-input online-slot-name"
                            value={slot.name}
                            onChange={(e) => setSlotName(i, e.target.value)}
                            maxLength={20}
                            placeholder={`Amigo ${i}`}
                          />
                        ) : (
                          <span className="online-slot-ai-label">Bot (IA)</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="play-setup-error">{error}</div>}

            <button
              type="button"
              className="sueca-btn sueca-btn--primary sueca-btn--block"
              disabled={busy}
              onClick={handleCreate}
            >
              {busy ? 'A criar…' : '🏠 Criar Sala'}
            </button>
          </>
        )}

        {/* ── JOIN INPUT ── */}
        {phase === 'join-input' && (
          <>
            <div className="play-setup-section">
              <div className="play-setup-label">Código da sala</div>
              <input
                type="text"
                className="form-input online-code-input"
                placeholder="Ex: AB3CD"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                maxLength={5}
                autoFocus
              />
            </div>

            {error && <div className="play-setup-error">{error}</div>}

            <button
              type="button"
              className="sueca-btn sueca-btn--primary sueca-btn--block"
              disabled={busy}
              onClick={handleJoin}
            >
              {busy ? 'A entrar…' : '🔗 Entrar'}
            </button>
          </>
        )}

        {/* ── LOBBY (host) ── */}
        {phase === 'waiting-host' && (
          <>
            <div className="play-setup-section">
              <div className="play-setup-label">Código da sala</div>
              <div className="mp-room-code">{sessionCode}</div>
              <p className="mp-lobby-hint">Partilha este código com os teus amigos</p>
            </div>

            <div className="play-setup-section">
              <div className="play-setup-label">Jogadores</div>
              <LobbySlots slots={liveSlots} />
            </div>

            <button
              type="button"
              className="sueca-btn sueca-btn--primary sueca-btn--block"
              onClick={handleStartAsHost}
            >
              ▶ Iniciar Jogo
            </button>
          </>
        )}

        {/* ── LOBBY (joiner) ── */}
        {phase === 'waiting-joiner' && (
          <>
            <div className="play-setup-section">
              <div className="play-setup-label">Sala: {sessionCode}</div>
              <p className="mp-lobby-hint">
                Entraste como <strong>{liveSlots[joinResult?.localPlayerIndex ?? 0]?.name}</strong> (lugar {(joinResult?.localPlayerIndex ?? 0) + 1})
              </p>
            </div>

            <div className="play-setup-section">
              <div className="play-setup-label">Jogadores</div>
              <LobbySlots slots={liveSlots} localIndex={joinResult?.localPlayerIndex} />
            </div>

            <button
              type="button"
              className="sueca-btn sueca-btn--primary sueca-btn--block"
              onClick={handleStartAsJoiner}
            >
              ▶ Entrar no Jogo
            </button>
            <p className="mp-lobby-hint" style={{ marginTop: '4px' }}>
              Aguarda que o host inicie, ou entra já — a mesa sincroniza automaticamente.
            </p>
          </>
        )}

      </div>
    </div>
  );
};

// ── Lobby slot list component ────────────────────────────────────────────────

interface LobbySlotsProps {
  slots: SessionSlot[];
  localIndex?: number;
}

const LobbySlots: React.FC<LobbySlotsProps> = ({ slots, localIndex }) => (
  <ul className="online-lobby-slots">
    {slots.map((slot, i) => (
      <li key={i} className={`online-lobby-slot ${slot.joined ? 'joined' : 'waiting'}`}>
        <span className="online-lobby-slot-icon">
          {slot.type === 'ai' ? '🤖' : slot.joined ? '✅' : '⏳'}
        </span>
        <span className="online-lobby-slot-name">
          {slot.name}
          {i === localIndex && <span className="online-slot-badge online-slot-badge--you"> (tu)</span>}
        </span>
        <span className="online-lobby-slot-status">
          {slot.type === 'ai' ? 'IA' : slot.joined ? 'Pronto' : 'A aguardar…'}
        </span>
      </li>
    ))}
  </ul>
);
