import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { InGameBar } from './InGameBar';

describe('InGameBar confirm gates', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    localStorage.setItem('sueca-language', 'pt');
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });

  function renderBar(overrides: Partial<React.ComponentProps<typeof InGameBar>> = {}) {
    const props: React.ComponentProps<typeof InGameBar> = {
      playerName: 'P1',
      gameLabel: 'Sueca',
      isPaused: false,
      onPause: jest.fn(),
      onResume: jest.fn(),
      onNewGame: jest.fn(),
      onExit: jest.fn(),
      ...overrides
    };
    act(() => {
      ReactDOM.render(<InGameBar {...props} />, container);
    });
    return props;
  }

  it('opens dialog for Novo jogo; cancel does not restart', () => {
    const props = renderBar();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="in-game-new-game"]')?.click();
    });
    expect(container.querySelector('[data-testid="confirm-dialog"]')).toBeTruthy();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="confirm-dialog-cancel"]')?.click();
    });
    expect(props.onNewGame).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="confirm-dialog"]')).toBeNull();
  });

  it('confirms Novo jogo once', () => {
    const props = renderBar();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="in-game-new-game"]')?.click();
    });
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="confirm-dialog-confirm"]')?.click();
    });
    expect(props.onNewGame).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="confirm-dialog"]')).toBeNull();
  });

  it('opens dialog for Sair; cancel does not exit', () => {
    const props = renderBar();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="in-game-exit"]')?.click();
    });
    expect(container.querySelector('[data-testid="confirm-dialog"]')).toBeTruthy();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="confirm-dialog-cancel"]')?.click();
    });
    expect(props.onExit).not.toHaveBeenCalled();
  });

  it('confirms Sair once', () => {
    const props = renderBar();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="in-game-exit"]')?.click();
    });
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="confirm-dialog-confirm"]')?.click();
    });
    expect(props.onExit).toHaveBeenCalledTimes(1);
  });

  it('Pausar does not open confirm dialog', () => {
    const props = renderBar();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="in-game-pause"]')?.click();
    });
    expect(container.querySelector('[data-testid="confirm-dialog"]')).toBeNull();
    expect(props.onPause).toHaveBeenCalledTimes(1);
    expect(props.onNewGame).not.toHaveBeenCalled();
    expect(props.onExit).not.toHaveBeenCalled();
  });

  it('Escape cancels pending Novo jogo without callback', () => {
    const props = renderBar();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="in-game-new-game"]')?.click();
    });
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(props.onNewGame).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="confirm-dialog"]')).toBeNull();
  });
});
