import React from 'react';
import { GameState, GameVariant } from '../../types/game';
import {
  getPlayerSeatTeamClass
} from '../../utils/playerSeatHelpers';
import { KingBid } from '../../models/games/king/kingContracts';
import { SpadesVariantState } from '../../models/games/SpadesGame';
import { getTablePositionForPlayer } from '../../utils/tableLayout';
import { CARD_BACK_PATH, getPublicAssetPath } from '../../constants/cardAssets';
import { PlayerInfoBox } from './PlayerInfoBox';

export interface PlayerSeatsProps {
  gameState: GameState;
  variant?: GameVariant;
  localPlayerIndex: number;
  usTeam: 1 | 2;
  showTeamLabels?: boolean;
  getTeamName: (team: 1 | 2) => string;
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
  showAuctionBadges = false,
  auctionActions,
  auctionLocale = 'pt',
  compactSeats = false,
  spadesBidPhase = false,
  spadesState
}) => {
  return (
    <div className="seats-layer">
      {gameState.players.map((player, index) => {
        const position = getTablePositionForPlayer(index, localPlayerIndex);
        if (position === 'south') return null;

        const renderAICards = () => {
          if (compactSeats) return null;
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
            <PlayerInfoBox
              gameState={gameState}
              playerIndex={index}
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
            />
            {renderAICards()}
          </div>
        );
      })}
    </div>
  );
};
