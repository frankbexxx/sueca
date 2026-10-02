import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameState, Card, Suit, DealAlignment, PlayDirection } from '../types/game';
import { GameConfig } from '../types/gameConfig';
import { InGameBar } from './navigation/InGameBar';
import { InGameSettingsOverlay } from './navigation/InGameSettingsOverlay';
import { RulesSheet } from './RulesSheet';
import { RoundEndModal } from './RoundEndModal';
import { GameOverModal } from './GameOverModal';
import { ConfirmDialog } from './common/ConfirmDialog';
import { useSound } from '../hooks/useSound';
import { useLanguage } from '../i18n/useLanguage';
import './GameBoard.css';
import {
  AiPlayRequestError,
  isExternalAiAvailable,
  isExternalAiCancellation,
  requestAiPlay,
} from '../services/aiClient';
import {
  bindAiTurnScope,
  createAiTurnGate,
  isSameLiveAiTurn,
  runGuardedAiPlay,
  type AiTurnScope,
} from '../services/aiTurnGate';
import { playCardAndLogDecision, playFirstLegalAndLogDecision } from '../cardIntelligence';
import { SUIT_TO_CODE, SUIT_TO_NAME, RANK_TO_IMAGE_NAME } from '../utils/cardMappings';
import { getCardImagePath } from '../constants/cardAssets';
import { isDevMode, publicUrl } from '../config/runtimeEnv';
import {
  GAME_OVER_DELAY_MS,
  ROUND_START_SFX_DELAY_MS,
  TRICK_COLLECT_DELAY_MS
} from '../constants/gameConstants';
import { resolveAiPlayDelayMs } from '../models/games/suecaAiPacing';
import {
  getHeartsState,
  heartsCardPlayArmDelayMs,
  isHeartsPassExchangeLocked
} from '../models/games/HeartsGame';
import {
  kingFestaTickDelayMs,
  kingSyntheticScoreHoldMs,
  spadesAiBidDelayMs
} from '../models/games/gamePacingPolicy';
import { getDealDelayMs } from '../constants/dealAnimationPreferences';
import { createGameOverExitController, shouldAutoExitAfterGameOver } from '../utils/gameOverExitTimer';
import { isHandPlayActionAllowed } from '../utils/handCardVisual';
import { resolveGameBoardFlow } from '../utils/gameFlowOrchestrator';
import {
  resolveHumanGameAudioResult,
  shouldPlayRoundEndCue
} from '../utils/roundGameCues';
import { historyFieldsFromMatchResult } from '../models/matchResult';
import { createVariantFlowControllers } from '../flow/createVariantFlowControllers';
import { buildTableRenderModel } from '../table/buildTableRenderModel';
import {
  mapTableModelToDomDockProps,
  mapTableModelToDomHandProps,
  mapTableModelToDomSurfaceProps
} from '../table/mapTableModelToDomProps';
import { resolveTableRendererForBrowser } from '../renderers/phaser/rendererFlag';
import { PhaserTableErrorBoundary } from '../renderers/phaser/PhaserTableErrorBoundary';
import { GameFactory } from '../models/games/GameFactory';
import { GameAdapter } from '../models/games/GameAdapter';
import { KingGame } from '../models/games/KingGame';
import {
  formatDevKingFestaBadge,
  parseDevKingFestaParams,
  type DevKingFestaJump
} from '../dev/kingFestaJump';
import {
  applyDevNegativeFixture,
  formatDevKingNegBadge,
  parseDevKingNegParams
} from '../dev/kingNegativeJump';
import {
  parseDevKingSyntheticParams
} from '../dev/kingSyntheticJump';
import type { KingNegativeContract } from '../models/games/king/kingContracts';
import { isKingPtEnginePreset } from '../models/games/king/kingSyntheticMode';
import { PlayerHand } from './PlayerHand';
import { GameActions } from './GameActions';
import { ScoreStrip } from './table/ScoreStrip';
import { TableSurface } from './table/TableSurface';
import { LocalPlayerDock } from './table/LocalPlayerDock';
import { useLayoutSnapshot } from '../hooks/useLayoutSnapshot';
import { SpadesBidMinibox } from './SpadesBidMinibox';
import { isBlindNilDecisionPending } from '../models/games/SpadesGame';
import { HeartsPassModal, HeartsPassReceipt } from './HeartsPassModal';
import { SuecaDealingModal } from './SuecaDealingModal';
import { SuecaPostDealCard } from './SuecaPostDealCard';
import { SuecaRitualDebugControl } from './SuecaRitualDebugControl';
import {
  isSuecaRitualDebugEnabled,
  type SuecaRitualDebugPhase
} from '../dev/suecaRitualDebug';
import {
  nextSuecaPostDealPhase,
  physicalDealFromAlignment,
  postDealDurationMs,
  postDealFocusForPhase,
  postDealHandsHidden,
  postDealPlayLocked,
  postDealTrumpHudHidden,
  resolvePostDealTimings,
  shouldMountSuecaDealRitual,
  suecaPresentationPlayReady,
  type SuecaPhysicalDealDirection,
  type SuecaPostDealFixedTimings,
  type SuecaPostDealPhase,
  type SuecaRitualRole
} from '../models/games/suecaHandRitual';
import { KingFestaFlowModal } from './KingFestaFlowModal';
import { KingKohRevealModal } from './KingKohRevealModal';
import { KingScoreSheetModal } from './KingScoreSheetModal';
import { KingSyntheticRoundCompleteCue } from './KingSyntheticRoundCompleteCue';
import { EarlyRoundEndModal } from './EarlyRoundEndModal';
import { resolvePresetId } from '../constants/rulesPresets';
import { recordGameFinished, showInterstitialIfDue } from '../services/adsService';
import { recordFinishedGame, pinGameSession } from '../services/gameHistoryStorage';
import {
  recordMatchHistory,
  resolveMatchCompletionId,
  snapshotPlayersFromGame
} from '../services/matchHistoryStorage';
import {
  startDiagnosticMatch,
  recordDealCompleted,
  recordAuctionAction,
  recordFestaDecision,
  completeDiagnosticMatch,
  abandonDiagnosticMatch
} from '../diagnostics/session';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { fetchSessionState, subscribeToActions } from '../services/multiplayerClient';
import { applyHostAction } from '../multiplayer/applyHostAction';
import { normalizeGameState } from '../multiplayer/normalizeGameState';
import { mpLog, mpWarn } from '../utils/mpDebug';
import {
  saveGameSession,
  clearGameSession,
  recordGameResult,
  SavedGameSession,
  stripMultiplayerFields
} from '../services/gameSessionStorage';

export interface GameBoardProps {
  config: GameConfig;
  resumeSession?: SavedGameSession | null;
  onExit: () => void;
  onRestartAsSolo?: (variant: import('../types/game').GameVariant) => void;
}

const SuecaPhaserRenderer = React.lazy(() =>
  import('../renderers/phaser/SuecaPhaserRenderer').then((m) => ({
    default: m.SuecaPhaserRenderer
  }))
);

/**
 * Main game board component - renders the entire Sueca game interface
 * Manages game state, player interactions, AI moves, and UI rendering
 */
export const GameBoard: React.FC<GameBoardProps> = ({
  config,
  resumeSession,
  onExit,
  onRestartAsSolo
}) => {
  const { t, language } = useLanguage();
  const [gameStarted, setGameStarted] = useState(false);
  const [aiSource, setAiSource] = useState<'external' | 'local'>('local');
  
  const { playerNames, aiDifficulty, gameVariant, rulesPresetId } = config;
  const sessionPlayDirection: PlayDirection =
    config.playDirection === 'left' ? 'left' : 'right';
  /** Last confirmed Sueca deal packaging (MP host-action fallback; not modal SoT). */
  const dealAlignmentRef = useRef<DealAlignment>('same');
  /** UX-SUECA-03 — transient ritual focus (not GameState / not persisted). */
  const [ritualFocus, setRitualFocus] = useState<{
    seat: number;
    role: SuecaRitualRole;
  } | null>(null);
  /** UX-SUECA-04 — table painted before ritual starts. */
  const [tableReadyForRitual, setTableReadyForRitual] = useState(false);
  /** UX-SUECA-04 — post-Distribuir presentation phase (null = unlocked / idle). */
  const [postDealPhase, setPostDealPhase] = useState<SuecaPostDealPhase | null>(null);
  const [postDealPhysical, setPostDealPhysical] = useState<SuecaPhysicalDealDirection>('right');
  /** UX-SUECA-06 — timings + seats for phase-driven advances (timer starts after paint). */
  const postDealCtxRef = useRef<{
    timings: SuecaPostDealFixedTimings;
    dealerIndex: number;
    firstPlayerIndex: number;
  } | null>(null);
  /** UX-SUECA-08 — `?ritualDebug=1` (read once; not persisted). */
  const ritualDebug = useMemo(() => isSuecaRitualDebugEnabled(), []);
  const [ritualDebugPhase, setRitualDebugPhase] = useState<SuecaRitualDebugPhase | null>(
    null
  );
  const [ritualDebugPreDealReleased, setRitualDebugPreDealReleased] = useState(false);
  const [ritualDebugPlayReadyHold, setRitualDebugPlayReadyHold] = useState(false);
  const [ritualDebugAdvanceNonce, setRitualDebugAdvanceNonce] = useState(0);
  const multiplayerSessionCode = (config.multiplayerSessionId ?? '').trim();
  const isMultiplayer = Boolean(config.multiplayerEnabled);
  const isMultiplayerActive = isMultiplayer && multiplayerSessionCode.length > 0;
  const multiplayerPlayerIndex = config.localPlayerIndex ?? 0;
  const isHost = isMultiplayerActive && multiplayerPlayerIndex === 0;
  const isJoiner = isMultiplayerActive && multiplayerPlayerIndex !== 0;
  const isHostOrSolo = !isMultiplayer || multiplayerPlayerIndex === 0;
  const [waitingForHost, setWaitingForHost] = useState(isJoiner);
  const [devKingFestaJump, setDevKingFestaJump] = useState<DevKingFestaJump | null>(null);
  const [devKingNegContract, setDevKingNegContract] = useState<KingNegativeContract | null>(
    null
  );

  const [gameAdapter, setGameAdapter] = useState<GameAdapter | null>(null);
  const gameAdapterRef = useRef<GameAdapter | null>(null);
  const aiTurnGateRef = useRef(createAiTurnGate());
  const latestRemoteStateRef = useRef<GameState | null>(null);
  const processedActionIdsRef = useRef<Set<string>>(new Set());
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;
  const gameOverExitRef = useRef(
    createGameOverExitController(() => onExitRef.current(), GAME_OVER_DELAY_MS)
  );
  const gameOverStatsRecordedRef = useRef(false);
  /** Stable id for one physical match completion (survives duplicate effect runs). */
  const matchHistoryIdRef = useRef<string | null>(null);

  /**
   * Game state snapshot - reactive state for UI updates
   * Falls back to minimal valid state if game is null or initialization fails
   */
  const [gameState, setGameState] = useState<GameState>(() => {
    // Return minimal valid state when no game exists
    return {
      players: [],
      currentPlayerIndex: 0,
      dealerIndex: 0,
      trumpSuit: null,
      trumpCard: null,
      currentTrick: [],
      trickLeader: 0,
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      completedPentes: [],
      round: 1,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: true,
      playDirection: 'right',
      dealAlignment: 'same',
      schemaVersion: 2,
      waitingForRoundStart: false,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [],
      isPaused: false,
      playerName: 'Player 1',
      aiDifficulty: 'medium',
      partnerSignals: [],
      nextRoundValue: undefined,
      variant: 'sueca'
    };
  });
  // UI state
  const [selectedCard, setSelectedCard] = useState<number | null>(null); // Index of selected card in player's hand
  const [phaserInitFailed, setPhaserInitFailed] = useState(false);
  const [pinConfirmOpen, setPinConfirmOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    playCardSound,
    playDealSound,
    playErrorSound,
    playGameLoseSound,
    playGameWinSound,
    playRoundEndSound,
    playRoundStartSound,
    playShuffleSound,
    playTrickCollectSound
  } = useSound();
  const playShuffleSoundRef = useRef(playShuffleSound);
  const playDealSoundRef = useRef(playDealSound);
  const playRoundStartSoundRef = useRef(playRoundStartSound);
  playShuffleSoundRef.current = playShuffleSound;
  playDealSoundRef.current = playDealSound;
  playRoundStartSoundRef.current = playRoundStartSound;
  const layoutSnapshot = useLayoutSnapshot();

  const applyRemoteState = useCallback((remoteState: GameState) => {
    const adapter = gameAdapterRef.current;
    const variant = remoteState.variant ?? adapter?.variant;
    const stateToRestore =
      adapter && !remoteState.variant
        ? { ...remoteState, variant: adapter.variant }
        : remoteState;

    if (adapter && (!remoteState.variant || adapter.variant === remoteState.variant)) {
      const restoreOptions = isMultiplayerActive
        ? {
            localPlayerIndex: config.localPlayerIndex ?? 0,
            multiplayerSlots: config.multiplayerSlots,
          }
        : undefined;
      const synced = adapter.restoreState(stateToRestore, restoreOptions);
      setGameState(synced);
    } else {
      setGameState(remoteState);
    }

    if (!isJoiner) return;

    // Sueca: host deals via modal — joiner waits until cards are actually dealt
    if (variant === 'sueca') {
      const waitingForHostDeal =
        remoteState.waitingForRoundStart ||
        remoteState.players.some((p) => (p.hand?.length ?? 0) === 0);
      mpLog('[MP] applyRemoteState sueca', {
        waitingForHostDeal,
        waitingForRoundStart: remoteState.waitingForRoundStart,
        handLens: remoteState.players?.map((p) => p.hand?.length ?? 0),
        restored: Boolean(adapter),
      });
      setWaitingForHost(waitingForHostDeal);
      return;
    }

    mpLog('[MP] applyRemoteState', { variant, waitingForHost: false });
    setWaitingForHost(false);
  }, [isJoiner, isMultiplayerActive, config.localPlayerIndex, config.multiplayerSlots]);

  const handleRemoteState = useCallback((remoteState: GameState) => {
    if (isHost) return;
    latestRemoteStateRef.current = remoteState;
    mpLog('[MP] remote received', {
      role: isJoiner ? 'joiner' : 'host',
      hasAdapter: Boolean(gameAdapterRef.current),
      waitingForRoundStart: remoteState.waitingForRoundStart,
      handLens: remoteState.players?.map((p) => p.hand?.length ?? 0),
      variant: remoteState.variant,
      session: config.multiplayerSessionId,
      applied: Boolean(gameAdapterRef.current),
    });
    if (gameAdapterRef.current) {
      applyRemoteState(remoteState);
    }
  }, [applyRemoteState, isJoiner, isHost, config.multiplayerSessionId]);

  const { publishAfterPlay, submitAction } = useMultiplayer({
    enabled: isMultiplayerActive,
    sessionCode: multiplayerSessionCode,
    onRemoteState: handleRemoteState,
    applyAllRemoteUpdates: isJoiner,
  });

  const publishHostState = useCallback(
    (state: GameState) => {
      if (!isHost) {
        mpWarn('[MP] host publish skipped', {
          isMultiplayerActive,
          multiplayerPlayerIndex,
          session: multiplayerSessionCode || '(empty)',
        });
        return;
      }
      publishAfterPlay(state);
    },
    [isHost, isMultiplayerActive, multiplayerPlayerIndex, multiplayerSessionCode, publishAfterPlay]
  );

  const afterHostMutation = useCallback(() => {
    const adapter = gameAdapterRef.current;
    if (!adapter) return;
    const next = adapter.getCurrentState();
    setGameState(next);
    if (isHost) publishHostState(next);
  }, [isHost, publishHostState]);

  const afterHostMutationRef = useRef(afterHostMutation);
  afterHostMutationRef.current = afterHostMutation;

  const publishHostStateRef = useRef(publishHostState);
  publishHostStateRef.current = publishHostState;

  useEffect(() => {
    mpLog('[MP] board', {
      role: isHost ? 'host' : isJoiner ? 'joiner' : 'solo',
      isMultiplayerActive,
      session: multiplayerSessionCode || '(empty)',
      localPlayerIndex: multiplayerPlayerIndex,
    });
  }, [isHost, isJoiner, isMultiplayerActive, multiplayerSessionCode, multiplayerPlayerIndex]);

  useEffect(() => {
    if (!isHost || !isMultiplayerActive || !multiplayerSessionCode || !gameAdapter) return;

    return subscribeToActions(multiplayerSessionCode, (action, actionId) => {
      if (processedActionIdsRef.current.has(actionId)) return;
      processedActionIdsRef.current.add(actionId);

      const adapter = gameAdapterRef.current;
      if (!adapter) return;

      const ok = applyHostAction(adapter, action, {
        dealAlignment: dealAlignmentRef.current,
        rulesPresetId,
      });
      if (!ok) {
        mpWarn('[MP] host rejected action', action);
        return;
      }
      afterHostMutationRef.current();
    });
  }, [isHost, isMultiplayerActive, multiplayerSessionCode, gameAdapter, rulesPresetId]);

  useEffect(() => {
    gameAdapterRef.current = gameAdapter;
  }, [gameAdapter]);

  const prevWaitingRoundStartRef = useRef<boolean | null>(null);
  const prevWaitingTrickEndRef = useRef<boolean | null>(null);
  const prevWaitingRoundEndRef = useRef<boolean | null>(null);
  const prevHandsDealtRef = useRef(false);
  const lastDealRoundSfxAtRef = useRef(0);
  const shuffleTimerRef = useRef<number | null>(null);
  const dealTimerRef = useRef<number | null>(null);
  const roundStartTimerRef = useRef<number | null>(null);
  const trickCollectTimerRef = useRef<number | null>(null);
  const freshStartRef = useRef(false);
  const scheduleDealRoundSfx = useCallback(() => {
    const now = Date.now();
    if (now - lastDealRoundSfxAtRef.current <= 2000) return;
    lastDealRoundSfxAtRef.current = now;
    if (shuffleTimerRef.current !== null) {
      window.clearTimeout(shuffleTimerRef.current);
      shuffleTimerRef.current = null;
    }
    if (dealTimerRef.current !== null) {
      window.clearTimeout(dealTimerRef.current);
      dealTimerRef.current = null;
    }
    if (roundStartTimerRef.current !== null) {
      window.clearTimeout(roundStartTimerRef.current);
      roundStartTimerRef.current = null;
    }
    // Both delayed slightly so Android WebView is past the startGame tick;
    // shuffle → deal → round-start (audio only; never per-card).
    shuffleTimerRef.current = window.setTimeout(() => {
      playShuffleSoundRef.current();
      shuffleTimerRef.current = null;
    }, 50);
    dealTimerRef.current = window.setTimeout(() => {
      playDealSoundRef.current();
      dealTimerRef.current = null;
    }, getDealDelayMs());
    roundStartTimerRef.current = window.setTimeout(() => {
      playRoundStartSoundRef.current();
      roundStartTimerRef.current = null;
    }, ROUND_START_SFX_DELAY_MS);
  }, []);
  const [gameInitKey, setGameInitKey] = useState(0);

  const variantFlow = useMemo(
    () => gameAdapter?.getVariantFlow() ?? null,
    [gameAdapter]
  );

  const flowControllers = useMemo(
    () => createVariantFlowControllers(variantFlow),
    [variantFlow]
  );

  const kingCtrl = flowControllers.king;
  const spadesCtrl = flowControllers.spades;
  const heartsCtrl = flowControllers.hearts;
  const suecaCtrl = flowControllers.sueca;

  const kingPtState = useMemo(() => {
    if (!kingCtrl || !kingCtrl.isPtNormal(rulesPresetId)) return null;
    return kingCtrl.readPtState(gameState);
  }, [kingCtrl, rulesPresetId, gameState]);

  const boardFlow = useMemo(
    () =>
      resolveGameBoardFlow({
        gameState,
        variant: gameVariant,
        rulesPresetId
      }),
    [gameState, gameVariant, rulesPresetId]
  );

  const {
    heartsPassActive,
    spadesBidActive,
    waitingForEarlyEnd,
    flowOverlayActive,
    festaSheetActive
  } = boardFlow;

  useEffect(() => {
    let cancelled = false;

    const startGame = async () => {
      try {
        if (freshStartRef.current) {
          latestRemoteStateRef.current = null;
        }

        const adapter = GameFactory.getAdapter(config.gameVariant);
        let initialState: GameState;
        const shouldResume =
          !freshStartRef.current &&
          resumeSession?.state &&
          resumeSession.config.gameVariant === config.gameVariant;
        if (shouldResume) {
          initialState = adapter.restoreState(normalizeGameState(resumeSession.state));
        } else {
          const initOptions = {
            playDirection: config.playDirection === 'left' ? 'left' : 'right',
            aiDifficulty: config.aiDifficulty,
            localPlayerIndex: config.multiplayerEnabled ? (config.localPlayerIndex ?? 0) : undefined,
            multiplayerSlots: config.multiplayerEnabled ? config.multiplayerSlots : undefined,
            rulesPresetId: config.rulesPresetId
          };
          const search =
            typeof window !== 'undefined' ? window.location.search : '';
          const canDevJump =
            process.env.NODE_ENV === 'development' &&
            config.gameVariant === 'king' &&
            isKingPtEnginePreset(config.rulesPresetId) &&
            !config.multiplayerEnabled;
          const festaJump = canDevJump ? parseDevKingFestaParams(search) : null;
          const negJump = canDevJump && !festaJump ? parseDevKingNegParams(search) : null;
          const synthJump =
            canDevJump && !festaJump && !negJump
              ? parseDevKingSyntheticParams(search)
              : null;
          if (festaJump && adapter instanceof KingGame) {
            initialState = adapter.applyDevFestaFixture(
              config.playerNames,
              festaJump,
              { ...initOptions, rulesPresetId: 'king-pt-normal' }
            );
            setDevKingFestaJump(festaJump);
            setDevKingNegContract(null);
          } else if (negJump && adapter instanceof KingGame) {
            const negState = applyDevNegativeFixture(
              adapter,
              config.playerNames,
              negJump,
              { ...initOptions, rulesPresetId: 'king-pt-normal' }
            );
            initialState = negState ?? adapter.initialize(config.playerNames, initOptions);
            setDevKingNegContract(negJump);
            setDevKingFestaJump(null);
          } else if (synthJump && adapter instanceof KingGame) {
            // DEV query routes into the production King Sintético preset.
            initialState = adapter.initialize(config.playerNames, {
              ...initOptions,
              rulesPresetId: 'king-pt-synthetic'
            });
            setDevKingFestaJump(null);
            setDevKingNegContract(null);
          } else {
            initialState = adapter.initialize(config.playerNames, initOptions);
            setDevKingFestaJump(null);
            setDevKingNegContract(null);
          }
        }
        freshStartRef.current = false;
        if (cancelled) return;

        setGameAdapter(adapter);
        gameAdapterRef.current = adapter;

        let remoteState = latestRemoteStateRef.current;
        if (isJoiner && !remoteState && config.multiplayerSessionId) {
          remoteState = await fetchSessionState(config.multiplayerSessionId);
          if (cancelled) return;
          if (remoteState) {
            latestRemoteStateRef.current = remoteState;
            mpLog('[MP] init fetch', {
              waitingForRoundStart: remoteState.waitingForRoundStart,
              handLens: remoteState.players?.map((p) => p.hand?.length ?? 0),
              session: config.multiplayerSessionId,
            });
          } else {
            mpLog('[MP] init fetch empty', { session: config.multiplayerSessionId });
          }
        }

        const initPath = isJoiner && remoteState ? 'applyRemote' : 'localInit';
        mpLog('[MP] init', {
          role: isJoiner ? 'joiner' : 'host',
          path: initPath,
          hasBuffered: Boolean(remoteState),
          bufferedHandLens: remoteState?.players?.map((p) => p.hand?.length ?? 0),
          bufferedWaitingForRoundStart: remoteState?.waitingForRoundStart,
        });
        if (isJoiner && remoteState) {
          applyRemoteState(remoteState);
        } else {
          setGameState(initialState);
          setWaitingForHost(isJoiner);
        }
        setGameStarted(true);

        try {
          abandonDiagnosticMatch();
          startDiagnosticMatch({
            gameVariant: config.gameVariant,
            rulesPresetId: config.rulesPresetId,
            difficulty: config.aiDifficulty,
            players: snapshotPlayersFromGame(initialState.players),
            localPlayerIndex: config.multiplayerEnabled
              ? (config.localPlayerIndex ?? 0)
              : 0
          });
          const handsReadyDiag =
            initialState.players.length > 0 &&
            initialState.players.every((p) => (p.hand?.length ?? 0) > 0);
          if (handsReadyDiag) {
            recordDealCompleted({
              players: initialState.players,
              trumpSuit: initialState.trumpSuit,
              trumpCard: initialState.trumpCard,
              dealerIndex: initialState.dealerIndex,
              roundIndex: initialState.round
            });
          }
        } catch {
          /* diagnostic must never block start */
        }

        // Spades/Hearts/King often initialize with hands already dealt — cue here so
        // we do not miss the first paint edge in the shared effect.
        const handsReady =
          initialState.players.length > 0 &&
          initialState.players.every((p) => p.hand.length > 0);
        if (handsReady && !(isJoiner && remoteState)) {
          window.setTimeout(() => scheduleDealRoundSfx(), 0);
        }

        if (isHost) {
          publishHostStateRef.current(adapter.getCurrentState());
        }
      } catch (error) {
        console.error('Error starting game:', error);
        alert(t.startMenu.errorStartingGame);
        onExit();
      }
    };

    void startGame();
    return () => {
      cancelled = true;
    };
  }, [
    config,
    resumeSession,
    gameInitKey,
    onExit,
    t.startMenu.errorStartingGame,
    isJoiner,
    isHost,
    applyRemoteState,
    scheduleDealRoundSfx,
  ]);

  // Host publishes when the adapter is ready so joiners can sync immediately
  useEffect(() => {
    if (!isHost || !gameAdapter || !gameStarted) return;
    publishHostState(gameAdapter.getCurrentState());
  }, [isHost, gameStarted, gameAdapter, publishHostState]);

  const buildPersistConfig = (): typeof config => {
    const statePreset =
      gameVariant === 'king'
        ? resolvePresetId(
            'king',
            (gameState.variantState?.rulesPresetId as string | undefined) ?? rulesPresetId
          )
        : rulesPresetId;
    return stripMultiplayerFields({
      ...config,
      playerNames,
      aiDifficulty,
      playDirection: sessionPlayDirection,
      gameVariant,
      rulesPresetId: statePreset
    });
  };

  const clearPostDealPresentation = useCallback(() => {
    postDealCtxRef.current = null;
    setPostDealPhase(null);
    setRitualFocus(null);
  }, []);

  const markTableReadyForRitual = useCallback(() => {
    // Latch TRUE for this table/game instance — never drop back to false mid-session.
    setTableReadyForRitual(true);
  }, []);

  const suecaPresentationGate = useMemo(() => {
    if (gameVariant !== 'sueca') {
      return { hideHands: false, hideTrump: false, playLocked: false };
    }
    const waiting = gameState.waitingForRoundStart;
    const postLocked = postDealPlayLocked(postDealPhase);
    return {
      hideHands: waiting || postDealHandsHidden(postDealPhase),
      hideTrump: waiting || postDealTrumpHudHidden(postDealPhase),
      playLocked:
        waiting ||
        postLocked ||
        !tableReadyForRitual ||
        ritualDebugPlayReadyHold
    };
  }, [
    gameVariant,
    gameState.waitingForRoundStart,
    postDealPhase,
    tableReadyForRitual,
    ritualDebugPlayReadyHold
  ]);

  const suecaPlayReady =
    gameVariant !== 'sueca' ||
    suecaPresentationPlayReady({
      waitingForRoundStart: gameState.waitingForRoundStart,
      postDealPhase,
      tableReadyForRitual,
      ritualDebugPlayReadyHold
    });

  /** Reset post-deal when a new Sueca hand wait begins (pre-deal ritual owns focus). */
  useEffect(() => {
    if (gameVariant !== 'sueca') return;
    if (gameState.waitingForRoundStart) {
      postDealCtxRef.current = null;
      setPostDealPhase(null);
      if (ritualDebug) {
        setRitualDebugPreDealReleased(false);
        setRitualDebugPlayReadyHold(false);
        setRitualDebugAdvanceNonce(0);
      }
    }
  }, [gameVariant, gameState.waitingForRoundStart, gameState.round, ritualDebug]);

  /** UX-SUECA-08 — freeze on inspectable table-ready before ritual mounts. */
  useEffect(() => {
    if (!ritualDebug || gameVariant !== 'sueca') return;
    if (
      gameState.waitingForRoundStart &&
      tableReadyForRitual &&
      !ritualDebugPreDealReleased &&
      !gameState.isGameOver &&
      !isJoiner
    ) {
      setRitualDebugPhase('table-ready');
    }
  }, [
    ritualDebug,
    gameVariant,
    gameState.waitingForRoundStart,
    tableReadyForRitual,
    ritualDebugPreDealReleased,
    gameState.isGameOver,
    isJoiner
  ]);

  /** UX-SUECA-08 — play-ready hold label after first-player Continuar. */
  useEffect(() => {
    if (!ritualDebug || gameVariant !== 'sueca') return;
    if (ritualDebugPlayReadyHold) {
      setRitualDebugPhase('play-ready');
    }
  }, [ritualDebug, gameVariant, ritualDebugPlayReadyHold]);

  /** DOM table: ready after paint when not using Phaser. */
  useEffect(() => {
    if (!gameStarted || gameVariant !== 'sueca') return;
    const phaser =
      resolveTableRendererForBrowser(gameVariant) === 'phaser' &&
      !isMultiplayerActive &&
      !phaserInitFailed;
    if (phaser) return;
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => markTableReadyForRitual());
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [
    gameStarted,
    gameVariant,
    isMultiplayerActive,
    phaserInitFailed,
    markTableReadyForRitual,
    gameState.round
  ]);

  useEffect(() => {
    return () => {
      postDealCtxRef.current = null;
    };
  }, []);

  /**
   * UX-SUECA-06 — phase-driven post-deal machine.
   * Timer for each beat starts in useEffect AFTER that phase commits/paints,
   * so `{name} começa` is guaranteed a full firstPlayerMs of visible state.
   * UX-SUECA-08 — ritualDebug freezes timers; Continuar advances instead.
   */
  useEffect(() => {
    if (ritualDebug) return;
    if (postDealPhase == null) return;
    const ctx = postDealCtxRef.current;
    if (!ctx) return;
    const phaseAtSchedule = postDealPhase;
    const ms = postDealDurationMs(phaseAtSchedule, ctx.timings);
    const id = window.setTimeout(() => {
      const next = nextSuecaPostDealPhase(phaseAtSchedule);
      if (phaseAtSchedule === 'deal-confirmed' && next === 'distributing') {
        scheduleDealRoundSfx();
      }
      if (next == null) {
        postDealCtxRef.current = null;
        setPostDealPhase(null);
        setRitualFocus(null);
        return;
      }
      setPostDealPhase(next);
      setRitualFocus(
        postDealFocusForPhase(next, ctx.dealerIndex, ctx.firstPlayerIndex)
      );
    }, ms);
    return () => window.clearTimeout(id);
  }, [postDealPhase, scheduleDealRoundSfx, ritualDebug]);

  const advanceSuecaPostDealDebugStep = useCallback(() => {
    const ctx = postDealCtxRef.current;
    if (!ctx || postDealPhase == null) return;
    const next = nextSuecaPostDealPhase(postDealPhase, { includeHandsReveal: true });
    if (postDealPhase === 'deal-confirmed' && next === 'distributing') {
      scheduleDealRoundSfx();
    }
    if (next == null) {
      postDealCtxRef.current = null;
      setPostDealPhase(null);
      setRitualFocus(null);
      setRitualDebugPlayReadyHold(true);
      setRitualDebugPhase('play-ready');
      return;
    }
    setPostDealPhase(next);
    setRitualFocus(postDealFocusForPhase(next, ctx.dealerIndex, ctx.firstPlayerIndex));
    setRitualDebugPhase(next);
  }, [postDealPhase, scheduleDealRoundSfx]);

  const handleRitualDebugContinue = useCallback(() => {
    if (!ritualDebug) return;
    if (ritualDebugPlayReadyHold) {
      setRitualDebugPlayReadyHold(false);
      setRitualDebugPhase(null);
      return;
    }
    if (postDealPhase != null) {
      advanceSuecaPostDealDebugStep();
      return;
    }
    if (
      gameState.waitingForRoundStart &&
      tableReadyForRitual &&
      !ritualDebugPreDealReleased
    ) {
      setRitualDebugPreDealReleased(true);
      return;
    }
    setRitualDebugAdvanceNonce((n) => n + 1);
  }, [
    ritualDebug,
    ritualDebugPlayReadyHold,
    postDealPhase,
    advanceSuecaPostDealDebugStep,
    gameState.waitingForRoundStart,
    tableReadyForRitual,
    ritualDebugPreDealReleased
  ]);

  useEffect(() => {
    if (!ritualDebug || postDealPhase == null) return;
    setRitualDebugPhase(postDealPhase);
  }, [ritualDebug, postDealPhase]);

  const runSuecaPostDealSequence = useCallback(
    (alignment: DealAlignment, physical: SuecaPhysicalDealDirection) => {
      if (!gameAdapter || !suecaCtrl) return;
      clearPostDealPresentation();
      setPostDealPhysical(physical);
      dealAlignmentRef.current = alignment;
      setRitualFocus({
        seat: gameAdapter.getCurrentState().dealerIndex,
        role: 'dealer'
      });
      suecaCtrl.applyDealSetup(alignment);
      gameAdapter.startRound(gameAdapter.getCurrentState());
      const afterDeal = gameAdapter.getCurrentState();
      setGameState(afterDeal);
      if (isHost) {
        mpLog('[MP] host publish deal', { session: multiplayerSessionCode });
      }
      afterHostMutation();

      const timings = resolvePostDealTimings();
      const dealerIndex = afterDeal.dealerIndex;
      const firstPlayer = afterDeal.currentPlayerIndex;
      postDealCtxRef.current = {
        timings,
        dealerIndex,
        firstPlayerIndex: firstPlayer
      };
      setPostDealPhase('deal-confirmed');
      setRitualFocus(postDealFocusForPhase('deal-confirmed', dealerIndex, firstPlayer));
    },
    [
      gameAdapter,
      suecaCtrl,
      clearPostDealPresentation,
      isHost,
      multiplayerSessionCode,
      afterHostMutation
    ]
  );

  /**
   * Shared deal/round SFX (all variants):
   * - when hands first become fully dealt, OR
   * - when waitingForRoundStart clears while hands exist
   * Debounced so Sueca (both edges) does not double-fire.
   * One shuffle + one deal cue — never per-card.
   * Timers are NOT cleared on every players[] identity change (avoids cancelling cues).
   */
  useEffect(() => {
    if (!gameStarted) {
      prevWaitingRoundStartRef.current = null;
      prevHandsDealtRef.current = false;
      prevWaitingRoundEndRef.current = null;
      return;
    }

    const handsDealt =
      gameState.players.length > 0 && gameState.players.every((p) => p.hand.length > 0);
    const wasWaiting = prevWaitingRoundStartRef.current;
    const roundStartCleared = wasWaiting === true && !gameState.waitingForRoundStart;
    const handsJustDealt = handsDealt && !prevHandsDealtRef.current;

    // UX-SUECA-04 — Sueca deal SFX is owned by the distributing presentation phase.
    const suecaOwnsDealSfx =
      gameVariant === 'sueca' && (postDealPhase != null || roundStartCleared);
    const shouldCue =
      handsDealt && (handsJustDealt || roundStartCleared) && !suecaOwnsDealSfx;
    if (shouldCue) {
      scheduleDealRoundSfx();
    }

    prevWaitingRoundStartRef.current = gameState.waitingForRoundStart;
    prevHandsDealtRef.current = handsDealt;
  }, [
    gameStarted,
    gameState.waitingForRoundStart,
    gameState.players,
    gameVariant,
    postDealPhase,
    scheduleDealRoundSfx
  ]);

  useEffect(() => {
    return () => {
      if (shuffleTimerRef.current !== null) {
        window.clearTimeout(shuffleTimerRef.current);
        shuffleTimerRef.current = null;
      }
      // Intentionally do not clear deal/round-start timers on unmount — avoids dropping
      // delayed cues when GameBoard remounts during variant start.
    };
  }, []);

  /** One trick-collect SFX per completed trick (not on finishTrick continue). */
  useEffect(() => {
    if (!gameStarted) return;
    const wasWaiting = prevWaitingTrickEndRef.current;
    if (wasWaiting === false && gameState.waitingForTrickEnd) {
      if (trickCollectTimerRef.current !== null) {
        window.clearTimeout(trickCollectTimerRef.current);
      }
      trickCollectTimerRef.current = window.setTimeout(() => {
        playTrickCollectSound();
        trickCollectTimerRef.current = null;
      }, TRICK_COLLECT_DELAY_MS);
    }
    prevWaitingTrickEndRef.current = gameState.waitingForTrickEnd;
  }, [gameStarted, gameState.waitingForTrickEnd, playTrickCollectSound]);

  useEffect(() => {
    return () => {
      if (trickCollectTimerRef.current !== null) {
        window.clearTimeout(trickCollectTimerRef.current);
        trickCollectTimerRef.current = null;
      }
    };
  }, []);

  /** Intermediate round-end only — never when the same transition is game over. */
  useEffect(() => {
    if (!gameStarted) return;
    if (
      shouldPlayRoundEndCue({
        prevWaitingForRoundEnd: prevWaitingRoundEndRef.current,
        waitingForRoundEnd: gameState.waitingForRoundEnd,
        isGameOver: gameState.isGameOver
      })
    ) {
      playRoundEndSound();
    }
    prevWaitingRoundEndRef.current = gameState.waitingForRoundEnd;
  }, [
    gameStarted,
    gameState.waitingForRoundEnd,
    gameState.isGameOver,
    playRoundEndSound
  ]);

  /**
   * UX-ROUND-01 — after synthetic negatives, hold restrained cue then open score sheet.
   */
  useEffect(() => {
    if (!gameStarted || !gameAdapter || !kingCtrl) return;
    if (!kingCtrl.isPtNormal(rulesPresetId)) return;
    if (kingPtState?.showScorePopup !== 'synthetic_complete') return;

    const timer = window.setTimeout(() => {
      kingCtrl.promoteSyntheticRoundComplete();
      setGameState(gameAdapter.getCurrentState());
    }, kingSyntheticScoreHoldMs());

    return () => window.clearTimeout(timer);
  }, [
    gameStarted,
    gameAdapter,
    kingCtrl,
    rulesPresetId,
    kingPtState?.showScorePopup
  ]);

  /**
   * Converts a Card object to a string code (e.g., "AS" for Ace of Spades)
   * Used for AI service communication and card identification
   */
  const cardToCode = (card: Card): string => {
    return `${card.rank}${SUIT_TO_CODE[card.suit] || ''}`;
  };

  /**
   * Handles AI player card selection and play for one live turn scope.
   * External success commits only while that scope is still current.
   * A real failure on the current turn falls back to local AI.
   * A cancelled or stale scope does not play and does not fall back.
   */
  const playAICard = useCallback((scope: AiTurnScope) => {
    if (!gameAdapter || !scope.isCurrent()) {
      return;
    }
    
    const playerIndex = gameState.currentPlayerIndex;
    const player = gameState.players[playerIndex];

    // Safety check - don't play if hand is empty
    if (!player || player.hand.length === 0) {
      return;
    }

    const adapterAtStart = gameAdapter;
    const turnIdentity = {
      playerIndex,
      round: gameState.round,
      trickLeader: gameState.trickLeader,
      trickLength: gameState.currentTrick.length,
    };
    const liveScope = bindAiTurnScope(scope, () => {
      if (gameAdapterRef.current !== adapterAtStart) return false;
      const live = adapterAtStart.getCurrentState();
      return isSameLiveAiTurn(turnIdentity, {
        currentPlayerIndex: live.currentPlayerIndex,
        round: live.round,
        trickLeader: live.trickLeader,
        trickLength: live.currentTrick.length,
        isPaused: live.isPaused,
        isGameOver: live.isGameOver,
        waitingForTrickEnd: live.waitingForTrickEnd,
        waitingForRoundStart: live.waitingForRoundStart,
        waitingForRoundEnd: live.waitingForRoundEnd,
        waitingForGameStart: live.waitingForGameStart,
      });
    });

    const logOpts = {
      gameConfigMode: config.rulesPresetId,
      isMultiplayer: isMultiplayerActive,
    };

    /**
     * External AI is only Sueca hard when a service URL is allowed.
     * Returns a hand index, or -1 to use local AI on this same turn.
     * Throws AiPlayRequestError('cancelled') when the scope died during the request.
     */
    const requestExternal = async (): Promise<number> => {
      if (
        adapterAtStart.variant !== 'sueca' ||
        gameState.aiDifficulty !== 'hard'
      ) {
        return -1;
      }
      // Prod without VITE_AI_SERVICE_URL, local-only, and Android: no fetch.
      if (!isExternalAiAvailable()) {
        return -1;
      }
      if (!liveScope.isCurrent()) {
        throw new AiPlayRequestError('cancelled');
      }

      const allPlayed = [
        ...gameState.currentTrick,
        ...(gameState.playedCards || []),
      ].map(cardToCode);
      const payload = {
        hand: player.hand.map(cardToCode),
        trick: gameState.currentTrick.map(cardToCode),
        trump: gameState.trumpSuit ? cardToCode({ rank: 'A', suit: gameState.trumpSuit as Suit, id: 'tmp' }).slice(-1) : '',
        played: allPlayed,
      };
      const play = await requestAiPlay(payload, { signal: liveScope.signal });
      if (!liveScope.isCurrent()) {
        throw new AiPlayRequestError('cancelled');
      }
      const idx = player.hand.findIndex((c) => cardToCode(c) === play);
      if (idx === -1) {
        console.warn(`[AI external] card "${play}" not found in hand (player ${playerIndex})`);
        setAiSource('local');
        return -1;
      }
      const currentStateForValidation = adapterAtStart.getCurrentState();
      if (!adapterAtStart.canPlayCard(currentStateForValidation, playerIndex, idx)) {
        console.warn(`[AI external] card "${play}" (idx ${idx}) is illegal for player ${playerIndex} — falling back to local AI`);
        setAiSource('local');
        return -1;
      }
      setAiSource('external');
      return idx;
    };

    void runGuardedAiPlay({
      scope: liveScope,
      requestExternal,
      onExternalFailure: (err) => {
        console.warn(`[AI external] request failed for player ${playerIndex}:`, err instanceof Error ? err.message : err);
        setAiSource('local');
      },
      chooseLocal: () => adapterAtStart.chooseAICard(adapterAtStart.getCurrentState(), playerIndex),
      play: (cardIndex) => {
        const currentState = adapterAtStart.getCurrentState();
        const played = playCardAndLogDecision(adapterAtStart, currentState, playerIndex, cardIndex, logOpts);
        if (played) {
          playCardSound();
          afterHostMutationRef.current();
        }
        return played;
      },
      onPlayRejected: (cardIndex) => {
        console.warn(`[AI local] playCard rejected index ${cardIndex} for player ${playerIndex} (${adapterAtStart.variant}) — trying playFirstLegal`);
      },
      playFirstLegal: () => {
        const currentState = adapterAtStart.getCurrentState();
        const fallbackIdx = playFirstLegalAndLogDecision(adapterAtStart, currentState, playerIndex, logOpts);
        if (fallbackIdx >= 0) {
          playCardSound();
          afterHostMutationRef.current();
        }
        return fallbackIdx;
      },
      onStuck: () => {
        const currentState = adapterAtStart.getCurrentState();
        console.error(
          `[AI fallback] playFirstLegal returned -1 — turn may be stuck`,
          {
            variant: adapterAtStart.variant,
            playerIndex,
            hand: currentState.players[playerIndex]?.hand.map(cardToCode) ?? [],
            trick: currentState.currentTrick.map(cardToCode),
          }
        );
      },
    }).catch((err) => {
      if (isExternalAiCancellation(err) || !liveScope.isCurrent()) return;
      console.warn('[AI chooseAndPlay]', err instanceof Error ? err.message : err);
    });
  }, [gameAdapter, gameState, playCardSound, config.rulesPresetId, isMultiplayerActive]);

  /**
   * Auto-play effect for AI players
   * Automatically triggers AI card play when it's an AI player's turn
   * Only runs if game is active, not paused, and not in a waiting state
   * Card-play delay comes from that variant's pacing policy.
   */
  useEffect(() => {
    const gate = aiTurnGateRef.current;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const isRemoteTurn = isMultiplayer && currentPlayer?.type === 'remote';
    const isLocalHumanTurn = isMultiplayer
      ? gameState.currentPlayerIndex === multiplayerPlayerIndex
      : gameState.currentPlayerIndex === 0;
    const eligible =
      !!gameAdapter &&
      gameStarted &&
      !gameState.isGameOver &&
      !gameState.isPaused &&
      !gameState.waitingForTrickEnd &&
      !gameState.waitingForRoundStart &&
      !gameState.waitingForRoundEnd &&
      !gameState.waitingForGameStart &&
      !isRemoteTurn &&
      !isLocalHumanTurn &&
      isHostOrSolo &&
      !waitingForEarlyEnd &&
      suecaPlayReady;

    const passBeatLocksPlay =
      gameVariant === 'hearts' && isHeartsPassExchangeLocked(getHeartsState(gameState));

    if (!eligible || !gameAdapter || passBeatLocksPlay) {
      gate.close();
      return () => {
        gate.close();
      };
    }

    const scope = gate.open();
    const delayMs =
      gameVariant === 'hearts'
        ? heartsCardPlayArmDelayMs(gameState)
        : resolveAiPlayDelayMs({
            variant: gameVariant,
            trickLength: gameState.currentTrick.length
          });
    if (delayMs == null) {
      gate.close();
      return () => {
        gate.close();
      };
    }
    const timer = setTimeout(() => {
      if (!scope.isCurrent()) return;
      playAICard(scope);
    }, delayMs);
    return () => {
      clearTimeout(timer);
      gate.close();
    };
  }, [gameAdapter, gameStarted, gameState.currentPlayerIndex, gameState.isGameOver, gameState.isPaused, gameState.waitingForTrickEnd, gameState.waitingForRoundStart, gameState.waitingForRoundEnd, gameState.waitingForGameStart, gameState.players, gameState.currentTrick.length, gameState.variantState, gameVariant, playAICard, isMultiplayer, multiplayerPlayerIndex, isHostOrSolo, waitingForEarlyEnd, suecaPlayReady]);

  const passExchangeUntilMs =
    gameVariant === 'hearts' ? getHeartsState(gameState).passExchangeUntilMs : null;

  useEffect(() => {
    if (!heartsCtrl || !gameAdapter || passExchangeUntilMs == null || !isHostOrSolo) return;
    const remaining = Math.max(0, passExchangeUntilMs - Date.now());
    const id = window.setTimeout(() => {
      heartsCtrl.releasePassExchange();
      afterHostMutationRef.current();
    }, remaining);
    return () => window.clearTimeout(id);
  }, [heartsCtrl, gameAdapter, passExchangeUntilMs, isHostOrSolo]);

  /**
   * Handles card click from human player
   * Validates that:
   * - It's the human player's turn (index 0)
   * - Game is in a playable state (not paused, not waiting, not over)
   * - Card is playable according to game rules
   * Plays error sound if card cannot be played
   */
  const handleCardClick = (cardIndex: number) => {
    // Only allow if game exists
    if (!gameAdapter) return;

    if (heartsCtrl?.togglePassCardIfPassing(gameState, cardIndex, localPlayerIndex)) {
      setGameState(gameAdapter.getCurrentState());
      return;
    }

    // Determine whether the current turn belongs to the local human player
    const isLocalTurn = isMultiplayer
      ? gameState.currentPlayerIndex === multiplayerPlayerIndex
      : gameState.currentPlayerIndex === 0;

    if (
      isLocalTurn &&
      !gameState.isGameOver &&
      !gameState.isPaused &&
      !gameState.waitingForTrickEnd &&
      !gameState.waitingForRoundStart &&
      !gameState.waitingForRoundEnd &&
      !gameState.waitingForGameStart &&
      suecaPlayReady
    ) {
      const playerIndex = isMultiplayer ? multiplayerPlayerIndex : 0;
      const player = gameState.players[playerIndex];
      if (!player || cardIndex < 0 || cardIndex >= player.hand.length) {
        return;
      }

      const currentState = gameAdapter.getCurrentState();
      const canPlay = gameAdapter.canPlayCard(currentState, playerIndex, cardIndex);
      if (!canPlay) {
        playErrorSound();
        return;
      }

      if (selectedCard === cardIndex) {
        if (isJoiner) {
          submitAction({ type: 'playCard', playerIndex, cardIndex });
          playCardSound();
          setSelectedCard(null);
          return;
        }
        if (playCardAndLogDecision(gameAdapter, currentState, playerIndex, cardIndex, {
          gameConfigMode: config.rulesPresetId,
          isMultiplayer: isMultiplayerActive,
        })) {
          playCardSound();
          setSelectedCard(null);
          afterHostMutation();
        } else {
          playErrorSound();
        }
      } else {
        setSelectedCard(cardIndex);
      }
    }
  };

  /**
   * Phaser: single tap plays a legal card (engine still validates).
   * During Hearts pass, tap toggles pass selection (same as DOM hand).
   */
  const handlePhaserCardClick = (cardIndex: number) => {
    if (!gameAdapter) return;

    if (heartsCtrl?.togglePassCardIfPassing(gameState, cardIndex, localPlayerIndex)) {
      setGameState(gameAdapter.getCurrentState());
      return;
    }

    const isLocalTurn = isMultiplayer
      ? gameState.currentPlayerIndex === multiplayerPlayerIndex
      : gameState.currentPlayerIndex === 0;
    if (
      !isLocalTurn ||
      gameState.isGameOver ||
      gameState.isPaused ||
      gameState.waitingForTrickEnd ||
      gameState.waitingForRoundStart ||
      gameState.waitingForRoundEnd ||
      gameState.waitingForGameStart ||
      waitingForEarlyEnd ||
      festaSheetActive
    ) {
      return;
    }
    const playerIndex = isMultiplayer ? multiplayerPlayerIndex : 0;
    const player = gameState.players[playerIndex];
    if (!player || cardIndex < 0 || cardIndex >= player.hand.length) return;

    const currentState = gameAdapter.getCurrentState();
    if (!gameAdapter.canPlayCard(currentState, playerIndex, cardIndex)) {
      playErrorSound();
      return;
    }
    if (isJoiner) {
      submitAction({ type: 'playCard', playerIndex, cardIndex });
      playCardSound();
      setSelectedCard(null);
      return;
    }
    if (
      playCardAndLogDecision(gameAdapter, currentState, playerIndex, cardIndex, {
        gameConfigMode: config.rulesPresetId,
        isMultiplayer: isMultiplayerActive
      })
    ) {
      playCardSound();
      setSelectedCard(null);
      afterHostMutation();
    } else {
      playErrorSound();
    }
  };

  /**
   * Generates the image path for a card
   * Maps card rank/suit to asset filename
   * Handles special case for face cards (J, Q, K) which use "_2" suffix
   * Works in both development and production environments
   */
  const getCardImage = (card: Card): string => {
    const suit = SUIT_TO_NAME[card.suit];
    const rank = RANK_TO_IMAGE_NAME[card.rank];
    return getCardImagePath(rank, suit, publicUrl());
  };

  /**
   * Effect to handle game over — record stats once, play result cue once, schedule delayed exit.
   * Timer is cancelled on New Game / leave / unmount so it cannot affect a new match.
   */
  useEffect(() => {
    if (!gameState.isGameOver) {
      gameOverStatsRecordedRef.current = false;
      matchHistoryIdRef.current = null;
      return;
    }
    if (!gameAdapter || !gameState.matchResult) return;
    if (gameOverStatsRecordedRef.current) return;
    gameOverStatsRecordedRef.current = true;

    const result = gameState.matchResult;
    const finishedAt = Date.now();
    const playerSnapshots = snapshotPlayersFromGame(gameState.players);
    const namesKey = playerSnapshots.map((p) => p.name).join(',');
    const bindMatchId = (fingerprint: string) => {
      const id = resolveMatchCompletionId(fingerprint);
      matchHistoryIdRef.current = id;
      return id;
    };

    recordGameFinished();
    void showInterstitialIfDue();
    const localIdx = isMultiplayer ? multiplayerPlayerIndex : 0;
    const localTeam = gameState.players[localIdx]?.team ?? null;
    const fields = historyFieldsFromMatchResult(result, localTeam, localIdx);
    const playerWon = fields.playerWon;

    let summary: string;
    let finalScores: { team1?: number; team2?: number; players?: number[] };
    let identity: string;

    if (result.kind === 'individual') {
      const scores = heartsCtrl
        ? heartsCtrl.readState(gameState).playerScores
        : kingCtrl
          ? kingCtrl.readPlayerScores(gameState)
          : [];
      identity = result.draw
        ? `tie:${result.winnerSeats.join(',')}`
        : `seat:${result.winnerSeats[0] ?? ''}`;
      summary = result.draw
        ? `${t.modals.resultTie} · ${scores.join('/')}`
        : `${gameState.players[result.winnerSeats[0] ?? 0]?.name ?? 'Player'} · ${scores.join('/')}`;
      finalScores = { players: [...scores] };
    } else {
      const winnerLabel = result.winnerTeam === localTeam ? t.gameBoard.us : t.gameBoard.them;
      const scoreSummary = `${gameState.gameScore.team1}-${gameState.gameScore.team2}`;
      identity = `team:${result.winnerTeam ?? ''}`;
      summary = `${winnerLabel} · ${scoreSummary}`;
      finalScores = {
        team1: gameState.gameScore.team1,
        team2: gameState.gameScore.team2
      };
    }

    const matchId = bindMatchId(
      `${gameVariant}|${rulesPresetId}|${summary}|${namesKey}|${identity}`
    );
    recordGameResult(gameVariant, playerWon);
    recordMatchHistory({
      id: matchId,
      idempotencyKey: matchId,
      completedAt: finishedAt,
      gameVariant,
      rulesPresetId,
      difficulty: aiDifficulty,
      players: playerSnapshots,
      localPlayerIndex: localIdx,
      playerWon,
      resultKind: fields.resultKind,
      winner: fields.winner,
      ...(fields.tiedSeats ? { tiedSeats: fields.tiedSeats } : {}),
      finalScores,
      summary
    });
    recordFinishedGame({
      variant: gameVariant,
      finishedAt,
      playerWon,
      summary
    });
    void completeDiagnosticMatch({
      playerWon,
      winner: fields.winner,
      finalScores,
      summary
    });
    const audioResult = resolveHumanGameAudioResult({
      matchResult: result,
      localPlayerIndex: localIdx,
      localTeam
    });
    if (audioResult === 'win') playGameWinSound();
    else if (audioResult === 'lose') playGameLoseSound();

    clearGameSession(gameVariant);
    // UX-KING-FINAL-01 — King final score sheet must stay until explicit CTA.
    if (shouldAutoExitAfterGameOver(gameVariant)) {
      gameOverExitRef.current.schedule();
    }
  }, [
    gameAdapter,
    heartsCtrl,
    kingCtrl,
    gameState,
    gameState.isGameOver,
    gameState.matchResult,
    gameState.players,
    gameState.gameScore,
    gameState.variantState,
    gameVariant,
    rulesPresetId,
    aiDifficulty,
    isMultiplayer,
    multiplayerPlayerIndex,
    playGameLoseSound,
    playGameWinSound,
    t.gameBoard.them,
    t.gameBoard.us,
    t.modals.resultTie
  ]);

  useEffect(() => {
    const ctrl = gameOverExitRef.current;
    return () => {
      ctrl.cancel();
    };
  }, []);

  const localPlayerIndex = isMultiplayer ? multiplayerPlayerIndex : 0;

  const dispatchFestaLogged = useCallback(
    (action: { type: string; playerIndex?: number; [key: string]: unknown }) => {
      if (!kingCtrl) return;
      try {
        const type = action.type;
        if (
          type === 'auction_bid' ||
          type === 'auction_pass' ||
          type === 'auction_continue'
        ) {
          recordAuctionAction({
            seat: typeof action.playerIndex === 'number' ? action.playerIndex : localPlayerIndex,
            action: type,
            bidType: typeof action.bidType === 'string' ? action.bidType : undefined,
            bidAmount: typeof action.amount === 'number' ? action.amount : undefined,
            details: { ...action }
          });
        } else {
          recordFestaDecision({
            action: type,
            seat: typeof action.playerIndex === 'number' ? action.playerIndex : undefined,
            details: { ...action }
          });
        }
      } catch {
        /* ignore */
      }
      kingCtrl.dispatchFestaAction(action as Parameters<typeof kingCtrl.dispatchFestaAction>[0]);
    },
    [kingCtrl, localPlayerIndex]
  );

  const kingPtFestaKey =
    kingCtrl && kingCtrl.isPtNormal(rulesPresetId)
      ? kingCtrl.buildFestaSyncKey(kingCtrl.readPtState(gameState))
      : '';

  useEffect(() => {
    if (!gameAdapter || !kingCtrl) return;
    if (!kingCtrl.shouldTickFestaAi(gameState, rulesPresetId)) return;

    const festaPhase = kingCtrl.readPtState(gameState).festaPhase;
    const delayMs = kingFestaTickDelayMs(festaPhase);

    const timer = window.setTimeout(() => {
      const before = kingCtrl.readPtState(gameState);
      const acted = kingCtrl.tickFestaAi();
      if (acted) {
        try {
          const after = kingCtrl.readPtState(gameAdapter.getCurrentState());
          recordFestaDecision({
            action: 'festa_ai_tick',
            details: {
              phaseBefore: before.festaPhase,
              phaseAfter: after.festaPhase,
              standingBid: after.standingBid,
              bestBid: after.bestBid
            }
          });
        } catch {
          /* ignore */
        }
        setGameState(gameAdapter.getCurrentState());
      }
    }, delayMs);
    return () => window.clearTimeout(timer);
    // kingPtFestaKey tracks festa state; full gameState would retrigger on unrelated clones
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameAdapter, kingCtrl, rulesPresetId, gameState.waitingForRoundStart, kingPtFestaKey]);

  const spadesState = spadesCtrl ? spadesCtrl.readState(gameState) : undefined;
  const heartsState = heartsCtrl ? heartsCtrl.readState(gameState) : undefined;
  const spadesLocalBidTurn = spadesState
    ? spadesCtrl!.isLocalBidTurn(spadesState, spadesBidActive, localPlayerIndex)
    : false;

  useEffect(() => {
    if (!gameAdapter || !gameStarted || !spadesCtrl || !spadesState) return;
    if (
      !spadesCtrl.shouldTickBidAi({
        bidActive: spadesBidActive,
        state: gameState,
        localPlayerIndex,
        spadesState
      })
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      spadesCtrl.tickBidAi();
      setGameState(gameAdapter.getCurrentState());
    }, spadesAiBidDelayMs());
    return () => window.clearTimeout(timer);
  }, [
    gameAdapter,
    spadesCtrl,
    gameStarted,
    spadesBidActive,
    spadesState?.currentBidderIndex,
    localPlayerIndex,
    gameState.players,
    gameState,
    spadesState
  ]);

  const usTeam = gameState.players[localPlayerIndex]?.team || 1;
  const themTeam = usTeam === 1 ? 2 : 1;

  /**
   * Returns display name for a team number
   * Used throughout UI to show team labels
   */
  const getTeamName = (team: 1 | 2): string => {
    return team === usTeam ? t.gameBoard.us : t.gameBoard.them;
  };

  /**
   * Pauses the current game
   * Stops AI auto-play and prevents further moves
   */
  const handlePause = () => {
    if (!gameAdapter) return;
    const current = gameAdapter.getCurrentState();
    gameAdapter.pauseGame(current);
    setGameState(gameAdapter.getCurrentState());
  };

  /**
   * Resumes a paused game
   * Re-enables AI auto-play and game flow
   */
  const handleResume = () => {
    if (!gameAdapter) return;
    const current = gameAdapter.getCurrentState();
    gameAdapter.resumeGame(current);
    setGameState(gameAdapter.getCurrentState());
  };

  /**
   * Leaves the game screen and keeps the saved session for Continue.
   */
  const handleLeaveScreen = () => {
    gameOverExitRef.current.cancel();
    if (!isMultiplayerActive) {
      saveGameSession(buildPersistConfig(), gameState);
    }
    onExit();
  };

  const restartFreshGame = () => {
    gameOverExitRef.current.cancel();
    clearGameSession(gameVariant);
    freshStartRef.current = true;
    setSelectedCard(null);
    setGameInitKey((key) => key + 1);
  };

  const handleNewGame = () => {
    gameOverExitRef.current.cancel();
    if (isMultiplayerActive && onRestartAsSolo) {
      onRestartAsSolo(gameVariant);
      return;
    }
    restartFreshGame();
  };

  const handlePinGame = () => {
    if (gameState.isGameOver) return;
    setPinConfirmOpen(true);
  };

  const confirmPinGame = () => {
    setPinConfirmOpen(false);
    if (gameState.isGameOver) return;
    pinGameSession(buildPersistConfig(), gameState);
  };

  const tableModel = useMemo(
    () =>
      buildTableRenderModel({
        gameState,
        variant: gameVariant,
        rulesPresetId,
        localPlayerIndex,
        usTeam,
        themTeam,
        boardFlow,
        auctionLocale: language === 'pt' ? 'pt' : 'en',
        kingPt: kingPtState,
        spadesState,
        heartsState,
        heartsPassIndices: heartsState?.humanPassIndices,
        ritualFocus:
          gameVariant === 'sueca' && ritualFocus
            ? { seat: ritualFocus.seat, role: ritualFocus.role }
            : null,
        presentation:
          gameVariant === 'sueca'
            ? {
                hideHands: suecaPresentationGate.hideHands,
                hideTrump: suecaPresentationGate.hideTrump,
                playLocked: suecaPresentationGate.playLocked
              }
            : null
      }),
    [
      gameState,
      gameVariant,
      rulesPresetId,
      localPlayerIndex,
      usTeam,
      themTeam,
      boardFlow,
      language,
      kingPtState,
      spadesState,
      heartsState,
      ritualFocus,
      suecaPresentationGate
    ]
  );

  const isTeamTableLayout = tableModel.chrome.isTeamTableLayout;

  const boardClassName = ['game-board', ...tableModel.chrome.boardModifiers]
    .filter(Boolean)
    .join(' ');

  const tableSurfaceProps = mapTableModelToDomSurfaceProps(
    tableModel,
    gameState,
    spadesState
  );
  const dockProps = mapTableModelToDomDockProps(tableModel, gameState, spadesState);
  const handProps = mapTableModelToDomHandProps(tableModel);

  const usePhaserTable =
    resolveTableRendererForBrowser(gameVariant) === 'phaser' &&
    !isMultiplayerActive &&
    !phaserInitFailed;

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (!gameAdapter || !kingCtrl || gameVariant !== 'king') return;
    type KingSmoke = {
      get: () => Record<string, unknown>;
      bid: (seat: number, bidType: 'positive' | 'null', amount: number) => boolean;
      pass: (seat: number) => boolean;
      continue: () => boolean;
      declareEightOrNulls: () => boolean;
      respondEightOrNulls: (seat: number, offerEight: boolean) => boolean;
      chooseFallback: (choice: string) => boolean;
      refresh: () => void;
    };
    const refresh = () => setGameState(gameAdapter.getCurrentState());
    const api: KingSmoke = {
      refresh,
      get: () => {
        const k = kingCtrl.readPtState(gameAdapter.getCurrentState());
        return {
          festaPhase: k.festaPhase,
          currentBidder: k.currentBidder,
          activeBidders: [...k.activeBidders],
          passedBidders: [...k.passedBidders],
          standingBid: k.standingBid,
          bestBid: k.bestBid,
          highestEquivalentValue: k.highestEquivalentValue,
          waitingForAuctionContinue: k.waitingForAuctionContinue,
          eightOrNullsPending: k.eightOrNullsPending,
          eightOrNullsTarget: k.eightOrNullsTarget,
          waitingForFallback: k.waitingForFallback,
          fallbackReason: k.fallbackReason,
          auctionHistoryLen: k.auctionHistory.length
        };
      },
      bid: (seat, bidType, amount) => {
        kingCtrl.dispatchFestaAction({
          type: 'auction_bid',
          playerIndex: seat,
          bidType,
          amount
        });
        refresh();
        return true;
      },
      pass: (seat) => {
        kingCtrl.dispatchFestaAction({ type: 'auction_pass', playerIndex: seat });
        refresh();
        return true;
      },
      continue: () => {
        kingCtrl.dispatchFestaAction({ type: 'auction_continue' });
        refresh();
        return true;
      },
      declareEightOrNulls: () => {
        kingCtrl.dispatchFestaAction({ type: 'declare_eight_or_nulls' });
        refresh();
        return true;
      },
      respondEightOrNulls: (seat, offerEight) => {
        kingCtrl.dispatchFestaAction({
          type: 'respond_eight',
          targetIndex: seat,
          offerEight
        });
        refresh();
        return true;
      },
      chooseFallback: (choice) => {
        kingCtrl.dispatchFestaAction({
          type: 'fallback',
          choice: choice as 'trump' | 'no_trump' | 'nulos' | 'four_by_three'
        });
        refresh();
        return true;
      }
    };
    const w = window as unknown as { __kingFestaSmoke?: KingSmoke };
    w.__kingFestaSmoke = api;
    return () => {
      if (w.__kingFestaSmoke === api) delete w.__kingFestaSmoke;
    };
  }, [gameAdapter, kingCtrl, gameVariant]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const id = usePhaserTable ? 'phaser' : 'dom';
    const w = window as unknown as { __suecaRenderer?: 'phaser' | 'dom' };
    w.__suecaRenderer = id;
    return () => {
      if (w.__suecaRenderer === id) delete w.__suecaRenderer;
    };
  }, [usePhaserTable]);

  const isLocalCardPlayable = (cardIndex: number) => {
    if (!gameAdapter) return false;
    if (!suecaPlayReady) return false;
    if (heartsPassActive) return true;
    if (festaSheetActive) return false;
    if (!isHandPlayActionAllowed(gameState)) return false;
    return gameAdapter.canPlayCard(
      gameAdapter.getCurrentState(),
      localPlayerIndex,
      cardIndex
    );
  };

  const tableSurface = (
    <TableSurface
      {...tableSurfaceProps}
      getCardImage={getCardImage}
      getTeamName={getTeamName}
      layoutSnapshot={layoutSnapshot}
    />
  );

  const domTableContent = (
    <>
      {isTeamTableLayout ? (
        <div className="game-table-zone">{tableSurface}</div>
      ) : (
        tableSurface
      )}

      {gameAdapter && gameState.players[localPlayerIndex] && (
        <>
          <LocalPlayerDock {...dockProps} getTeamName={getTeamName} />
          {!suecaPresentationGate.hideHands &&
          !(spadesState && isBlindNilDecisionPending(spadesState, localPlayerIndex)) ? (
            <PlayerHand
              gameState={gameState}
              localPlayerIndex={localPlayerIndex}
              selectedCard={selectedCard}
              readOnly={handProps.readOnly || !suecaPlayReady}
              selectedPassIndices={handProps.selectedPassIndices}
              canPlayCard={isLocalCardPlayable}
              onCardClick={handleCardClick}
              getCardImage={getCardImage}
              layoutSnapshot={layoutSnapshot}
            />
          ) : null}
        </>
      )}
    </>
  );

  const handlePhaserFallback = useCallback((error: Error) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('Phaser renderer failed, falling back to DOM', error);
      try {
        (window as unknown as { __suecaPhaserLastError?: string }).__suecaPhaserLastError =
          `${error.message}\n${error.stack || ''}`;
      } catch {
        /* ignore */
      }
    }
    setPhaserInitFailed(true);
  }, []);

  return (
    <div
      className={boardClassName}
      data-table-renderer={usePhaserTable ? 'phaser' : 'dom'}
      data-phaser-failed={phaserInitFailed ? '1' : '0'}
      data-table-ready={
        gameVariant === 'sueca' ? (tableReadyForRitual ? '1' : '0') : undefined
      }
      data-post-deal-phase={
        gameVariant === 'sueca' ? postDealPhase ?? 'play-ready' : undefined
      }
      data-ai-source={isDevMode() ? aiSource : undefined}
    >
      {(devKingFestaJump || devKingNegContract) ? (
        <div
          className="dev-king-festa-badge"
          style={{
            position: 'fixed',
            top: 8,
            right: 8,
            zIndex: 9999,
            padding: '4px 8px',
            fontSize: 11,
            fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
            letterSpacing: '0.02em',
            color: '#1a1a1a',
            background: 'rgba(255, 214, 102, 0.92)',
            border: '1px solid rgba(0,0,0,0.2)',
            borderRadius: 4,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            alignItems: 'flex-end'
          }}
        >
          <span>
            {devKingFestaJump
              ? formatDevKingFestaBadge(devKingFestaJump)
              : formatDevKingNegBadge(devKingNegContract!)}
          </span>
        </div>
      ) : null}
      <div className="in-game-hud-chrome" data-testid="in-game-hud-chrome">
        <div className="in-game-hud-chrome__scores">
          <ScoreStrip
            gameState={gameState}
            variant={gameVariant}
            usTeam={usTeam}
            themTeam={themTeam}
            rulesPresetId={rulesPresetId}
            hideTrump={suecaPresentationGate.hideTrump}
          />
        </div>
        <InGameBar
          isPaused={gameState.isPaused}
          onPause={handlePause}
          onResume={handleResume}
          onNewGame={handleNewGame}
          onPinGame={handlePinGame}
          onExit={handleLeaveScreen}
          onOpenRules={() => setRulesOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>

      {rulesOpen ? (
        <RulesSheet
          variant={gameVariant}
          presetId={rulesPresetId}
          onClose={() => setRulesOpen(false)}
        />
      ) : null}

      {settingsOpen ? (
        <InGameSettingsOverlay onClose={() => setSettingsOpen(false)} />
      ) : null}

      {usePhaserTable ? (
        <React.Suspense
          fallback={
            <div className="game-table-zone sueca-phaser-root">
              A carregar mesa Phaser…
            </div>
          }
        >
          <div className="game-table-zone">
            <PhaserTableErrorBoundary
              fallback={domTableContent}
              onFallback={handlePhaserFallback}
            >
              <SuecaPhaserRenderer
                model={tableModel}
                getCardImage={getCardImage}
                getTeamName={getTeamName}
                selectedCardIndex={selectedCard}
                isLocalCardPlayable={isLocalCardPlayable}
                onInitError={handlePhaserFallback}
                onTableReady={markTableReadyForRitual}
                events={{
                  onLocalCardClick: handlePhaserCardClick,
                  onContinueTrick: () => {
                    if (!gameAdapter || !gameState.waitingForTrickEnd) return;
                    gameAdapter.finishTrick(gameAdapter.getCurrentState());
                    afterHostMutation();
                  }
                }}
              />
            </PhaserTableErrorBoundary>
          </div>
        </React.Suspense>
      ) : (
        domTableContent
      )}

      {spadesLocalBidTurn && spadesState && (
        <SpadesBidMinibox
          currentBidderName={gameState.players[localPlayerIndex]?.name ?? 'Player'}
          nilEnabled={spadesState.nilEnabled}
          blindDecisionPending={isBlindNilDecisionPending(spadesState, localPlayerIndex)}
          onDeclineBlindNil={() => {
            if (!spadesCtrl) return;
            if (isJoiner) {
              submitAction({ type: 'declineBlindNil', playerIndex: localPlayerIndex });
              return;
            }
            spadesCtrl.declineBlindNil(localPlayerIndex);
            afterHostMutation();
          }}
          onConfirm={(bid, bidType) => {
            if (!gameAdapter || !spadesCtrl) return;
            if (isJoiner) {
              submitAction({ type: 'submitBid', playerIndex: localPlayerIndex, bid, bidType });
              return;
            }
            spadesCtrl.submitHumanBid(localPlayerIndex, bid, bidType);
            afterHostMutation();
          }}
        />
      )}

      {/* Action button - continue to next trick */}
      <GameActions
        gameState={gameState}
        variant={gameVariant}
        flowOverlayActive={flowOverlayActive}
        onContinueTrick={() => {
          if (!gameAdapter || !gameState.waitingForTrickEnd) return;
          if (isJoiner) {
            submitAction({ type: 'finishTrick', playerIndex: multiplayerPlayerIndex });
            return;
          }
          gameAdapter.finishTrick(gameAdapter.getCurrentState());
          afterHostMutation();
        }}
      />

      {/* Game end modal - displays game scores and games progress */}
      {gameState.waitingForRoundEnd &&
        !gameState.isGameOver &&
        !(kingCtrl?.shouldSuppressRoundEndModal(gameState, rulesPresetId)) && (
        <RoundEndModal
          gameState={gameState}
          variant={gameVariant}
          usTeam={usTeam}
          themTeam={themTeam}
          localPlayerIndex={localPlayerIndex}
          onContinue={() => {
            if (!gameAdapter) return;
            if (isJoiner) {
              submitAction({ type: 'continueRound' });
              return;
            }
            gameAdapter.continueToNextRound(gameAdapter.getCurrentState());
            kingCtrl?.afterContinueToNextRound();
            afterHostMutation();
          }}
        />
      )}

      {heartsPassActive && (
          <HeartsPassModal
            passDirection={heartsState?.passDirection || 'left'}
            playerNames={gameState.players.map((p) => p.name)}
            localPlayerIndex={localPlayerIndex}
            selectedCount={heartsState?.humanPassIndices?.length ?? 0}
            onConfirm={() => {
              if (!gameAdapter || !heartsCtrl) return;
              if (isJoiner) {
                submitAction({ type: 'confirmPass', playerIndex: localPlayerIndex });
                return;
              }
              heartsCtrl.confirmPass(localPlayerIndex);
              afterHostMutation();
            }}
          />
        )}

      {gameVariant === 'hearts' &&
        heartsState &&
        !heartsPassActive &&
        isHeartsPassExchangeLocked(heartsState) && <HeartsPassReceipt />}

      {!isJoiner &&
        kingCtrl &&
        kingCtrl.isPtNormal(rulesPresetId) &&
        (() => {
          const overlay = kingCtrl.resolvePtOverlay(gameState, rulesPresetId);
          const king = kingCtrl.readPtState(gameState);

          if (overlay === 'koh_reveal') {
            return (
              <KingKohRevealModal
                gameState={gameState}
                getCardImage={getCardImage}
                localPlayerIndex={localPlayerIndex}
                onNext={() => {
                  kingCtrl.advanceKohRevealStep();
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onConfirm={() => {
                  kingCtrl.confirmKohReveal();
                  setGameState(gameAdapter!.getCurrentState());
                }}
              />
            );
          }

          if (overlay === 'festa') {
            return (
              <KingFestaFlowModal
                gameState={gameState}
                localPlayerIndex={localPlayerIndex}
                onAuctionPass={() => {
                  dispatchFestaLogged({
                    type: 'auction_pass',
                    playerIndex: localPlayerIndex
                  });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onAuctionBid={(bidType, amount) => {
                  dispatchFestaLogged({
                    type: 'auction_bid',
                    playerIndex: localPlayerIndex,
                    bidType,
                    amount
                  });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onAuctionContinue={() => {
                  dispatchFestaLogged({ type: 'auction_continue' });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onAcceptContract={() => {
                  dispatchFestaLogged({ type: 'accept_contract' });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onRejectContract={() => {
                  dispatchFestaLogged({ type: 'reject_contract' });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onRequestHigherBid={(bidType, amount) => {
                  dispatchFestaLogged({
                    type: 'request_higher',
                    bidType,
                    amount
                  });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onRespondHigherBid={(raise, bidType, amount) => {
                  dispatchFestaLogged({
                    type: 'respond_higher',
                    raise,
                    bidType,
                    amount
                  });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onEightOrNulls={() => {
                  dispatchFestaLogged({ type: 'declare_eight_or_nulls' });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onRespondEight={(offerEight) => {
                  if (king.eightOrNullsTarget !== null) {
                    dispatchFestaLogged({
                      type: 'respond_eight',
                      targetIndex: king.eightOrNullsTarget,
                      offerEight
                    });
                    setGameState(gameAdapter!.getCurrentState());
                  }
                }}
                onFallback={(choice) => {
                  dispatchFestaLogged({ type: 'fallback', choice });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onSetup={(trump, noTrump, firstPlayer) => {
                  dispatchFestaLogged({
                    type: 'setup',
                    trump,
                    noTrump,
                    firstPlayerIndex: firstPlayer
                  });
                  setGameState(gameAdapter!.getCurrentState());
                }}
              />
            );
          }
          if (overlay === 'synthetic_complete') {
            return (
              <KingSyntheticRoundCompleteCue
                locale={language === 'pt' ? 'pt' : 'en'}
              />
            );
          }

          if (overlay === 'score_popup') {
            return (
              <KingScoreSheetModal
                gameState={gameState}
                showContinue={gameState.waitingForRoundEnd}
                onDismiss={() => {
                  if (gameAdapter) {
                    kingCtrl.dismissScorePopup();
                    setGameState(gameAdapter.getCurrentState());
                  }
                }}
                onContinue={() => {
                  if (gameAdapter) {
                    kingCtrl.dismissScorePopup();
                    gameAdapter.continueToNextRound(gameAdapter.getCurrentState());
                    kingCtrl.afterContinueToNextRound();
                    setGameState(gameAdapter.getCurrentState());
                  }
                }}
                onConclude={() => {
                  gameOverExitRef.current.cancel();
                  if (gameAdapter) {
                    kingCtrl.dismissScorePopup();
                  }
                  onExit();
                }}
              />
            );
          }
          return null;
        })()}

      {gameVariant === 'sueca' &&
        shouldMountSuecaDealRitual({
          waitingForRoundStart: gameState.waitingForRoundStart,
          tableReadyForRitual,
          isGameOver: gameState.isGameOver,
          isJoiner,
          ritualDebugPreDealReleased: ritualDebug ? ritualDebugPreDealReleased : true
        }) && (
        <SuecaDealingModal
          playDirection={sessionPlayDirection}
          dealerIndex={gameState.dealerIndex}
          players={gameState.players}
          ritualDebug={ritualDebug}
          debugAdvanceNonce={ritualDebugAdvanceNonce}
          onRitualDebugPhase={setRitualDebugPhase}
          onRitualFocusChange={(focus) => {
            setRitualFocus(focus ? { seat: focus.seat, role: focus.role } : null);
          }}
          onConfirm={(alignment) => {
            runSuecaPostDealSequence(
              alignment,
              physicalDealFromAlignment(sessionPlayDirection, alignment)
            );
          }}
        />
      )}

      {gameVariant === 'sueca' && postDealPhase != null && (
        <SuecaPostDealCard
          phase={postDealPhase}
          dealerName={
            gameState.players[gameState.dealerIndex]?.name ??
            `Player ${gameState.dealerIndex + 1}`
          }
          firstPlayerName={
            gameState.players[gameState.currentPlayerIndex]?.name ??
            `Player ${gameState.currentPlayerIndex + 1}`
          }
          physicalDeal={postDealPhysical}
          trumpCard={gameState.trumpCard ?? null}
        />
      )}

      {ritualDebug &&
        gameVariant === 'sueca' &&
        gameStarted &&
        ritualDebugPhase != null && (
          <SuecaRitualDebugControl
            phase={ritualDebugPhase}
            onContinue={handleRitualDebugContinue}
          />
        )}


      {/* Game over modal - displays final scores and new game options.
          King final sheet owns the end UX (UX-KING-FINAL-01) while showScorePopup is set. */}
      {gameState.isGameOver &&
        !(
          gameVariant === 'king' &&
          kingCtrl &&
          Boolean(kingCtrl.readPtState(gameState).showScorePopup)
        ) && (
        <GameOverModal
          gameState={gameState}
          variant={gameVariant}
          usTeam={usTeam}
          themTeam={themTeam}
          localPlayerIndex={localPlayerIndex}
          getTeamName={getTeamName}
          onNewGame={handleNewGame}
        />
      )}

      {waitingForHost && (
        <div className="multiplayer-host-wait-overlay">
          <div className="multiplayer-host-wait-content">
            <span className="multiplayer-host-wait-spinner" />
            <p>A aguardar o host…</p>
          </div>
        </div>
      )}

      {waitingForEarlyEnd && (
        <EarlyRoundEndModal
          onAccept={() => {
            if (!gameAdapter) return;
            (heartsCtrl ?? kingCtrl)?.resolveEarlyEnd(true);
            setGameState(gameAdapter.getCurrentState());
          }}
          onDecline={() => {
            if (!gameAdapter) return;
            (heartsCtrl ?? kingCtrl)?.resolveEarlyEnd(false);
            setGameState(gameAdapter.getCurrentState());
          }}
        />
      )}

      <ConfirmDialog
        open={pinConfirmOpen}
        title={t.inGame.pinGame}
        message={t.inGame.pinConfirm}
        confirmLabel={t.inGame.pinGame}
        cancelLabel={t.gameMenu.cancel}
        onConfirm={confirmPinGame}
        onCancel={() => setPinConfirmOpen(false)}
      />
    </div>
  );
};
