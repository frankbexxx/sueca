import React from 'react';
import { GameState, GameVariant } from '../../types/game';
import { useLanguage } from '../../i18n/useLanguage';
import { shouldShowTeamLabel } from '../../utils/playerSeatHelpers';
import { KingBid } from '../../models/games/king/kingContracts';
import { SpadesVariantState } from '../../models/games/SpadesGame';
import { formatSpadesBidLabel } from '../../models/games/spades/spadesRules';
import { formatAuctionActionShort } from '../../models/games/king/kingAuction';
import { isMobileDevice, truncatePlayerName } from '../../utils/tableLayout';

export interface PlayerInfoBoxProps {
  gameState: GameState;
  playerIndex: number;
  variant?: GameVariant;
  usTeam: 1 | 2;
  getTeamName: (team: 1 | 2) => string;
  showTeamLabels?: boolean;
  compactSeats?: boolean;
  spadesBidPhase?: boolean;
  spadesState?: SpadesVariantState;
  showAuctionBadges?: boolean;
  auctionActions?: Partial<Record<number, KingBid | 'pass'>>;
  auctionLocale?: 'pt' | 'en';
  forceMobileLayout?: boolean;
}

export const PlayerInfoBox: React.FC<PlayerInfoBoxProps> = ({
  gameState,
  playerIndex,
  variant,
  getTeamName,
  showTeamLabels = true,
  compactSeats = false,
  spadesBidPhase = false,
  spadesState,
  showAuctionBadges = false,
  auctionActions,
  auctionLocale = 'pt',
  forceMobileLayout = false
}) => {
  const { t } = useLanguage();
  const player = gameState.players[playerIndex];
  const useMobileLayout = forceMobileLayout || isMobileDevice() || compactSeats;
  const showTeamLabel = shouldShowTeamLabel(variant, showTeamLabels);
  const isDealer = playerIndex === gameState.dealerIndex;
  const isCurrentPlayer = playerIndex === gameState.currentPlayerIndex;
  const heartsRoundPoints =
    !compactSeats && variant === 'hearts'
      ? ((gameState.variantState?.hearts as { roundPoints?: number[] } | undefined)
          ?.roundPoints ?? [0, 0, 0, 0])
      : null;

  const renderSecondaryLine = () => {
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
      return getTeamName(player.team);
    }
    return null;
  };

  const renderAuctionBadge = () => {
    if (!showAuctionBadges || !auctionActions) return null;
    const action = auctionActions[playerIndex];
    if (!action) return null;
    return (
      <span className="player-auction-badge">{formatAuctionActionShort(action, auctionLocale)}</span>
    );
  };

  return (
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
              {renderSecondaryLine()}
              {!compactSeats && !spadesBidPhase && isCurrentPlayer && (
                <span className="turn-indicator">⚡</span>
              )}
              {!spadesBidPhase && renderAuctionBadge()}
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
              <div className="team-badge">{renderSecondaryLine()}</div>
              {renderAuctionBadge()}
            </>
          )}
        </>
      )}
    </div>
  );
};
