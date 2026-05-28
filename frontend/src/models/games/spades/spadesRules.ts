import { RulesPresetId } from '../../../constants/rulesPresets';

export type SpadesBidType = 'normal' | 'nil' | 'blindNil';

export interface SpadesPresetOptions {
  nilEnabled: boolean;
  blindNilEnabled: boolean;
}

export function getSpadesPresetOptions(presetId: RulesPresetId): SpadesPresetOptions {
  if (presetId === 'spades-pt-nil') {
    return { nilEnabled: true, blindNilEnabled: true };
  }
  return { nilEnabled: false, blindNilEnabled: false };
}

export function formatSpadesBidLabel(
  bid: number | null,
  bidType: SpadesBidType,
  pendingLabel: string
): string {
  if (bid === null) return pendingLabel;
  if (bidType === 'nil') return 'Nil';
  if (bidType === 'blindNil') return 'Blind';
  return String(bid);
}

export function partialTeamBids(
  playerBids: (number | null)[],
  types: SpadesBidType[]
): { team1: number; team2: number } {
  const resolved = playerBids.map((value, index) =>
    value === null ? null : types[index] === 'nil' || types[index] === 'blindNil' ? null : value
  );
  let team1 = 0;
  let team2 = 0;
  for (let i = 0; i < 4; i++) {
    const bid = resolved[i];
    if (bid === null) continue;
    if (i === 0 || i === 2) team1 += bid;
    else team2 += bid;
  }
  return { team1, team2 };
}
