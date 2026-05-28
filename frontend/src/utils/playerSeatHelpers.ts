import { GameVariant } from '../types/game';

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
