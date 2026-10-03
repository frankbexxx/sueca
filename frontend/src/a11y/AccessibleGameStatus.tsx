import React, { useEffect, useRef, useState } from 'react';
import type {
  TableSeatRenderModel,
  TableTrickCardRenderModel
} from '../table/tableRenderModel';
import { getTablePositionForPlayer, type TableCompass } from '../utils/tableLayout';
import { formatAccessibleHandCardName } from './AccessibleLocalHand';
import './accessibleGameStatus.css';

export interface AccessibleGameStatusProps {
  seats: readonly TableSeatRenderModel[];
  localPlayerIndex: number;
  /** Engine seat with active turn highlight; null when none (pass/festa suppress, etc.). */
  activeSeat: number | null;
  /** Authoritative trick entries from TableRenderModel (card + playerIndex + order). */
  currentTrick: readonly TableTrickCardRenderModel[];
  /** Engine lastTrickWinner — presentation SoT while waiting / after complete. */
  lastTrickWinner: number | null;
}

const COMPASS_ORDER: readonly TableCompass[] = ['north', 'west', 'east', 'south'];

function playerName(
  seats: readonly TableSeatRenderModel[],
  index: number | null | undefined
): string | null {
  if (index == null || index < 0) return null;
  return seats.find((s) => s.index === index)?.name ?? null;
}

function seatLine(seat: TableSeatRenderModel, compass: TableCompass): string {
  const parts = [seat.name, compass];
  if (seat.isLocal) parts.push('you');
  if (seat.isDealer) parts.push('dealer');
  if (seat.isActive) parts.push('current turn');
  if (seat.isTrickLeader) parts.push('trick leader');
  return parts.join(', ');
}

/**
 * Accessibility Step 2 — semantic seats / trick / turn status for the Phaser path.
 * Consumes TableRenderModel fields only — no rules engine, Phaser, or geometry.
 */
export const AccessibleGameStatus: React.FC<AccessibleGameStatusProps> = ({
  seats,
  localPlayerIndex,
  activeSeat,
  currentTrick,
  lastTrickWinner
}) => {
  const [liveMessage, setLiveMessage] = useState('');
  const prevActiveRef = useRef<number | null | undefined>(undefined);
  const prevTrickLenRef = useRef<number | undefined>(undefined);
  const prevWinnerRef = useRef<number | null | undefined>(undefined);

  const seatsByCompass = COMPASS_ORDER.map((compass) => {
    const index = seats.find(
      (s) => getTablePositionForPlayer(s.index, localPlayerIndex) === compass
    );
    return { compass, seat: index ?? null };
  }).filter((entry): entry is { compass: TableCompass; seat: TableSeatRenderModel } =>
    Boolean(entry.seat)
  );

  useEffect(() => {
    const prev = prevActiveRef.current;
    if (prev !== undefined && activeSeat != null && activeSeat !== prev) {
      const name = playerName(seats, activeSeat);
      if (name) setLiveMessage(`${name}'s turn`);
    }
    prevActiveRef.current = activeSeat;
  }, [activeSeat, seats]);

  useEffect(() => {
    const prevLen = prevTrickLenRef.current;
    const len = currentTrick.length;
    if (prevLen !== undefined && len > prevLen) {
      const entry = currentTrick[len - 1];
      if (entry) {
        const name = playerName(seats, entry.playerIndex) ?? 'Player';
        const cardName = formatAccessibleHandCardName(entry.card);
        setLiveMessage(`${name} played ${cardName}`);
      }
    }
    prevTrickLenRef.current = len;
  }, [currentTrick, seats]);

  useEffect(() => {
    const prev = prevWinnerRef.current;
    if (prev !== undefined && lastTrickWinner != null && lastTrickWinner !== prev) {
      const name = playerName(seats, lastTrickWinner);
      if (name) setLiveMessage(`${name} won the trick`);
    }
    prevWinnerRef.current = lastTrickWinner;
  }, [lastTrickWinner, seats]);

  return (
    <div
      className="accessible-game-status"
      data-testid="accessible-game-status"
      role="region"
      aria-label="Game status"
    >
      <ul
        className="accessible-game-status__list"
        role="list"
        aria-label="Players"
        data-testid="accessible-game-seats"
      >
        {seatsByCompass.map(({ compass, seat }) => (
          <li
            key={seat.index}
            role="listitem"
            data-testid={`accessible-seat-${seat.index}`}
            data-compass={compass}
            data-seat-index={seat.index}
            data-active={seat.isActive ? 'true' : undefined}
            data-local={seat.isLocal ? 'true' : undefined}
            data-dealer={seat.isDealer ? 'true' : undefined}
            aria-current={seat.isActive ? 'true' : undefined}
          >
            {seatLine(seat, compass)}
          </li>
        ))}
      </ul>

      <ul
        className="accessible-game-status__list"
        role="list"
        aria-label="Current trick"
        data-testid="accessible-game-trick"
      >
        {currentTrick.length === 0 ? (
          <li role="listitem" data-testid="accessible-trick-empty">
            No cards in trick
          </li>
        ) : (
          currentTrick.map((entry) => {
            const name = playerName(seats, entry.playerIndex) ?? `Seat ${entry.playerIndex}`;
            const cardName = formatAccessibleHandCardName(entry.card);
            return (
              <li
                key={`${entry.card.id}-${entry.orderIndex}`}
                role="listitem"
                data-testid={`accessible-trick-card-${entry.orderIndex}`}
                data-player-index={entry.playerIndex}
                data-order-index={entry.orderIndex}
              >
                {`${entry.orderIndex + 1}. ${name}: ${cardName}`}
              </li>
            );
          })
        )}
      </ul>

      <p
        className="accessible-game-status__live"
        data-testid="accessible-game-live"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveMessage}
      </p>
    </div>
  );
};
