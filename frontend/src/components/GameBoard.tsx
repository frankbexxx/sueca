import React, { useState, useEffect, useCallback } from 'react';
import { Game } from '../models/Game';
import { GameState, Card, DealingMethod, AIDifficulty, Suit } from '../types/game';
import { GameMenu } from './GameMenu';
import { StartMenu, GameConfig } from './StartMenu';
import { useSound } from '../hooks/useSound';
import './GameBoard.css';
import { requestAiPlay } from '../services/aiClient';
import { SUIT_TO_CODE, SUIT_TO_NAME, RANK_TO_IMAGE_NAME, SUIT_TO_EMOJI } from '../utils/cardMappings';

/**
 * Main game board component - renders the entire Sueca game interface
 * Manages game state, player interactions, AI moves, and UI rendering
 */
export const GameBoard: React.FC = () => {
  // Start menu and game state
  const [showStartMenu, setShowStartMenu] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Game configuration state - loaded from localStorage or defaults
  const [dealingMethod, setDealingMethod] = useState<DealingMethod>(() => {
    const saved = localStorage.getItem('sueca-dealing-method');
    return (saved === 'A' || saved === 'B') ? saved : 'A';
  });
  const [playerNames, setPlayerNames] = useState<string[]>(() => {
    const saved = localStorage.getItem('sueca-player-names');
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
    return ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
  });
  const [aiDifficulty, setAIDifficulty] = useState<AIDifficulty>(() => {
    const saved = localStorage.getItem('sueca-ai-difficulty');
    return (saved === 'easy' || saved === 'medium' || saved === 'hard') ? saved : 'medium';
  });
  
  // UI preferences - dark mode persisted in localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('sueca-dark-mode');
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
      partnerSignals: []
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
        return idx;
      } catch (err) {
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
      }, 1500); // 1.5s delay for visual feedback
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
          setSelectedCard(cardIndex);
        } else {
          playErrorSound(); // Visual/audio feedback for invalid play
        }
      }
    }
  };

  /**
   * Executes the play of the selected card
   * Called when "Play Card" button is clicked
   * Validates state and attempts to play the card through game logic
   */
  const handlePlayCard = () => {
    if (!game) return;
    
    if (
      selectedCard !== null &&
      gameState.currentPlayerIndex === 0 &&
      !gameState.waitingForTrickEnd &&
      !gameState.waitingForRoundEnd
    ) {
      if (game.playCard(0, selectedCard)) {
        playCardSound();
        setGameState(game.getState());
        setSelectedCard(null); // Clear selection after successful play
      } else {
        playErrorSound(); // Play failed (shouldn't happen if validation is correct)
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
    
    // Para jack, queen e king, usar versão "2" (specific asset naming convention)
    const isFigure = card.rank === 'J' || card.rank === 'Q' || card.rank === 'K';
    const suffix = isFigure ? '2' : '';
    
    // Use relative path that works in both dev and production
    // In production, PUBLIC_URL is empty string, so we use relative path
    const publicUrl = process.env.PUBLIC_URL || '';
    // Ensure we don't have double slashes
    const basePath = publicUrl && !publicUrl.endsWith('/') ? publicUrl : (publicUrl || '');
    return `${basePath}/assets/cards1/${rank}_of_${suit}${suffix}.png`;
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
      }, 3000); // 3 seconds delay
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
    localStorage.setItem('sueca-ai-difficulty', difficulty);
    
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
    const currentState = game.getState();
    const updatedState: GameState = {
      ...currentState,
      aiDifficulty: difficulty
    };
    setGameState(updatedState);
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

  /**
   * Determines if "Play Card" button should be enabled
   * Checks all conditions for a valid play:
   * - Must be human player's turn
   * - Must have a card selected
   * - Game must be in playable state
   */
  const canPlay =
    game !== null &&
    gameState.currentPlayerIndex === 0 &&
    selectedCard !== null &&
    !gameState.isGameOver &&
    !gameState.waitingForTrickEnd &&
    !gameState.waitingForRoundStart &&
    !gameState.waitingForGameStart;

  // Show StartMenu if it should be visible
  if (showStartMenu) {
    return (
      <div className={`game-board ${darkMode ? 'dark-mode' : ''}`}>
        <StartMenu
          onStartGame={handleStartGame}
          darkMode={darkMode}
          onDarkModeChange={(mode) => {
            setDarkMode(mode);
            localStorage.setItem('sueca-dark-mode', String(mode));
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
          <div className="line">Round: {gameState.scores[usTeam === 1 ? 'team1' : 'team2']}</div>
          <div className="line">Game: {gameState.gameScore[usTeam === 1 ? 'team1' : 'team2']}</div>
        </div>
        <div className="round-block">
          <div>Round {gameState.round}</div>
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
          <div className="line">Round: {gameState.scores[themTeam === 1 ? 'team1' : 'team2']}</div>
          <div className="line">Game: {gameState.gameScore[themTeam === 1 ? 'team1' : 'team2']}</div>
        </div>
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
                  const player = gameState.players[playerIndex];
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
              const CARD_SPACING = 18; /* 70% of 26px - reduced for smaller table */
              const MAX_CARDS = 10;
              const CENTER_OFFSET = ((MAX_CARDS - 1) * CARD_SPACING) / 2;
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
                  style={{ transform: fixedTransform, zIndex: isSelected ? 1000 : cardIndex + 1 }}
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

      {/* Action buttons - play card and advance to next trick */}
      <div className="action-buttons-bar">
        <div className="action-buttons-group">
          {/* Play selected card button - enabled when card is selected and playable */}
          <button
            className={`play-button ${canPlay ? 'enabled' : 'disabled'}`}
            onClick={handlePlayCard}
            disabled={!canPlay}
          >
            Play Card
          </button>
          {/* Advance to next trick button - only enabled when trick is complete */}
          <button
            className={`next-trick-button ${gameState.waitingForTrickEnd ? 'enabled' : 'disabled'}`}
            onClick={() => {
              if (game && gameState.waitingForTrickEnd) {
                game.finishTrick();
                setGameState(game.getState());
              }
            }}
            disabled={!gameState.waitingForTrickEnd || !game}
          >
            Next Trick
          </button>
        </div>
      </div>

      {/* Round end modal - displays round scores and game progress */}
      {gameState.waitingForRoundEnd && !gameState.isGameOver && (
        <div className="pause-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '15px',
            textAlign: 'center',
            maxWidth: '600px'
          }}>
            <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#2c3e50' }}>Round {gameState.round - 1} Complete!</h2>
            
            <div style={{ marginBottom: '30px' }}>
              <p style={{ fontSize: '18px', marginBottom: '15px', fontWeight: 'bold' }}>Round Scores:</p>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '10px', minWidth: '150px' }}>
                  <strong style={{ fontSize: '16px', color: '#1976d2' }}>US</strong>
                  <p style={{ fontSize: '24px', margin: '10px 0', fontWeight: 'bold' }}>
                    {gameState.scores[usTeam === 1 ? 'team1' : 'team2']} points
                  </p>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#fce4ec', borderRadius: '10px', minWidth: '150px' }}>
                  <strong style={{ fontSize: '16px', color: '#c2185b' }}>THEM</strong>
                  <p style={{ fontSize: '24px', margin: '10px 0', fontWeight: 'bold' }}>
                    {gameState.scores[themTeam === 1 ? 'team1' : 'team2']} points
                  </p>
                </div>
              </div>
              
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '10px' }}>
                <p style={{ fontSize: '16px', marginBottom: '10px', fontWeight: 'bold' }}>Game Score:</p>
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  <div>
                    <strong>US:</strong> {gameState.gameScore[usTeam === 1 ? 'team1' : 'team2']} victories
                  </div>
                  <div>
                    <strong>THEM:</strong> {gameState.gameScore[themTeam === 1 ? 'team1' : 'team2']} victories
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                if (game) {
                  game.continueToNextRound();
                  setGameState(game.getState());
                }
              }}
              style={{
                padding: '15px 40px',
                fontSize: '18px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              Continue to Round {gameState.round}
            </button>
          </div>
        </div>
      )}

      {/* Round start modal - shown only for first round, displays trump card */}
      {gameState.waitingForRoundStart && !gameState.isGameOver && gameState.round === 1 && (
        <div className="pause-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#2a3a52',
            color: '#e9eef7',
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center',
            maxWidth: '500px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ color: '#e9eef7', marginBottom: '20px' }}>Round {gameState.round} Ready!</h2>
            {gameState.trumpCard && (
              <div style={{ margin: '20px 0' }}>
                <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#cfdffc' }}>Trump Suit:</p>
                <img
                  src={getCardImage(gameState.trumpCard)}
                  alt={`Trump: ${gameState.trumpCard.rank} of ${gameState.trumpCard.suit}`}
                  style={{ width: '150px', height: 'auto', border: '3px solid #6c5ce7', borderRadius: '10px', boxShadow: '0 4px 12px rgba(108, 92, 231, 0.4)' }}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <p style={{ marginTop: '10px', fontSize: '16px', color: '#e9eef7' }}>
                  {getSuitEmoji(gameState.trumpSuit!)} {gameState.trumpSuit!.toUpperCase()}
                </p>
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#9aa5b5', fontStyle: 'italic' }}>
                  This trump suit will remain visible throughout the game
                </p>
              </div>
            )}
            <p style={{ margin: '20px 0', color: '#cfdffc' }}>
              Dealer: <strong style={{ color: '#e9eef7' }}>{gameState.players[gameState.dealerIndex].name}</strong>
            </p>
            <button
              onClick={() => {
                if (game) {
                  game.startRound();
                  setGameState(game.getState());
                }
              }}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                background: 'linear-gradient(135deg, #6c5ce7 0%, #5a4fd6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(108, 92, 231, 0.4)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(108, 92, 231, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(108, 92, 231, 0.4)';
              }}
            >
              Start Round
            </button>
          </div>
        </div>
      )}


      {/* Game over modal - displays final scores and new game options */}
      {gameState.isGameOver && (
        <div className="game-over" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '15px',
            textAlign: 'center',
            maxWidth: '600px'
          }}>
            <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>🎉 Game Over! 🎉</h2>
            <p className="winner-text" style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>
              {getTeamName(gameState.winner!)} Wins!
            </p>
            <div style={{ marginBottom: '30px' }}>
              <p style={{ fontSize: '18px', marginBottom: '15px' }}>Final Scores:</p>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                <div>
                  <strong>US:</strong> {gameState.gameScore[usTeam === 1 ? 'team1' : 'team2']} points
                </div>
                <div>
                  <strong>THEM:</strong> {gameState.gameScore[themTeam === 1 ? 'team1' : 'team2']} points
                </div>
              </div>
            </div>
            <div className="new-game-options" style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '16px' }}>
                <strong>Dealing Method for Next Game:</strong>
                <select
                  value={dealingMethod}
                  onChange={(e) => setDealingMethod(e.target.value as DealingMethod)}
                  style={{ marginLeft: '10px', padding: '8px', fontSize: '16px', borderRadius: '5px' }}
                >
                  <option value="A">Method A (Standard)</option>
                  <option value="B">Method B (Dealer First)</option>
                </select>
              </label>
            </div>
          <button
            className="new-game-button"
            onClick={handleNewGame}
              style={{
                padding: '15px 40px',
                fontSize: '20px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
            }}
          >
              Start New Game
          </button>
          </div>
        </div>
      )}
    </div>
  );
};

