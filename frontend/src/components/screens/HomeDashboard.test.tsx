/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeDashboard } from './HomeDashboard';
import {
  buildSoloConfigForVariant,
  clearGameSession,
  saveGameSession
} from '../../services/gameSessionStorage';
import type { GameState } from '../../types/game';

vi.mock('../../i18n/useLanguage', () => ({
  useLanguage: () => ({ language: 'pt', t: {} })
}));

function minimalState(): GameState {
  return {
    players: [],
    currentPlayerIndex: 0,
    dealerIndex: 0,
    trumpSuit: null,
    trumpCard: null,
    currentTrick: [],
    trickLeader: 0,
    scores: { team1: 0, team2: 0 },
    gameScore: { team1: 0, team2: 0 },
    completedPentes: [],
    round: 1,
    isGameOver: false,
    winner: null,
    lastTrickWinner: null,
    waitingForTrickEnd: false,
    nextTrickLeader: null,
    isFirstTrick: true,
    dealingMethod: 'A',
    dealingDirection: 'left',
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    playedCards: [],
    isPaused: false,
    playerName: 'P1',
    aiDifficulty: 'medium',
    partnerSignals: []
  };
}

describe('HomeDashboard (REL-HOME-01)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    localStorage.clear();
    clearGameSession();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  function renderHome(props?: Partial<React.ComponentProps<typeof HomeDashboard>>) {
    const onContinue = vi.fn();
    const onOpenSetup = vi.fn();
    const onOpenActivity = vi.fn();
    act(() => {
      root.render(
        <HomeDashboard
          onContinue={onContinue}
          onOpenSetup={onOpenSetup}
          onOpenActivity={onOpenActivity}
          {...props}
        />
      );
    });
    return { onContinue, onOpenSetup, onOpenActivity };
  }

  it('renders four game tiles and no stats dashboard', () => {
    renderHome();
    expect(container.querySelectorAll('.home-tile')).toHaveLength(4);
    expect(container.textContent).toContain('Sueca');
    expect(container.textContent).toContain('Spades');
    expect(container.textContent).toContain('Hearts');
    expect(container.textContent).toContain('King');
    expect(container.textContent).toContain('Jogar');
    expect(container.querySelector('.dashboard-stats-summary')).toBeNull();
    expect(container.textContent).not.toMatch(/Taxa de vitórias|Win rate/i);
  });

  it('hides Continue when no resumable session', () => {
    renderHome();
    expect(container.querySelector('.home-continue')).toBeNull();
  });

  it('shows Continue when a session exists', () => {
    saveGameSession(buildSoloConfigForVariant('sueca'), minimalState());
    renderHome();
    expect(container.querySelector('.home-continue')).toBeTruthy();
    expect(container.textContent).toMatch(/Continuar/);
  });

  it('Sueca / Hearts / Spades open Setup (not game)', () => {
    const { onOpenSetup } = renderHome();
    const tiles = Array.from(container.querySelectorAll<HTMLButtonElement>('.home-tile'));
    act(() => {
      tiles.find((t) => t.classList.contains('home-tile--sueca'))?.click();
    });
    expect(onOpenSetup).toHaveBeenCalledWith('sueca');
    act(() => {
      tiles.find((t) => t.classList.contains('home-tile--hearts'))?.click();
    });
    expect(onOpenSetup).toHaveBeenCalledWith('hearts');
    act(() => {
      tiles.find((t) => t.classList.contains('home-tile--spades'))?.click();
    });
    expect(onOpenSetup).toHaveBeenCalledWith('spades');
  });

  it('King opens mode sheet; options go to Setup with presets; Cancel closes', () => {
    const { onOpenSetup } = renderHome();
    act(() => {
      container.querySelector<HTMLButtonElement>('.home-tile--king')?.click();
    });
    expect(container.querySelector('.home-king-sheet')).toBeTruthy();
    expect(onOpenSetup).not.toHaveBeenCalled();

    act(() => {
      const options = Array.from(
        container.querySelectorAll<HTMLButtonElement>('.home-mode-option')
      );
      options[0]?.click();
    });
    expect(onOpenSetup).toHaveBeenCalledWith('king', 'king-pt-normal');
    expect(container.querySelector('.home-king-sheet')).toBeNull();

    act(() => {
      container.querySelector<HTMLButtonElement>('.home-tile--king')?.click();
    });
    act(() => {
      const options = Array.from(
        container.querySelectorAll<HTMLButtonElement>('.home-mode-option')
      );
      options[1]?.click();
    });
    expect(onOpenSetup).toHaveBeenCalledWith('king', 'king-pt-synthetic');

    act(() => {
      container.querySelector<HTMLButtonElement>('.home-tile--king')?.click();
    });
    act(() => {
      container.querySelector<HTMLButtonElement>('.home-sheet-cancel')?.click();
    });
    expect(container.querySelector('.home-king-sheet')).toBeNull();
  });

  it('Ver actividade opens Activity', () => {
    localStorage.setItem(
      'sueca-local-stats',
      JSON.stringify({
        gamesPlayed: 1,
        wins: 0,
        lastPlayedAt: Date.now(),
        lastPlayedVariant: 'sueca',
        byVariant: {
          sueca: { played: 1, wins: 0 },
          spades: { played: 0, wins: 0 },
          hearts: { played: 0, wins: 0 },
          king: { played: 0, wins: 0 }
        }
      })
    );
    const { onOpenActivity } = renderHome();
    act(() => {
      container.querySelector<HTMLButtonElement>('.home-last-link')?.click();
    });
    expect(onOpenActivity).toHaveBeenCalled();
  });
});
