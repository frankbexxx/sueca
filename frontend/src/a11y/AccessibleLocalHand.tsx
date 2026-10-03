import React, { useLayoutEffect, useRef } from 'react';
import type { Card } from '../types/game';
import './accessibleLocalHand.css';

export interface AccessibleLocalHandProps {
  cards: readonly Card[];
  selectedCard: number | null;
  /** When provided, aria-pressed reflects Hearts pass selection instead of normal select. */
  selectedPassIndices?: readonly number[];
  canPlayCard: (cardIndex: number) => boolean;
  readOnly?: boolean;
  /**
   * Same physical activation entry as DOM PlayerHand / keyboard:
   * GameBoard wires this to handleDomCardPhysicalActivation (canonical contract).
   */
  onCardActivate: (cardIndex: number) => void;
  /** Optional region label for assistive tech. */
  label?: string;
}

/** Matches PlayerHand img alt terminology — no general localized hand utility exists. */
export function formatAccessibleHandCardName(card: Pick<Card, 'rank' | 'suit'>): string {
  return `${card.rank} of ${card.suit}`;
}

function isPassMode(selectedPassIndices: readonly number[] | undefined): boolean {
  return selectedPassIndices != null;
}

function resolveActionable(
  cardIndex: number,
  readOnly: boolean,
  canPlayCard: (cardIndex: number) => boolean
): boolean {
  return !readOnly && canPlayCard(cardIndex);
}

function nextActionableIndex(
  fromIndex: number,
  count: number,
  isActionable: (i: number) => boolean
): number | null {
  for (let i = fromIndex; i < count; i += 1) {
    if (isActionable(i)) return i;
  }
  for (let i = fromIndex - 1; i >= 0; i -= 1) {
    if (isActionable(i)) return i;
  }
  return null;
}

/**
 * Accessibility Step 1 — semantic React local hand for the Phaser path.
 * Visually hidden; keyboard + SR only. No Phaser / geometry / rules ownership.
 */
export const AccessibleLocalHand: React.FC<AccessibleLocalHandProps> = ({
  cards,
  selectedCard,
  selectedPassIndices,
  canPlayCard,
  readOnly = false,
  onCardActivate,
  label = 'Local hand'
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusedCardIdRef = useRef<string | null>(null);
  const prevCardIdsRef = useRef<string[]>([]);

  const passMode = isPassMode(selectedPassIndices);

  useLayoutEffect(() => {
    const ids = cards.map((c) => c.id);
    const focusedId = focusedCardIdRef.current;
    const prevIds = prevCardIdsRef.current;
    prevCardIdsRef.current = ids;

    if (!focusedId) return;
    if (ids.includes(focusedId)) {
      // Focused card still present — do not move focus for unrelated re-renders.
      return;
    }

    const active = document.activeElement;
    const root = rootRef.current;
    const focusWasInside =
      !!root &&
      !!active &&
      (active === root || root.contains(active));

    // Only restore when focus was on this hand (or lost with the removed control).
    if (!focusWasInside && active != null && active !== document.body) {
      return;
    }

    const removedAt = prevIds.indexOf(focusedId);
    const startAt = removedAt >= 0 ? removedAt : 0;
    const actionableAt = (i: number) => resolveActionable(i, readOnly, canPlayCard);
    const next = nextActionableIndex(startAt, cards.length, actionableAt);

    if (next != null) {
      const btn = buttonRefs.current[next];
      btn?.focus();
      focusedCardIdRef.current = cards[next]?.id ?? null;
      return;
    }

    root?.focus();
    focusedCardIdRef.current = null;
  }, [cards, readOnly, canPlayCard]);

  const activate = (cardIndex: number) => {
    if (!resolveActionable(cardIndex, readOnly, canPlayCard)) return;
    onCardActivate(cardIndex);
  };

  return (
    <div
      ref={rootRef}
      className="accessible-local-hand"
      data-testid="accessible-local-hand"
      role="region"
      aria-label={label}
      tabIndex={-1}
    >
      <ul className="accessible-local-hand__list" role="list">
        {cards.map((card, cardIndex) => {
          const actionable = resolveActionable(cardIndex, readOnly, canPlayCard);
          const isSelected = selectedCard === cardIndex;
          const isPassSelected = selectedPassIndices?.includes(cardIndex) ?? false;
          const pressed = passMode ? isPassSelected : isSelected;
          const name = formatAccessibleHandCardName(card);

          return (
            <li key={card.id} className="accessible-local-hand__item" role="listitem">
              <button
                type="button"
                ref={(el) => {
                  buttonRefs.current[cardIndex] = el;
                }}
                className="accessible-local-hand__card"
                data-testid={`accessible-hand-card-${cardIndex}`}
                data-card-index={cardIndex}
                data-pass-selected={isPassSelected ? 'true' : undefined}
                tabIndex={actionable ? 0 : -1}
                aria-disabled={!actionable}
                aria-pressed={pressed}
                aria-label={name}
                onFocus={() => {
                  focusedCardIdRef.current = card.id;
                }}
                onClick={() => activate(cardIndex)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activate(cardIndex);
                  }
                }}
              >
                {name}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
