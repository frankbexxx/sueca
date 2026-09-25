/**
 * Home Continue resume — App-level (REL-HOME-01: new games go through Setup, not silent start).
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { vi } from 'vitest';
import { GameVariant } from './types/game';
import { GameState } from './types/game';

vi.mock('./components/GameBoard', () => ({
  GameBoard: ({ config }: { config: { gameVariant: string } }) => (
    <div data-testid="game-board" data-variant={config.gameVariant} />
  )
}));

vi.mock('./components/LandingPage', () => ({
  LandingPage: ({ onStart }: { onStart: () => void }) => (
    <button type="button" data-testid="enter-shell" onClick={onStart}>
      Entrar
    </button>
  )
}));

vi.mock('./navigation/ShellRouter', () => ({
  ShellRouter: ({
    onContinue
  }: {
    onContinue: (variant: GameVariant) => void;
  }) => (
    <div data-testid="shell-home">
      <button type="button" data-testid="home-continue" onClick={() => onContinue('sueca')}>
        Continuar
      </button>
    </div>
  )
}));

vi.mock('./components/navigation/BottomNav', () => ({
  BottomNav: () => <nav data-testid="bottom-nav" />
}));

vi.mock('./services/audioService', () => ({
  playUiClick: vi.fn(),
  preloadMusic: vi.fn(),
  preloadSfx: vi.fn(),
  playMusic: vi.fn(),
  syncMusicToTheme: vi.fn(),
  applyMusicFromSettings: vi.fn()
}));

vi.mock('./navigation/useShellBrowserBack', () => ({
  bindCapacitorBackButton: () => Promise.resolve(() => undefined),
  useShellBrowserBack: () => ({ goBack: vi.fn() })
}));

vi.mock('./hooks/useCustomThemeCSS', () => ({
  useCustomThemeCSS: vi.fn()
}));

vi.mock('./services/multiplayerClient', () => ({
  endSession: vi.fn(async () => undefined)
}));

import App from './App';
import {
  buildSoloConfigForVariant,
  clearGameSession,
  loadGameSession,
  saveGameSession
} from './services/gameSessionStorage';

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

describe('App home continue resume (REL-HOME-01)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    localStorage.clear();
    localStorage.setItem('sueca-language', 'pt');
    clearGameSession();
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });

  function enterShell() {
    act(() => {
      ReactDOM.render(<App />, container);
    });
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="enter-shell"]')?.click();
    });
  }

  it('Continuar resumes saved session without Setup', () => {
    const config = buildSoloConfigForVariant('sueca');
    saveGameSession(config, minimalState());
    enterShell();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="home-continue"]')?.click();
    });
    expect(container.querySelector('[data-testid="game-board"]')).toBeTruthy();
    expect(loadGameSession('sueca')).toBeTruthy();
  });
});
