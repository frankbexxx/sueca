import React from 'react';
import { GameState, GameVariant } from '../../types/game';
import { getPlayerSeatTeamClass } from '../../utils/playerSeatHelpers';
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
  ritualFocusSeat?: number | null;
  ritualRole?: 'shuffler' | 'cutter' | 'dealer' | 'first-player' | null;
  /** Presentation lock is already folded into seatActive by the table model. */
  playLocked?: boolean;
  /** Shared-model active flags, one per engine seat. */
  seatActive?: boolean[];
  /** Shared-model pause. Hides the turn cue without changing who is active. */
  turnCuePaused?: boolean;
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
  auctionLocale = 'pt',
  ritualFocusSeat = null,
  ritualRole = null,
  seatActive = [],
  turnCuePaused = false
}) => {
  const player = gameState.players[localPlayerIndex];
  if (!player) return null;

  const hasRitualFocus = ritualFocusSeat === localPlayerIndex;
  const isActive = !turnCuePaused && Boolean(seatActive[localPlayerIndex]);
  const isBidding =
    !turnCuePaused &&
    spadesBidPhase &&
    spadesState?.currentBidderIndex === localPlayerIndex;

  return (
    <div
      className={`local-player-dock ${getPlayerSeatTeamClass(variant, usTeam, player.team)}${
        isActive ? ' local-player-dock--active' : ''
      }${hasRitualFocus ? ' local-player-dock--ritual' : ''}${
        isBidding ? ' local-player-dock--bidding' : ''
      }`}
      data-ritual-focus={hasRitualFocus ? 'true' : undefined}
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
        ritualRole={hasRitualFocus ? ritualRole : null}
      />
    </div>
  );
};
