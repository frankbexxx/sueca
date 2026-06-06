import { EncodedDecisionState } from '../../encoder/types';

export function summarizeEncodedState(encoded?: EncodedDecisionState): Record<string, unknown> {
  if (!encoded) return {};
  const summary: Record<string, unknown> = {
    contractId: encoded.contractId ?? null,
  };
  const variant = encoded.variantEncoding;
  if ('mustPlayKingHeartsNow' in variant) {
    summary.mustPlayKingHeartsNow = variant.mustPlayKingHeartsNow;
  }
  if ('dangerousCardsInHand' in variant && variant.dangerousCardsInHand.length > 0) {
    summary.dangerousCardsInHand = variant.dangerousCardsInHand.length;
  }
  if ('canWinCheaply' in variant && variant.canWinCheaply !== null) {
    summary.canWinCheaply = variant.canWinCheaply;
  }
  if ('bidMet' in variant && variant.bidMet !== null) {
    summary.bidMet = variant.bidMet;
  }
  return summary;
}
