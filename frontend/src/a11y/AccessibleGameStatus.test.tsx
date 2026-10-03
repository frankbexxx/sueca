import React from 'react';
import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AccessibleGameStatus } from './AccessibleGameStatus';
import type {
  TableSeatRenderModel,
  TableTrickCardRenderModel
} from '../table/tableRenderModel';
import type { Card } from '../types/game';

const here = dirname(fileURLToPath(import.meta.url));

function card(rank: Card['rank'], suit: Card['suit'], id: string): Card {
  return { rank, suit, id };
}

function seats(active: number | null = 0): TableSeatRenderModel[] {
  return [0, 1, 2, 3].map((index) => ({
    index,
    name: `P${index + 1}`,
    team: (index % 2 === 0 ? 1 : 2) as 1 | 2,
    isLocal: index === 0,
    isActive: active === index,
    isDealer: index === 1,
    isTrickLeader: index === 2,
    handCount: 10
  }));
}

function trick(
  entries: Array<{ rank: Card['rank']; suit: Card['suit']; playerIndex: number }>
): TableTrickCardRenderModel[] {
  return entries.map((e, orderIndex) => ({
    card: card(e.rank, e.suit, `${e.suit}_${e.rank}_${orderIndex}`),
    playerIndex: e.playerIndex,
    orderIndex
  }));
}

describe('AccessibleGameStatus', () => {
  it('exposes four semantic seats with local, dealer, and active markers', () => {
    render(
      <AccessibleGameStatus
        seats={seats(0)}
        localPlayerIndex={0}
        activeSeat={0}
        currentTrick={[]}
        lastTrickWinner={null}
      />
    );
    const items = screen.getByTestId('accessible-game-seats').querySelectorAll('[role=listitem]');
    expect(items).toHaveLength(4);
    expect(screen.getByTestId('accessible-seat-0').getAttribute('data-local')).toBe('true');
    expect(screen.getByTestId('accessible-seat-0').getAttribute('data-active')).toBe('true');
    expect(screen.getByTestId('accessible-seat-0').getAttribute('aria-current')).toBe('true');
    expect(screen.getByTestId('accessible-seat-1').getAttribute('data-dealer')).toBe('true');
    expect(screen.getByTestId('accessible-seat-0').textContent).toMatch(/you/);
    expect(screen.getByTestId('accessible-seat-0').textContent).toMatch(/current turn/);
    expect(screen.getByTestId('accessible-seat-1').textContent).toMatch(/dealer/);
  });

  it('lists current trick cards with authoritative player association and order', () => {
    render(
      <AccessibleGameStatus
        seats={seats(1)}
        localPlayerIndex={0}
        activeSeat={1}
        currentTrick={trick([
          { rank: 'A', suit: 'hearts', playerIndex: 2 },
          { rank: '3', suit: 'hearts', playerIndex: 3 }
        ])}
        lastTrickWinner={null}
      />
    );
    expect(screen.getByTestId('accessible-trick-card-0').textContent).toBe(
      '1. P3: A of hearts'
    );
    expect(screen.getByTestId('accessible-trick-card-0').getAttribute('data-player-index')).toBe(
      '2'
    );
    expect(screen.getByTestId('accessible-trick-card-1').textContent).toBe(
      '2. P4: 3 of hearts'
    );
  });

  it('announces turn change once; unrelated rerender does not repeat', () => {
    const { rerender } = render(
      <AccessibleGameStatus
        seats={seats(0)}
        localPlayerIndex={0}
        activeSeat={0}
        currentTrick={[]}
        lastTrickWinner={null}
      />
    );
    expect(screen.getByTestId('accessible-game-live').textContent).toBe('');

    rerender(
      <AccessibleGameStatus
        seats={seats(1)}
        localPlayerIndex={0}
        activeSeat={1}
        currentTrick={[]}
        lastTrickWinner={null}
      />
    );
    expect(screen.getByTestId('accessible-game-live').textContent).toBe("P2's turn");

    rerender(
      <AccessibleGameStatus
        seats={seats(1)}
        localPlayerIndex={0}
        activeSeat={1}
        currentTrick={[]}
        lastTrickWinner={null}
      />
    );
    expect(screen.getByTestId('accessible-game-live').textContent).toBe("P2's turn");
  });

  it('announces a new trick card when turn seat is unchanged', () => {
    const first = trick([{ rank: 'A', suit: 'clubs', playerIndex: 0 }]);
    const { rerender } = render(
      <AccessibleGameStatus
        seats={seats(null)}
        localPlayerIndex={0}
        activeSeat={null}
        currentTrick={first}
        lastTrickWinner={null}
      />
    );
    rerender(
      <AccessibleGameStatus
        seats={seats(null)}
        localPlayerIndex={0}
        activeSeat={null}
        currentTrick={trick([
          { rank: 'A', suit: 'clubs', playerIndex: 0 },
          { rank: 'K', suit: 'clubs', playerIndex: 1 }
        ])}
        lastTrickWinner={null}
      />
    );
    expect(screen.getByTestId('accessible-game-live').textContent).toBe('P2 played K of clubs');
  });

  it('announces trick winner once when authoritative winner changes', () => {
    const { rerender } = render(
      <AccessibleGameStatus
        seats={seats(0)}
        localPlayerIndex={0}
        activeSeat={0}
        currentTrick={trick([
          { rank: 'A', suit: 'spades', playerIndex: 0 },
          { rank: '2', suit: 'spades', playerIndex: 1 },
          { rank: '3', suit: 'spades', playerIndex: 2 },
          { rank: '4', suit: 'spades', playerIndex: 3 }
        ])}
        lastTrickWinner={null}
      />
    );
    rerender(
      <AccessibleGameStatus
        seats={seats(0)}
        localPlayerIndex={0}
        activeSeat={0}
        currentTrick={trick([
          { rank: 'A', suit: 'spades', playerIndex: 0 },
          { rank: '2', suit: 'spades', playerIndex: 1 },
          { rank: '3', suit: 'spades', playerIndex: 2 },
          { rank: '4', suit: 'spades', playerIndex: 3 }
        ])}
        lastTrickWinner={2}
      />
    );
    expect(screen.getByTestId('accessible-game-live').textContent).toBe('P3 won the trick');

    rerender(
      <AccessibleGameStatus
        seats={seats(0)}
        localPlayerIndex={0}
        activeSeat={0}
        currentTrick={trick([
          { rank: 'A', suit: 'spades', playerIndex: 0 },
          { rank: '2', suit: 'spades', playerIndex: 1 },
          { rank: '3', suit: 'spades', playerIndex: 2 },
          { rank: '4', suit: 'spades', playerIndex: 3 }
        ])}
        lastTrickWinner={2}
      />
    );
    expect(screen.getByTestId('accessible-game-live').textContent).toBe('P3 won the trick');
  });

  it('module has no Phaser / geometry / rules-engine imports', () => {
    const source = readFileSync(join(here, 'AccessibleGameStatus.tsx'), 'utf8');
    const code = source
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('*') && !line.trimStart().startsWith('//'))
      .join('\n');
    expect(code).not.toMatch(/from\s+['"]phaser['"]/);
    expect(code).not.toMatch(/renderers\/phaser|SuecaTableScene|SuecaPhaserRenderer/);
    expect(code).not.toMatch(/sceneGeometry|SceneGeometry|calculateSceneGeometry/);
    expect(code).not.toMatch(/suecaRules|seatAtOffset|clockwiseSeatAtTrickOffset/);
    expect(code).not.toMatch(/GameAdapter|canPlayCard|playCardAndLogDecision/);
  });
});

describe('AccessibleGameStatus live region isolation', () => {
  it('does not announce on initial mount', () => {
    act(() => {
      render(
        <AccessibleGameStatus
          seats={seats(2)}
          localPlayerIndex={0}
          activeSeat={2}
          currentTrick={trick([{ rank: '7', suit: 'diamonds', playerIndex: 2 }])}
          lastTrickWinner={1}
        />
      );
    });
    expect(screen.getByTestId('accessible-game-live').textContent).toBe('');
  });
});
