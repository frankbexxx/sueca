import {
  KingAuctionHistoryEntry,
  KingBid,
  KingFestaPhase
} from './kingContracts';

/** Timeline visible for beneficiary read-through of the auction. */
export function shouldShowKingAuctionTimeline(phase: KingFestaPhase): boolean {
  return (
    phase === 'auction' ||
    phase === 'auction_result' ||
    phase === 'negotiation' ||
    phase === 'negotiation_counter'
  );
}

export function appendKingAuctionHistory(
  history: KingAuctionHistoryEntry[],
  seat: number,
  action: 'bid' | 'pass',
  bid?: Pick<KingBid, 'amount' | 'bidType'>
): KingAuctionHistoryEntry[] {
  const sequence = history.length + 1;
  if (action === 'pass') {
    return [...history, { seat, action: 'pass', sequence }];
  }
  return [
    ...history,
    {
      seat,
      action: 'bid',
      amount: bid?.amount,
      bidType: bid?.bidType,
      sequence
    }
  ];
}

/** Compact chip label: `6`, `2N`, or `PASS`. */
export function formatAuctionHistoryChipValue(
  entry: KingAuctionHistoryEntry,
  locale: 'pt' | 'en' = 'pt'
): string {
  if (entry.action === 'pass') {
    return 'PASS';
  }
  const amount = entry.amount ?? 0;
  if (entry.bidType === 'null') {
    return locale === 'pt' ? `${amount}N` : `${amount}N`;
  }
  return String(amount);
}

export function shortAuctionSeatLabel(name: string | undefined, seat: number): string {
  const raw = (name ?? '').trim();
  const playerMatch = /^Player\s*(\d+)$/i.exec(raw);
  if (playerMatch) return `P${playerMatch[1]}`;
  if (/^P\d+$/i.test(raw)) return raw.toUpperCase();
  if (raw.length > 0 && raw.length <= 8) return raw;
  return `P${seat + 1}`;
}

export function buildDevAuctionHistoryFromActions(
  order: number[],
  actions: Partial<Record<number, KingBid | 'pass'>>
): KingAuctionHistoryEntry[] {
  let history: KingAuctionHistoryEntry[] = [];
  for (const seat of order) {
    const action = actions[seat];
    if (action === undefined) continue;
    if (action === 'pass') {
      history = appendKingAuctionHistory(history, seat, 'pass');
    } else {
      history = appendKingAuctionHistory(history, seat, 'bid', action);
    }
  }
  return history;
}
