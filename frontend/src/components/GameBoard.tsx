import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameState, Card, Suit } from '../types/game';
import { GameConfig } from '../types/gameConfig';
import { InGameBar } from './navigation/InGameBar';
import { RoundEndModal } from './RoundEndModal';
import { GameOverModal } from './GameOverModal';
import { useSound } from '../hooks/useSound';
import { useLanguage } from '../i18n/useLanguage';
import './GameBoard.css';
import { requestAiPlay } from '../services/aiClient';
import { playCardAndLogDecision, playFirstLegalAndLogDecision } from '../cardIntelligence';
import { SUIT_TO_CODE, SUIT_TO_NAME, RANK_TO_IMAGE_NAME } from '../utils/cardMappings';
import { getCardImagePath } from '../constants/cardAssets';
import {
  AI_PLAY_DELAY_MS,
  GAME_OVER_DELAY_MS,
  SHUFFLE_DELAY_MS,
  TRICK_WIN_DELAY_MS
} from '../constants/gameConstants';
import { createGameOverExitController } from '../utils/gameOverExitTimer';
import { isHandPlayActionAllowed } from '../utils/handCardVisual';
import { resolveGameBoardFlow } from '../utils/gameFlowOrchestrator';
import { GameFactory } from '../models/games/GameFactory';
import { GameAdapter } from '../models/games/GameAdapter';
import {
  isHeartsFlow,
  isKingFlow,
  isSpadesFlow,
  isSuecaFlow
} from '../models/games/variantFlowApi';
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
import { getAvailableGames } from '../constants/gameMetadata';
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
  const { playCardSound, playErrorSound, playShuffleSound, playTrickWinSound } = useSound();
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
  const shuffleTimerRef = useRef<number | null>(null);
  const trickWinTimerRef = useRef<number | null>(null);
  const freshStartRef = useRef(false);
  const [gameInitKey, setGameInitKey] = useState(0);

  const variantFlow = useMemo(
    () => gameAdapter?.getVariantFlow() ?? null,
    [gameAdapter]
  );

  const kingPtState = useMemo(() => {
    if (!variantFlow || !isKingFlow(variantFlow) || !variantFlow.isPtNormal(rulesPresetId)) {
      return null;
    }
    return variantFlow.readPtState(gameState);
  }, [variantFlow, rulesPresetId, gameState]);

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
    festaSheetActive,
    waitingForEarlyEnd,
    flowOverlayActive
  } = boardFlow;

  const gameLabel =
    getAvailableGames().find((g) => g.variant === gameVariant)?.name ?? gameVariant;

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
          initialState = adapter.initialize(config.playerNames, {
            dealingMethod: config.dealingMethod,
            aiDifficulty: config.aiDifficulty,
            localPlayerIndex: config.multiplayerEnabled ? (config.localPlayerIndex ?? 0) : undefined,
            multiplayerSlots: config.multiplayerEnabled ? config.multiplayerSlots : undefined,
            rulesPresetId: config.rulesPresetId
          });
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

  useEffect(() => {
    if (!gameStarted) return;
    const wasWaiting = prevWaitingRoundStartRef.current;
    if (wasWaiting === true && !gameState.waitingForRoundStart) {
      const hasHands = gameState.players.length > 0 && gameState.players.every((p) => p.hand.length > 0);
      if (hasHands) {
        if (shuffleTimerRef.current !== null) {
          window.clearTimeout(shuffleTimerRef.current);
        }
        shuffleTimerRef.current = window.setTimeout(() => {
          playShuffleSound();
          shuffleTimerRef.current = null;
        }, SHUFFLE_DELAY_MS);
      }
    }
    prevWaitingRoundStartRef.current = gameState.waitingForRoundStart;
    return () => {
      if (shuffleTimerRef.current !== null) {
        window.clearTimeout(shuffleTimerRef.current);
        shuffleTimerRef.current = null;
      }
    };
  }, [gameStarted, gameState.waitingForRoundStart, gameState.players, playShuffleSound]);

  useEffect(() => {
    if (!gameStarted) return;
    const wasWaiting = prevWaitingTrickEndRef.current;
    if (wasWaiting === false && gameState.waitingForTrickEnd) {
      if (trickWinTimerRef.current !== null) {
        window.clearTimeout(trickWinTimerRef.current);
      }
      trickWinTimerRef.current = window.setTimeout(() => {
        playTrickWinSound();
        trickWinTimerRef.current = null;
      }, TRICK_WIN_DELAY_MS);
    }
    prevWaitingTrickEndRef.current = gameState.waitingForTrickEnd;
    return () => {
      if (trickWinTimerRef.current !== null) {
        window.clearTimeout(trickWinTimerRef.current);
        trickWinTimerRef.current = null;
      }
    };
  }, [gameStarted, gameState.waitingForTrickEnd, playTrickWinSound]);

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
    if (!gameAdapter || !variantFlow) return;

    if (isHeartsFlow(variantFlow)) {
      if (variantFlow.readState(gameState).waitingForPass) {
        variantFlow.togglePassCard(cardIndex, localPlayerIndex);
        setGameState(gameAdapter.getCurrentState());
        return;
      }
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
   * Generates the image path for a card
   * Maps card rank/suit to asset filename
   * Handles special case for face cards (J, Q, K) which use "_2" suffix
   * Works in both development and production environments
   */
  const getCardImage = (card: Card): string => {
    const suit = SUIT_TO_NAME[card.suit];
    const rank = RANK_TO_IMAGE_NAME[card.rank];
    return getCardImagePath(rank, suit, process.env.PUBLIC_URL || '');
  };

  /**
   * Effect to handle game over — record stats once and schedule delayed exit.
   * Timer is cancelled on New Game / leave / unmount so it cannot affect a new match.
   */
  useEffect(() => {
    if (!gameState.isGameOver) {
      gameOverStatsRecordedRef.current = false;
      return;
    }
    if (!gameAdapter || !gameState.winner || !variantFlow) return;
    if (gameOverStatsRecordedRef.current) return;
    gameOverStatsRecordedRef.current = true;

    recordGameFinished();
    void showInterstitialIfDue();
    const localIdx = isMultiplayer ? multiplayerPlayerIndex : 0;

    if (isHeartsFlow(variantFlow)) {
      const scores = variantFlow.readState(gameState).playerScores;
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
    } else if (isKingFlow(variantFlow)) {
      const scores = variantFlow.readPlayerScores(gameState);
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
    }

    clearGameSession(gameVariant);
    gameOverExitRef.current.schedule();
  }, [
    gameAdapter,
    variantFlow,
    gameState,
    gameState.isGameOver,
    gameState.winner,
    gameState.players,
    gameState.gameScore,
    gameState.variantState,
    gameVariant,
    isMultiplayer,
    multiplayerPlayerIndex,
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
    variantFlow && isKingFlow(variantFlow) && variantFlow.isPtNormal(rulesPresetId)
      ? (() => {
          const k = variantFlow.readPtState(gameState);
          return [
            k.festaPhase,
            k.auctionTurnIndex,
            k.bestBid?.bidderIndex,
            k.bestBid?.amount,
            k.requestedBid?.amount,
            k.waitingForFallback,
            k.waitingForFestaSetup,
            k.eightOrNullsPending,
            k.eightOrNullsTarget
          ].join('|');
        })()
      : '';

  useEffect(() => {
    if (!gameAdapter || !variantFlow || !isKingFlow(variantFlow)) return;
    if (!variantFlow.isPtNormal(rulesPresetId)) return;
    if (!gameState.waitingForRoundStart) return;

    const king = variantFlow.readPtState(gameState);
    const inFestaFlow =
      king.festaPhase === 'auction' ||
      king.festaPhase === 'negotiation' ||
      king.festaPhase === 'negotiation_counter' ||
      king.waitingForFallback ||
      king.waitingForFestaSetup ||
      king.eightOrNullsPending;
    if (!inFestaFlow) return;

    const timer = window.setTimeout(() => {
      const acted = variantFlow.tickFestaAi();
      if (acted) {
        setGameState(gameAdapter.getCurrentState());
      }
    }, 350);
    return () => window.clearTimeout(timer);
    // kingPtFestaKey tracks festa state; full gameState would retrigger on unrelated clones
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameAdapter, variantFlow, rulesPresetId, gameState.waitingForRoundStart, kingPtFestaKey]);

  const spadesState =
    variantFlow && isSpadesFlow(variantFlow)
      ? variantFlow.readState(gameState)
      : undefined;
  const spadesLocalBidTurn =
    spadesBidActive && spadesState?.currentBidderIndex === localPlayerIndex;

  useEffect(() => {
    if (!gameAdapter || !gameStarted || !variantFlow || !isSpadesFlow(variantFlow)) return;
    if (!spadesBidActive) return;

    const bidderIndex = spadesState?.currentBidderIndex ?? 0;
    const bidder = gameState.players[bidderIndex];
    const isLocalBidTurn = bidderIndex === localPlayerIndex;
    if (!bidder || bidder.type === 'human' || isLocalBidTurn) return;

    const timer = window.setTimeout(() => {
      variantFlow.tickBidAi();
      setGameState(gameAdapter.getCurrentState());
    }, AI_PLAY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [
    gameAdapter,
    variantFlow,
    gameStarted,
    spadesBidActive,
    spadesState?.currentBidderIndex,
    localPlayerIndex,
    gameState.players
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
    if (window.confirm(t.inGame.pinConfirm)) {
      pinGameSession(
        { ...config, playerNames, aiDifficulty, dealingMethod, gameVariant },
        gameState
      );
    }
  };

  const showTeamLabels = gameVariant === 'sueca' || gameVariant === 'hearts';
  const isTeamTableLayout = gameVariant === 'sueca' || gameVariant === 'spades';
  const heartsState =
    variantFlow && isHeartsFlow(variantFlow)
      ? variantFlow.readState(gameState)
      : undefined;

  const boardClassName = [
    'game-board',
    festaSheetActive ? 'game-board--festa-sheet' : '',
    isTeamTableLayout ? 'game-board--team-table' : '',
    heartsPassActive ? 'game-board--hearts-pass' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const tableSurface = (
    <TableSurface
      gameState={gameState}
      variant={gameVariant}
      localPlayerIndex={localPlayerIndex}
      usTeam={usTeam}
      getCardImage={getCardImage}
      getTeamName={getTeamName}
      showTeamLabels={showTeamLabels}
      showAuctionBadges={
        gameVariant === 'king' &&
        resolvePresetId('king', rulesPresetId) === 'king-pt-normal' &&
        kingPtState?.festaPhase === 'auction'
      }
      auctionActions={kingPtState?.auctionPlayerActions}
      auctionLocale={language === 'pt' ? 'pt' : 'en'}
      compactSeats={heartsPassActive}
      spadesBidPhase={spadesBidActive}
      spadesState={spadesState}
      layoutSnapshot={layoutSnapshot}
    />
  );

  return (
    <div className={boardClassName}>
      <InGameBar
        playerName={playerNames[localPlayerIndex] || 'Player 1'}
        gameLabel={gameLabel}
        metaLabel={aiSource === 'external' ? t.gameBoard.aiExternal : t.gameBoard.aiLocal}
        isPaused={gameState.isPaused}
        onPause={handlePause}
        onResume={handleResume}
        onNewGame={handleNewGame}
        onPinGame={handlePinGame}
        onExit={handleLeaveScreen}
      />

      <ScoreStrip
        gameState={gameState}
        variant={gameVariant}
        usTeam={usTeam}
        themTeam={themTeam}
        rulesPresetId={rulesPresetId}
      />

      {isTeamTableLayout ? <div className="game-table-zone">{tableSurface}</div> : tableSurface}

      {/* Human player dock + hand (South position) - displayed below table */}
      {gameAdapter && gameState.players[localPlayerIndex] && (
        <>
          <LocalPlayerDock
            gameState={gameState}
            variant={gameVariant}
            localPlayerIndex={localPlayerIndex}
            usTeam={usTeam}
            getTeamName={getTeamName}
            showTeamLabels={showTeamLabels}
            compactSeats={heartsPassActive}
            spadesBidPhase={spadesBidActive}
            spadesState={spadesState}
            showAuctionBadges={
              gameVariant === 'king' &&
              resolvePresetId('king', rulesPresetId) === 'king-pt-normal' &&
              kingPtState?.festaPhase === 'auction'
            }
            auctionActions={kingPtState?.auctionPlayerActions}
            auctionLocale={language === 'pt' ? 'pt' : 'en'}
          />
          <PlayerHand
            gameState={gameState}
            localPlayerIndex={localPlayerIndex}
            selectedCard={selectedCard}
            readOnly={festaSheetActive && !heartsPassActive}
            selectedPassIndices={heartsPassActive ? heartsState?.humanPassIndices : undefined}
            canPlayCard={(cardIndex: number) => {
              if (heartsPassActive) return true;
              if (!isHandPlayActionAllowed(gameState)) return false;
              return gameAdapter.canPlayCard(
                gameAdapter.getCurrentState(),
                localPlayerIndex,
                cardIndex
              );
            }}
            onCardClick={handleCardClick}
            getCardImage={getCardImage}
            layoutSnapshot={layoutSnapshot}
          />
        </>
      )}

      {spadesLocalBidTurn && spadesState && (
        <SpadesBidMinibox
          currentBidderName={gameState.players[localPlayerIndex]?.name ?? 'Player'}
          nilEnabled={spadesState.nilEnabled}
          blindNilEnabled={spadesState.blindNilEnabled}
          onConfirm={(bid, bidType) => {
            if (!gameAdapter || !variantFlow || !isSpadesFlow(variantFlow)) return;
            if (isJoiner) {
              submitAction({ type: 'submitBid', playerIndex: localPlayerIndex, bid, bidType });
              return;
            }
            variantFlow.submitBid(localPlayerIndex, bid, bidType);
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
        !(
          variantFlow &&
          isKingFlow(variantFlow) &&
          variantFlow.isPtNormal(rulesPresetId) &&
          variantFlow.readPtState(gameState).showScorePopup
        ) && (
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
            if (variantFlow && isKingFlow(variantFlow)) {
              variantFlow.tickFestaAi();
            }
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
              if (!gameAdapter || !variantFlow || !isHeartsFlow(variantFlow)) return;
              if (isJoiner) {
                submitAction({ type: 'confirmPass', playerIndex: localPlayerIndex });
                return;
              }
              variantFlow.confirmPass(localPlayerIndex);
              afterHostMutation();
            }}
          />
        )}

      {!isJoiner &&
        variantFlow &&
        isKingFlow(variantFlow) &&
        variantFlow.isPtNormal(rulesPresetId) &&
        (() => {
          const king = variantFlow.readPtState(gameState);
          const inFestaFlow =
            king.festaPhase === 'auction' ||
            king.festaPhase === 'negotiation' ||
            king.festaPhase === 'negotiation_counter' ||
            king.waitingForFallback ||
            king.waitingForFestaSetup ||
            king.eightOrNullsPending;

          if (king.phase === 'koh_reveal' && gameState.waitingForRoundStart) {
            return (
              <KingKohRevealModal
                gameState={gameState}
                getCardImage={getCardImage}
                onNext={() => {
                  variantFlow.advanceKohRevealStep();
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onConfirm={() => {
                  variantFlow.confirmKohReveal();
                  setGameState(gameAdapter!.getCurrentState());
                }}
              />
            );
          }

          if (inFestaFlow && gameState.waitingForRoundStart) {
            return (
              <KingFestaFlowModal
                gameState={gameState}
                localPlayerIndex={localPlayerIndex}
                onAuctionPass={() => {
                  variantFlow.submitAuctionPass(localPlayerIndex);
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onAuctionBid={(bidType, amount) => {
                  variantFlow.submitAuctionBid(localPlayerIndex, bidType, amount);
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onAcceptContract={() => {
                  variantFlow.acceptContract();
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onRejectContract={() => {
                  variantFlow.rejectContract();
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onRequestHigherBid={(bidType, amount) => {
                  variantFlow.requestHigherBid(bidType, amount);
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onRespondHigherBid={(raise, bidType, amount) => {
                  variantFlow.respondToHigherBid(raise, bidType, amount);
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onEightOrNulls={() => {
                  variantFlow.declareEightOrNulls();
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onRespondEight={(offerEight) => {
                  if (king.eightOrNullsTarget !== null) {
                    variantFlow.respondEightOrNulls(king.eightOrNullsTarget, offerEight);
                    setGameState(gameAdapter!.getCurrentState());
                  }
                }}
                onFallback={(choice) => {
                  variantFlow.chooseFallback(choice);
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onSetup={(trump, noTrump, firstPlayer) => {
                  variantFlow.setupFesta(trump, noTrump, firstPlayer);
                  setGameState(gameAdapter!.getCurrentState());
                }}
              />
            );
          }
          if (king.showScorePopup) {
            return (
              <KingScoreSheetModal
                gameState={gameState}
                showContinue={gameState.waitingForRoundEnd}
                onDismiss={() => {
                  if (gameAdapter) {
                    variantFlow.dismissScorePopup();
                    setGameState(gameAdapter.getCurrentState());
                  }
                }}
                onContinue={() => {
                  if (gameAdapter) {
                    variantFlow.dismissScorePopup();
                    gameAdapter.continueToNextRound(gameAdapter.getCurrentState());
                    variantFlow.tickFestaAi();
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
            <div className="variant-modal dobo-panel">
              <h2>
                King simplificado — mão {gameState.round}/10 (
                {(variantFlow && isKingFlow(variantFlow)
                  ? variantFlow.readSimplifiedHandType(gameState)
                  : undefined) || '…'}
                )
              </h2>
              <button
                type="button"
                className="variant-modal-primary dobo-btn"
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
            if (!gameAdapter || !variantFlow || !isSuecaFlow(variantFlow)) return;
            variantFlow.setDealingMethod(roundDealingMethod);
            variantFlow.setDealingDirection(dealingDirection);
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
            if (!gameAdapter || !variantFlow) return;
            if (isKingFlow(variantFlow) || isHeartsFlow(variantFlow)) {
              variantFlow.acceptEarlyEnd();
            }
            setGameState(gameAdapter.getCurrentState());
          }}
          onDecline={() => {
            if (!gameAdapter || !variantFlow) return;
            if (isKingFlow(variantFlow) || isHeartsFlow(variantFlow)) {
              variantFlow.declineEarlyEnd();
            }
            setGameState(gameAdapter.getCurrentState());
          }}
        />
      )}
    </div>
  );
};
