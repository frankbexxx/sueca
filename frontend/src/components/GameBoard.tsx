import React, { useState, useEffect, useCallback } from 'react';
import { Game } from '../models/Game';
import { GameState, Card, DealingMethod, AIDifficulty, Suit } from '../types/game';
import { GameMenu } from './GameMenu';
import { StartMenu, GameConfig } from './StartMenu';
import { RoundEndModal } from './RoundEndModal';
import { GameStartModal } from './GameStartModal';
import { GameOverModal } from './GameOverModal';
import { useSound } from '../hooks/useSound';
import './GameBoard.css';
import { requestAiPlay } from '../services/aiClient';
import { SUIT_TO_CODE, SUIT_TO_NAME, RANK_TO_IMAGE_NAME, SUIT_TO_EMOJI } from '../utils/cardMappings';
import {
  AI_PLAY_DELAY_MS,
  CARD_SPACING,
  MAX_CARDS_IN_HAND,
  SELECTED_CARD_Z_INDEX,
  GAME_OVER_DELAY_MS,
  STORAGE_KEYS,
  DEFAULT_PLAYER_NAMES,
  DEFAULT_DEALING_METHOD,
  DEFAULT_AI_DIFFICULTY
} from '../constants/gameConstants';

/**
 * Main game board component - renders the entire Sueca game interface
 * Manages game state, player interactions, AI moves, and UI rendering
 */
export const GameBoard: React.FC = () => {
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

  /**
   * Game instance - core game logic and state management
   * Only created when game starts (not on initial render)
   */
  const [game, setGame] = useState<Game | null>(null);
  
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
      nextRoundValue: undefined
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
    
    try {
      const newGame = new Game(config.playerNames, config.dealingMethod, config.aiDifficulty);
      setGame(newGame);
      setGameState(newGame.getState());
      setShowStartMenu(false);
      setGameStarted(true);
      setSelectedCard(null);
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Erro ao iniciar o jogo. Por favor, tente novamente.');
    }
  };

  /**
   * Update gameState when game changes
   */
  useEffect(() => {
    if (game) {
      setGameState(game.getState());
    }
  }, [game]);

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
    // Safety check - don't play if game doesn't exist
    if (!game) {
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
      if (cardIndex < 0) {
        // External AI unavailable, use local AI strategy
        cardIndex = game.chooseAICard(playerIndex);
      }

      // Attempt to play the selected card
      if (cardIndex >= 0 && game.playCard(playerIndex, cardIndex)) {
        playCardSound();
        setGameState(game.getState());
      } else {
        // Fallback: try first valid card if AI strategy fails
        // This ensures the game never gets stuck
        for (let i = 0; i < player.hand.length; i++) {
          if (game.playCard(playerIndex, i)) {
            playCardSound();
            setGameState(game.getState());
            break;
          }
        }
      }
    };

    chooseAndPlay();
  }, [game, gameState, playCardSound, setGameState]);

  /**
   * Auto-play effect for AI players
   * Automatically triggers AI card play when it's an AI player's turn
   * Only runs if game is active, not paused, and not in a waiting state
   * Includes 1.5s delay for better UX (allows player to see the turn change)
   */
  useEffect(() => {
    // Only auto-play if game exists and is started
    if (!game || !gameStarted) return;
    
    // Auto-play for AI players (only if not waiting for round/game start and not paused)
    if (
      !gameState.isGameOver &&
      !gameState.isPaused &&
      !gameState.waitingForTrickEnd &&
      !gameState.waitingForRoundStart &&
      !gameState.waitingForRoundEnd &&
      !gameState.waitingForGameStart &&
      gameState.currentPlayerIndex !== 0 // Only for AI players (0 is human)
    ) {
      const timer = setTimeout(() => {
        playAICard();
      }, AI_PLAY_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [game, gameStarted, gameState.currentPlayerIndex, gameState.isGameOver, gameState.isPaused, gameState.waitingForTrickEnd, gameState.waitingForRoundStart, gameState.waitingForRoundEnd, gameState.waitingForGameStart, gameState.players, playAICard]);

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
    if (!game) return;
    
    // Only allow card selection if it's the human player's turn (index 0 = "You")
    const isHumanPlayer = gameState.currentPlayerIndex === 0;
    
    if (
      isHumanPlayer &&
      !gameState.isGameOver &&
      !gameState.isPaused &&
      !gameState.waitingForTrickEnd &&
      !gameState.waitingForRoundStart &&
      !gameState.waitingForRoundEnd &&
      !gameState.waitingForGameStart
    ) {
      // Check if the card is playable before allowing selection
      const player = gameState.players[0];
      if (cardIndex >= 0 && cardIndex < player.hand.length) {
        // Use the game's canPlayCard method to check if card can be played
        const canPlay = game.canPlayCard(0, cardIndex);
        if (canPlay) {
          // If clicking the same card that's already selected, play it
          if (selectedCard === cardIndex) {
            if (game.playCard(0, cardIndex)) {
              playCardSound();
              setGameState(game.getState());
              setSelectedCard(null); // Clear selection after successful play
            } else {
              playErrorSound();
            }
          } else {
            // Otherwise, just select the card
            setSelectedCard(cardIndex);
          }
        } else {
          playErrorSound(); // Visual/audio feedback for invalid play
        }
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
    
    // Use relative path that works in both dev and production
    // In production, PUBLIC_URL is empty string, so we use relative path
    const publicUrl = process.env.PUBLIC_URL || '';
    // Ensure we don't have double slashes
    const basePath = publicUrl && !publicUrl.endsWith('/') ? publicUrl : (publicUrl || '');
    return `${basePath}/assets/cards2/${rank}_of_${suit}.png`;
  };

  /**
   * Returns emoji representation of a suit
   * Used for display in UI (trump indicators, etc.)
   */
  const getSuitEmoji = (suit: string): string => {
    return SUIT_TO_EMOJI[suit] || suit;
  };

  /**
   * Truncates player name to maximum 8 characters for mobile info boxes
   * Adds "..." if truncated
   */
  const truncatePlayerName = (name: string, maxLength: number = 8): string => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
  };

  /**
   * Returns CSS class for trump suit color styling
   * Red suits (diamonds, hearts) get 'trump-red' class
   * Black suits (clubs, spades) get 'trump-black' class
   */
  const getTrumpColorClass = (suit: Suit | null): string => {
    if (!suit) return '';
    // Red suits: diamonds, hearts
    if (suit === 'diamonds' || suit === 'hearts') {
      return 'trump-red';
    }
    // Black suits: clubs, spades
    return 'trump-black';
  };

  /**
   * Effect to handle game over - show StartMenu when game ends
   */
  useEffect(() => {
    if (game && gameState.isGameOver) {
      // Show start menu after a short delay to allow game over modal to be seen
      const timer = setTimeout(() => {
        setShowStartMenu(true);
        setGameStarted(false);
      }, GAME_OVER_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [game, gameState.isGameOver]);

  /**
   * Detects if the current device is a mobile device
   * Uses both User Agent detection and screen width check
   * Used to apply mobile-specific layout fixes (position inversion)
   * Returns false if window is undefined (SSR safety)
   */
  const isMobileDevice = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    // Check user agent for mobile devices
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    
    // Also check screen width as additional indicator (tablets in portrait, etc.)
    const isSmallScreen = window.innerWidth <= 768;
    
    return isMobileUA || isSmallScreen;
  };

  /**
   * Maps player index to table position (compass directions)
   * Fixed mapping (same for desktop and mobile):
   *   - Index 0 (You) = South (bottom)
   *   - Index 1 (AI 1) = East (right)
   *   - Index 2 (Partner) = North (top)
   *   - Index 3 (AI 2) = West (left)
   * 
   * Order of play (anti-clockwise): 0 (South) → 1 (East) → 2 (North) → 3 (West) → 0
   * 
   * Note: Position adjustments for mobile are handled via CSS media queries,
   * not by inverting the position mapping, to maintain correct game flow direction.
   */
  const getTablePosition = (playerIndex: number): 'north' | 'east' | 'south' | 'west' => {
    const positionMap: Record<number, 'north' | 'east' | 'south' | 'west'> = {
      0: 'south',  // You
      1: 'east',    // AI 1
      2: 'north',   // Partner
      3: 'west'     // AI 2
    };
    
    return positionMap[playerIndex] || 'south';
  };

  /**
   * Team identification
   * "US" = the team containing the human player (index 0)
   * "THEM" = the opposing team
   */
  const usTeam = gameState.players[0]?.team || 1;
  const themTeam = usTeam === 1 ? 2 : 1;

  /**
   * Returns display name for a team number
   * Used throughout UI to show team labels
   */
  const getTeamName = (team: 1 | 2): string => {
    return team === usTeam ? 'US' : 'THEM';
  };

  /**
   * Pauses the current game
   * Stops AI auto-play and prevents further moves
   */
  const handlePause = () => {
    if (!game) return;
    game.pauseGame();
    setGameState(game.getState());
  };

  /**
   * Resumes a paused game
   * Re-enables AI auto-play and game flow
   */
  const handleResume = () => {
    if (!game) return;
    game.resumeGame();
    setGameState(game.getState());
  };

  /**
   * Quits the current game and returns to StartMenu
   * Shows confirmation dialog before quitting
   */
  const handleQuit = () => {
    if (window.confirm('Tem certeza que deseja sair do jogo atual?')) {
      setShowStartMenu(true);
      setGameStarted(false);
      // Optionally quit the game (but keep it for potential resume)
      if (game) {
        game.quitGame();
        setGameState(game.getState());
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
  const handleAIDifficultyChange = (difficulty: AIDifficulty) => {
    setAIDifficulty(difficulty);
    localStorage.setItem(STORAGE_KEYS.AI_DIFFICULTY, difficulty);
    
    // Only allow changing difficulty if game hasn't started or is over
    if (!game || gameState.waitingForGameStart || gameState.isGameOver) {
      if (game) {
        const newGame = new Game(playerNames, dealingMethod, difficulty);
        setGame(newGame);
        setGameState(newGame.getState());
      }
      return;
    }
    
    // During active game, update state immutably (without mutation)
    // Note: This shouldn't normally happen as the setting should be disabled
    if (game && gameState.aiDifficulty !== difficulty) {
      const currentState = game.getState();
      const updatedState: GameState = {
        ...currentState,
        aiDifficulty: difficulty
      };
      setGameState(updatedState);
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
    
    // Only allow changing method if game hasn't started or is over
    if (!game || gameState.waitingForGameStart || gameState.isGameOver) {
      if (game) {
        const newGame = new Game(playerNames, method, aiDifficulty);
        setGame(newGame);
        setGameState(newGame.getState());
      }
      return;
    }
    
    // During active game, update state immutably (without mutation)
    // Note: This shouldn't normally happen as the setting should be disabled
    if (game && gameState.dealingMethod !== method) {
      const currentState = game.getState();
      const updatedState: GameState = {
        ...currentState,
        dealingMethod: method
      };
      setGameState(updatedState);
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
    
    // If game hasn't started or is over, create new game with new names
    if (!game || gameState.waitingForGameStart || gameState.isGameOver) {
      const newGame = new Game(names, dealingMethod, aiDifficulty);
      setGame(newGame);
      setGameState(newGame.getState());
    } else {
      // Update names in both game instance and state without restarting
      if (typeof game.updatePlayerNames === 'function') {
        game.updatePlayerNames(names);
        setGameState(game.getState());
      } else {
        // Fallback: update state directly if method doesn't exist (shouldn't happen)
        setGameState(prevState => ({
          ...prevState,
          players: prevState.players.map((player, index) => ({
            ...player,
            name: names[index] || `Player ${index + 1}`
          }))
        }));
      }
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

      <div className="top-strip">
        <div className="score-block us">
          <div className="label">US</div>
          <div className="line">Pontos: {gameState.scores[usTeam === 1 ? 'team1' : 'team2']}</div>
          <div className="line">Jogos: {gameState.gameScore[usTeam === 1 ? 'team1' : 'team2']}</div>
        </div>
        <div className="round-block">
          <div>Jogo {gameState.round}</div>
          <div className="dealing-method">Dealing: {gameState.dealingMethod === 'A' ? 'A' : 'B'}</div>
          {/* Trump information moved here from score blocks */}
          {gameState.trumpSuit && gameState.trumpCard && (
            <div className="trump-info-in-team">
              <span className="dealer-name">{gameState.players[gameState.dealerIndex]?.name}</span>
              <span className={`trump-minimal ${getTrumpColorClass(gameState.trumpSuit)}`}>
                {gameState.trumpCard.rank}{getSuitEmoji(gameState.trumpSuit)}
              </span>
            </div>
          )}
        </div>
        <div className="score-block them">
          <div className="label">THEM</div>
          <div className="line">Pontos: {gameState.scores[themTeam === 1 ? 'team1' : 'team2']}</div>
          <div className="line">Jogos: {gameState.gameScore[themTeam === 1 ? 'team1' : 'team2']}</div>
        </div>
      </div>
      {/* Indicador de fonte da AI */}
      <div className="ai-source-banner">
        {aiSource === 'external' ? 'AI Externa (Render)' : 'AI Local (fallback)'}
      </div>

      {/* Main game table container */}
      <div className="table-layout">

        {/* Green table surface - main playing area */}
        <div className="table-surface">
          {/* Debug grid overlay - shows positioning grid when enabled */}
          {showGridOverlay && <div className="grid-overlay" />}

          {/* Center area - displays current trick cards in cross formation */}
          <div className="trick-area-center">
            {gameState.currentTrick.length > 0 ? (
              <div className="trick-cards-cross">
                {/* Render each card in the current trick with player info */}
                {gameState.currentTrick.map((card: Card, index: number) => {
                  // Calculate which player played this card (based on trick leader + order)
                  const playerIndex = (gameState.trickLeader + index) % 4;
                  const position = getTablePosition(playerIndex);
                  // Highlight winning card if this is the last card and player won
                  const isWinning =
                    gameState.lastTrickWinner === playerIndex &&
                    index === gameState.currentTrick.length - 1;
                  return (
                    <div
                      key={index}
                      className={`trick-card-cross trick-from-${position} ${isWinning ? 'winning' : ''}`}
                    >
                      <img
                        src={getCardImage(card)}
                        alt={`${card.rank} of ${card.suit}`}
                        className="trick-card-img"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Player seats layer - displays player info and card counts around table */}
          <div className="seats-layer">
            {gameState.players.map((player, index) => {
              const position = getTablePosition(index);
              const isDealer = index === gameState.dealerIndex;
              const isCurrentPlayer = index === gameState.currentPlayerIndex;
              const isHuman = index === 0;

              /**
               * Renders AI player's card count (back of cards + number)
               * Human player (South) doesn't show this - they see their actual cards below
               */
              const renderAICards = () => {
                if (isHuman) return null;
                return (
                  <div className="hand-back-stack">
                    <div className="card-back-small" />
                    <span className="card-count">{player.hand.length}</span>
                  </div>
                );
              };

              // Determine if we should use mobile layout for info box
              const useMobileLayout = isMobileDevice();

              return (
                <div
                  key={player.id}
                  className={`player-seat player-${position} ${player.team === usTeam ? 'team-us' : 'team-them'}`}
                >
                  <div className={`player-info ${useMobileLayout ? 'mobile-layout' : ''}`}>
                    {useMobileLayout ? (
                      // Mobile layout: 2 lines, fixed size
                      <>
                        <div className="player-name-line-1">
                          {truncatePlayerName(player.name)}
                          {isDealer && <span className="dealer-badge">🃏</span>}
                        </div>
                        <div className="player-name-line-2">
                          {getTeamName(player.team)}
                          {isCurrentPlayer && <span className="turn-indicator">⚡</span>}
                        </div>
                      </>
                    ) : (
                      // Desktop layout: original
                      <>
                        <h3 className="player-name">
                          {player.name}
                          {isDealer && <span className="dealer-badge">🃏</span>}
                          {isCurrentPlayer && <span className="turn-indicator">⚡</span>}
                        </h3>
                        <div className="team-badge">{getTeamName(player.team)}</div>
                      </>
                    )}
                  </div>
                  {position === 'south' ? null : renderAICards()}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Human player's hand (South position) - displayed below table */}
      {game && gameState.players[0] && (
        <div className="player-hand-bar">
          <div className="hand-row">
            {/* Render each card in player's hand with proper spacing and positioning */}
            {gameState.players[0].hand.map((card: Card, cardIndex: number) => {
              // Card spacing calculation - centers hand with proper overlap
              const CENTER_OFFSET = ((MAX_CARDS_IN_HAND - 1) * CARD_SPACING) / 2;
              const cardPosition = cardIndex * CARD_SPACING;
              const translateX = cardPosition - CENTER_OFFSET;
              const fixedTransform = `translateX(${translateX}px)`;
              
              // Card state for UI feedback
              const isPlayable = game ? game.canPlayCard(0, cardIndex) : false;
              const isSelected = selectedCard === cardIndex;
              return (
                <img
                  key={card.id}
                  src={getCardImage(card)}
                  alt={`${card.rank} of ${card.suit}`}
                  className={`card-hand ${isSelected ? 'selected' : ''} ${!isPlayable ? 'not-playable' : ''}`}
                  style={{ transform: fixedTransform, zIndex: isSelected ? SELECTED_CARD_Z_INDEX : cardIndex + 1 }}
                  onClick={() => handleCardClick(cardIndex)}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Action button - continue to next trick */}
      <div className="action-buttons-bar">
        <div className="action-buttons-group">
          {/* Continue button - only enabled when trick is complete */}
          <button
            className={`continue-button ${gameState.waitingForTrickEnd ? 'enabled' : 'disabled'}`}
            onClick={() => {
              if (game && gameState.waitingForTrickEnd) {
                game.finishTrick();
                setGameState(game.getState());
              }
            }}
            disabled={!gameState.waitingForTrickEnd || !game}
          >
            Continuar
          </button>
        </div>
      </div>

      {/* Game end modal - displays game scores and games progress */}
      {gameState.waitingForRoundEnd && !gameState.isGameOver && (
        <RoundEndModal
          gameState={gameState}
          usTeam={usTeam}
          themTeam={themTeam}
          onContinue={() => {
            if (game) {
              game.continueToNextRound();
              setGameState(game.getState());
            }
          }}
        />
      )}

      {/* Game start modal - shown only for first game, displays trump card */}
      {gameState.waitingForRoundStart && !gameState.isGameOver && gameState.round === 1 && (
        <GameStartModal
          gameState={gameState}
          getCardImage={getCardImage}
          getSuitEmoji={getSuitEmoji}
          onStart={() => {
            if (game) {
              game.startRound();
              setGameState(game.getState());
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
