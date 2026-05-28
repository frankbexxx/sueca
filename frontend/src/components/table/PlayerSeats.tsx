import React from 'react';
import { GameState, GameVariant } from '../../types/game';
import { useLanguage } from '../../i18n/useLanguage';
import {
  getPlayerSeatTeamClass,
  shouldShowTeamLabel
} from '../../utils/playerSeatHelpers';
import { KingBid } from '../../models/games/king/kingContracts';
import { SpadesVariantState } from '../../models/games/SpadesGame';
import { formatSpadesBidLabel } from '../../models/games/spades/spadesRules';
import { formatAuctionActionShort } from '../../models/games/king/kingAuction';
import { getTablePositionForPlayer, isMobileDevice, truncatePlayerName } from '../../utils/tableLayout';
import { Card } from '../../types/game';
import { CARD_BACK_PATH, getPublicAssetPath } from '../../constants/cardAssets';

export interface PlayerSeatsProps {
  gameState: GameState;
  variant?: GameVariant;
  localPlayerIndex: number;
  usTeam: 1 | 2;
  showTeamLabels?: boolean;
  getTeamName: (team: 1 | 2) => string;
  getCardImage?: (card: Card) => string;
  showAuctionBadges?: boolean;
  auctionActions?: Partial<Record<number, KingBid | 'pass'>>;
  auctionLocale?: 'pt' | 'en';
  compactSeats?: boolean;
  spadesBidPhase?: boolean;
  spadesState?: SpadesVariantState;
}

export const PlayerSeats: React.FC<PlayerSeatsProps> = ({
  gameState,
  variant,
  localPlayerIndex,
  usTeam,
  showTeamLabels = true,
  getTeamName,
  getCardImage,
  showAuctionBadges = false,
  auctionActions,
  auctionLocale = 'pt',
  compactSeats = false,
  spadesBidPhase = false,
  spadesState
}) => {
  const { t } = useLanguage();
  const useMobileLayout = isMobileDevice() || compactSeats;
  const showTeamLabel = shouldShowTeamLabel(variant, showTeamLabels);
  const heartsRoundPoints =
    !compactSeats && variant === 'hearts'
      ? ((gameState.variantState?.hearts as { roundPoints?: number[] } | undefined)
          ?.roundPoints ?? [0, 0, 0, 0])
      : null;

  const renderSecondaryLine = (playerIndex: number) => {
    if (spadesBidPhase && spadesState) {
      const bid = spadesState.playerBids[playerIndex];
      const bidType = spadesState.playerBidTypes[playerIndex] ?? 'normal';
      if (bidType === 'nil') return t.spadesBid.badgeNil;
      if (bidType === 'blindNil') return t.spadesBid.badgeBlind;
      return formatSpadesBidLabel(bid, bidType, t.spadesBid.pending);
    }
    if (compactSeats) return null;
    if (heartsRoundPoints) {
      return t.gameBoard.roundPointsShort(heartsRoundPoints[playerIndex] ?? 0);
    }
    if (showTeamLabel) {
      return getTeamName(gameState.players[playerIndex].team);
    }
    return null;
  };

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
        const position = getTablePositionForPlayer(index, localPlayerIndex);
        const isDealer = index === gameState.dealerIndex;
        const isCurrentPlayer = index === gameState.currentPlayerIndex;
        const isHuman = index === localPlayerIndex;

        const trickCardIndex = gameState.currentTrick.findIndex(
          (_, trickIdx) => (gameState.trickLeader + trickIdx) % 4 === index
        );
        const trickCard =
          trickCardIndex >= 0 ? gameState.currentTrick[trickCardIndex] : null;

        const renderPlayedCard = () => {
          if (!trickCard || !getCardImage || position !== 'south') return null;
          return (
            <div className="player-trick-card">
              <img
                src={getCardImage(trickCard)}
                alt={`${trickCard.rank} of ${trickCard.suit}`}
                className="trick-card-img"
                draggable={false}
              />
            </div>
          );
        };

        const renderAICards = () => {
          if (isHuman || compactSeats) return null;
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
            className={`player-seat player-${position} ${getPlayerSeatTeamClass(variant, usTeam, player.team)}${
              spadesBidPhase && spadesState?.currentBidderIndex === index
                ? ' player-seat--bidding'
                : ''
            }`}
          >
            <div
              className={`player-info ${useMobileLayout || spadesBidPhase ? 'mobile-layout' : ''}${
                compactSeats ? ' player-info--compact' : ''
              }`}
            >
              {useMobileLayout || spadesBidPhase ? (
                <>
                  <div className="player-name-line-1">
                    {truncatePlayerName(player.name)}
                    {!compactSeats && !spadesBidPhase && isDealer && (
                      <span className="dealer-badge">🃏</span>
                    )}
                  </div>
                  {(spadesBidPhase || !compactSeats) && (
                    <div className="player-name-line-2">
                      {renderSecondaryLine(index)}
                      {!compactSeats && !spadesBidPhase && isCurrentPlayer && (
                        <span className="turn-indicator">⚡</span>
                      )}
                      {!spadesBidPhase && renderAuctionBadge(index)}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3 className="player-name">
                    {truncatePlayerName(player.name)}
                    {!compactSeats && isDealer && <span className="dealer-badge">🃏</span>}
                    {!compactSeats && isCurrentPlayer && <span className="turn-indicator">⚡</span>}
                  </h3>
                  {!compactSeats && (
                    <>
                      <div className="team-badge">{renderSecondaryLine(index)}</div>
                      {renderAuctionBadge(index)}
                    </>
                  )}
                </>
              )}
            </div>
            {renderPlayedCard()}
            {position === 'south' ? null : renderAICards()}
          </div>
        );
      })}
    </div>
  );
};
