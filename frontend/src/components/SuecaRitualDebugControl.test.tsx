/**
 * @vitest-environment jsdom
 * UX-SUECA-08 — ritual debug Continuar control.
 */
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SuecaRitualDebugControl } from './SuecaRitualDebugControl';

describe('SuecaRitualDebugControl (UX-SUECA-08)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('shows DEV phase label and Continuar', () => {
    const onContinue = vi.fn();
    act(() => {
      root.render(<SuecaRitualDebugControl phase="trump-reveal" onContinue={onContinue} />);
    });
    expect(container.querySelector('[data-testid="sueca-ritual-debug-phase"]')?.textContent).toBe(
      'DEV · trump-reveal'
    );
    const btn = container.querySelector(
      '[data-testid="sueca-ritual-debug-continue"]'
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();
    act(() => btn.click());
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('hides Continuar on human dealer-choice', () => {
    act(() => {
      root.render(<SuecaRitualDebugControl phase="dealer-choice" onContinue={vi.fn()} />);
    });
    expect(container.querySelector('[data-testid="sueca-ritual-debug-continue"]')).toBeNull();
    expect(container.querySelector('[data-testid="sueca-ritual-debug-choice-hint"]')).toBeTruthy();
  });
});
