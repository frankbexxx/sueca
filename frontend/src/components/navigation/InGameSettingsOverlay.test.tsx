import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { InGameSettingsOverlay } from './InGameSettingsOverlay';

describe('InGameSettingsOverlay', () => {
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

  it('renders safe in-game settings subset and closes without navigation', () => {
    const onClose = jest.fn();
    act(() => {
      ReactDOM.render(<InGameSettingsOverlay onClose={onClose} />, container);
    });

    expect(container.querySelector('[data-testid="in-game-settings-overlay"]')).toBeTruthy();
    expect(container.textContent).toContain('Definições');
    expect(container.textContent).toContain('Som');
    expect(container.textContent).toContain('Música');
    expect(container.textContent).not.toContain('Sair da aplicação');
    expect(container.textContent).not.toContain('Feedback');

    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="in-game-settings-close"]')?.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape closes overlay', () => {
    const onClose = jest.fn();
    act(() => {
      ReactDOM.render(<InGameSettingsOverlay onClose={onClose} />, container);
    });
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
