/**
 * GLOBAL-UI-03 — active player turn cue (DOM path).
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { PlayerInfoBox } from './PlayerInfoBox';
import type { GameState } from '../../types/game';

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    players: [
      { id: 'p0', name: 'Player 1', team: 1, hand: [] },
      { id: 'p1', name: 'Player 2', team: 2, hand: [] },
      { id: 'p2', name: 'Player 3', team: 1, hand: [] },
      { id: 'p3', name: 'Player 4', team: 2, hand: [] }
    ],
    currentPlayerIndex: 0,
    dealerIndex: 0,
    trickLeader: 0,
    currentTrick: [],
    scores: { team1: 0, team2: 0 },
    gameScore: { team1: 0, team2: 0 },
    round: 1,
    trickNumber: 1,
    trumpSuit: null,
    isPaused: false,
    isGameOver: false,
    waitingForTrickEnd: false,
    waitingForRoundEnd: false,
    waitingForRoundStart: false,
    waitingForGameStart: false,
    winner: null,
    ...overrides
  } as GameState;
}

describe('PlayerInfoBox active turn cue (GLOBAL-UI-03)', () => {
  let container: HTMLDivElement;

  afterEach(() => {
    if (container) {
      ReactDOM.unmountComponentAtNode(container);
      container.remove();
    }
  });

  function renderBox(isActiveTurn: boolean, compactSeats = false) {
    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      ReactDOM.render(
        <PlayerInfoBox
          gameState={baseState()}
          playerIndex={0}
          variant="sueca"
          usTeam={1}
          getTeamName={(t) => (t === 1 ? 'NÓS' : 'ELES')}
          isActiveTurn={isActiveTurn}
          compactSeats={compactSeats}
        />,
        container
      );
    });
  }

  it('shows A JOGAR cue only when active', () => {
    renderBox(true);
    const cues = container.querySelectorAll('[data-testid="active-turn-cue"]');
    expect(cues).toHaveLength(1);
    expect(cues[0].textContent).toMatch(/A JOGAR/i);
    expect(cues[0].querySelector('.turn-now-dot')).toBeTruthy();
    expect(container.querySelector('.player-info--active')).toBeTruthy();
    expect(container.querySelector('[data-active-turn="true"]')).toBeTruthy();
  });

  it('hides cue when inactive', () => {
    renderBox(false);
    expect(container.querySelector('[data-testid="active-turn-cue"]')).toBeNull();
    expect(container.querySelector('.player-info--active')).toBeNull();
  });

  it('suppresses cue under compact seats (Hearts pass)', () => {
    renderBox(true, true);
    expect(container.querySelector('[data-testid="active-turn-cue"]')).toBeNull();
  });
});
