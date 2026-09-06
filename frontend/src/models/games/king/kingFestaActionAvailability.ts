import { KingBid, KingFestaPhase } from './kingContracts';
import { canUseFourThreeThree } from './kingAuction';

/** Minimal King festa fields needed for UI availability (no rules recompute). */
export interface KingFestaUiState {
  festaPhase: KingFestaPhase;
  festaOwnerIndex: number;
  benefitOwnerIndex: number | null;
  auctionOrder: number[];
  auctionTurnIndex: number;
  bestBid: KingBid | null;
  requestedBid: KingBid | null;
  eightOrNullsPending: boolean;
  eightOrNullsTarget: number | null;
  waitingForFallback: boolean;
  waitingForFestaSetup: boolean;
}

export type KingFestaUiViewKind =
  | 'auction_turn'
  | 'auction_waiting'
  | 'eight_respond'
  | 'eight_waiting'
  | 'counter_owner_waiting'
  | 'counter_bidder'
  | 'negotiation_owner'
  | 'fallback_owner'
  | 'setup_owner'
  | 'spectator_waiting'
  | 'none';

export interface KingFestaActionAvailability {
  enabled: boolean;
  /** Short hint when disabled; omit when enabled or hidden. */
  disabledReason?: string;
}

export interface KingFallbackActionsAvailability {
  trump: KingFestaActionAvailability;
  noTrump: KingFestaActionAvailability;
  nulos: KingFestaActionAvailability;
  fourByThree: KingFestaActionAvailability;
}

export interface KingNegotiationOwnerActionsAvailability {
  accept: KingFestaActionAvailability;
  askMore: KingFestaActionAvailability;
  reject: KingFestaActionAvailability;
  eightOrNulls: KingFestaActionAvailability;
}

/**
 * Which festa sheet the local player should see.
 * Mirrors engine phase gates — presentation only.
 */
export function resolveKingFestaUiView(
  king: KingFestaUiState,
  localPlayerIndex: number
): KingFestaUiViewKind {
  const currentAuctionPlayer =
    king.festaPhase === 'auction' ? king.auctionOrder[king.auctionTurnIndex] : null;

  if (king.festaPhase === 'auction' && currentAuctionPlayer === localPlayerIndex) {
    return 'auction_turn';
  }
  if (king.festaPhase === 'auction') {
    return 'auction_waiting';
  }

  if (king.eightOrNullsPending) {
    if (king.eightOrNullsTarget === localPlayerIndex) return 'eight_respond';
    return 'eight_waiting';
  }

  if (king.festaPhase === 'negotiation_counter' && king.bestBid && king.requestedBid) {
    if (king.festaOwnerIndex === localPlayerIndex) return 'counter_owner_waiting';
    if (king.bestBid.bidderIndex === localPlayerIndex) return 'counter_bidder';
  }

  if (
    king.festaPhase === 'negotiation' &&
    !king.eightOrNullsPending &&
    king.festaOwnerIndex === localPlayerIndex &&
    king.bestBid
  ) {
    return 'negotiation_owner';
  }

  if (king.waitingForFallback && king.festaOwnerIndex === localPlayerIndex) {
    return 'fallback_owner';
  }

  if (
    king.waitingForFestaSetup &&
    (king.benefitOwnerIndex ?? king.festaOwnerIndex) === localPlayerIndex
  ) {
    return 'setup_owner';
  }

  if (
    king.festaPhase === 'negotiation' ||
    king.festaPhase === 'negotiation_counter' ||
    king.waitingForFallback ||
    king.waitingForFestaSetup ||
    king.eightOrNullsPending
  ) {
    return 'spectator_waiting';
  }

  return 'none';
}

export function fourByThreeDisabledReason(locale: 'pt' | 'en' = 'pt'): string {
  return locale === 'pt'
    ? 'Indisponível: a oferta não é fraca o suficiente.'
    : 'Unavailable: the bid is not weak enough.';
}

/** Fallback choices — uses engine canUseFourThreeThree only. */
export function resolveFallbackActionsAvailability(
  bestBid: KingBid | null,
  locale: 'pt' | 'en' = 'pt'
): KingFallbackActionsAvailability {
  const allow433 = canUseFourThreeThree(bestBid);
  return {
    trump: { enabled: true },
    noTrump: { enabled: true },
    nulos: { enabled: true },
    fourByThree: {
      enabled: allow433,
      disabledReason: allow433 ? undefined : fourByThreeDisabledReason(locale)
    }
  };
}

/**
 * Owner negotiation buttons.
 * When eight-or-nulls is pending, engine rejects these — keep disabled if mis-shown.
 */
export function resolveNegotiationOwnerActionsAvailability(
  eightOrNullsPending: boolean
): KingNegotiationOwnerActionsAvailability {
  const enabled = !eightOrNullsPending;
  const disabledReason = eightOrNullsPending
    ? 'A aguardar resposta a «8 ou nulos».'
    : undefined;
  const blocked: KingFestaActionAvailability = { enabled, disabledReason };
  return {
    accept: blocked,
    askMore: blocked,
    reject: blocked,
    eightOrNulls: blocked
  };
}

/** Setup must not show negotiation / fallback / eight-or-nulls actions. */
export function setupShowsNegotiationActions(view: KingFestaUiViewKind): boolean {
  return view === 'negotiation_owner';
}
