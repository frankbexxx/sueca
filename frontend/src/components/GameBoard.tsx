import React, { useState, useEffect, useCallback } from 'react';
import { Game } from '../models/Game';
import { GameState, Card, DealingMethod, AIDifficulty, Suit } from '../types/game';
import { GameMenu } from './GameMenu';
import { useSound } from '../hooks/useSound';
import './GameBoard.css';
import { requestAiPlay } from '../services/aiClient';

export const GameBoard: React.FC = () => {
  const [dealingMethod, setDealingMethod] = useState<DealingMethod>('A');
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  const [aiDifficulty, setAIDifficulty] = useState<AIDifficulty>('medium');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('sueca-dark-mode');
    return saved ? saved === 'true' : false;
  });

  // Initialize game safely
  const [game, setGame] = useState(() => {
    try {
      return new Game(playerNames, dealingMethod, aiDifficulty);
    } catch (error) {
      console.error('Error initializing game:', error);
      throw error;
    }
  });
  
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      return game.getState();
    } catch (error) {
      console.error('Error getting game state:', error);
      // Return minimal valid state
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
    }
  });
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const { playCardSound, playErrorSound } = useSound();
  const [showGridOverlay, setShowGridOverlay] = useState(false);

  const cardToCode = (card: Card): string => {
    const suitMap: Record<string, string> = { clubs: 'C', diamonds: 'D', hearts: 'H', spades: 'S' };
    return `${card.rank}${suitMap[card.suit] || ''}`;
  };

  const playAICard = useCallback(() => {
    const playerIndex = gameState.currentPlayerIndex;
    const player = gameState.players[playerIndex];

    if (player.hand.length === 0) {
      return;
    }

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

    const chooseAndPlay = async () => {
      let cardIndex = await tryExternal();
      if (cardIndex < 0) {
        cardIndex = game.chooseAICard(playerIndex);
      }

      if (cardIndex >= 0 && game.playCard(playerIndex, cardIndex)) {
        playCardSound();
        setGameState(game.getState());
      } else {
        // Fallback: try first valid card if AI strategy fails
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

  useEffect(() => {
    // Auto-play for AI players (only if not waiting for round/game start and not paused)
    if (
      !gameState.isGameOver &&
      !gameState.isPaused &&
      !gameState.waitingForTrickEnd &&
      !gameState.waitingForRoundStart &&
      !gameState.waitingForRoundEnd &&
      !gameState.waitingForGameStart &&
      gameState.currentPlayerIndex !== 0
    ) {
      const timer = setTimeout(() => {
        playAICard();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayerIndex, gameState.isGameOver, gameState.isPaused, gameState.waitingForTrickEnd, gameState.waitingForRoundStart, gameState.waitingForRoundEnd, gameState.waitingForGameStart, gameState.players, playAICard]);

  const handleCardClick = (cardIndex: number) => {
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
          playErrorSound();
        }
      }
    }
  };

  const handlePlayCard = () => {
    if (
      selectedCard !== null &&
      gameState.currentPlayerIndex === 0 &&
      !gameState.waitingForTrickEnd &&
      !gameState.waitingForRoundEnd
    ) {
      if (game.playCard(0, selectedCard)) {
        playCardSound();
        setGameState(game.getState());
        setSelectedCard(null);
      } else {
        playErrorSound();
      }
    }
  };

  const getCardImage = (card: Card): string => {
    const suitMap: Record<string, string> = {
      'clubs': 'clubs',
      'diamonds': 'diamonds',
      'hearts': 'hearts',
      'spades': 'spades'
    };
    const rankMap: Record<string, string> = {
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5',
      '6': '6',
      'Q': 'queen',
      'J': 'jack',
      'K': 'king',
      '7': '7',
      'A': 'ace'
    };
    const suit = suitMap[card.suit];
    const rank = rankMap[card.rank];
    // Use relative path that works in both dev and production
    // In production, PUBLIC_URL is empty string, so we use relative path
    const publicUrl = process.env.PUBLIC_URL || '';
    // Ensure we don't have double slashes
    const basePath = publicUrl && !publicUrl.endsWith('/') ? publicUrl : (publicUrl || '');
    return `${basePath}/assets/cards1/${rank}_of_${suit}.png`;
  };

  const getSuitEmoji = (suit: string): string => {
    const emojiMap: Record<string, string> = {
      'clubs': '♣',
      'diamonds': '♦',
      'hearts': '♥',
      'spades': '♠'
    };
    return emojiMap[suit] || suit;
  };

  // Map player index to table position
  // You (index 0) is always South, Partner (index 2) is always North
  // Index 1 = East, Index 3 = West
  const getTablePosition = (playerIndex: number): 'north' | 'east' | 'south' | 'west' => {
    const positionMap: Record<number, 'north' | 'east' | 'south' | 'west'> = {
      0: 'south',  // You
      1: 'east',    // AI 1
      2: 'north',   // Partner
      3: 'west'     // AI 2
    };
    return positionMap[playerIndex] || 'south';
  };

  // Determine which team is "US" (the team with index 0)
  const usTeam = gameState.players[0]?.team || 1;
  const themTeam = usTeam === 1 ? 2 : 1;

  // Get team name
  const getTeamName = (team: 1 | 2): string => {
    return team === usTeam ? 'US' : 'THEM';
  };

  const handlePause = () => {
    game.pauseGame();
    setGameState(game.getState());
  };

  const handleResume = () => {
    game.resumeGame();
    setGameState(game.getState());
  };

  const handleQuit = () => {
    if (window.confirm('Tem certeza que deseja sair do jogo atual?')) {
      game.quitGame();
      setGameState(game.getState());
    }
  };

  const handleNewGame = () => {
    const newGame = new Game(playerNames, dealingMethod, aiDifficulty);
    setGame(newGame);
    setGameState(newGame.getState());
    setSelectedCard(null);
  };

  const handleAIDifficultyChange = (difficulty: AIDifficulty) => {
    setAIDifficulty(difficulty);
    // Update current game's difficulty if game is active
    const updatedState = game.getState();
    updatedState.aiDifficulty = difficulty;
    setGameState(updatedState);
  };

  const handlePlayerNamesChange = (names: string[]) => {
    setPlayerNames(names);
    const newGame = new Game(names, dealingMethod, aiDifficulty);
    setGame(newGame);
    setGameState(newGame.getState());
    setSelectedCard(null);
  };

  const canPlay =
    gameState.currentPlayerIndex === 0 &&
    selectedCard !== null &&
    !gameState.isGameOver &&
    !gameState.waitingForTrickEnd &&
    !gameState.waitingForRoundStart &&
    !gameState.waitingForGameStart;

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
          <div>Dealer: {gameState.players[gameState.dealerIndex]?.name}</div>
          <div>Dealing: {gameState.dealingMethod === 'A' ? 'A' : 'B'}</div>
        </div>
        <div className="score-block them">
          <div className="label">THEM</div>
          <div className="line">Round: {gameState.scores[themTeam === 1 ? 'team1' : 'team2']}</div>
          <div className="line">Game: {gameState.gameScore[themTeam === 1 ? 'team1' : 'team2']}</div>
        </div>
      </div>

      <div className="table-layout">
        <div className="ui-corner top-left" />

        <div className="ui-corner top-right">
          {gameState.trumpSuit && (
            <div className="trump-card-display">
              <div className="trump-title">Trump</div>
              {gameState.trumpCard && (
                <img
                  src={getCardImage(gameState.trumpCard)}
                  alt={`Trump: ${gameState.trumpCard.rank} of ${gameState.trumpCard.suit}`}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
          )}
        </div>

        <div className="ui-corner bottom-left" />

        <div className="table-surface">
          {showGridOverlay && <div className="grid-overlay" />}

          <div className="trick-area-center">
            <h3>Current Trick</h3>
            {gameState.currentTrick.length > 0 ? (
              <div className="trick-cards-cross">
                {gameState.currentTrick.map((card: Card, index: number) => {
                  const playerIndex = (gameState.trickLeader + index) % 4;
                  const player = gameState.players[playerIndex];
                  const position = getTablePosition(playerIndex);
                  const isWinning =
                    gameState.lastTrickWinner === playerIndex &&
                    index === gameState.currentTrick.length - 1;
                  return (
                    <div
                      key={index}
                      className={`trick-card-cross trick-from-${position} ${isWinning ? 'winning' : ''}`}
                    >
                      <div className="trick-player-name-small">{player.name}</div>
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
            ) : (
              <p className="no-trick">No cards played yet</p>
            )}
          </div>

          <div className="seats-layer">
            {gameState.players.map((player, index) => {
              const position = getTablePosition(index);
              const isDealer = index === gameState.dealerIndex;
              const isCurrentPlayer = index === gameState.currentPlayerIndex;
              const isHuman = index === 0;

              const renderAICards = () => {
                if (isHuman) return null;
                return (
                  <div className="hand-back-stack">
                    <div className="card-back-small" />
                    <span className="card-count">{player.hand.length}</span>
                  </div>
                );
              };

              return (
                <div
                  key={player.id}
                  className={`player-seat player-${position} ${isCurrentPlayer ? 'active' : ''} ${player.team === usTeam ? 'team-us' : 'team-them'}`}
                >
                  <div className="player-info">
                    <h3 className="player-name">
                      {player.name}
                      {isDealer && <span className="dealer-badge">🃏</span>}
                      {isCurrentPlayer && <span className="turn-indicator">Turn</span>}
                    </h3>
                    <div className="team-badge">{getTeamName(player.team)}</div>
                  </div>
                  {position === 'south' ? null : renderAICards()}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Human hand (South) positioned outside the table */}
      {gameState.players[0] && (
        <div className="player-hand-bar">
          <div className="hand-row">
            {gameState.players[0].hand.map((card: Card, cardIndex: number) => {
              const CARD_SPACING = 26;
              const MAX_CARDS = 10;
              const CENTER_OFFSET = ((MAX_CARDS - 1) * CARD_SPACING) / 2;
              const cardPosition = cardIndex * CARD_SPACING;
              const translateX = cardPosition - CENTER_OFFSET;
              const fixedTransform = `translateX(${translateX}px)`;
              const isPlayable = game.canPlayCard(0, cardIndex);
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

      <div className="action-buttons-bar">
        <div className="action-buttons-group">
          <button
            className={`play-button ${canPlay ? 'enabled' : 'disabled'}`}
            onClick={handlePlayCard}
            disabled={!canPlay}
          >
            Play Card
          </button>
          <button
            className={`next-trick-button ${gameState.waitingForTrickEnd ? 'enabled' : 'disabled'}`}
            onClick={() => {
              if (gameState.waitingForTrickEnd) {
                game.finishTrick();
                setGameState(game.getState());
              }
            }}
            disabled={!gameState.waitingForTrickEnd}
          >
            Next Trick
          </button>
        </div>
      </div>

      {/* Show round results when round ends */}
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
                game.continueToNextRound();
                setGameState(game.getState());
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

      {/* Pause before starting first round only - show trump card */}
      {gameState.waitingForRoundStart && !gameState.isGameOver && gameState.round === 1 && (
        <div className="pause-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            <h2>Round {gameState.round} Ready!</h2>
            {gameState.trumpCard && (
              <div style={{ margin: '20px 0' }}>
                <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Trump Suit:</p>
                <img
                  src={getCardImage(gameState.trumpCard)}
                  alt={`Trump: ${gameState.trumpCard.rank} of ${gameState.trumpCard.suit}`}
                  style={{ width: '150px', height: 'auto', border: '3px solid gold', borderRadius: '10px' }}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <p style={{ marginTop: '10px', fontSize: '16px' }}>
                  {getSuitEmoji(gameState.trumpSuit!)} {gameState.trumpSuit!.toUpperCase()}
                </p>
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                  This trump suit will remain visible throughout the game
                </p>
              </div>
            )}
            <p style={{ margin: '20px 0', color: '#666' }}>
              Dealer: <strong>{gameState.players[gameState.dealerIndex].name}</strong>
            </p>
            <button
              onClick={() => {
                game.startRound();
                setGameState(game.getState());
              }}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Start Round
            </button>
          </div>
        </div>
      )}


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

