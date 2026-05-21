import React from 'react';
import { GameState } from '../../types/game';
import { getTablePosition, isMobileDevice, truncatePlayerName } from '../../utils/tableLayout';

export interface PlayerSeatsProps {
  gameState: GameState;
  localPlayerIndex: number;
  usTeam: 1 | 2;
  getTeamName: (team: 1 | 2) => string;
}

export const PlayerSeats: React.FC<PlayerSeatsProps> = ({
  gameState,
  localPlayerIndex,
  usTeam,
  getTeamName
}) => {
  const useMobileLayout = isMobileDevice();

  return (
    <div className="seats-layer">
      {gameState.players.map((player, index) => {
        const position = getTablePosition(index);
        const isDealer = index === gameState.dealerIndex;
        const isCurrentPlayer = index === gameState.currentPlayerIndex;
        const isHuman = index === localPlayerIndex;

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
            className={`player-seat player-${position} ${player.team === usTeam ? 'team-us' : 'team-them'}`}
          >
            <div className={`player-info ${useMobileLayout ? 'mobile-layout' : ''}`}>
              {useMobileLayout ? (
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
  );
};
