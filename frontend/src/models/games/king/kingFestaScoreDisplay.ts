import {
  FESTA_POSITIVE_TRICK,
  settleNegativeFesta,
  settleNullAuctionFesta,
  settlePositiveAuctionRound
} from './kingScoring';

/** Canonical mid-round / presentation score for unsold nulls: 325 − 75×tricks. */
export function nullFestaRunningScore(tricksWon: number): number {
  return 325 - 75 * tricksWon;
}

/** Base accounting at start of a null festa (optional sold transfer already applied). */
export function nullFestaStartScores(
  beneficiaryIndex: number | null,
  bidderIndex: number | null,
  nullAmount: number | null
): number[] {
  if (
    beneficiaryIndex !== null &&
    bidderIndex !== null &&
    nullAmount !== null &&
    nullAmount > 0
  ) {
    return settleNullAuctionFesta([0, 0, 0, 0], beneficiaryIndex, bidderIndex, nullAmount);
  }
  return settleNegativeFesta([0, 0, 0, 0]);
}

export interface PositiveFestaPlayerBreakdown {
  playerIndex: number;
  trickPts: number;
  contractPts: number;
  total: number;
}

/** Presentation parts for a positive festa — mirrors settlePositiveAuctionRound. */
export function positiveFestaPlayerBreakdowns(
  tricksWon: number[],
  offeredTricks: number | null,
  beneficiaryIndex: number | null,
  bidderIndex: number | null
): PositiveFestaPlayerBreakdown[] {
  const hasTransfer =
    offeredTricks !== null &&
    offeredTricks > 0 &&
    beneficiaryIndex !== null &&
    bidderIndex !== null;

  const totals = hasTransfer
    ? settlePositiveAuctionRound(
        offeredTricks!,
        tricksWon,
        beneficiaryIndex!,
        bidderIndex!
      )
    : tricksWon.map((t) => t * FESTA_POSITIVE_TRICK);

  const transfer = hasTransfer ? offeredTricks! * FESTA_POSITIVE_TRICK : 0;

  return tricksWon.map((t, i) => {
    const trickPts = t * FESTA_POSITIVE_TRICK;
    let contractPts = 0;
    if (hasTransfer) {
      if (i === beneficiaryIndex) contractPts = transfer;
      else if (i === bidderIndex) contractPts = -transfer;
    }
    return {
      playerIndex: i,
      trickPts,
      contractPts,
      total: totals[i]
    };
  });
}

export function formatPositiveFestaBreakdownLine(
  part: PositiveFestaPlayerBreakdown,
  locale: 'pt' | 'en' = 'pt'
): string {
  const label = locale === 'pt' ? `J${part.playerIndex + 1}` : `P${part.playerIndex + 1}`;
  const fmt = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
  if (part.contractPts === 0) {
    return locale === 'pt'
      ? `${label}: vazas ${fmt(part.trickPts)} · total ${fmt(part.total)}`
      : `${label}: tricks ${fmt(part.trickPts)} · total ${fmt(part.total)}`;
  }
  return locale === 'pt'
    ? `${label}: vazas ${fmt(part.trickPts)} · contrato ${fmt(part.contractPts)} · total ${fmt(part.total)}`
    : `${label}: tricks ${fmt(part.trickPts)} · contract ${fmt(part.contractPts)} · total ${fmt(part.total)}`;
}

export interface NullFestaPlayerBreakdown {
  playerIndex: number;
  tricks: number;
  trickPts: number;
  contractPts: number;
  total: number;
}

/** Presentation parts for a null festa — mirrors settleNegativeFesta / settleNullAuctionFesta. */
export function nullFestaPlayerBreakdowns(
  tricksWon: number[],
  nullAmount: number | null,
  beneficiaryIndex: number | null,
  bidderIndex: number | null
): NullFestaPlayerBreakdown[] {
  const hasTransfer =
    nullAmount !== null &&
    nullAmount > 0 &&
    beneficiaryIndex !== null &&
    bidderIndex !== null;

  const totals = hasTransfer
    ? settleNullAuctionFesta(tricksWon, beneficiaryIndex!, bidderIndex!, nullAmount!)
    : settleNegativeFesta(tricksWon);

  const transfer = hasTransfer ? nullAmount! * 75 : 0;

  return tricksWon.map((t, i) => {
    const trickPts = nullFestaRunningScore(t);
    let contractPts = 0;
    if (hasTransfer) {
      if (i === beneficiaryIndex) contractPts = transfer;
      else if (i === bidderIndex) contractPts = -transfer;
    }
    return {
      playerIndex: i,
      tricks: t,
      trickPts,
      contractPts,
      total: totals[i]
    };
  });
}

export function formatNullFestaBreakdownLine(
  part: NullFestaPlayerBreakdown,
  locale: 'pt' | 'en' = 'pt'
): string {
  const label = locale === 'pt' ? `J${part.playerIndex + 1}` : `P${part.playerIndex + 1}`;
  const fmt = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
  if (part.contractPts === 0) {
    return locale === 'pt'
      ? `${label}: ${part.tricks} vaza(s) · base ${fmt(part.trickPts)} · total ${fmt(part.total)}`
      : `${label}: ${part.tricks} trick(s) · base ${fmt(part.trickPts)} · total ${fmt(part.total)}`;
  }
  return locale === 'pt'
    ? `${label}: ${part.tricks} vaza(s) · base ${fmt(part.trickPts)} · contrato ${fmt(part.contractPts)} · total ${fmt(part.total)}`
    : `${label}: ${part.tricks} trick(s) · base ${fmt(part.trickPts)} · contract ${fmt(part.contractPts)} · total ${fmt(part.total)}`;
}
