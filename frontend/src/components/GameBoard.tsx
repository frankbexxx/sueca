import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Card, DealingMethod, AIDifficulty, Suit, GameVariant } from '../types/game';
import { GameMenu } from './GameMenu';
import { StartMenu, GameConfig } from './StartMenu';
import { MultiplayerClient, MultiplayerClientCallbacks } from '../services/multiplayerClient';
import { RoundEndModal } from './RoundEndModal';
import { GameStartModal } from './GameStartModal';
import { GameOverModal } from './GameOverModal';
import { useSound } from '../hooks/useSound';
import { useLanguage } from '../i18n/useLanguage';
import './GameBoard.css';
import { requestAiPlay } from '../services/aiClient';
import { SUIT_TO_CODE, SUIT_TO_NAME, RANK_TO_IMAGE_NAME, SUIT_TO_EMOJI } from '../utils/cardMappings';
import { getCardImagePath } from '../constants/cardAssets';
import {
  AI_PLAY_DELAY_MS,
  GAME_OVER_DELAY_MS,
  STORAGE_KEYS,
  DEFAULT_PLAYER_NAMES,
  DEFAULT_DEALING_METHOD,
  DEFAULT_AI_DIFFICULTY
} from '../constants/gameConstants';
import { GameFactory } from '../models/games/GameFactory';
import { GameAdapter } from '../models/games/GameAdapter';
import { PlayerHand } from './PlayerHand';
import { GameActions } from './GameActions';
import { ScoreStrip } from './table/ScoreStrip';
import { TableSurface } from './table/TableSurface';
import { SpadesBidModal } from './SpadesBidModal';
import { HeartsPassModal } from './HeartsPassModal';
import { SpadesGame } from '../models/games/SpadesGame';
import { HeartsGame } from '../models/games/HeartsGame';
import { recordGameFinished, showInterstitialIfDue } from '../services/adsService';
import { MULTIPLAYER_ENABLED } from '../config/features';

/**
 * Main game board component - renders the entire Sueca game interface
 * Manages game state, player interactions, AI moves, and UI rendering
 */
export const GameBoard: React.FC = () => {
  const { t } = useLanguage();
  // Start menu and game state
  const [showStartMenu, setShowStartMenu] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [aiSource, setAiSource] = useState<'external' | 'local'>('local'); // Observabilidade da AI
  
  // Game configuration state - loaded from localStorage or defaults
  const [dealingMethod, setDealingMethod] = useState<DealingMethod>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEALING_METHOD);
    return (saved === 'A' || saved === 'B') ? saved : DEFAULT_DEALING_METHOD;
  });
  const [playerNames, setPlayerNames] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PLAYER_NAMES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing saved player names:', e);
      }
    }
    return DEFAULT_PLAYER_NAMES;
  });
  const [aiDifficulty, setAIDifficulty] = useState<AIDifficulty>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AI_DIFFICULTY);
    return (saved === 'easy' || saved === 'medium' || saved === 'hard') ? saved : DEFAULT_AI_DIFFICULTY;
  });
  
  // UI preferences - dark mode persisted in localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
    return saved ? saved === 'true' : false;
  });

  const [gameVariant, setGameVariant] = useState<GameVariant>('sueca');
  const [gameAdapter, setGameAdapter] = useState<GameAdapter | null>(null);

  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [multiplayerSessionId, setMultiplayerSessionId] = useState<string | null>(null);
  const [multiplayerStatus, setMultiplayerStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [multiplayerError, setMultiplayerError] = useState<string | null>(null);
  const [multiplayerPlayerIndex, setMultiplayerPlayerIndex] = useState<number>(0);
  const [multiplayerClient, setMultiplayerClient] = useState<MultiplayerClient | null>(null);
  
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
  const { playCardSound, playErrorSound } = useSound(); // Sound effects hook
  const [showGridOverlay, setShowGridOverlay] = useState(false); // Debug grid overlay toggle

  /**
   * Handles starting a new game with configuration from StartMenu
   * Creates new Game instance and initializes game state
   */
  const handleStartGame = (config: GameConfig) => {
    setPlayerNames(config.playerNames);
    setAIDifficulty(config.aiDifficulty);
    setDealingMethod(config.dealingMethod);
    setGameVariant(config.gameVariant);
    setIsMultiplayer(Boolean(config.multiplayerEnabled));
    setMultiplayerSessionId(config.multiplayerSessionId || null);
    setMultiplayerError(null);
    setMultiplayerStatus(config.multiplayerEnabled ? 'connecting' : 'disconnected');

    try {
      const adapter = GameFactory.getAdapter(config.gameVariant);
      const initialState = adapter.initialize(config.playerNames, {
        dealingMethod: config.dealingMethod,
        aiDifficulty: config.aiDifficulty,
        localPlayerIndex: config.multiplayerEnabled ? 0 : undefined
      });
      setGameAdapter(adapter);
      setGameState(initialState);
      setShowStartMenu(false);
      setGameStarted(true);
      setSelectedCard(null);

      if (config.multiplayerEnabled && MULTIPLAYER_ENABLED) {
        const mpCallbacks: MultiplayerClientCallbacks = {
          onOpen: () => {
            setMultiplayerStatus('connected');
            setMultiplayerError(null);
          },
          onClose: () => {
            setMultiplayerStatus('disconnected');
          },
          onError: (message: string) => {
            setMultiplayerError(message);
            setMultiplayerStatus('disconnected');
          },
          onSessionInfo: (sessionId, players, localPlayerIndex) => {
            setMultiplayerSessionId(sessionId);
            if (typeof localPlayerIndex === 'number') {
              setMultiplayerPlayerIndex(localPlayerIndex);
            }
          },
          onPlayerListUpdate: (players) => {
            // Player list update - could be used for UI updates if needed
          },
          onStateUpdate: (update) => {
            const updatedState = update.gameState as GameState;
            if (updatedState) {
              setGameState(updatedState);
            }
            if (update.sessionId) {
              setMultiplayerSessionId(update.sessionId);
            }
          },
          onPlayerAction: (payload) => {
            if (!gameAdapter) {
              return;
            }
            const { playerIndex, card } = payload;
            const currentState = gameAdapter.getCurrentState();
            const targetPlayer = currentState.players[playerIndex];
            if (!targetPlayer) {
              return;
            }
            const cardIndex = targetPlayer.hand.findIndex((c) => cardToCode(c) === card);
            if (cardIndex === -1) {
              return;
            }
            gameAdapter.playCard(currentState, playerIndex, cardIndex);
            setGameState(gameAdapter.getCurrentState());
          }
        };
        void (async () => {
          try {
            const client = await MultiplayerClient.connectAuthenticated(
              config.playerNames[0],
              0,
              mpCallbacks
            );
            if (config.multiplayerJoinMode && config.multiplayerSessionId) {
              client.joinSession(config.multiplayerSessionId);
            } else {
              client.createSession();
            }
            client.syncState(initialState);
            setMultiplayerClient(client);
          } catch (e) {
            setMultiplayerError('Multiplayer auth failed');
            setMultiplayerStatus('disconnected');
          }
        })();
      } else {
        if (multiplayerClient) {
          multiplayerClient.close();
          setMultiplayerClient(null);
        }
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert(t.startMenu.errorStartingGame);
    }
  };

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
      !isLocalHumanTurn
    ) {
      const timer = setTimeout(() => {
        playAICard();
      }, AI_PLAY_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [gameAdapter, gameStarted, gameState.currentPlayerIndex, gameState.isGameOver, gameState.isPaused, gameState.waitingForTrickEnd, gameState.waitingForRoundStart, gameState.waitingForRoundEnd, gameState.waitingForGameStart, gameState.players, playAICard, isMultiplayer, multiplayerPlayerIndex]);

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

      if (isMultiplayer && multiplayerClient && multiplayerStatus === 'connected') {
        const card = player.hand[cardIndex];
        multiplayerClient.sendPlayerAction('play_card', {
          playerIndex,
          card: cardToCode(card)
        });
        setSelectedCard(null);
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
   * Returns emoji representation of a suit
   * Used for display in UI (trump indicators, etc.)
   */
  const getSuitEmoji = (suit: string): string => {
    return SUIT_TO_EMOJI[suit] || suit;
  };

  /**
   * Effect to handle game over - show StartMenu when game ends
   */
  useEffect(() => {
    if (gameAdapter && gameState.isGameOver) {
      recordGameFinished();
      void showInterstitialIfDue();
      const timer = setTimeout(() => {
        setShowStartMenu(true);
        setGameStarted(false);
      }, GAME_OVER_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [gameAdapter, gameState.isGameOver]);

  /**
   * Team identification
   * "US" = the team containing the human player (index 0)
   * "THEM" = the opposing team
   */
  const localPlayerIndex = isMultiplayer ? multiplayerPlayerIndex : 0;
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
   * Quits the current game and returns to StartMenu
   * Shows confirmation dialog before quitting
   */
  const handleQuit = () => {
    if (window.confirm(t.gameMenu.quitConfirm)) {
      setShowStartMenu(true);
      setGameStarted(false);
      if (gameAdapter) {
        const current = gameAdapter.getCurrentState();
        gameAdapter.quitGame(current);
        setGameState(gameAdapter.getCurrentState());
      }
    }
  };

  /**
   * Starts a completely new game
   * Shows StartMenu to allow configuration before starting
   */
  const handleNewGame = () => {
    setShowStartMenu(true);
    setGameStarted(false);
  };

  /**
   * Updates AI difficulty setting
   * During active game, only updates state (not allowed to change difficulty)
   * If game is waiting to start or is over, recreates the game with new difficulty
   */
  const reinitializeFromConfig = useCallback(
    (names: string[], method: DealingMethod, difficulty: AIDifficulty, variant: GameVariant) => {
      const adapter = GameFactory.getAdapter(variant);
      const state = adapter.initialize(names, {
        dealingMethod: method,
        aiDifficulty: difficulty,
        localPlayerIndex: isMultiplayer ? multiplayerPlayerIndex : undefined
      });
      setGameAdapter(adapter);
      setGameState(state);
    },
    [isMultiplayer, multiplayerPlayerIndex]
  );

  const handleAIDifficultyChange = (difficulty: AIDifficulty) => {
    setAIDifficulty(difficulty);
    localStorage.setItem(STORAGE_KEYS.AI_DIFFICULTY, difficulty);

    if (!gameAdapter || gameState.waitingForGameStart || gameState.isGameOver) {
      if (gameStarted && gameAdapter) {
        reinitializeFromConfig(playerNames, dealingMethod, difficulty, gameVariant);
      }
      return;
    }

    if (gameState.aiDifficulty !== difficulty) {
      const current = gameAdapter.getCurrentState();
      setGameState({ ...current, aiDifficulty: difficulty });
    }
  };

  /**
   * Updates dealing method setting
   * During active game, only updates state (not allowed to change method)
   * If game is waiting to start or is over, recreates the game with new method
   */
  const handleDealingMethodChange = (method: DealingMethod) => {
    setDealingMethod(method);
    localStorage.setItem(STORAGE_KEYS.DEALING_METHOD, method);

    if (!gameAdapter || gameState.waitingForGameStart || gameState.isGameOver) {
      if (gameStarted && gameAdapter) {
        reinitializeFromConfig(playerNames, method, aiDifficulty, gameVariant);
      }
      return;
    }

    if (gameState.dealingMethod !== method) {
      const current = gameAdapter.getCurrentState();
      setGameState({ ...current, dealingMethod: method });
    }
  };

  /**
   * Updates player names and restarts game
   * Creates new game instance with new names
   * Resets selected card
   */
  /**
   * Updates player names in the current game state without restarting the game
   * If game hasn't started, creates a new game. Otherwise, updates names in both game instance and state.
   */
  const handlePlayerNamesChange = (names: string[]) => {
    setPlayerNames(names);

    if (!gameAdapter || gameState.waitingForGameStart || gameState.isGameOver) {
      if (gameStarted && gameAdapter) {
        reinitializeFromConfig(names, dealingMethod, aiDifficulty, gameVariant);
      }
    } else {
      const current = gameAdapter.getCurrentState();
      gameAdapter.updatePlayerNames(current, names);
      setGameState(gameAdapter.getCurrentState());
    }
    setSelectedCard(null);
  };

  // Show StartMenu if it should be visible
  if (showStartMenu) {
    return (
      <div className={`game-board ${darkMode ? 'dark-mode' : ''}`}>
        <StartMenu
          onStartGame={handleStartGame}
          darkMode={darkMode}
          onDarkModeChange={(mode) => {
            setDarkMode(mode);
            localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(mode));
          }}
        />
      </div>
    );
  }

  // Show game board if game is started
  return (
    <div className={`game-board ${darkMode ? 'dark-mode' : ''}`}>
      <GameMenu
        playerNames={playerNames}
        onPlayerNamesChange={handlePlayerNamesChange}
        aiDifficulty={gameState.aiDifficulty || aiDifficulty}
        onAIDifficultyChange={handleAIDifficultyChange}
        dealingMethod={gameState.dealingMethod || dealingMethod}
        onDealingMethodChange={handleDealingMethodChange}
        isPaused={gameState.isPaused}
        onPause={handlePause}
        onResume={handleResume}
        onQuit={handleQuit}
        onNewGame={handleNewGame}
        isGameOver={gameState.isGameOver}
        isGameActive={!gameState.waitingForGameStart}
        darkMode={darkMode}
        onDarkModeChange={(mode) => {
          setDarkMode(mode);
          localStorage.setItem('sueca-dark-mode', String(mode));
        }}
        showGrid={showGridOverlay}
        onToggleGrid={() => setShowGridOverlay(!showGridOverlay)}
      />

      <ScoreStrip
        gameState={gameState}
        variant={gameVariant}
        usTeam={usTeam}
        themTeam={themTeam}
      />
      {/* Indicador de fonte da AI */}
      <div className="ai-source-banner">
        {aiSource === 'external' ? t.gameBoard.aiExternal : t.gameBoard.aiLocal}
      </div>
      {isMultiplayer && (
        <div className={`multiplayer-banner multiplayer-${multiplayerStatus}`}>
          <span>{`Multiplayer: ${multiplayerStatus}`}</span>
          {multiplayerSessionId && <span>{`Session: ${multiplayerSessionId}`}</span>}
          {multiplayerError && <span className="error-label">{multiplayerError}</span>}
        </div>
      )}

      <TableSurface
        gameState={gameState}
        variant={gameVariant}
        localPlayerIndex={localPlayerIndex}
        usTeam={usTeam}
        showGridOverlay={showGridOverlay}
        getCardImage={getCardImage}
        getTeamName={getTeamName}
      />

      {/* Human player's hand (South position) - displayed below table */}
      {gameAdapter && gameState.players[localPlayerIndex] && (
        <PlayerHand
          gameState={gameState}
          variant={gameVariant}
          localPlayerIndex={localPlayerIndex}
          selectedCard={selectedCard}
          canPlayCard={(cardIndex: number) =>
            gameAdapter.canPlayCard(gameAdapter.getCurrentState(), localPlayerIndex, cardIndex)
          }
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
      {gameState.waitingForRoundEnd && !gameState.isGameOver && (
        <RoundEndModal
          gameState={gameState}
          usTeam={usTeam}
          themTeam={themTeam}
          onContinue={() => {
            if (gameAdapter) {
              gameAdapter.continueToNextRound(gameAdapter.getCurrentState());
              setGameState(gameAdapter.getCurrentState());
            }
          }}
        />
      )}

      {gameVariant === 'spades' &&
        (gameState.variantState?.spades as { waitingForBids?: boolean } | undefined)?.waitingForBids && (
          <SpadesBidModal
            onConfirm={(team1Bid, team2Bid) => {
              if (gameAdapter) {
                (gameAdapter as SpadesGame).applyBids(team1Bid, team2Bid);
                setGameState(gameAdapter.getCurrentState());
              }
            }}
          />
        )}

      {gameVariant === 'hearts' &&
        (gameState.variantState?.hearts as { waitingForPass?: boolean; passDirection?: string; humanPassIndices?: number[] } | undefined)
          ?.waitingForPass && (
          <HeartsPassModal
            gameState={gameState}
            localPlayerIndex={localPlayerIndex}
            passDirection={
              (gameState.variantState?.hearts as { passDirection?: string }).passDirection || 'left'
            }
            selectedIndices={
              (gameState.variantState?.hearts as { humanPassIndices?: number[] }).humanPassIndices || []
            }
            onToggleCard={(index) => {
              if (gameAdapter) {
                (gameAdapter as HeartsGame).togglePassCard(index, localPlayerIndex);
                setGameState(gameAdapter.getCurrentState());
              }
            }}
            onConfirm={() => {
              if (gameAdapter) {
                (gameAdapter as HeartsGame).confirmPass(localPlayerIndex);
                setGameState(gameAdapter.getCurrentState());
              }
            }}
          />
        )}

      {gameVariant === 'king' && gameState.waitingForRoundStart && !gameState.isGameOver && (
        <div className="variant-modal-overlay">
          <div className="variant-modal">
            <h2>
              King — Hand {gameState.round}/10 (
              {(gameState.variantState?.king as { handType?: string })?.handType || 'negative'})
            </h2>
            <p className="variant-modal-hint">
              Trump: {gameState.trumpSuit} — see docs/rules/king-simplified.md
            </p>
            <button
              type="button"
              className="variant-modal-primary"
              onClick={() => {
                if (gameAdapter) {
                  gameAdapter.startRound(gameAdapter.getCurrentState());
                  setGameState(gameAdapter.getCurrentState());
                }
              }}
            >
              Start hand
            </button>
          </div>
        </div>
      )}

      {gameVariant === 'sueca' &&
        gameState.waitingForRoundStart &&
        !gameState.isGameOver &&
        gameState.round === 1 && (
          <GameStartModal
            gameState={gameState}
            getCardImage={getCardImage}
            getSuitEmoji={getSuitEmoji}
            onStart={() => {
              if (gameAdapter) {
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
          onDealingMethodChange={setDealingMethod}
          onNewGame={handleNewGame}
        />
      )}
    </div>
  );
};
