import { afterEach, describe, expect, it, vi } from 'vitest';
import { readSafeAreaInsets } from './readSafeAreaInsets';

describe('readSafeAreaInsets', () => {
  afterEach(() => {
    document.querySelectorAll('[data-sueca-safe-area-probe]').forEach((el) => el.remove());
    vi.restoreAllMocks();
  });

  it('reads env()-backed padding from a temporary probe', () => {
    const original = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      if (
        el instanceof HTMLElement &&
        el.getAttribute('data-sueca-safe-area-probe') === '1'
      ) {
        return {
          paddingTop: '47px',
          paddingRight: '0px',
          paddingBottom: '34px',
          paddingLeft: '12px'
        } as CSSStyleDeclaration;
      }
      return original(el);
    });

    expect(readSafeAreaInsets(document)).toEqual({
      top: 47,
      right: 0,
      bottom: 34,
      left: 12
    });
    expect(document.querySelector('[data-sueca-safe-area-probe]')).toBeNull();
  });

  it('treats non-numeric computed padding as 0', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      paddingTop: 'auto',
      paddingRight: '',
      paddingBottom: '8px',
      paddingLeft: 'NaN'
    } as CSSStyleDeclaration);

    expect(readSafeAreaInsets(document)).toEqual({
      top: 0,
      right: 0,
      bottom: 8,
      left: 0
    });
  });
});
