import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameState, Card, Suit } from '../types/game';
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
import { requestAiPlay } from '../services/aiClient';
import { playCardAndLogDecision, playFirstLegalAndLogDecision } from '../cardIntelligence';
import { SUIT_TO_CODE, SUIT_TO_NAME, RANK_TO_IMAGE_NAME } from '../utils/cardMappings';
import { getCardImagePath } from '../constants/cardAssets';
import { isDevMode, publicUrl } from '../config/runtimeEnv';
import {
  AI_PLAY_DELAY_MS,
  DEAL_DELAY_MS,
  FESTA_AI_STEP_DELAY_MS,
  GAME_OVER_DELAY_MS,
  ROUND_START_SFX_DELAY_MS,
  TRICK_COLLECT_DELAY_MS
} from '../constants/gameConstants';
import { createGameOverExitController } from '../utils/gameOverExitTimer';
import { isHandPlayActionAllowed } from '../utils/handCardVisual';
import { resolveGameBoardFlow } from '../utils/gameFlowOrchestrator';
import {
  resolveHumanGameAudioResult,
  shouldPlayRoundEndCue
} from '../utils/roundGameCues';
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
  formatDevKingSyntheticBadge,
  parseDevKingSyntheticParams,
  type DevKingSyntheticJump
} from '../dev/kingSyntheticJump';
import {
  activateKingSynthetic,
  deactivateKingSynthetic,
  getKingSyntheticContract,
  isKingSyntheticActive,
  markKingSyntheticSetupApplied,
  shouldApplyFixtureAfterKoh,
  skipToNextKingSyntheticContract
} from '../dev/kingSyntheticController';
import { applyKingSyntheticFixture } from '../dev/kingSyntheticFixtures';
import type { KingNegativeContract } from '../models/games/king/kingContracts';
import { PlayerHand } from './PlayerHand';
import { GameActions } from './GameActions';
import { ScoreStrip } from './table/ScoreStrip';
import { TableSurface } from './table/TableSurface';
import { LocalPlayerDock } from './table/LocalPlayerDock';
import { useLayoutSnapshot } from '../hooks/useLayoutSnapshot';
import { SpadesBidMinibox } from './SpadesBidMinibox';
import { HeartsPassModal } from './HeartsPassModal';
import { SuecaDealingModal, DealingDirection } from './SuecaDealingModal';
import { KingFestaFlowModal } from './KingFestaFlowModal';
import { KingKohRevealModal } from './KingKohRevealModal';
import { KingScoreSheetModal } from './KingScoreSheetModal';
import { EarlyRoundEndModal } from './EarlyRoundEndModal';
import { resolvePresetId } from '../constants/rulesPresets';
import { recordGameFinished, showInterstitialIfDue } from '../services/adsService';
import { recordFinishedGame, pinGameSession } from '../services/gameHistoryStorage';
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
  
  const { playerNames, dealingMethod, aiDifficulty, gameVariant, rulesPresetId } = config;
  const [roundDealingMethod, setRoundDealingMethod] = useState(dealingMethod);
  const [dealingDirection, setDealingDirection] = useState<DealingDirection>('left');
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
  const [devKingSynthetic, setDevKingSynthetic] = useState<DevKingSyntheticJump | null>(null);
  const [devSyntheticContract, setDevSyntheticContract] = useState<KingNegativeContract | null>(
    null
  );

  const [gameAdapter, setGameAdapter] = useState<GameAdapter | null>(null);
  const gameAdapterRef = useRef<GameAdapter | null>(null);
  const latestRemoteStateRef = useRef<GameState | null>(null);
  const processedActionIdsRef = useRef<Set<string>>(new Set());
  const roundDealingMethodRef = useRef(dealingMethod);
  roundDealingMethodRef.current = roundDealingMethod;
  const dealingDirectionRef = useRef(dealingDirection);
  dealingDirectionRef.current = dealingDirection;
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;
  const gameOverExitRef = useRef(
    createGameOverExitController(() => onExitRef.current(), GAME_OVER_DELAY_MS)
  );
  const gameOverStatsRecordedRef = useRef(false);

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
      dealingMethod: 'A',
      dealingDirection: 'left',
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
        roundDealingMethod: roundDealingMethodRef.current,
        dealingDirection: dealingDirectionRef.current,
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
    }, DEAL_DELAY_MS);
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
            dealingMethod: config.dealingMethod,
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
            config.rulesPresetId === 'king-pt-normal' &&
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
              initOptions
            );
            setDevKingFestaJump(festaJump);
            setDevKingNegContract(null);
            setDevKingSynthetic(null);
            setDevSyntheticContract(null);
            deactivateKingSynthetic();
          } else if (negJump && adapter instanceof KingGame) {
            const negState = applyDevNegativeFixture(
              adapter,
              config.playerNames,
              negJump,
              initOptions
            );
            initialState = negState ?? adapter.initialize(config.playerNames, initOptions);
            setDevKingNegContract(negJump);
            setDevKingFestaJump(null);
            setDevKingSynthetic(null);
            setDevSyntheticContract(null);
            deactivateKingSynthetic();
          } else if (synthJump && adapter instanceof KingGame) {
            activateKingSynthetic(synthJump);
            setDevKingSynthetic(synthJump);
            setDevKingFestaJump(null);
            setDevKingNegContract(null);
            if (synthJump.contract) {
              // Targeted fixture — skip KOH for immediate legality smoke.
              initialState = applyKingSyntheticFixture(
                adapter,
                config.playerNames,
                synthJump.contract,
                initOptions
              );
              markKingSyntheticSetupApplied();
              setDevSyntheticContract(synthJump.contract);
            } else {
              // Default: keep KOH reveal; fixture applies after confirm.
              initialState = adapter.initialize(config.playerNames, initOptions);
              setDevSyntheticContract(getKingSyntheticContract());
            }
          } else {
            initialState = adapter.initialize(config.playerNames, initOptions);
            setDevKingFestaJump(null);
            setDevKingNegContract(null);
            setDevKingSynthetic(null);
            setDevSyntheticContract(null);
            deactivateKingSynthetic();
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

  useEffect(() => {
    if (!gameAdapter || !gameStarted || gameState.isGameOver || isMultiplayerActive) return;
    saveGameSession(
      stripMultiplayerFields({ ...config, playerNames, aiDifficulty, dealingMethod, gameVariant }),
      gameState
    );
  }, [gameAdapter, gameStarted, gameState, isMultiplayerActive, config, playerNames, aiDifficulty, dealingMethod, gameVariant]);

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

    const shouldCue = handsDealt && (handsJustDealt || roundStartCleared);
    if (shouldCue) {
      scheduleDealRoundSfx();
    }

    prevWaitingRoundStartRef.current = gameState.waitingForRoundStart;
    prevHandsDealtRef.current = handsDealt;
  }, [
    gameStarted,
    gameState.waitingForRoundStart,
    gameState.players,
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
   * Converts a Card object to a string code (e.g., "AS" for Ace of Spades)
   * Used for AI service communication and card identification
   */
  const cardToCode = (card: Card): string => {
    return `${card.rank}${SUIT_TO_CODE[card.suit] || ''}`;
  };

  /**
   * Handles AI player card selection and play
   * Tries external AI service first, falls back to local AI strategy
   * Includes fallback to first valid card if AI fails
   */
  const playAICard = useCallback(() => {
    if (!gameAdapter) {
      return;
    }
    
    const playerIndex = gameState.currentPlayerIndex;
    const player = gameState.players[playerIndex];

    // Safety check - don't play if hand is empty
    if (!player || player.hand.length === 0) {
      return;
    }

    /**
     * Attempts to get card play from external AI service.
     * Only used for Sueca on hard difficulty; all other variants/difficulties use local AI.
     * Returns card index if successful, -1 if skipped, unavailable, or timed out.
     */
    const tryExternal = async (): Promise<number> => {
      if (
        gameAdapter.variant !== 'sueca' ||
        gameState.aiDifficulty !== 'hard'
      ) {
        return -1;
      }
      try {
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
        const play = await requestAiPlay(payload);
        const idx = player.hand.findIndex((c) => cardToCode(c) === play);
        if (idx === -1) {
          console.warn(`[AI external] card "${play}" not found in hand (player ${playerIndex})`);
          setAiSource('local');
          return -1;
        }
        const currentStateForValidation = gameAdapter.getCurrentState();
        if (!gameAdapter.canPlayCard(currentStateForValidation, playerIndex, idx)) {
          console.warn(`[AI external] card "${play}" (idx ${idx}) is illegal for player ${playerIndex} — falling back to local AI`);
          setAiSource('local');
          return -1;
        }
        setAiSource('external');
        return idx;
      } catch (err) {
        console.warn(`[AI external] request failed for player ${playerIndex}:`, err instanceof Error ? err.message : err);
        setAiSource('local');
        return -1;
      }
    };

    /**
     * Main AI card selection logic
     * 1. Try external AI service
     * 2. Fallback to local AI strategy
     * 3. Final fallback: play first valid card
     */
    const chooseAndPlay = async () => {
      let cardIndex = await tryExternal();
      const currentState = gameAdapter.getCurrentState();
      if (cardIndex < 0) {
        cardIndex = gameAdapter.chooseAICard(currentState, playerIndex);
      }

      const publishHostAiPlay = () => {
        afterHostMutationRef.current();
      };

      const logOpts = {
        gameConfigMode: config.rulesPresetId,
        isMultiplayer: isMultiplayerActive,
      };

      if (cardIndex >= 0 && playCardAndLogDecision(gameAdapter, currentState, playerIndex, cardIndex, logOpts)) {
        playCardSound();
        publishHostAiPlay();
        return;
      }
      if (cardIndex >= 0) {
        console.warn(`[AI local] playCard rejected index ${cardIndex} for player ${playerIndex} (${gameAdapter.variant}) — trying playFirstLegal`);
      }

      const fallbackIdx = playFirstLegalAndLogDecision(gameAdapter, currentState, playerIndex, logOpts);
      if (fallbackIdx >= 0) {
        playCardSound();
        publishHostAiPlay();
      } else {
          console.error(
            `[AI fallback] playFirstLegal returned -1 — turn may be stuck`,
            {
              variant: gameAdapter.variant,
              playerIndex,
              hand: currentState.players[playerIndex]?.hand.map(cardToCode) ?? [],
              trick: currentState.currentTrick.map(cardToCode),
            }
          );
        }
    };

    void chooseAndPlay().catch((err) => {
      console.warn('[AI chooseAndPlay]', err instanceof Error ? err.message : err);
    });
  }, [gameAdapter, gameState, playCardSound, config.rulesPresetId, isMultiplayerActive]);

  /**
   * Auto-play effect for AI players
   * Automatically triggers AI card play when it's an AI player's turn
   * Only runs if game is active, not paused, and not in a waiting state
   * Includes 1.5s delay for better UX (allows player to see the turn change)
   */
  useEffect(() => {
    // Only auto-play if game exists and is started
    if (!gameAdapter || !gameStarted) return;
    
    // Auto-play for AI players (only if not waiting for round/game start and not paused)
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const isRemoteTurn = isMultiplayer && currentPlayer?.type === 'remote';
    const isLocalHumanTurn = isMultiplayer
      ? gameState.currentPlayerIndex === multiplayerPlayerIndex
      : gameState.currentPlayerIndex === 0;

    if (
      !gameState.isGameOver &&
      !gameState.isPaused &&
      !gameState.waitingForTrickEnd &&
      !gameState.waitingForRoundStart &&
      !gameState.waitingForRoundEnd &&
      !gameState.waitingForGameStart &&
      !isRemoteTurn &&
      !isLocalHumanTurn &&
      isHostOrSolo &&
      !waitingForEarlyEnd
    ) {
      const timer = setTimeout(() => {
        playAICard();
      }, AI_PLAY_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [gameAdapter, gameStarted, gameState.currentPlayerIndex, gameState.isGameOver, gameState.isPaused, gameState.waitingForTrickEnd, gameState.waitingForRoundStart, gameState.waitingForRoundEnd, gameState.waitingForGameStart, gameState.players, gameState.variantState, gameVariant, playAICard, isMultiplayer, multiplayerPlayerIndex, isHostOrSolo, waitingForEarlyEnd]);

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
      !gameState.waitingForGameStart
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
      return;
    }
    if (!gameAdapter || !gameState.winner) return;
    if (gameOverStatsRecordedRef.current) return;
    gameOverStatsRecordedRef.current = true;

    recordGameFinished();
    void showInterstitialIfDue();
    const localIdx = isMultiplayer ? multiplayerPlayerIndex : 0;

    if (heartsCtrl) {
      const scores = heartsCtrl.readState(gameState).playerScores;
      const winnerIndex = scores.indexOf(Math.min(...scores));
      const winnerName = gameState.players[winnerIndex]?.name ?? 'Player';
      const playerWon = winnerIndex === localIdx;
      recordGameResult(gameVariant, playerWon);
      recordFinishedGame({
        variant: gameVariant,
        finishedAt: Date.now(),
        playerWon,
        summary: `${winnerName} · ${scores.join('/')}`
      });
      const audioResult = resolveHumanGameAudioResult({
        variant: 'hearts',
        winner: gameState.winner,
        localPlayerIndex: localIdx,
        players: gameState.players,
        individualScores: scores
      });
      if (audioResult === 'win') playGameWinSound();
      else if (audioResult === 'lose') playGameLoseSound();
    } else if (kingCtrl) {
      const scores = kingCtrl.readPlayerScores(gameState);
      const winnerIndex = scores.indexOf(Math.max(...scores));
      const winnerName = gameState.players[winnerIndex]?.name ?? 'Player';
      const playerWon = winnerIndex === localIdx;
      recordGameResult(gameVariant, playerWon);
      recordFinishedGame({
        variant: gameVariant,
        finishedAt: Date.now(),
        playerWon,
        summary: `${winnerName} · ${scores.join('/')}`
      });
      const audioResult = resolveHumanGameAudioResult({
        variant: 'king',
        winner: gameState.winner,
        localPlayerIndex: localIdx,
        players: gameState.players,
        individualScores: scores
      });
      if (audioResult === 'win') playGameWinSound();
      else if (audioResult === 'lose') playGameLoseSound();
    } else {
      const us = gameState.players[localIdx]?.team;
      const playerWon = us === gameState.winner;
      recordGameResult(gameVariant, playerWon);
      const winnerLabel = gameState.winner === us ? t.gameBoard.us : t.gameBoard.them;
      const scoreSummary = `${gameState.gameScore.team1}-${gameState.gameScore.team2}`;
      recordFinishedGame({
        variant: gameVariant,
        finishedAt: Date.now(),
        playerWon,
        summary: `${winnerLabel} · ${scoreSummary}`
      });
      const audioResult = resolveHumanGameAudioResult({
        variant: gameVariant,
        winner: gameState.winner,
        localPlayerIndex: localIdx,
        players: gameState.players
      });
      if (audioResult === 'win') playGameWinSound();
      else if (audioResult === 'lose') playGameLoseSound();
    }

    clearGameSession(gameVariant);
    gameOverExitRef.current.schedule();
  }, [
    gameAdapter,
    heartsCtrl,
    kingCtrl,
    gameState,
    gameState.isGameOver,
    gameState.winner,
    gameState.players,
    gameState.gameScore,
    gameState.variantState,
    gameVariant,
    isMultiplayer,
    multiplayerPlayerIndex,
    playGameLoseSound,
    playGameWinSound,
    t.gameBoard.them,
    t.gameBoard.us
  ]);

  useEffect(() => {
    const ctrl = gameOverExitRef.current;
    return () => {
      ctrl.cancel();
    };
  }, []);

  const localPlayerIndex = isMultiplayer ? multiplayerPlayerIndex : 0;

  const kingPtFestaKey =
    kingCtrl && kingCtrl.isPtNormal(rulesPresetId)
      ? kingCtrl.buildFestaSyncKey(kingCtrl.readPtState(gameState))
      : '';

  useEffect(() => {
    if (!gameAdapter || !kingCtrl) return;
    if (!kingCtrl.shouldTickFestaAi(gameState, rulesPresetId)) return;

    const festaPhase = kingCtrl.readPtState(gameState).festaPhase;
    // Auction voices are manual (Continuar). Only non-auction festa AI keeps a short delay.
    const delayMs =
      festaPhase === 'auction' ? 0 : FESTA_AI_STEP_DELAY_MS;

    const timer = window.setTimeout(() => {
      const acted = kingCtrl.tickFestaAi();
      if (acted) {
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
    }, AI_PLAY_DELAY_MS);
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
      saveGameSession(
        stripMultiplayerFields({ ...config, playerNames, aiDifficulty, dealingMethod, gameVariant }),
        gameState
      );
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
    if (isKingSyntheticActive() || devKingSynthetic) return;
    setPinConfirmOpen(true);
  };

  const loadSyntheticFixture = useCallback(
    (contract: KingNegativeContract) => {
      if (!gameAdapter || !(gameAdapter instanceof KingGame)) return;
      const next = applyKingSyntheticFixture(
        gameAdapter,
        config.playerNames,
        contract,
        {
          aiDifficulty: config.aiDifficulty,
          localPlayerIndex: config.multiplayerEnabled
            ? (config.localPlayerIndex ?? 0)
            : undefined,
          rulesPresetId: config.rulesPresetId
        }
      );
      markKingSyntheticSetupApplied();
      setDevSyntheticContract(contract);
      setGameState(next);
    },
    [gameAdapter, config]
  );

  const handleSyntheticNext = () => {
    const next = skipToNextKingSyntheticContract();
    if (!next) return;
    loadSyntheticFixture(next);
  };

  const confirmPinGame = () => {
    setPinConfirmOpen(false);
    if (gameState.isGameOver) return;
    if (isKingSyntheticActive() || devKingSynthetic) return;
    pinGameSession(
      { ...config, playerNames, aiDifficulty, dealingMethod, gameVariant },
      gameState
    );
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
        heartsPassIndices: heartsState?.humanPassIndices
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
      heartsState
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
          <PlayerHand
            gameState={gameState}
            localPlayerIndex={localPlayerIndex}
            selectedCard={selectedCard}
            readOnly={handProps.readOnly}
            selectedPassIndices={handProps.selectedPassIndices}
            canPlayCard={isLocalCardPlayable}
            onCardClick={handleCardClick}
            getCardImage={getCardImage}
            layoutSnapshot={layoutSnapshot}
          />
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
      data-ai-source={isDevMode() ? aiSource : undefined}
    >
      {(devKingFestaJump || devKingNegContract || devKingSynthetic) ? (
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
            pointerEvents: devKingSynthetic ? 'auto' : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            alignItems: 'flex-end'
          }}
        >
          <span>
            {devKingFestaJump
              ? formatDevKingFestaBadge(devKingFestaJump)
              : devKingNegContract
                ? formatDevKingNegBadge(devKingNegContract)
                : formatDevKingSyntheticBadge(devSyntheticContract)}
          </span>
          {devKingSynthetic ? (
            <button
              type="button"
              data-testid="king-synthetic-next"
              className="sueca-btn sueca-btn--secondary sueca-btn--compact"
              style={{ minHeight: 28, fontSize: 11, pointerEvents: 'auto' }}
              onClick={handleSyntheticNext}
            >
              Seguinte
            </button>
          ) : null}
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
          />
        </div>
        <InGameBar
          isPaused={gameState.isPaused}
          onPause={handlePause}
          onResume={handleResume}
          onNewGame={handleNewGame}
          onPinGame={
            isKingSyntheticActive() || devKingSynthetic ? undefined : handlePinGame
          }
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
          blindNilEnabled={spadesState.blindNilEnabled}
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
                onNext={() => {
                  kingCtrl.advanceKohRevealStep();
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onConfirm={() => {
                  kingCtrl.confirmKohReveal();
                  let nextState = gameAdapter!.getCurrentState();
                  if (
                    shouldApplyFixtureAfterKoh() &&
                    gameAdapter instanceof KingGame
                  ) {
                    const contract = getKingSyntheticContract() ?? 'no_tricks';
                    nextState = applyKingSyntheticFixture(
                      gameAdapter,
                      config.playerNames,
                      contract,
                      {
                        aiDifficulty: config.aiDifficulty,
                        localPlayerIndex: config.multiplayerEnabled
                          ? (config.localPlayerIndex ?? 0)
                          : undefined,
                        rulesPresetId: config.rulesPresetId
                      }
                    );
                    markKingSyntheticSetupApplied();
                    setDevSyntheticContract(contract);
                  }
                  setGameState(nextState);
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
                  kingCtrl.dispatchFestaAction({
                    type: 'auction_pass',
                    playerIndex: localPlayerIndex
                  });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onAuctionBid={(bidType, amount) => {
                  kingCtrl.dispatchFestaAction({
                    type: 'auction_bid',
                    playerIndex: localPlayerIndex,
                    bidType,
                    amount
                  });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onAuctionContinue={() => {
                  kingCtrl.dispatchFestaAction({ type: 'auction_continue' });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onAcceptContract={() => {
                  kingCtrl.dispatchFestaAction({ type: 'accept_contract' });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onRejectContract={() => {
                  kingCtrl.dispatchFestaAction({ type: 'reject_contract' });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onRequestHigherBid={(bidType, amount) => {
                  kingCtrl.dispatchFestaAction({
                    type: 'request_higher',
                    bidType,
                    amount
                  });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onRespondHigherBid={(raise, bidType, amount) => {
                  kingCtrl.dispatchFestaAction({
                    type: 'respond_higher',
                    raise,
                    bidType,
                    amount
                  });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onEightOrNulls={() => {
                  kingCtrl.dispatchFestaAction({ type: 'declare_eight_or_nulls' });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onRespondEight={(offerEight) => {
                  if (king.eightOrNullsTarget !== null) {
                    kingCtrl.dispatchFestaAction({
                      type: 'respond_eight',
                      targetIndex: king.eightOrNullsTarget,
                      offerEight
                    });
                    setGameState(gameAdapter!.getCurrentState());
                  }
                }}
                onFallback={(choice) => {
                  kingCtrl.dispatchFestaAction({ type: 'fallback', choice });
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onSetup={(trump, noTrump, firstPlayer) => {
                  kingCtrl.dispatchFestaAction({
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
              />
            );
          }
          return null;
        })()}

      {gameVariant === 'king' &&
        resolvePresetId('king', rulesPresetId) === 'king-simplified' &&
        gameState.waitingForRoundStart &&
        !gameState.isGameOver && !isJoiner && (
          <div className="variant-modal-overlay">
            <div className="variant-modal">
              <h2>
                King simplificado — Jogo {gameState.round}/10 (
                {kingCtrl?.readSimplifiedHandType(gameState) || '…'}
                )
              </h2>
              <button
                type="button"
                className="sueca-btn sueca-btn--primary"
                onClick={() => {
                  if (!gameAdapter) return;
                  gameAdapter.startRound(gameAdapter.getCurrentState());
                  afterHostMutation();
                }}
              >
                Começar mão
              </button>
            </div>
          </div>
        )}

      {gameVariant === 'sueca' && gameState.waitingForRoundStart && !gameState.isGameOver && !isJoiner && (
        <SuecaDealingModal
          round={gameState.round}
          dealingMethod={roundDealingMethod}
          dealingDirection={dealingDirection}
          onMethodChange={setRoundDealingMethod}
          onDirectionChange={setDealingDirection}
          onConfirm={() => {
            if (!gameAdapter || !suecaCtrl) return;
            suecaCtrl.applyDealSetup(roundDealingMethod, dealingDirection);
            gameAdapter.startRound(gameAdapter.getCurrentState());
            if (isHost) {
              mpLog('[MP] host publish deal', {
                session: multiplayerSessionCode,
              });
            }
            afterHostMutation();
          }}
        />
      )}


      {/* Game over modal - displays final scores and new game options */}
      {gameState.isGameOver && (
        <GameOverModal
          gameState={gameState}
          variant={gameVariant}
          usTeam={usTeam}
          themTeam={themTeam}
          localPlayerIndex={localPlayerIndex}
          dealingMethod={dealingMethod}
          getTeamName={getTeamName}
          onDealingMethodChange={() => {}}
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
