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
import { SUIT_TO_CODE, SUIT_TO_NAME, RANK_TO_IMAGE_NAME } from '../utils/cardMappings';
import { getCardImagePath } from '../constants/cardAssets';
import {
  AI_PLAY_DELAY_MS,
  GAME_OVER_DELAY_MS,
  SHUFFLE_DELAY_MS,
  TRICK_WIN_DELAY_MS
} from '../constants/gameConstants';
import { GameFactory } from '../models/games/GameFactory';
import { GameAdapter } from '../models/games/GameAdapter';
import { PlayerHand } from './PlayerHand';
import { GameActions } from './GameActions';
import { ScoreStrip } from './table/ScoreStrip';
import { TableSurface } from './table/TableSurface';
import { SpadesBidModal } from './SpadesBidModal';
import { HeartsPassModal } from './HeartsPassModal';
import { SuecaDealingModal, DealingDirection } from './SuecaDealingModal';
import { KingFestaFlowModal } from './KingFestaFlowModal';
import { KingKohRevealModal } from './KingKohRevealModal';
import { KingScoreSheetModal } from './KingScoreSheetModal';
import { EarlyRoundEndModal } from './EarlyRoundEndModal';
import { SpadesGame } from '../models/games/SpadesGame';
import { HeartsGame } from '../models/games/HeartsGame';
import { KingGame } from '../models/games/KingGame';
import { SuecaGame } from '../models/games/SuecaGame';
import { getKingPtState } from '../models/games/KingPtGame';
import { resolvePresetId } from '../constants/rulesPresets';
import { recordGameFinished, showInterstitialIfDue } from '../services/adsService';
import { recordFinishedGame, pinGameSession } from '../services/gameHistoryStorage';
import { getAvailableGames } from '../constants/gameMetadata';
import {
  saveGameSession,
  clearGameSession,
  recordGameResult,
  SavedGameSession
} from '../services/gameSessionStorage';

export interface GameBoardProps {
  config: GameConfig;
  resumeSession?: SavedGameSession | null;
  darkMode: boolean;
  onExit: () => void;
}

/**
 * Main game board component - renders the entire Sueca game interface
 * Manages game state, player interactions, AI moves, and UI rendering
 */
export const GameBoard: React.FC<GameBoardProps> = ({ config, resumeSession, darkMode, onExit }) => {
  const { t, language } = useLanguage();
  const [gameStarted, setGameStarted] = useState(false);
  const [aiSource, setAiSource] = useState<'external' | 'local'>('local');
  
  const { playerNames, dealingMethod, aiDifficulty, gameVariant, rulesPresetId } = config;
  const [roundDealingMethod, setRoundDealingMethod] = useState(dealingMethod);
  const [dealingDirection, setDealingDirection] = useState<DealingDirection>('left');
  const isMultiplayer = Boolean(config.multiplayerEnabled);
  const multiplayerPlayerIndex = 0;
  const multiplayerStatus = 'disconnected' as const;
  const multiplayerSessionId: string | null = config.multiplayerSessionId ?? null;
  const multiplayerError: string | null = null;

  const [gameAdapter, setGameAdapter] = useState<GameAdapter | null>(null);
  
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
  const showGridOverlay = false;
  const prevWaitingRoundStartRef = useRef<boolean | null>(null);
  const prevWaitingTrickEndRef = useRef<boolean | null>(null);
  const shuffleTimerRef = useRef<number | null>(null);
  const trickWinTimerRef = useRef<number | null>(null);
  const freshStartRef = useRef(false);
  const [gameInitKey, setGameInitKey] = useState(0);

  const kingPtState = useMemo(
    () =>
      gameVariant === 'king' && resolvePresetId('king', rulesPresetId) === 'king-pt-normal'
        ? getKingPtState(gameState)
        : null,
    [gameVariant, rulesPresetId, gameState]
  );

  const waitingForEarlyEnd = useMemo(
    () =>
      Boolean(kingPtState?.waitingForEarlyEnd) ||
      Boolean(
        gameVariant === 'hearts' &&
          (gameState.variantState?.hearts as { waitingForEarlyEnd?: boolean } | undefined)
            ?.waitingForEarlyEnd
      ),
    [kingPtState, gameVariant, gameState.variantState]
  );

  const festaSheetActive = useMemo(
    () =>
      Boolean(
        kingPtState &&
          gameState.waitingForRoundStart &&
          kingPtState.phase !== 'koh_reveal' &&
          (kingPtState.festaPhase === 'auction' ||
            kingPtState.festaPhase === 'negotiation' ||
            kingPtState.festaPhase === 'negotiation_counter' ||
            kingPtState.waitingForFallback ||
            kingPtState.waitingForFestaSetup ||
            kingPtState.eightOrNullsPending)
      ),
    [kingPtState, gameState.waitingForRoundStart]
  );

  const gameLabel =
    getAvailableGames().find((g) => g.variant === gameVariant)?.name ?? gameVariant;

  useEffect(() => {
    try {
      const adapter = GameFactory.getAdapter(config.gameVariant);
      let initialState: GameState;
      const shouldResume =
        !freshStartRef.current &&
        resumeSession?.state &&
        resumeSession.config.gameVariant === config.gameVariant;
      if (shouldResume) {
        initialState = adapter.restoreState(resumeSession.state);
      } else {
        initialState = adapter.initialize(config.playerNames, {
          dealingMethod: config.dealingMethod,
          aiDifficulty: config.aiDifficulty,
          localPlayerIndex: config.multiplayerEnabled ? 0 : undefined,
          rulesPresetId: config.rulesPresetId
        });
      }
      freshStartRef.current = false;
      setGameAdapter(adapter);
      setGameState(initialState);
      setGameStarted(true);
    } catch (error) {
      console.error('Error starting game:', error);
      alert(t.startMenu.errorStartingGame);
      onExit();
    }
  }, [config, resumeSession, gameInitKey, onExit, t.startMenu.errorStartingGame]);

  useEffect(() => {
    if (!gameAdapter || !gameStarted || gameState.isGameOver) return;
    saveGameSession(
      { ...config, playerNames, aiDifficulty, dealingMethod, gameVariant },
      gameState
    );
  }, [gameAdapter, gameStarted, gameState, config, playerNames, aiDifficulty, dealingMethod, gameVariant]);

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
     * Attempts to get card play from external AI service
     * Returns card index if successful, -1 if service unavailable
     */
    const tryExternal = async (): Promise<number> => {
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
        setAiSource('external');
        return idx;
      } catch (err) {
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

      if (cardIndex >= 0 && gameAdapter.playCard(currentState, playerIndex, cardIndex)) {
        playCardSound();
        setGameState(gameAdapter.getCurrentState());
      } else {
        for (let i = 0; i < player.hand.length; i++) {
          if (gameAdapter.playCard(gameAdapter.getCurrentState(), playerIndex, i)) {
            playCardSound();
            setGameState(gameAdapter.getCurrentState());
            break;
          }
        }
      }
    };

    chooseAndPlay();
  }, [gameAdapter, gameState, playCardSound]);

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
      !waitingForEarlyEnd
    ) {
      const timer = setTimeout(() => {
        playAICard();
      }, AI_PLAY_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [gameAdapter, gameStarted, gameState.currentPlayerIndex, gameState.isGameOver, gameState.isPaused, gameState.waitingForTrickEnd, gameState.waitingForRoundStart, gameState.waitingForRoundEnd, gameState.waitingForGameStart, gameState.players, gameState.variantState, gameVariant, playAICard, isMultiplayer, multiplayerPlayerIndex, waitingForEarlyEnd]);

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

    if (gameVariant === 'hearts') {
      const hearts = gameState.variantState?.hearts as { waitingForPass?: boolean } | undefined;
      if (hearts?.waitingForPass) {
        (gameAdapter as HeartsGame).togglePassCard(cardIndex, localPlayerIndex);
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
        const success = gameAdapter.playCard(currentState, playerIndex, cardIndex);
        if (success) {
          playCardSound();
          setGameState(gameAdapter.getCurrentState());
          setSelectedCard(null);
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
   * Effect to handle game over — record stats and return to dashboard
   */
  useEffect(() => {
    if (gameAdapter && gameState.isGameOver && gameState.winner) {
      recordGameFinished();
      void showInterstitialIfDue();
      const localIdx = isMultiplayer ? multiplayerPlayerIndex : 0;
      const us = gameState.players[localIdx]?.team;
      const playerWon = us === gameState.winner;
      recordGameResult(gameVariant, playerWon);
      const winnerLabel =
        gameState.winner === us ? t.gameBoard.us : t.gameBoard.them;
      const scoreSummary = `${gameState.gameScore.team1}-${gameState.gameScore.team2}`;
      recordFinishedGame({
        variant: gameVariant,
        finishedAt: Date.now(),
        playerWon,
        summary: `${winnerLabel} · ${scoreSummary}`
      });
      clearGameSession(gameVariant);
      const timer = setTimeout(() => onExit(), GAME_OVER_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [
    gameAdapter,
    gameState.isGameOver,
    gameState.winner,
    gameState.players,
    gameState.gameScore,
    gameVariant,
    isMultiplayer,
    multiplayerPlayerIndex,
    onExit,
    t.gameBoard.them,
    t.gameBoard.us
  ]);

  const localPlayerIndex = isMultiplayer ? multiplayerPlayerIndex : 0;

  const kingPtFestaKey =
    gameVariant === 'king' && resolvePresetId('king', rulesPresetId) === 'king-pt-normal'
      ? (() => {
          const k = getKingPtState(gameState);
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
    if (!gameAdapter || gameVariant !== 'king') return;
    if (resolvePresetId('king', rulesPresetId) !== 'king-pt-normal') return;
    if (!gameState.waitingForRoundStart) return;

    const king = getKingPtState(gameState);
    const inFestaFlow =
      king.festaPhase === 'auction' ||
      king.festaPhase === 'negotiation' ||
      king.festaPhase === 'negotiation_counter' ||
      king.waitingForFallback ||
      king.waitingForFestaSetup ||
      king.eightOrNullsPending;
    if (!inFestaFlow) return;

    const timer = window.setTimeout(() => {
      const acted = (gameAdapter as KingGame).tickFestaAi();
      if (acted) {
        setGameState(gameAdapter.getCurrentState());
      }
    }, 350);
    return () => window.clearTimeout(timer);
    // kingPtFestaKey tracks festa state; full gameState would retrigger on unrelated clones
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameAdapter, gameVariant, rulesPresetId, gameState.waitingForRoundStart, kingPtFestaKey]);
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
    saveGameSession(
      { ...config, playerNames, aiDifficulty, dealingMethod, gameVariant },
      gameState
    );
    onExit();
  };

  const restartFreshGame = () => {
    clearGameSession(gameVariant);
    freshStartRef.current = true;
    setSelectedCard(null);
    setGameInitKey((key) => key + 1);
  };

  const handleNewGame = () => {
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
  const heartsState = gameState.variantState?.hearts as
    | { waitingForPass?: boolean; humanPassIndices?: number[]; passDirection?: string }
    | undefined;
  const heartsPassActive = gameVariant === 'hearts' && Boolean(heartsState?.waitingForPass);

  const boardClassName = [
    'game-board',
    darkMode ? 'dark-mode' : '',
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
      showGridOverlay={showGridOverlay}
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
      {isMultiplayer && (
        <div className={`multiplayer-banner multiplayer-${multiplayerStatus}`}>
          <span>{`Multiplayer: ${multiplayerStatus}`}</span>
          {multiplayerSessionId && <span>{`Session: ${multiplayerSessionId}`}</span>}
          {multiplayerError && <span className="error-label">{multiplayerError}</span>}
        </div>
      )}

      {isTeamTableLayout ? <div className="game-table-zone">{tableSurface}</div> : tableSurface}

      {/* Human player's hand (South position) - displayed below table */}
      {gameAdapter && gameState.players[localPlayerIndex] && (
        <PlayerHand
          gameState={gameState}
          variant={gameVariant}
          localPlayerIndex={localPlayerIndex}
          selectedCard={selectedCard}
          readOnly={festaSheetActive && !heartsPassActive}
          selectedPassIndices={heartsPassActive ? heartsState?.humanPassIndices : undefined}
          canPlayCard={(cardIndex: number) => {
            if (heartsPassActive) return true;
            return gameAdapter.canPlayCard(gameAdapter.getCurrentState(), localPlayerIndex, cardIndex);
          }}
          onCardClick={handleCardClick}
          getCardImage={getCardImage}
        />
      )}

      {/* Action button - continue to next trick */}
      <GameActions
        gameState={gameState}
        variant={gameVariant}
        onContinueTrick={() => {
          if (gameAdapter && gameState.waitingForTrickEnd) {
            gameAdapter.finishTrick(gameAdapter.getCurrentState());
            setGameState(gameAdapter.getCurrentState());
          }
        }}
      />

      {/* Game end modal - displays game scores and games progress */}
      {gameState.waitingForRoundEnd &&
        !gameState.isGameOver &&
        !(
          gameVariant === 'king' &&
          resolvePresetId('king', rulesPresetId) === 'king-pt-normal' &&
          getKingPtState(gameState).showScorePopup
        ) && (
        <RoundEndModal
          gameState={gameState}
          usTeam={usTeam}
          themTeam={themTeam}
          onContinue={() => {
            if (gameAdapter) {
              gameAdapter.continueToNextRound(gameAdapter.getCurrentState());
              if (gameVariant === 'king') {
                (gameAdapter as KingGame).tickFestaAi();
              }
              setGameState(gameAdapter.getCurrentState());
            }
          }}
        />
      )}

      {gameVariant === 'spades' &&
        (gameState.variantState?.spades as { waitingForBids?: boolean } | undefined)?.waitingForBids && (
          <SpadesBidModal
            playerNames={gameState.players.map((p) => p.name)}
            onConfirm={(playerBids) => {
              if (gameAdapter) {
                (gameAdapter as SpadesGame).applyBids(playerBids);
                setGameState(gameAdapter.getCurrentState());
              }
            }}
          />
        )}

      {heartsPassActive && (
          <HeartsPassModal
            passDirection={heartsState?.passDirection || 'left'}
            selectedCount={heartsState?.humanPassIndices?.length ?? 0}
            onConfirm={() => {
              if (gameAdapter) {
                (gameAdapter as HeartsGame).confirmPass(localPlayerIndex);
                setGameState(gameAdapter.getCurrentState());
              }
            }}
          />
        )}

      {gameVariant === 'king' &&
        resolvePresetId('king', rulesPresetId) === 'king-pt-normal' &&
        (() => {
          const king = getKingPtState(gameState);
          const kingAdapter = gameAdapter as KingGame;
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
                  kingAdapter.advanceKohRevealStep();
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onConfirm={() => {
                  kingAdapter.confirmKohReveal();
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
                  kingAdapter.submitAuctionPass(localPlayerIndex);
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onAuctionBid={(bidType, amount) => {
                  kingAdapter.submitAuctionBid(localPlayerIndex, bidType, amount);
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onAcceptContract={() => {
                  kingAdapter.acceptContract();
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onRejectContract={() => {
                  kingAdapter.rejectContract();
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onRequestHigherBid={(bidType, amount) => {
                  kingAdapter.requestHigherBid(bidType, amount);
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onRespondHigherBid={(raise, bidType, amount) => {
                  kingAdapter.respondToHigherBid(raise, bidType, amount);
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onEightOrNulls={() => {
                  kingAdapter.declareEightOrNulls();
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onRespondEight={(offerEight) => {
                  if (king.eightOrNullsTarget !== null) {
                    kingAdapter.respondEightOrNulls(king.eightOrNullsTarget, offerEight);
                    setGameState(gameAdapter!.getCurrentState());
                  }
                }}
                onFallback={(choice) => {
                  kingAdapter.chooseFallback(choice);
                  setGameState(gameAdapter!.getCurrentState());
                }}
                onSetup={(trump, noTrump, firstPlayer) => {
                  kingAdapter.setupFesta(trump, noTrump, firstPlayer);
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
                    (gameAdapter as KingGame).dismissScorePopup();
                    setGameState(gameAdapter.getCurrentState());
                  }
                }}
                onContinue={() => {
                  if (gameAdapter) {
                    (gameAdapter as KingGame).dismissScorePopup();
                    gameAdapter.continueToNextRound(gameAdapter.getCurrentState());
                    (gameAdapter as KingGame).tickFestaAi();
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
        !gameState.isGameOver && (
          <div className="variant-modal-overlay">
            <div className="variant-modal dobo-panel">
              <h2>
                King simplificado — mão {gameState.round}/10 (
                {(gameState.variantState?.kingSimplified as { handType?: string })?.handType || '…'})
              </h2>
              <button
                type="button"
                className="variant-modal-primary dobo-btn"
                onClick={() => {
                  if (gameAdapter) {
                    gameAdapter.startRound(gameAdapter.getCurrentState());
                    setGameState(gameAdapter.getCurrentState());
                  }
                }}
              >
                Começar mão
              </button>
            </div>
          </div>
        )}

      {gameVariant === 'sueca' && gameState.waitingForRoundStart && !gameState.isGameOver && (
        <SuecaDealingModal
          round={gameState.round}
          dealingMethod={roundDealingMethod}
          dealingDirection={dealingDirection}
          onMethodChange={setRoundDealingMethod}
          onDirectionChange={setDealingDirection}
          onConfirm={() => {
            if (gameAdapter) {
              (gameAdapter as SuecaGame).setDealingMethod(roundDealingMethod);
              gameAdapter.startRound(gameAdapter.getCurrentState());
              setGameState(gameAdapter.getCurrentState());
            }
          }}
        />
      )}


      {/* Game over modal - displays final scores and new game options */}
      {gameState.isGameOver && (
        <GameOverModal
          gameState={gameState}
          usTeam={usTeam}
          themTeam={themTeam}
          dealingMethod={dealingMethod}
          getTeamName={getTeamName}
          onDealingMethodChange={() => {}}
          onNewGame={handleNewGame}
        />
      )}

      {waitingForEarlyEnd && (
        <EarlyRoundEndModal
          onAccept={() => {
            if (!gameAdapter) return;
            if (gameVariant === 'king') {
              (gameAdapter as KingGame).acceptEarlyEnd();
            } else if (gameVariant === 'hearts') {
              (gameAdapter as HeartsGame).acceptEarlyEnd();
            }
            setGameState(gameAdapter.getCurrentState());
          }}
          onDecline={() => {
            if (!gameAdapter) return;
            if (gameVariant === 'king') {
              (gameAdapter as KingGame).declineEarlyEnd();
            } else if (gameVariant === 'hearts') {
              (gameAdapter as HeartsGame).declineEarlyEnd();
            }
            setGameState(gameAdapter.getCurrentState());
          }}
        />
      )}
    </div>
  );
};
