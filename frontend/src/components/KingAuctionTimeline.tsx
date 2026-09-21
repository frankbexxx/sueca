import React, { useState } from 'react';
import {
  KingAuctionHistoryEntry,
  KingBid,
  KingFestaPhase
} from '../models/games/king/kingContracts';
import {
  formatAuctionHistoryChipValue,
  shortAuctionSeatLabel,
  shouldShowKingAuctionTimeline
} from '../models/games/king/kingAuctionHistory';

interface KingAuctionTimelineProps {
  history: KingAuctionHistoryEntry[];
  playerNames: string[];
  festaPhase: KingFestaPhase;
  bestBid: KingBid | null;
  /**
   * When true (default), chips start collapsed behind a disclosure control.
   * KING DENSITY — progressive disclosure.
   */
  defaultOpen?: boolean;
}

/**
 * Compact chronological auction chips for the festa bottom sheet.
 * Collapsed by default so primary auction controls stay dominant.
 */
export const KingAuctionTimeline: React.FC<KingAuctionTimelineProps> = ({
  history,
  playerNames,
  festaPhase,
  bestBid,
  defaultOpen = false
}) => {
  const [open, setOpen] = useState(defaultOpen);

  if (!shouldShowKingAuctionTimeline(festaPhase) || history.length === 0) {
    return null;
  }

  const highlightWinner =
    festaPhase === 'auction_result' ||
    festaPhase === 'negotiation' ||
    festaPhase === 'negotiation_counter';
  const winnerSeat = highlightWinner && bestBid ? bestBid.bidderIndex : null;
  const latestSequence = festaPhase === 'auction' ? history[history.length - 1]?.sequence : null;

  return (
    <div className="king-auction-history" data-testid="king-auction-history">
      <button
        type="button"
        className="sueca-btn sueca-btn--secondary sueca-btn--compact king-auction-history__toggle"
        data-testid="king-auction-history-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Histórico do leilão ({history.length})
      </button>
      {open ? (
        <div
          className="king-auction-timeline"
          role="list"
          aria-label="Histórico do leilão"
          data-testid="king-auction-timeline"
        >
          {history.map((entry, index) => {
            const isWinner =
              winnerSeat !== null && entry.seat === winnerSeat && entry.action === 'bid';
            const isLatest = latestSequence !== null && entry.sequence === latestSequence;
            const chipClass = [
              'king-auction-timeline__chip',
              isLatest ? 'king-auction-timeline__chip--latest' : '',
              isWinner ? 'king-auction-timeline__chip--winner' : ''
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <React.Fragment key={`${entry.sequence}-${entry.seat}`}>
                {index > 0 ? (
                  <span className="king-auction-timeline__sep" aria-hidden="true">
                    →
                  </span>
                ) : null}
                <span className={chipClass} role="listitem">
                  <span className="king-auction-timeline__seat">
                    {shortAuctionSeatLabel(playerNames[entry.seat], entry.seat)}
                  </span>
                  <span className="king-auction-timeline__dot" aria-hidden="true">
                    ·
                  </span>
                  <span className="king-auction-timeline__value">
                    {formatAuctionHistoryChipValue(entry)}
                  </span>
                  {isWinner ? (
                    <span className="king-auction-timeline__mark" title="Vencedor">
                      ✓
                    </span>
                  ) : null}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
