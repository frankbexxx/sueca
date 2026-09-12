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
  /** Narrow portrait west/east — shorter labels, skip team when possible. */
  compactSide?: boolean;
  /**
   * UX-P3.4b — top seat: name + monogram + D only (team lives in HUD scores).
   * Local seat may still carry team for Sueca.
   */
  omitTeam?: boolean;
}

export interface SeatPresentation {
  /** Single-line seat chrome for the table. */
  labelText: string;
  shortName: string;
  /** Single-letter presence mark (no portrait). */
  monogram: string;
  showActiveRing: boolean;
  showDealerMark: boolean;
}

/** First letter / digit for seat presence marker. */
export function seatMonogram(name: string): string {
  const cleaned = (name || '').trim();
  if (!cleaned) return '?';
  const match = cleaned.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]/);
  return (match?.[0] ?? cleaned[0] ?? '?').toUpperCase();
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
 * Canonical seat line (UX-P3.2 / P3.4b): Name · [badge|team] · [D]
 * Card counts live in the global Vaza indicator — never on seats.
 * Compact side / top seat: drop team; local Sueca may keep team.
 */
export function computeSeatPresentation(input: SeatPresentationInput): SeatPresentation {
  const compact = Boolean(input.compactSide);
  const playerNum = input.name.match(/player\s*(\d+)/i);
  const shortName = compact && playerNum
    ? `P${playerNum[1]}`
    : truncatePlayerName(
        input.name,
        input.aspect === 'landscape' ? 6 : compact ? 5 : 9
      );
  const parts: string[] = [shortName];

  const badge = input.secondaryBadge?.trim() || null;
  const allowTeam = !badge && !compact && !input.omitTeam;
  const team = allowTeam ? shortTeamLabel(input.teamLabel) : null;
  if (badge) parts.push(badge);
  else if (team) parts.push(team);

  if (input.isDealer) parts.push('D');

  return {
    labelText: parts.join(compact ? ' ' : ' · '),
    shortName,
    monogram: playerNum ? playerNum[1] : seatMonogram(input.name),
    showActiveRing: input.showActiveHighlight,
    showDealerMark: input.isDealer
  };
}
