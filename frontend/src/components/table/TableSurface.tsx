import React from 'react';
import { Card, GameState, GameVariant } from '../../types/game';
import { KingBid } from '../../models/games/king/kingContracts';
import { SpadesVariantState } from '../../models/games/SpadesGame';
import { TrickArea } from '../TrickArea';
import { PlayerSeats } from './PlayerSeats';

export interface TableSurfaceProps {
  gameState: GameState;
  variant: GameVariant;
  localPlayerIndex: number;
  usTeam: 1 | 2;
  showGridOverlay: boolean;
  getCardImage: (card: Card) => string;
  getTeamName: (team: 1 | 2) => string;
  showTeamLabels?: boolean;
  showAuctionBadges?: boolean;
  auctionActions?: Partial<Record<number, KingBid | 'pass'>>;
  auctionLocale?: 'pt' | 'en';
  compactSeats?: boolean;
  spadesBidPhase?: boolean;
  spadesState?: SpadesVariantState;
}

export const TableSurface: React.FC<TableSurfaceProps> = ({
  gameState,
  variant,
  localPlayerIndex,
  usTeam,
  showGridOverlay,
  getCardImage,
  getTeamName,
  showTeamLabels = true,
  showAuctionBadges = false,
  auctionActions,
  auctionLocale = 'pt',
  compactSeats = false,
  spadesBidPhase = false,
  spadesState
}) => {
  return (
    <div className="table-layout">
      <div className="table-surface">
        {showGridOverlay && <div className="grid-overlay" />}
        <TrickArea
          gameState={gameState}
          variant={variant}
          localPlayerIndex={localPlayerIndex}
          getCardImage={getCardImage}
        />
        <PlayerSeats
          gameState={gameState}
          variant={variant}
          localPlayerIndex={localPlayerIndex}
          usTeam={usTeam}
          showTeamLabels={showTeamLabels}
          getTeamName={getTeamName}
          getCardImage={getCardImage}
          showAuctionBadges={showAuctionBadges}
          auctionActions={auctionActions}
          auctionLocale={auctionLocale}
          compactSeats={compactSeats}
          spadesBidPhase={spadesBidPhase}
          spadesState={spadesState}
        />
      </div>
    </div>
  );
};
