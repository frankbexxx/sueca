import React, { useState, useEffect } from 'react';
import { Game } from '../models/Game';
import { GameState, Card } from '../types/game';
import './GameBoard.css';

export const GameBoard: React.FC = () => {
  const [game] = useState(() => new Game(['You', 'AI 1', 'Partner', 'AI 2']));
  const [gameState, setGameState] = useState<GameState>(game.getState());
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  useEffect(() => {
    // Auto-play for AI players
    if (
      !gameState.isGameOver &&
      !gameState.waitingForTrickEnd &&
      gameState.currentPlayerIndex !== 0
    ) {
      const timer = setTimeout(() => {
        playAICard();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayerIndex, gameState.isGameOver, gameState.waitingForTrickEnd]);

  const playAICard = () => {
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
  };

  const handleCardClick = (cardIndex: number) => {
    if (
      gameState.currentPlayerIndex === 0 &&
      !gameState.isGameOver &&
      !gameState.waitingForTrickEnd
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

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div className="game-board">
      <div className="game-header">
        <h1>🃏 Sueca Card Game</h1>
        <div className="scores">
          <div className="team-score team1">
            <h3>Team 1</h3>
            <p className="score-text">Round: <strong>{gameState.scores.team1}</strong></p>
            <p className="score-text">Game: <strong>{gameState.gameScore.team1}</strong></p>
          </div>
          <div className="team-score team2">
            <h3>Team 2</h3>
            <p className="score-text">Round: <strong>{gameState.scores.team2}</strong></p>
            <p className="score-text">Game: <strong>{gameState.gameScore.team2}</strong></p>
          </div>
        </div>
        <div className="game-info">
          {gameState.trumpSuit && (
            <div className="trump-suit">
              <strong>Trump Suit: {getSuitEmoji(gameState.trumpSuit)} {gameState.trumpSuit}</strong>
            </div>
          )}
          <div className="round-info">Round {gameState.round}</div>
        </div>
      </div>

      <div className="players-area">
        {gameState.players.map((player, index) => (
          <div
            key={player.id}
            className={`player-area ${index === gameState.currentPlayerIndex ? 'active' : ''} team${player.team}`}
          >
            <h3>
              {player.name} {player.team === 1 ? '(Team 1)' : '(Team 2)'}
              {index === gameState.currentPlayerIndex && index === 0 && (
                <span className="turn-indicator"> ← Your Turn</span>
              )}
            </h3>
            {index === 0 ? (
              <div className="hand">
                {player.hand.map((card: Card, cardIndex: number) => (
                  <img
                    key={card.id}
                    src={getCardImage(card)}
                    alt={`${card.rank} of ${card.suit}`}
                    className={`card ${selectedCard === cardIndex ? 'selected' : ''}`}
                    onClick={() => handleCardClick(cardIndex)}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      // Fallback if image doesn't exist
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="hand">
                {player.hand.map((_: Card, cardIndex: number) => (
                  <div key={cardIndex} className="card-back">
                    <span className="card-count">{player.hand.length}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="trick-area">
        <h3>Current Trick</h3>
        {gameState.currentTrick.length > 0 ? (
          <>
            <div className="trick-cards">
              {gameState.currentTrick.map((card: Card, index: number) => {
                const playerIndex = (gameState.trickLeader + index) % 4;
                const player = gameState.players[playerIndex];
                return (
                  <div key={index} className="trick-card-wrapper">
                    <div className="trick-player-name">{player.name}</div>
                    <img
                      src={getCardImage(card)}
                      alt={`${card.rank} of ${card.suit}`}
                      className="trick-card"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                );
              })}
            </div>
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
          </>
        ) : (
          <p className="no-trick">No cards played yet</p>
        )}
      </div>

      {gameState.currentPlayerIndex === 0 &&
        selectedCard !== null &&
        !gameState.isGameOver &&
        !gameState.waitingForTrickEnd && (
        <button className="play-button" onClick={handlePlayCard}>
          Play Selected Card
        </button>
      )}

      {gameState.isGameOver && (
        <div className="game-over">
          <h2>🎉 Game Over! 🎉</h2>
          <p className="winner-text">Team {gameState.winner} Wins!</p>
          <button
            className="new-game-button"
            onClick={() => {
              window.location.reload();
            }}
          >
            New Game
          </button>
        </div>
      )}
    </div>
  );
};

