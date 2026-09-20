import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { InGameBar, IN_GAME_BAR_TOUCH_LABEL_MS } from './InGameBar';

describe('InGameBar icon command bar', () => {
  let container: HTMLDivElement;

  beforeAll(() => {
    if (typeof PointerEvent === 'undefined') {
      class PointerEventPolyfill extends MouseEvent {
        pointerId: number;
        constructor(type: string, props: MouseEventInit & { pointerId?: number } = {}) {
          super(type, props);
          this.pointerId = props.pointerId ?? 1;
        }
      }
      (globalThis as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent =
        PointerEventPolyfill as unknown as typeof PointerEvent;
    }
  });

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
      isPaused: false,
      onPause: jest.fn(),
      onResume: jest.fn(),
      onNewGame: jest.fn(),
      onPinGame: jest.fn(),
      onExit: jest.fn(),
      onOpenRules: jest.fn(),
      onOpenSettings: jest.fn(),
      ...overrides
    };
    act(() => {
      ReactDOM.render(<InGameBar {...props} />, container);
    });
    return props;
  }

  function openOverflow() {
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="in-game-more"]')?.click();
    });
  }

  it('renders vertical rail with three permanent icon controls', () => {
    renderBar();
    const bar = container.querySelector('[data-testid="in-game-bar"]');
    expect(bar?.getAttribute('data-layout')).toBe('vertical-rail');
    expect(bar?.getAttribute('aria-orientation')).toBe('vertical');
    expect(container.querySelectorAll('.in-game-bar-icon-btn')).toHaveLength(3);
    expect(container.querySelector('[data-testid="in-game-pause"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="in-game-pin"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="in-game-more"]')).toBeTruthy();
    expect(container.querySelector('.in-game-bar-title')).toBeNull();
    expect(container.querySelector('.in-game-bar-player')).toBeNull();
    expect(container.querySelector('.in-game-bar-meta')).toBeNull();
    const order = Array.from(container.querySelectorAll('.in-game-bar-icon-btn')).map((el) =>
      el.getAttribute('data-testid')
    );
    expect(order).toEqual(['in-game-pause', 'in-game-pin', 'in-game-more']);
  });

  it('does not expose Novo/Sair until overflow opens', () => {
    renderBar();
    expect(container.querySelector('[data-testid="in-game-new-game"]')).toBeNull();
    expect(container.querySelector('[data-testid="in-game-exit"]')).toBeNull();
    openOverflow();
    expect(container.querySelector('[data-testid="in-game-new-game"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="in-game-exit"]')).toBeTruthy();
  });

  it('Pause icon calls onPause with dynamic aria-label', () => {
    const props = renderBar();
    const btn = container.querySelector<HTMLButtonElement>('[data-testid="in-game-pause"]');
    expect(btn?.getAttribute('aria-label')).toBe('Pausar');
    act(() => {
      btn?.click();
    });
    expect(props.onPause).toHaveBeenCalledTimes(1);
    expect(props.onResume).not.toHaveBeenCalled();
  });

  it('Resume icon calls onResume when paused', () => {
    const props = renderBar({ isPaused: true });
    const btn = container.querySelector<HTMLButtonElement>('[data-testid="in-game-pause"]');
    expect(btn?.getAttribute('aria-label')).toBe('Retomar');
    expect(btn?.textContent).toContain('▶');
    act(() => {
      btn?.click();
    });
    expect(props.onResume).toHaveBeenCalledTimes(1);
    expect(props.onPause).not.toHaveBeenCalled();
  });

  it('Pin calls existing callback path', () => {
    const props = renderBar();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="in-game-pin"]')?.click();
    });
    expect(props.onPinGame).toHaveBeenCalledTimes(1);
  });

  it('More opens menu with correct row order', () => {
    renderBar();
    openOverflow();
    const menu = container.querySelector('[data-testid="in-game-overflow-menu"]');
    expect(menu).toBeTruthy();
    const items = Array.from(menu!.querySelectorAll('[role="menuitem"]')).map(
      (el) => el.getAttribute('data-testid')
    );
    expect(items).toEqual([
      'in-game-overflow-rules',
      'in-game-overflow-settings',
      'in-game-new-game',
      'in-game-exit'
    ]);
    expect(container.querySelector('[data-testid="in-game-more"]')?.getAttribute('aria-expanded')).toBe(
      'true'
    );
  });

  it('outside pointerdown closes overflow', () => {
    renderBar();
    openOverflow();
    expect(container.querySelector('[data-testid="in-game-overflow-menu"]')).toBeTruthy();
    act(() => {
      document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    expect(container.querySelector('[data-testid="in-game-overflow-menu"]')).toBeNull();
  });

  it('Escape closes overflow', () => {
    renderBar();
    openOverflow();
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(container.querySelector('[data-testid="in-game-overflow-menu"]')).toBeNull();
  });

  it('Rules row opens rules without new-game/exit', () => {
    const props = renderBar();
    openOverflow();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="in-game-overflow-rules"]')?.click();
    });
    expect(props.onOpenRules).toHaveBeenCalledTimes(1);
    expect(props.onOpenSettings).not.toHaveBeenCalled();
    expect(props.onNewGame).not.toHaveBeenCalled();
    expect(props.onExit).not.toHaveBeenCalled();
  });

  it('Settings row opens in-game settings without exit', () => {
    const props = renderBar();
    openOverflow();
    act(() => {
      container
        .querySelector<HTMLButtonElement>('[data-testid="in-game-overflow-settings"]')
        ?.click();
    });
    expect(props.onOpenSettings).toHaveBeenCalledTimes(1);
    expect(props.onExit).not.toHaveBeenCalled();
  });

  it('Novo jogo only via overflow and still gated by confirm', () => {
    const props = renderBar();
    openOverflow();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="in-game-new-game"]')?.click();
    });
    expect(container.querySelector('[data-testid="confirm-dialog"]')).toBeTruthy();
    expect(props.onNewGame).not.toHaveBeenCalled();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="confirm-dialog-cancel"]')?.click();
    });
    expect(props.onNewGame).not.toHaveBeenCalled();

    openOverflow();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="in-game-new-game"]')?.click();
    });
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="confirm-dialog-confirm"]')?.click();
    });
    expect(props.onNewGame).toHaveBeenCalledTimes(1);
  });

  it('Sair only via overflow and still gated by confirm', () => {
    const props = renderBar();
    openOverflow();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="in-game-exit"]')?.click();
    });
    expect(container.querySelector('[data-testid="confirm-dialog"]')).toBeTruthy();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="confirm-dialog-cancel"]')?.click();
    });
    expect(props.onExit).not.toHaveBeenCalled();

    openOverflow();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="in-game-exit"]')?.click();
    });
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="confirm-dialog-confirm"]')?.click();
    });
    expect(props.onExit).toHaveBeenCalledTimes(1);
  });

  it('Escape cancels pending Novo jogo without callback', () => {
    const props = renderBar();
    openOverflow();
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="in-game-new-game"]')?.click();
    });
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(props.onNewGame).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="confirm-dialog"]')).toBeNull();
  });

  it('pointercancel does not execute Pause', () => {
    const props = renderBar();
    const btn = container.querySelector<HTMLButtonElement>('[data-testid="in-game-pause"]')!;
    act(() => {
      btn.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 1 })
      );
    });
    expect(btn.className).toContain('is-label-visible');
    act(() => {
      btn.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1 }));
    });
    expect(props.onPause).not.toHaveBeenCalled();
    expect(IN_GAME_BAR_TOUCH_LABEL_MS).toBeGreaterThan(0);
  });

  it('pointerup activates once and suppresses duplicate click', () => {
    const props = renderBar();
    const btn = container.querySelector<HTMLButtonElement>('[data-testid="in-game-pause"]')!;
    act(() => {
      btn.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 2 })
      );
      btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 2 }));
      btn.click();
    });
    expect(props.onPause).toHaveBeenCalledTimes(1);
  });
});
