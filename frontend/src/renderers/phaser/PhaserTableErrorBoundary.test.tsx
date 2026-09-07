import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { PhaserTableErrorBoundary } from './PhaserTableErrorBoundary';

function Boom(): React.ReactElement {
  throw new Error('phaser boom');
}

describe('PhaserTableErrorBoundary', () => {
  let container: HTMLDivElement;
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });

  afterAll(() => {
    consoleError.mockRestore();
  });

  it('falls back to DOM content without crashing', () => {
    const onFallback = jest.fn();
    act(() => {
      ReactDOM.render(
        <PhaserTableErrorBoundary
          fallback={<div data-testid="dom-fallback">DOM table</div>}
          onFallback={onFallback}
        >
          <Boom />
        </PhaserTableErrorBoundary>,
        container
      );
    });
    expect(container.querySelector('[data-testid="dom-fallback"]')?.textContent).toBe(
      'DOM table'
    );
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onFallback.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('does not duplicate fallback callbacks on re-render after error', () => {
    const onFallback = jest.fn();
    act(() => {
      ReactDOM.render(
        <PhaserTableErrorBoundary
          fallback={<div data-testid="dom-fallback">DOM</div>}
          onFallback={onFallback}
        >
          <Boom />
        </PhaserTableErrorBoundary>,
        container
      );
    });
    expect(onFallback).toHaveBeenCalledTimes(1);
    act(() => {
      ReactDOM.render(
        <PhaserTableErrorBoundary
          fallback={<div data-testid="dom-fallback">DOM</div>}
          onFallback={onFallback}
        >
          <Boom />
        </PhaserTableErrorBoundary>,
        container
      );
    });
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="dom-fallback"]')).toBeTruthy();
  });
});
