import React from 'react';
import { GameState, GameVariant } from '../../types/game';
import { getPlayerSeatTeamClass } from '../../utils/playerSeatHelpers';
import { KingBid } from '../../models/games/king/kingContracts';
import { SpadesVariantState } from '../../models/games/SpadesGame';
import { getTablePositionForPlayer } from '../../utils/tableLayout';
import { getActiveThemeCardBackPath, getPublicAssetPath } from '../../constants/cardAssets';
import { PlayerInfoBox } from './PlayerInfoBox';
import { LayoutSnapshot } from '../../hooks/useLayoutSnapshot';

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
  layoutSnapshot?: LayoutSnapshot;
  ritualFocusSeat?: number | null;
  ritualRole?: 'shuffler' | 'cutter' | 'dealer' | 'first-player' | null;
  /** UX-SUECA-04 — hide opponent backs until post-deal reveal. */
  hideHands?: boolean;
  /** Presentation lock is already folded into seatActive by the table model. */
  playLocked?: boolean;
  /** Shared-model active flags, one per engine seat. */
  seatActive?: boolean[];
  /** Shared-model pause. Hides the turn cue without changing who is active. */
  turnCuePaused?: boolean;
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
  spadesState,
  layoutSnapshot,
  ritualFocusSeat = null,
  ritualRole = null,
  hideHands = false,
  seatActive = [],
  turnCuePaused = false
}) => {
  return (
    <div className="seats-layer">
      {gameState.players.map((player, index) => {
        const position = getTablePositionForPlayer(index, localPlayerIndex);
        if (position === 'south') return null;

        const handCount = hideHands ? 0 : player.hand?.length ?? 0;
        const renderAICards = () => {
          if (compactSeats || handCount <= 0) return null;
          return (
            <div className="hand-back-stack">
              <img
                src={getPublicAssetPath(getActiveThemeCardBackPath())}
                alt=""
                className="card-back-small"
                draggable={false}
              />
              <span className="card-count">{handCount}</span>
            </div>
          );
        };

        const hasRitualFocus = ritualFocusSeat === index;
        const isActive = !turnCuePaused && Boolean(seatActive[index]);
        const isBidding =
          !turnCuePaused &&
          spadesBidPhase &&
          spadesState?.currentBidderIndex === index;

        return (
          <div
            key={`seat-${index}`}
            className={`player-seat player-${position} ${getPlayerSeatTeamClass(variant, usTeam, player.team)}${
              isActive ? ' player-seat--active' : ''
            }${hasRitualFocus ? ' player-seat--ritual' : ''}${
              isBidding ? ' player-seat--bidding' : ''
            }`}
            data-seat-index={index}
            data-ritual-focus={hasRitualFocus ? 'true' : undefined}
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
              layoutSnapshot={layoutSnapshot}
              isActiveTurn={isActive}
              ritualRole={hasRitualFocus ? ritualRole : null}
            />
            {renderAICards()}
          </div>
        );
      })}
    </div>
  );
};
