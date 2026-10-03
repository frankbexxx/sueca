import { afterEach, describe, expect, it, vi } from 'vitest';
import { measureGameplayShell } from './measureGameplayShell';

describe('measureGameplayShell', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('uses shell client box + safe-area adapter (not window alone)', () => {
    const shell = document.createElement('div');
    Object.defineProperty(shell, 'clientWidth', { configurable: true, value: 390 });
    Object.defineProperty(shell, 'clientHeight', { configurable: true, value: 780 });
    document.body.appendChild(shell);

    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      paddingTop: '44px',
      paddingRight: '0px',
      paddingBottom: '20px',
      paddingLeft: '0px'
    } as CSSStyleDeclaration);

    const measured = measureGameplayShell(shell);
    expect(measured).toEqual({
      source: 'gameplay-shell',
      width: 390,
      height: 780,
      safeInsets: { top: 44, right: 0, bottom: 20, left: 0 }
    });
  });
});
