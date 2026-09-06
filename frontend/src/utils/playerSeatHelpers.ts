import { GameState, GameVariant } from '../types/game';

export function isIndividualTableVariant(variant?: GameVariant): boolean {
  return variant === 'hearts' || variant === 'king';
}

export function getPlayerSeatTeamClass(
  variant: GameVariant | undefined,
  usTeam: 1 | 2,
  playerTeam: 1 | 2
): string {
  if (isIndividualTableVariant(variant)) {
    return 'player-seat--individual';
  }
  return playerTeam === usTeam ? 'team-us' : 'team-them';
}

export function shouldShowTeamLabel(
  variant: GameVariant | undefined,
  showTeamLabels: boolean
): boolean {
  return showTeamLabels && !isIndividualTableVariant(variant);
}

export interface ActiveTurnSeatOptions {
  /** Spades bidding: use bidder index instead of currentPlayerIndex. */
  spadesBidPhase?: boolean;
  currentBidderIndex?: number | null;
  /** Hearts pass / other non-turn overlays. */
  suppress?: boolean;
}

/**
 * Whether this seat should show the "active turn" highlight.
 * Derived only from engine waiting flags + current player / bidder.
 */
export function isActiveTurnSeat(
  gameState: GameState,
  playerIndex: number,
  options: ActiveTurnSeatOptions = {}
): boolean {
  if (options.suppress) return false;
  if (gameState.isGameOver) return false;
  if (gameState.waitingForRoundStart) return false;
  if (gameState.waitingForRoundEnd) return false;
  if (gameState.waitingForGameStart) return false;
  if (gameState.waitingForTrickEnd) return false;

  if (options.spadesBidPhase) {
    return options.currentBidderIndex === playerIndex;
  }

  return gameState.currentPlayerIndex === playerIndex;
}
