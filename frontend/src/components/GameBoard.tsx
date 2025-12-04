import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Game } from '../models/Game';
import { GameState, Card, DealingMethod } from '../types/game';
import './GameBoard.css';

export const GameBoard: React.FC = () => {
  const [dealingMethod, setDealingMethod] = useState<DealingMethod>('A');
  const [game, setGame] = useState(() => new Game(['You', 'AI 1', 'Partner', 'AI 2'], dealingMethod));
  const [gameState, setGameState] = useState<GameState>(game.getState());
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const playAICard = useCallback(() => {
    const playerIndex = gameState.currentPlayerIndex;
    const player = gameState.players[playerIndex];

    if (player.hand.length === 0) {
      return;
    }

    // Try to play the first valid card in the AI's hand
    let played = false;
    for (let i = 0; i < player.hand.length; i++) {
      if (game.playCard(playerIndex, i)) {
        played = true;
        break;
      }
    }

    // As a safeguard, if for some reason no card was considered valid,
    // force play of the first card to avoid the game getting stuck.
    if (!played) {
      if (game.playCard(playerIndex, 0)) {
        played = true;
      }
    }

    if (played) {
      setGameState(game.getState());
    }
  }, [game, gameState]);

  useEffect(() => {
    // Auto-play for AI players (only if not waiting for round/game start)
    if (
      !gameState.isGameOver &&
      !gameState.waitingForTrickEnd &&
      !gameState.waitingForRoundStart &&
      !gameState.waitingForGameStart &&
      gameState.currentPlayerIndex !== 0 &&
      gameState.players[gameState.currentPlayerIndex].name !== 'You'
    ) {
      const timer = setTimeout(() => {
        playAICard();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayerIndex, gameState.isGameOver, gameState.waitingForTrickEnd, gameState.waitingForRoundStart, gameState.waitingForGameStart, gameState.players, playAICard]);

  const handleCardClick = (cardIndex: number) => {
    // Only allow card selection if it's the human player's turn (index 0 = "You")
    if (
      gameState.players[gameState.currentPlayerIndex].name === 'You' &&
      gameState.currentPlayerIndex === 0 &&
      !gameState.isGameOver &&
      !gameState.waitingForTrickEnd &&
      !gameState.waitingForRoundStart &&
      !gameState.waitingForGameStart
    ) {
      setSelectedCard(cardIndex);
    }
  };

  const handlePlayCard = () => {
    if (
      selectedCard !== null &&
      gameState.currentPlayerIndex === 0 &&
      !gameState.waitingForTrickEnd
    ) {
      if (game.playCard(0, selectedCard)) {
        setGameState(game.getState());
        setSelectedCard(null);
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
    // Path assumes assets are copied to public/assets/cards1/
    return `${process.env.PUBLIC_URL || ''}/assets/cards1/${rank}_of_${suit}.png`;
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

  // Determine which team is "US" (the team with "You")
  const youTeam = gameState.players.find(p => p.name === 'You')?.team || 1;
  const usTeam = youTeam;
  const themTeam = youTeam === 1 ? 2 : 1;

  // Get team name
  const getTeamName = (team: 1 | 2): string => {
    return team === usTeam ? 'US' : 'THEM';
  };

  return (
    <div className="game-board">
      <div className="game-header">
        <h1>🃏 Sueca Card Game</h1>
        <div className="scores">
          <div className={`team-score ${usTeam === 1 ? 'team1' : 'team2'}`}>
            <h3>US</h3>
            <p className="score-text">Round: <strong>{gameState.scores[usTeam === 1 ? 'team1' : 'team2']}</strong></p>
            <p className="score-text">Game: <strong>{gameState.gameScore[usTeam === 1 ? 'team1' : 'team2']}</strong></p>
          </div>
          <div className={`team-score ${themTeam === 1 ? 'team1' : 'team2'}`}>
            <h3>THEM</h3>
            <p className="score-text">Round: <strong>{gameState.scores[themTeam === 1 ? 'team1' : 'team2']}</strong></p>
            <p className="score-text">Game: <strong>{gameState.gameScore[themTeam === 1 ? 'team1' : 'team2']}</strong></p>
          </div>
        </div>
        <div className="game-info">
          <div className="round-info">Round {gameState.round}</div>
          <div className="dealer-info">
            <strong>Dealer: {gameState.players[gameState.dealerIndex].name}</strong>
          </div>
          <div className="dealing-method-info">
            <strong>Dealing Method: {gameState.dealingMethod === 'A' ? 'A (Standard)' : 'B (Dealer First)'}</strong>
          </div>
          <div className="teams-info">
            <div className="team-setup">
              <strong>US:</strong> {gameState.players.filter(p => p.team === usTeam).map(p => p.name).join(' & ')}
            </div>
            <div className="team-setup">
              <strong>THEM:</strong> {gameState.players.filter(p => p.team === themTeam).map(p => p.name).join(' & ')}
            </div>
          </div>
        </div>
      </div>

      {/* Trump Card Display - Always visible when set (outside game-header) */}
      {gameState.trumpSuit && (
        <div className="trump-card-display" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: '20px auto',
          padding: '15px',
          backgroundColor: '#fff3e0',
          borderRadius: '10px',
          border: '3px solid #ff9800',
          maxWidth: '400px',
          boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#e65100', fontSize: '22px', fontWeight: 'bold' }}>🃏 TRUMP SUIT 🃏</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {gameState.trumpCard ? (
              <>
                <img
                  src={getCardImage(gameState.trumpCard)}
                  alt={`Trump: ${gameState.trumpCard.rank} of ${gameState.trumpCard.suit}`}
                  style={{ width: '120px', height: 'auto', border: '3px solid #ff9800', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e65100' }}>
                    {getSuitEmoji(gameState.trumpSuit)} {gameState.trumpSuit.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '16px', color: '#666', marginTop: '8px', fontStyle: 'italic' }}>
                    {gameState.trumpCard.rank} of {gameState.trumpCard.suit}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#e65100' }}>
                  {getSuitEmoji(gameState.trumpSuit)} {gameState.trumpSuit.toUpperCase()}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '8px', fontStyle: 'italic' }}>
                  Trump Suit
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="table-surface">
          {/* Trick area in center */}
          <div className="trick-area-center">
            <h3>Current Trick</h3>
            {gameState.currentTrick.length > 0 ? (
              <div className="trick-cards-center">
                {gameState.currentTrick.map((card: Card, index: number) => {
                  const playerIndex = (gameState.trickLeader + index) % 4;
                  const player = gameState.players[playerIndex];
                  const position = getTablePosition(playerIndex);
                  return (
                    <div key={index} className={`trick-card-center trick-from-${position}`}>
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
            {gameState.waitingForTrickEnd && (
              <button
                className="next-trick-button"
                onClick={() => {
                  game.finishTrick();
                  setGameState(game.getState());
                }}
              >
                Next Trick
              </button>
            )}
          </div>

          {/* Players positioned around table */}
          {gameState.players.map((player, index) => {
            const position = getTablePosition(index);
            const isDealer = index === gameState.dealerIndex;
            const isCurrentPlayer = index === gameState.currentPlayerIndex;
            
            return (
              <div
                key={player.id}
                className={`player-seat player-${position} ${isCurrentPlayer ? 'active' : ''} ${player.team === usTeam ? 'team-us' : 'team-them'}`}
              >
                <div className="player-info">
                  <h3 className="player-name">
                    {player.name}
                    {isDealer && <span className="dealer-badge">🃏 Dealer</span>}
                    {isCurrentPlayer && <span className="turn-indicator">← Turn</span>}
                  </h3>
                  <div className="team-badge">{getTeamName(player.team)}</div>
                </div>
                {index === 0 ? (
                  <div className={`hand-fanned hand-${position} hand-player`}>
                    {player.hand.map((card: Card, cardIndex: number) => {
                      // For player: compact fan like before (more together)
                      const totalCards = player.hand.length;
                      const maxAngle = Math.min(45, totalCards * 1.2); // Fan angle
                      const fanAngle = (cardIndex - (totalCards - 1) / 2) * (maxAngle / Math.max(1, totalCards - 1));
                      const xOffset = (cardIndex - (totalCards - 1) / 2) * 18; // Horizontal spacing
                      
                      // Get base rotation for position
                      let baseRotation = 0;
                      if (position === 'north') baseRotation = 180;
                      else if (position === 'east') baseRotation = 90;
                      else if (position === 'west') baseRotation = -90;
                      
                      // Combine base rotation with fan angle
                      const totalRotation = baseRotation + fanAngle;
                      
                      // Z-index: cards on the right side (visually on top) have higher z-index
                      const zIndexValue = totalCards - cardIndex;
                      
                      // Check if this card is currently hovered
                      const isHovered = hoveredCard === cardIndex;
                      
                      return (
                        <img
                          key={card.id}
                          src={getCardImage(card)}
                          alt={`${card.rank} of ${card.suit}`}
                          className={`card-fanned card-${position} ${selectedCard === cardIndex ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                          style={{
                            transform: `rotate(${totalRotation}deg) translateX(${xOffset}px)`,
                            zIndex: isHovered ? 1000 : zIndexValue,
                            pointerEvents: 'auto'
                          }}
                          onMouseEnter={() => {
                            // Clear any pending timeout
                            if (hoverTimeoutRef.current) {
                              clearTimeout(hoverTimeoutRef.current);
                              hoverTimeoutRef.current = null;
                            }
                            // Set this card as hovered immediately
                            setHoveredCard(cardIndex);
                          }}
                          onMouseLeave={() => {
                            // Clear hover with a small delay to prevent flickering when moving between overlapping cards
                            if (hoverTimeoutRef.current) {
                              clearTimeout(hoverTimeoutRef.current);
                            }
                            hoverTimeoutRef.current = setTimeout(() => {
                              setHoveredCard(null);
                              hoverTimeoutRef.current = null;
                            }, 100);
                          }}
                          onClick={() => {
                            handleCardClick(cardIndex);
                          }}
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className={`hand-fanned hand-${position}`}>
                    {player.hand.map((_: Card, cardIndex: number) => {
                      // Calculate fan angle - compact fan like a leque
                      const totalCards = player.hand.length;
                      const maxAngle = Math.min(45, totalCards * 1.2); // Slightly reduced angle
                      const fanAngle = (cardIndex - (totalCards - 1) / 2) * (maxAngle / Math.max(1, totalCards - 1));
                      // Increased spacing to reduce overlap
                      const xOffset = (cardIndex - (totalCards - 1) / 2) * 16;
                      
                      // Get base rotation for position
                      let baseRotation = 0;
                      if (position === 'north') baseRotation = 180;
                      else if (position === 'east') baseRotation = 90;
                      else if (position === 'west') baseRotation = -90;
                      
                      // Combine base rotation with fan angle
                      const totalRotation = baseRotation + fanAngle;
                      
                      return (
                        <div
                          key={cardIndex}
                          className={`card-back-fanned card-${position}`}
                          style={{
                            transform: `rotate(${totalRotation}deg) translateX(${xOffset}px)`,
                            zIndex: cardIndex
                          }}
                        >
                          {cardIndex === Math.floor(player.hand.length / 2) && (
                            <span className="card-count-overlay">{player.hand.length}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>


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

      {gameState.currentPlayerIndex === 0 &&
        gameState.players[0].name === 'You' &&
        selectedCard !== null &&
        !gameState.isGameOver &&
        !gameState.waitingForTrickEnd &&
        !gameState.waitingForRoundStart &&
        !gameState.waitingForGameStart && (
        <button className="play-button" onClick={handlePlayCard}>
          Play Selected Card
        </button>
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
            onClick={() => {
                const newGame = new Game(['You', 'AI 1', 'Partner', 'AI 2'], dealingMethod);
                setGame(newGame);
                setGameState(newGame.getState());
              }}
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

