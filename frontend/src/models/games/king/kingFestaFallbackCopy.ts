import { KingFallbackReason } from './kingContracts';

/**
 * Resolve fallback reason for copy. Prefer engine-set reason; infer only for
 * legacy/incomplete state (never invents rules).
 */
export function resolveKingFallbackReason(
  reason: KingFallbackReason | null | undefined,
  bestBidPresent: boolean
): KingFallbackReason {
  if (reason) return reason;
  return bestBidPresent ? 'negotiation_failed' : 'no_bids';
}

export function kingFallbackReasonMessage(
  reason: KingFallbackReason,
  locale: 'pt' | 'en' = 'pt'
): string {
  const isPt = locale === 'pt';
  switch (reason) {
    case 'negotiation_failed':
      return isPt
        ? 'A negociação terminou sem acordo.'
        : 'Negotiation ended without agreement.';
    case 'eight_or_nulls_declined':
      return isPt
        ? 'O adversário não ofereceu 8. Manténs a festa.'
        : 'The opponent did not offer 8. You keep the festa.';
    case 'no_bids':
    default:
      return isPt
        ? 'Ninguém apresentou uma oferta.'
        : 'No one made an offer.';
  }
}

export function kingFallbackOptionsHint(
  allowFourByThree: boolean,
  locale: 'pt' | 'en' = 'pt'
): string {
  const isPt = locale === 'pt';
  if (allowFourByThree) {
    return isPt
      ? 'Escolhe trunfo, sem trunfo, nulos ou 4×3×3.'
      : 'Choose trump, no trump, nulls, or 4×3×3.';
  }
  return isPt
    ? 'Escolhe trunfo, sem trunfo ou nulos.'
    : 'Choose trump, no trump, or nulls.';
}

export function kingFallbackBody(
  reason: KingFallbackReason | null | undefined,
  bestBidPresent: boolean,
  allowFourByThree: boolean,
  locale: 'pt' | 'en' = 'pt'
): string {
  const resolved = resolveKingFallbackReason(reason, bestBidPresent);
  return `${kingFallbackReasonMessage(resolved, locale)} ${kingFallbackOptionsHint(
    allowFourByThree,
    locale
  )}`;
}
