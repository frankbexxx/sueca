import { Card } from '../../../types/game';
import {
  countHearts,
  countMen,
  countQueens,
  hasKingHearts,
  heartsInTrick,
  kingHeartsInTrick,
  menInTrick,
  queensInTrick
} from './kingScoring';
import {
  emptyBreakdown,
  KingRoundBreakdown
} from './kingBreakdown';
import {
  KingActiveContract,
  KingFestaMode,
  KingNegativeContract,
  kingContractLabel
} from './kingContracts';
import { formatBid } from './kingAuction';
import {
  formatNullFestaBreakdownLine,
  formatPositiveFestaBreakdownLine,
  nullFestaPlayerBreakdowns,
  positiveFestaPlayerBreakdowns
} from './kingFestaScoreDisplay';

export function initBreakdownForRound(
  gameIndex: number,
  contract: KingNegativeContract | null,
  festaMode: KingFestaMode | null,
  activeContract: KingActiveContract | null,
  locale: 'pt' | 'en' = 'pt'
): KingRoundBreakdown {
  const b = emptyBreakdown();
  b.festaMode = festaMode;
  if (gameIndex < 6 && contract) {
    b.contractLabel = kingContractLabel(contract, locale);
  } else if (activeContract) {
    b.contractLabel =
      locale === 'pt'
        ? `Contrato: ${formatBid(
            {
              bidderIndex: activeContract.bidderIndex,
              bidType: activeContract.bidType,
              amount: activeContract.amount
            },
            locale
          )}`
        : `Contract: ${formatBid(
            {
              bidderIndex: activeContract.bidderIndex,
              bidType: activeContract.bidType,
              amount: activeContract.amount
            },
            locale
          )}`;
  } else if (festaMode === 'negative_festa') {
    b.contractLabel = locale === 'pt' ? 'Nulos' : 'Nulls';
  } else if (festaMode === 'positive') {
    b.contractLabel = locale === 'pt' ? 'Positivo' : 'Positive';
  }
  return b;
}

export function accumulateTrickBreakdown(
  breakdown: KingRoundBreakdown,
  contract: KingNegativeContract | null,
  trick: Card[],
  trickNumber: number,
  winner: number
): void {
  breakdown.tricksWon[winner] += 1;

  if (!contract) return;

  if (contract === 'no_hearts' || contract === 'no_king_hearts') {
    breakdown.heartsTaken[winner] += countHearts(trick);
    if (contract === 'no_hearts') {
      breakdown.penaltyCardsTaken[winner].push(...heartsInTrick(trick));
    }
  }
  if (contract === 'no_queens') {
    breakdown.queensTaken[winner] += countQueens(trick);
    breakdown.penaltyCardsTaken[winner].push(...queensInTrick(trick));
  }
  if (contract === 'no_men') {
    breakdown.menTaken[winner] += countMen(trick);
    breakdown.penaltyCardsTaken[winner].push(...menInTrick(trick));
  }
  if (contract === 'no_king_hearts' && hasKingHearts(trick)) {
    breakdown.kingTakenBy = winner;
    breakdown.penaltyCardsTaken[winner].push(...kingHeartsInTrick(trick));
  }
  if (contract === 'no_last_two' && trickNumber >= 12) {
    breakdown.lastTwoWinners.push(winner);
  }
}

export function accumulateFestaTrickBreakdown(
  breakdown: KingRoundBreakdown,
  trick: Card[],
  winner: number
): void {
  breakdown.tricksWon[winner] += 1;
  breakdown.heartsTaken[winner] += countHearts(trick);
  breakdown.queensTaken[winner] += countQueens(trick);
  breakdown.menTaken[winner] += countMen(trick);
  if (hasKingHearts(trick)) breakdown.kingTakenBy = winner;
}

export function buildBreakdownLines(
  breakdown: KingRoundBreakdown,
  contract: KingNegativeContract | null,
  locale: 'pt' | 'en'
): string[] {
  const lines: string[] = [];
  if (breakdown.contractLabel) lines.push(breakdown.contractLabel);

  if (contract === 'no_tricks') {
    breakdown.tricksWon.forEach((t, i) => {
      if (t > 0) {
        lines.push(
          locale === 'pt'
            ? `J${i + 1}: ${t} vaza(s) (−${t * 20})`
            : `P${i + 1}: ${t} trick(s) (−${t * 20})`
        );
      }
    });
  }
  if (contract === 'no_hearts') {
    breakdown.heartsTaken.forEach((h, i) => {
      if (h > 0) lines.push(locale === 'pt' ? `J${i + 1}: ${h} copa(s)` : `P${i + 1}: ${h} heart(s)`);
    });
  }
  if (contract === 'no_queens') {
    breakdown.queensTaken.forEach((q, i) => {
      if (q > 0) lines.push(locale === 'pt' ? `J${i + 1}: ${q} dama(s)` : `P${i + 1}: ${q} queen(s)`);
    });
  }
  if (contract === 'no_men') {
    breakdown.menTaken.forEach((m, i) => {
      if (m > 0) lines.push(locale === 'pt' ? `J${i + 1}: ${m} homem(ns)` : `P${i + 1}: ${m} men`);
    });
  }
  if (contract === 'no_king_hearts' && breakdown.kingTakenBy !== null) {
    lines.push(
      locale === 'pt'
        ? `K♥ para J${breakdown.kingTakenBy + 1}`
        : `K♥ to P${breakdown.kingTakenBy + 1}`
    );
  }
  if (contract === 'no_last_two' && breakdown.lastTwoWinners.length) {
    lines.push(
      locale === 'pt'
        ? `Últimas vazas: ${breakdown.lastTwoWinners.map((p) => `J${p + 1}`).join(', ')}`
        : `Last tricks: ${breakdown.lastTwoWinners.map((p) => `P${p + 1}`).join(', ')}`
    );
  }

  if (breakdown.festaMode === 'positive') {
    const transfer = breakdown.positiveTransfer;
    const parts = positiveFestaPlayerBreakdowns(
      breakdown.tricksWon,
      transfer?.amount ?? null,
      transfer?.beneficiary ?? null,
      transfer?.bidder ?? null
    );
    parts.forEach((part) => {
      if (part.trickPts !== 0 || part.contractPts !== 0) {
        lines.push(formatPositiveFestaBreakdownLine(part, locale));
      }
    });
  }
  if (breakdown.festaMode === 'negative_festa') {
    const transfer = breakdown.nullTransfer;
    const parts = nullFestaPlayerBreakdowns(
      breakdown.tricksWon,
      transfer?.amount ?? null,
      transfer?.beneficiary ?? null,
      transfer?.bidder ?? null
    );
    parts.forEach((part) => {
      lines.push(formatNullFestaBreakdownLine(part, locale));
    });
  }

  return lines;
}

export function nullAuctionStartNote(
  beneficiaryIndex: number,
  bidderIndex: number,
  nullAmount: number,
  locale: 'pt' | 'en'
): string {
  const transfer = nullAmount * 75;
  const benStart = 325 + transfer;
  const bidStart = 325 - transfer;
  return locale === 'pt'
    ? `Arranque nulos: J${beneficiaryIndex + 1} +${benStart} · J${bidderIndex + 1} +${bidStart} · restantes +325`
    : `Null start: P${beneficiaryIndex + 1} +${benStart} · P${bidderIndex + 1} +${bidStart} · others +325`;
}
