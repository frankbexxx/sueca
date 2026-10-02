import React from 'react';
import { Card, GameState, GameVariant } from '../../types/game';
import { KingBid } from '../../models/games/king/kingContracts';
import { SpadesVariantState } from '../../models/games/SpadesGame';
import { TrickArea } from '../TrickArea';
import { PlayerSeats } from './PlayerSeats';
import { LayoutSnapshot } from '../../hooks/useLayoutSnapshot';

export interface TableSurfaceProps {
  gameState: GameState;
  variant: GameVariant;
  localPlayerIndex: number;
  usTeam: 1 | 2;
  getCardImage: (card: Card) => string;
  getTeamName: (team: 1 | 2) => string;
  showTeamLabels?: boolean;
  showAuctionBadges?: boolean;
  auctionActions?: Partial<Record<number, KingBid | 'pass'>>;
  auctionLocale?: 'pt' | 'en';
  compactSeats?: boolean;
  spadesBidPhase?: boolean;
  spadesState?: SpadesVariantState;
  layoutSnapshot?: LayoutSnapshot;
  ritualFocusSeat?: number | null;
  ritualRole?: 'shuffler' | 'cutter' | 'dealer' | 'first-player' | null;
  hideHands?: boolean;
  playLocked?: boolean;
  seatActive?: boolean[];
  turnCuePaused?: boolean;
}

export const TableSurface: React.FC<TableSurfaceProps> = ({
  gameState,
  variant,
  localPlayerIndex,
  usTeam,
  getCardImage,
  getTeamName,
  showTeamLabels = true,
  showAuctionBadges = false,
  auctionActions,
  auctionLocale = 'pt',
  compactSeats = false,
  spadesBidPhase = false,
  spadesState,
  layoutSnapshot,
  ritualFocusSeat = null,
  ritualRole = null,
  hideHands = false,
  playLocked = false,
  seatActive = [],
  turnCuePaused = false
}) => {
  return (
    <div className="table-layout">
      <div className="table-surface">
        <TrickArea
          gameState={gameState}
          localPlayerIndex={localPlayerIndex}
          getCardImage={getCardImage}
          variant={variant}
        />
        <PlayerSeats
          gameState={gameState}
          variant={variant}
          localPlayerIndex={localPlayerIndex}
          usTeam={usTeam}
          showTeamLabels={showTeamLabels}
          getTeamName={getTeamName}
          showAuctionBadges={showAuctionBadges}
          auctionActions={auctionActions}
          auctionLocale={auctionLocale}
          compactSeats={compactSeats}
          spadesBidPhase={spadesBidPhase}
          spadesState={spadesState}
          layoutSnapshot={layoutSnapshot}
          ritualFocusSeat={ritualFocusSeat}
          ritualRole={ritualRole}
          hideHands={hideHands}
          playLocked={playLocked}
          seatActive={seatActive}
          turnCuePaused={turnCuePaused}
        />
      </div>
    </div>
  );
};
