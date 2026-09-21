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
  /** Localized active-turn label (e.g. A JOGAR); only drawn when highlight is on. */
  activeTurnLabel?: string | null;
  aspect: PhaserAspectMode;
  /** Narrow portrait west/east — shorter name truncation. */
  compactSide?: boolean;
  /**
   * @deprecated UX polish: team never renders on seats (lives in HUD).
   * Kept for call-site compatibility.
   */
  omitTeam?: boolean;
}

export interface SeatPresentation {
  /** Single-line seat chrome for the table. */
  labelText: string;
  shortName: string;
  /**
   * Legacy monogram field — seats no longer draw numbered bubbles.
   * Kept empty so callers/tests can assert absence of seat numbering.
   */
  monogram: string;
  showActiveRing: boolean;
  showDealerMark: boolean;
  /** When true, Phaser must not draw a monogram circle. */
  showMonogram: boolean;
  /** GLOBAL-UI-03 cue text when this seat is active; null otherwise. */
  turnCueLabel: string | null;
}

/** First letter / digit for seat presence marker (unused on felt; kept for helpers). */
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
 * Canonical seat line: Name [· badge] [· D]
 * - No seat-number bubbles
 * - No team tokens on seats (HUD owns Nós/Eles)
 * - No pending “…” bid noise
 * - Card counts live in global Vaza indicator
 */
export function computeSeatPresentation(input: SeatPresentationInput): SeatPresentation {
  const compact = Boolean(input.compactSide);
  const maxLen =
    input.aspect === 'landscape' ? 8 : compact ? 9 : 10;
  const shortName = truncatePlayerName(input.name, maxLen);
  const parts: string[] = [shortName];

  const badge = input.secondaryBadge?.trim() || null;
  // Ignore placeholder / ellipsis pending markers.
  if (badge && badge !== '…' && badge !== '...') {
    parts.push(badge);
  }

  if (input.isDealer) parts.push('D');

  return {
    labelText: parts.join(' · '),
    shortName,
    monogram: '',
    showMonogram: false,
    showActiveRing: input.showActiveHighlight,
    showDealerMark: input.isDealer,
    turnCueLabel:
      input.showActiveHighlight && input.activeTurnLabel
        ? input.activeTurnLabel.trim() || null
        : null
  };
}
