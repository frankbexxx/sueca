import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AccessibleLocalHand,
  formatAccessibleHandCardName
} from './AccessibleLocalHand';
import type { Card } from '../types/game';
import {
  handleDomCardPhysicalActivation,
  resolveDomHandIntent
} from '../table/canonicalCardActions';

const here = dirname(fileURLToPath(import.meta.url));

function card(rank: Card['rank'], suit: Card['suit'], id: string): Card {
  return { rank, suit, id };
}

const HAND: Card[] = [
  card('A', 'clubs', 'cA'),
  card('K', 'hearts', 'hK'),
  card('2', 'spades', 's2')
];

describe('formatAccessibleHandCardName', () => {
  it('preserves PlayerHand English terminology (no general localized hand utility)', () => {
    expect(formatAccessibleHandCardName({ rank: 'A', suit: 'hearts' })).toBe('A of hearts');
  });
});

describe('AccessibleLocalHand', () => {
  it('renders list + one control per card in hand order', () => {
    render(
      <AccessibleLocalHand
        cards={HAND}
        selectedCard={null}
        canPlayCard={() => true}
        onCardActivate={() => undefined}
      />
    );
    const root = screen.getByTestId('accessible-local-hand');
    expect(root.getAttribute('role')).toBe('region');
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveAttribute('aria-label', 'A of clubs');
    expect(buttons[1]).toHaveAttribute('aria-label', 'K of hearts');
    expect(buttons[2]).toHaveAttribute('aria-label', '2 of spades');
  });

  it('marks only actionable cards as tabbable; illegal are not executable', () => {
    render(
      <AccessibleLocalHand
        cards={HAND}
        selectedCard={null}
        canPlayCard={(i) => i === 1}
        onCardActivate={() => undefined}
      />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('tabIndex', '-1');
    expect(buttons[0]).toHaveAttribute('aria-disabled', 'true');
    expect(buttons[1]).toHaveAttribute('tabIndex', '0');
    expect(buttons[1]).toHaveAttribute('aria-disabled', 'false');
    expect(buttons[2]).toHaveAttribute('tabIndex', '-1');
  });

  it('exposes selectedCard via aria-pressed', () => {
    render(
      <AccessibleLocalHand
        cards={HAND}
        selectedCard={0}
        canPlayCard={() => true}
        onCardActivate={() => undefined}
      />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'false');
  });

  it('Hearts pass: aria-pressed reflects pass selection', () => {
    render(
      <AccessibleLocalHand
        cards={HAND}
        selectedCard={null}
        selectedPassIndices={[2]}
        canPlayCard={() => true}
        onCardActivate={() => undefined}
      />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'false');
    expect(buttons[2]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[2]).toHaveAttribute('data-pass-selected', 'true');
  });

  it('Enter and Space both invoke onCardActivate once (no double fire from key)', () => {
    const onCardActivate = vi.fn();
    render(
      <AccessibleLocalHand
        cards={HAND}
        selectedCard={null}
        canPlayCard={() => true}
        onCardActivate={onCardActivate}
      />
    );
    const btn = screen.getByTestId('accessible-hand-card-0');
    fireEvent.keyDown(btn, { key: 'Enter' });
    fireEvent.keyDown(btn, { key: ' ' });
    expect(onCardActivate).toHaveBeenCalledTimes(2);
    expect(onCardActivate).toHaveBeenNthCalledWith(1, 0);
    expect(onCardActivate).toHaveBeenNthCalledWith(2, 0);
  });

  it('does not activate illegal cards', () => {
    const onCardActivate = vi.fn();
    render(
      <AccessibleLocalHand
        cards={HAND}
        selectedCard={null}
        canPlayCard={() => false}
        onCardActivate={onCardActivate}
      />
    );
    fireEvent.keyDown(screen.getByTestId('accessible-hand-card-0'), { key: 'Enter' });
    expect(onCardActivate).not.toHaveBeenCalled();
  });

  it('keyboard path matches DOM/canonical select then activate intents', () => {
    expect(resolveDomHandIntent(0, null, false)).toEqual({ type: 'selectCard', cardIndex: 0 });
    expect(resolveDomHandIntent(0, 0, false)).toEqual({ type: 'activateCard', cardIndex: 0 });
    expect(resolveDomHandIntent(1, 0, true)).toEqual({
      type: 'togglePassSelection',
      cardIndex: 1
    });
    expect(typeof handleDomCardPhysicalActivation).toBe('function');
  });

  it('after focused card is removed, focuses next actionable card', () => {
    const onCardActivate = vi.fn();
    const { rerender } = render(
      <AccessibleLocalHand
        cards={HAND}
        selectedCard={null}
        canPlayCard={() => true}
        onCardActivate={onCardActivate}
      />
    );
    const first = screen.getByTestId('accessible-hand-card-0');
    act(() => {
      first.focus();
    });
    expect(document.activeElement).toBe(first);

    const remaining = HAND.slice(1);
    rerender(
      <AccessibleLocalHand
        cards={remaining}
        selectedCard={null}
        canPlayCard={() => true}
        onCardActivate={onCardActivate}
      />
    );

    expect(document.activeElement).toBe(screen.getByTestId('accessible-hand-card-0'));
    expect(document.activeElement).toHaveAttribute('aria-label', 'K of hearts');
  });

  it('after last actionable card removed, focuses semantic hand root', () => {
    const single = [HAND[0]];
    const { rerender } = render(
      <AccessibleLocalHand
        cards={single}
        selectedCard={null}
        canPlayCard={() => true}
        onCardActivate={() => undefined}
      />
    );
    act(() => {
      screen.getByTestId('accessible-hand-card-0').focus();
    });
    rerender(
      <AccessibleLocalHand
        cards={[]}
        selectedCard={null}
        canPlayCard={() => true}
        onCardActivate={() => undefined}
      />
    );
    expect(document.activeElement).toBe(screen.getByTestId('accessible-local-hand'));
  });

  it('module has no Phaser imports', () => {
    const source = readFileSync(join(here, 'AccessibleLocalHand.tsx'), 'utf8');
    const code = source
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('*') && !line.trimStart().startsWith('//'))
      .join('\n');
    expect(code).not.toMatch(/from\s+['"]phaser['"]/);
    expect(code).not.toMatch(/renderers\/phaser/);
    expect(code).not.toMatch(/SuecaTableScene|SuecaPhaserRenderer/);
    expect(code).not.toMatch(/sceneGeometry|SceneGeometry/);
  });
});
