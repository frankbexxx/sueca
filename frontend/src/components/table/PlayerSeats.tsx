import React from 'react';
import { GameState } from '../../types/game';
import { KingBid } from '../../models/games/king/kingContracts';
import { formatAuctionActionShort } from '../../models/games/king/kingAuction';
import { getTablePosition, isMobileDevice, truncatePlayerName } from '../../utils/tableLayout';
import { CARD_BACK_PATH, getPublicAssetPath } from '../../constants/cardAssets';

export interface PlayerSeatsProps {
  gameState: GameState;
  localPlayerIndex: number;
  usTeam: 1 | 2;
  showTeamLabels?: boolean;
  getTeamName: (team: 1 | 2) => string;
  showAuctionBadges?: boolean;
  auctionActions?: Partial<Record<number, KingBid | 'pass'>>;
  auctionLocale?: 'pt' | 'en';
}

export const PlayerSeats: React.FC<PlayerSeatsProps> = ({
  gameState,
  localPlayerIndex,
  usTeam,
  showTeamLabels = true,
  getTeamName,
  showAuctionBadges = false,
  auctionActions,
  auctionLocale = 'pt'
}) => {
  const useMobileLayout = isMobileDevice();

  const renderAuctionBadge = (playerIndex: number) => {
    if (!showAuctionBadges || !auctionActions) return null;
    const action = auctionActions[playerIndex];
    if (!action) return null;
    return (
      <span className="player-auction-badge">{formatAuctionActionShort(action, auctionLocale)}</span>
    );
  };

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
              <img
                src={getPublicAssetPath(CARD_BACK_PATH)}
                alt=""
                className="card-back-small"
                draggable={false}
              />
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
                    {showTeamLabels && getTeamName(player.team)}
                    {isCurrentPlayer && <span className="turn-indicator">⚡</span>}
                    {renderAuctionBadge(index)}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="player-name">
                    {player.name}
                    {isDealer && <span className="dealer-badge">🃏</span>}
                    {isCurrentPlayer && <span className="turn-indicator">⚡</span>}
                  </h3>
                  <div className="team-badge">{showTeamLabels ? getTeamName(player.team) : null}</div>
                  {renderAuctionBadge(index)}
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
