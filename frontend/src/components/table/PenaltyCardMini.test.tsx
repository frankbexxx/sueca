import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { PenaltyCardMini } from './PenaltyCardMini';
import { formatPenaltyCardAriaLabel } from './penaltyCardLabel';

describe('formatPenaltyCardAriaLabel', () => {
  it('formats PT specials for press-to-enlarge', () => {
    expect(formatPenaltyCardAriaLabel({ rank: 'Q', suit: 'hearts' }, 'pt')).toBe(
      'Dama de Copas — manter premido para ampliar'
    );
    expect(formatPenaltyCardAriaLabel({ rank: 'K', suit: 'hearts' }, 'pt')).toContain(
      'Rei de Copas'
    );
  });
});

describe('PenaltyCardMini press preview', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });

  const cardA = { id: 'qh', rank: 'Q' as const, suit: 'hearts' as const };
  const cardB = { id: 'ks', rank: 'K' as const, suit: 'spades' as const };

  function firePointer(
    el: Element,
    type: 'pointerdown' | 'pointerup' | 'pointercancel',
    pointerId = 1
  ) {
    const target = el as HTMLElement & {
      setPointerCapture?: (id: number) => void;
      releasePointerCapture?: (id: number) => void;
      hasPointerCapture?: (id: number) => boolean;
    };
    if (!target.setPointerCapture) {
      target.setPointerCapture = () => undefined;
      target.releasePointerCapture = () => undefined;
      target.hasPointerCapture = () => true;
    }
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'pointerId', { value: pointerId });
    Object.defineProperty(event, 'pointerType', { value: 'touch' });
    el.dispatchEvent(event);
  }

  it('opens preview on press and closes on release', () => {
    act(() => {
      ReactDOM.render(
        <PenaltyCardMini card={cardA} src="/qh.png" locale="pt" />,
        container
      );
    });
    const btn = container.querySelector(
      'button.game-status-panel__penalty-card-btn'
    ) as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toContain('Dama de Copas');
    expect(container.querySelector('[data-testid="penalty-card-preview"]')).toBeNull();

    act(() => {
      firePointer(btn, 'pointerdown');
    });
    const preview = container.querySelector(
      '[data-testid="penalty-card-preview"]'
    ) as HTMLImageElement;
    expect(preview).not.toBeNull();
    expect(preview.getAttribute('data-card-id')).toBe('qh');
    expect(preview.getAttribute('src')).toBe('/qh.png');

    act(() => {
      firePointer(btn, 'pointerup');
    });
    expect(container.querySelector('[data-testid="penalty-card-preview"]')).toBeNull();
  });

  it('closes preview on pointercancel', () => {
    act(() => {
      ReactDOM.render(
        <PenaltyCardMini card={cardA} src="/qh.png" locale="pt" />,
        container
      );
    });
    const btn = container.querySelector(
      'button.game-status-panel__penalty-card-btn'
    ) as HTMLButtonElement;
    act(() => {
      firePointer(btn, 'pointerdown');
    });
    expect(container.querySelector('[data-testid="penalty-card-preview"]')).not.toBeNull();
    act(() => {
      firePointer(btn, 'pointercancel');
    });
    expect(container.querySelector('[data-testid="penalty-card-preview"]')).toBeNull();
  });

  it('previews independent cards', () => {
    act(() => {
      ReactDOM.render(
        <>
          <PenaltyCardMini card={cardA} src="/qh.png" locale="pt" />
          <PenaltyCardMini card={cardB} src="/ks.png" locale="pt" />
        </>,
        container
      );
    });
    const buttons = container.querySelectorAll(
      'button.game-status-panel__penalty-card-btn'
    );
    act(() => {
      firePointer(buttons[1], 'pointerdown');
    });
    const preview = container.querySelector(
      '[data-testid="penalty-card-preview"]'
    ) as HTMLImageElement;
    expect(preview.getAttribute('data-card-id')).toBe('ks');
    expect(preview.getAttribute('src')).toBe('/ks.png');
  });
});
