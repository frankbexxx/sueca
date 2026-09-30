import React from 'react';
import { GameState, GameVariant } from '../../types/game';
import { useLanguage } from '../../i18n/useLanguage';
import { shouldShowTeamLabel } from '../../utils/playerSeatHelpers';
import { KingBid } from '../../models/games/king/kingContracts';
import { SpadesVariantState } from '../../models/games/SpadesGame';
import { getHeartsState } from '../../models/games/HeartsGame';
import { formatSpadesBidLabel } from '../../models/games/spades/spadesRules';
import { formatAuctionActionShort } from '../../models/games/king/kingAuction';
import { truncatePlayerName } from '../../utils/tableLayout';
import { LayoutSnapshot } from '../../hooks/useLayoutSnapshot';

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
  layoutSnapshot?: LayoutSnapshot;
  /** Engine-derived active turn / bid seat highlight. */
  isActiveTurn?: boolean;
  /** UX-SUECA-03 — ritual focus (independent of trick turn). */
  ritualRole?: 'shuffler' | 'cutter' | 'dealer' | 'first-player' | null;
}

/** Shared active-turn cue — DOM path (Phaser mirrors via seat chrome). */
export function ActiveTurnCue({ label }: { label: string }) {
  return (
    <span
      className="turn-now-badge"
      data-testid="active-turn-cue"
      data-active-turn="true"
      aria-label={label}
    >
      <span className="turn-now-dot" aria-hidden="true" />
      <span className="turn-now-label">{label}</span>
    </span>
  );
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
  forceMobileLayout = false,
  layoutSnapshot,
  isActiveTurn = false,
  ritualRole = null
}) => {
  void forceMobileLayout;
  void layoutSnapshot;
  const { t } = useLanguage();
  const player = gameState.players[playerIndex];
  const useMobileLayout = true;
  const showTeamLabel = shouldShowTeamLabel(variant, showTeamLabels);
  const isDealer = playerIndex === gameState.dealerIndex;
  const heartsRoundPoints =
    !compactSeats && variant === 'hearts' ? getHeartsState(gameState).roundPoints : null;
  const hasRitualFocus = ritualRole != null;
  const showTurnCue = isActiveTurn && !hasRitualFocus && !compactSeats;

  const ritualChipLabel =
    ritualRole === 'shuffler'
      ? t.modals.ritualRoleShuffler
      : ritualRole === 'cutter'
        ? t.modals.ritualRoleCutter
        : ritualRole === 'dealer'
          ? t.modals.ritualRoleDealer
          : ritualRole === 'first-player'
            ? t.modals.ritualRoleFirstPlayer
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

  const renderTurnCue = () => {
    if (!showTurnCue) return null;
    return <ActiveTurnCue label={t.gameBoard.nowPlaying} />;
  };

  const renderRitualChip = () => {
    if (!ritualChipLabel) return null;
    return (
      <span className="ritual-role-chip" data-ritual-role={ritualRole} aria-label={ritualChipLabel}>
        {ritualChipLabel}
      </span>
    );
  };

  return (
    <div
      className={`player-info ${useMobileLayout || spadesBidPhase ? 'mobile-layout' : ''}${
        isActiveTurn && !hasRitualFocus ? ' player-info--active' : ''
      }${hasRitualFocus ? ' player-info--ritual' : ''}`}
      data-active-turn={isActiveTurn && !hasRitualFocus ? 'true' : undefined}
      data-ritual-role={ritualRole ?? undefined}
    >
      {useMobileLayout || spadesBidPhase ? (
        <>
          <div className="player-name-line-1">
            {truncatePlayerName(player.name)}
            {!compactSeats && !spadesBidPhase && isDealer && !hasRitualFocus && (
              <span className="dealer-badge">🃏</span>
            )}
          </div>
          {(spadesBidPhase || !compactSeats || isActiveTurn || hasRitualFocus) && (
            <div className="player-name-line-2">
              {renderSecondaryLine()}
              {renderRitualChip()}
              {renderTurnCue()}
              {!spadesBidPhase && renderAuctionBadge()}
            </div>
          )}
        </>
      ) : (
        <>
          <h3 className="player-name">
            {truncatePlayerName(player.name)}
            {!compactSeats && isDealer && !hasRitualFocus && (
              <span className="dealer-badge">🃏</span>
            )}
            {renderRitualChip()}
            {renderTurnCue()}
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
