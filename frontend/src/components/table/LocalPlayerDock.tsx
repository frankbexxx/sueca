import React from 'react';
import { GameState, GameVariant } from '../../types/game';
import { getPlayerSeatTeamClass, isActiveTurnSeat } from '../../utils/playerSeatHelpers';
import { KingBid } from '../../models/games/king/kingContracts';
import { SpadesVariantState } from '../../models/games/SpadesGame';
import { PlayerInfoBox } from './PlayerInfoBox';

export interface LocalPlayerDockProps {
  gameState: GameState;
  variant: GameVariant;
  localPlayerIndex: number;
  usTeam: 1 | 2;
  getTeamName: (team: 1 | 2) => string;
  showTeamLabels?: boolean;
  compactSeats?: boolean;
  spadesBidPhase?: boolean;
  spadesState?: SpadesVariantState;
  showAuctionBadges?: boolean;
  auctionActions?: Partial<Record<number, KingBid | 'pass'>>;
  auctionLocale?: 'pt' | 'en';
}

export const LocalPlayerDock: React.FC<LocalPlayerDockProps> = ({
  gameState,
  variant,
  localPlayerIndex,
  usTeam,
  getTeamName,
  showTeamLabels = true,
  compactSeats = false,
  spadesBidPhase = false,
  spadesState,
  showAuctionBadges = false,
  auctionActions,
  auctionLocale = 'pt'
}) => {
  const player = gameState.players[localPlayerIndex];
  if (!player) return null;

  const isActive = isActiveTurnSeat(gameState, localPlayerIndex, {
    spadesBidPhase,
    currentBidderIndex: spadesState?.currentBidderIndex ?? null,
    suppress: compactSeats
  });
  const isBidding =
    spadesBidPhase && spadesState?.currentBidderIndex === localPlayerIndex;

  return (
    <div
      className={`local-player-dock ${getPlayerSeatTeamClass(variant, usTeam, player.team)}${
        isActive ? ' local-player-dock--active' : ''
      }${isBidding ? ' local-player-dock--bidding' : ''}`}
    >
      {/* forceMobileLayout: dock always compact; layout frozen at session start */}
      <PlayerInfoBox
        gameState={gameState}
        playerIndex={localPlayerIndex}
        variant={variant}
        usTeam={usTeam}
        getTeamName={getTeamName}
        showTeamLabels={showTeamLabels}
        compactSeats={compactSeats}
        spadesBidPhase={spadesBidPhase}
        spadesState={spadesState}
        showAuctionBadges={showAuctionBadges}
        auctionActions={auctionActions}
        auctionLocale={auctionLocale}
        forceMobileLayout
        isActiveTurn={isActive}
      />
    </div>
  );
};
