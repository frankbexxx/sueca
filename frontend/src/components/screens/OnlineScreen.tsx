import React, { useState, useEffect } from 'react';
import { GameVariant } from '../../types/game';
import { GameConfig } from '../../types/gameConfig';
import { GameSelector } from '../GameSelector';
import { useGameSetup } from '../../hooks/useGameSetup';
import { MULTIPLAYER_ENABLED } from '../../config/features';
import { saveLastConfig } from '../../services/gameSessionStorage';
import {
  SessionSlot,
  createSession,
  joinSession,
  startSession,
  subscribeToSlots,
  subscribeToSessionStatus,
  fetchSessionState,
} from '../../services/multiplayerClient';
import { clearMultiplayerLocalStorage } from '../../services/gameSessionStorage';
import { ShellHeader } from '../navigation/ShellHeader';
import { useLanguage } from '../../i18n/useLanguage';
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

const SLOT_NAMES_PT = ['Tu', 'Amigo 1', 'Amigo 2', 'Amigo 3'];

export const OnlineScreen: React.FC<OnlineScreenProps> = ({
  onStartGame,
  showBack = false,
  onBack,
}) => {
  const { t } = useLanguage();
  const o = t.onlineScreen;
  const setup = useGameSetup();

  const [phase, setPhase] = useState<OnlinePhase>('choose');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [slots, setSlots] = useState<SessionSlot[]>([
    { type: 'human', name: SLOT_NAMES_PT[0], joined: true },
    { type: 'human', name: SLOT_NAMES_PT[1], joined: false },
    { type: 'ai', name: 'Bot', joined: true },
    { type: 'ai', name: 'Bot', joined: true },
  ]);

  const [sessionCode, setSessionCode] = useState('');
  const [liveSlots, setLiveSlots] = useState<SessionSlot[]>([]);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinResult, setJoinResult] = useState<{
    localPlayerIndex: number;
    variant: GameVariant;
    slots: SessionSlot[];
  } | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'waiting' | 'playing' | 'ended'>('waiting');
  const [hostHasPublished, setHostHasPublished] = useState(false);

  useEffect(() => {
    if ((phase !== 'waiting-host' && phase !== 'waiting-joiner') || !sessionCode) return;
    const unsub = subscribeToSlots(sessionCode, setLiveSlots);
    return unsub;
  }, [phase, sessionCode]);

  useEffect(() => {
    if (phase !== 'waiting-joiner' || !sessionCode) return;
    const unsubStatus = subscribeToSessionStatus(sessionCode, setSessionStatus);
    void fetchSessionState(sessionCode)
      .then((state) => {
        if (state) setHostHasPublished(true);
      })
      .catch(() => {});
    return unsubStatus;
  }, [phase, sessionCode]);

  const setSlotType = (index: number, type: 'human' | 'ai') => {
    setSlots((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const name = type === 'ai' ? 'Bot' : (SLOT_NAMES_PT[i] ?? o.friendPlaceholder(i));
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
      name: s.name.trim() || (s.type === 'ai' ? 'Bot' : SLOT_NAMES_PT[i] ?? o.friendPlaceholder(i)),
    }));
    try {
      const code = await createSession('sueca', cleanedSlots);
      setSessionCode(code);
      setLiveSlots(cleanedSlots);
      setPhase('waiting-host');
    } catch {
      setError(o.errorCreate);
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) {
      setError(o.errorJoinEmpty);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await joinSession(code);
      setJoinResult(result);
      setSessionCode(code);
      setLiveSlots(result.slots);
      setPhase('waiting-joiner');
    } catch (err) {
      setError(err instanceof Error ? err.message : o.errorJoinGeneric);
    } finally {
      setBusy(false);
    }
  };

  const handleStartAsHost = async () => {
    await startSession(sessionCode);
    const config: GameConfig = {
      ...setup.buildConfig(),
      playerNames: liveSlots.map((s) => s.name),
      gameVariant: 'sueca',
      multiplayerEnabled: true,
      multiplayerSessionId: sessionCode,
      localPlayerIndex: 0,
      multiplayerSlots: liveSlots.map((s) => s.type),
    };
    saveLastConfig(config);
    onStartGame(config);
  };

  const handleStartAsJoiner = () => {
    if (!joinResult) return;
    const config: GameConfig = {
      ...setup.buildConfig(),
      playerNames: liveSlots.map((s) => s.name),
      gameVariant: 'sueca',
      multiplayerEnabled: true,
      multiplayerSessionId: sessionCode,
      localPlayerIndex: joinResult.localPlayerIndex,
      multiplayerSlots: liveSlots.map((s) => s.type),
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
    setSessionStatus('waiting');
    setHostHasPublished(false);
    clearMultiplayerLocalStorage();
  };

  if (!MULTIPLAYER_ENABLED) {
    return (
      <div className="screen-play shell-screen">
        <ShellHeader title={o.title} showBack={showBack} onBack={onBack} />
        <div className="shell-panel online-unavailable">
          <p>{o.unavailable}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-play shell-screen">
      <ShellHeader
        title={o.title}
        subtitle={phase === 'choose' ? o.subtitle : undefined}
        showBack={showBack}
        onBack={phase === 'choose' ? onBack : reset}
      />

      <div className="play-setup-card shell-panel">

        {phase === 'choose' && (
          <div className="online-choose">
            <button
              className="online-big-btn sueca-btn sueca-btn--primary"
              onClick={() => setPhase('create-config')}
            >
              <span className="online-big-icon">🏠</span>
              <span className="online-big-label">{o.createTable}</span>
              <span className="online-big-sub">{o.createTableSub}</span>
            </button>
            <button
              className="online-big-btn sueca-btn sueca-btn--secondary"
              onClick={() => setPhase('join-input')}
            >
              <span className="online-big-icon">🔗</span>
              <span className="online-big-label">{o.joinWithCode}</span>
              <span className="online-big-sub">{o.joinWithCodeSub}</span>
            </button>
          </div>
        )}

        {phase === 'create-config' && (
          <>
            <div className="play-setup-section">
              <div className="play-setup-label">{o.gameLabel}</div>
              <GameSelector selectedGame="sueca" onSelectGame={setup.setGameVariant} />
              <p className="mp-lobby-hint">{o.suecaOnlyHint}</p>
            </div>

            <div className="play-setup-section">
              <div className="play-setup-label">{o.seatsLabel}</div>
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
                          placeholder={o.yourNamePlaceholder}
                        />
                        <span className="online-slot-badge online-slot-badge--host">{o.hostBadge}</span>
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
                            placeholder={o.friendPlaceholder(i)}
                          />
                        ) : (
                          <span className="online-slot-ai-label">{o.botLabel}</span>
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
              {busy ? o.creating : o.createRoom}
            </button>
          </>
        )}

        {phase === 'join-input' && (
          <>
            <div className="play-setup-section">
              <div className="play-setup-label">{o.joinCodeLabel}</div>
              <input
                type="text"
                className="form-input online-code-input"
                placeholder={o.joinCodePlaceholder}
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
              {busy ? o.joining : o.join}
            </button>
          </>
        )}

        {phase === 'waiting-host' && (
          <>
            <div className="play-setup-section">
              <div className="play-setup-label">{o.roomCodeLabel}</div>
              <div className="mp-room-code">{sessionCode}</div>
              <p className="mp-lobby-hint">{o.shareCodeHint}</p>
            </div>

            <div className="play-setup-section">
              <div className="play-setup-label">{o.playersLabel}</div>
              <LobbySlots slots={liveSlots} labels={o} />
            </div>

            <button
              type="button"
              className="sueca-btn sueca-btn--primary sueca-btn--block"
              onClick={handleStartAsHost}
            >
              {o.startGame}
            </button>
          </>
        )}

        {phase === 'waiting-joiner' && (
          <>
            <div className="play-setup-section">
              <div className="play-setup-label">{o.roomTitle(sessionCode)}</div>
              <p className="mp-lobby-hint">
                {o.joinedAs(
                  liveSlots[joinResult?.localPlayerIndex ?? 0]?.name ?? '',
                  (joinResult?.localPlayerIndex ?? 0) + 1
                )}
              </p>
            </div>

            <div className="play-setup-section">
              <div className="play-setup-label">{o.playersLabel}</div>
              <LobbySlots
                slots={liveSlots}
                localIndex={joinResult?.localPlayerIndex}
                labels={o}
              />
            </div>

            <button
              type="button"
              className="sueca-btn sueca-btn--primary sueca-btn--block"
              disabled={sessionStatus !== 'playing' && !hostHasPublished}
              onClick={handleStartAsJoiner}
            >
              {o.enterGame}
            </button>
            <p className="mp-lobby-hint" style={{ marginTop: '4px' }}>
              {o.waitForHostHint}
            </p>
          </>
        )}

      </div>
    </div>
  );
};

interface LobbyLabels {
  youBadge: string;
  slotReady: string;
  slotWaiting: string;
  slotAi: string;
}

interface LobbySlotsProps {
  slots: SessionSlot[];
  localIndex?: number;
  labels: LobbyLabels;
}

const LobbySlots: React.FC<LobbySlotsProps> = ({ slots, localIndex, labels }) => (
  <ul className="online-lobby-slots">
    {slots.map((slot, i) => (
      <li key={i} className={`online-lobby-slot ${slot.joined ? 'joined' : 'waiting'}`}>
        <span className="online-lobby-slot-icon">
          {slot.type === 'ai' ? '🤖' : slot.joined ? '✅' : '⏳'}
        </span>
        <span className="online-lobby-slot-name">
          {slot.name}
          {i === localIndex && (
            <span className="online-slot-badge online-slot-badge--you">{labels.youBadge}</span>
          )}
        </span>
        <span className="online-lobby-slot-status">
          {slot.type === 'ai' ? labels.slotAi : slot.joined ? labels.slotReady : labels.slotWaiting}
        </span>
      </li>
    ))}
  </ul>
);
