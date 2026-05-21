import React from 'react';
import { Card, GameState, GameVariant } from '../../types/game';
import { TrickArea } from '../TrickArea';
import { PlayerSeats } from './PlayerSeats';
import { getTablePosition } from '../../utils/tableLayout';

export interface TableSurfaceProps {
  gameState: GameState;
  variant: GameVariant;
  localPlayerIndex: number;
  usTeam: 1 | 2;
  showGridOverlay: boolean;
  getCardImage: (card: Card) => string;
  getTeamName: (team: 1 | 2) => string;
}

export const TableSurface: React.FC<TableSurfaceProps> = ({
  gameState,
  variant,
  localPlayerIndex,
  usTeam,
  showGridOverlay,
  getCardImage,
  getTeamName
}) => {
  return (
    <div className="table-layout">
      <div className="table-surface">
        {showGridOverlay && <div className="grid-overlay" />}
        <TrickArea
          gameState={gameState}
          variant={variant}
          getCardImage={getCardImage}
          getTablePosition={getTablePosition}
        />
        <PlayerSeats
          gameState={gameState}
          localPlayerIndex={localPlayerIndex}
          usTeam={usTeam}
          getTeamName={getTeamName}
        />
      </div>
    </div>
  );
};
