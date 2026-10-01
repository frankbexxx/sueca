import { translations } from '../i18n/translations';
import type { TableRitualRole } from './tableRenderModel';

/** Chip copy shared by the DOM ritual seat and the Phaser ritual seat. */
export interface RitualRoleLabels {
  shuffler: string;
  cutter: string;
  dealer: string;
  firstPlayer: string;
}

export function ritualRoleLabelsFromModals(modals: {
  ritualRoleShuffler: string;
  ritualRoleCutter: string;
  ritualRoleDealer: string;
  ritualRoleFirstPlayer: string;
}): RitualRoleLabels {
  return {
    shuffler: modals.ritualRoleShuffler,
    cutter: modals.ritualRoleCutter,
    dealer: modals.ritualRoleDealer,
    firstPlayer: modals.ritualRoleFirstPlayer,
  };
}

/** Product default is Portuguese, matching the language hook. */
export const DEFAULT_RITUAL_ROLE_LABELS: RitualRoleLabels = ritualRoleLabelsFromModals(
  translations.pt.modals
);

export function ritualRoleChipLabel(
  role: TableRitualRole | null | undefined,
  labels: RitualRoleLabels
): string | null {
  if (role === 'shuffler') return labels.shuffler;
  if (role === 'cutter') return labels.cutter;
  if (role === 'dealer') return labels.dealer;
  if (role === 'first-player') return labels.firstPlayer;
  return null;
}
