/**
 * Shared Phaser seat chrome — variant-agnostic geometry, optional secondary badge.
 * Does not decide turn legality; only formats what the view model already decided.
 */

import { truncatePlayerName } from '../../utils/tableLayout';
import type { PhaserAspectMode } from './phaserTableLayout';

export interface SeatPresentationInput {
  name: string;
  handCount: number;
  isLocal: boolean;
  isDealer: boolean;
  /** Team only when policy allows (Sueca); never stacked with secondaryBadge. */
  teamLabel: string | null;
  /** Bid / auction / Lic|Ben — one optional secondary token. */
  secondaryBadge: string | null;
  showActiveHighlight: boolean;
  aspect: PhaserAspectMode;
}

export interface SeatPresentation {
  /** Single-line seat chrome for the table. */
  labelText: string;
  shortName: string;
  showActiveRing: boolean;
  showDealerMark: boolean;
}

/** Shorten team tokens (NÓS / ELES / US / THEM). */
export function shortTeamLabel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  if (/^nós$/i.test(t) || /^nos$/i.test(t) || /^us$/i.test(t)) return 'Nós';
  if (/^eles$/i.test(t) || /^them$/i.test(t)) return 'Eles';
  return truncatePlayerName(t, 5);
}

/**
 * Canonical seat line: Name · [badge|team] · [count] · [D]
 * Same structure for Sueca / Spades / Hearts / King.
 */
export function computeSeatPresentation(input: SeatPresentationInput): SeatPresentation {
  const maxName = input.aspect === 'landscape' ? 6 : 8;
  const shortName = truncatePlayerName(input.name, maxName);
  const parts: string[] = [shortName];

  const badge = input.secondaryBadge?.trim() || null;
  const team = badge ? null : shortTeamLabel(input.teamLabel);
  if (badge) parts.push(badge);
  else if (team) parts.push(team);

  if (!input.isLocal) parts.push(String(input.handCount));
  if (input.isDealer) parts.push('D');

  return {
    labelText: parts.join(' · '),
    shortName,
    showActiveRing: input.showActiveHighlight,
    showDealerMark: input.isDealer
  };
}
