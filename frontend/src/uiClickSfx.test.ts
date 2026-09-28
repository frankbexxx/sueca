/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { resolveUiClickTarget, UI_CLICK_SELECTOR } from './uiClickSfx';

describe('uiClickSfx', () => {
  it('uses narrow selector only', () => {
    expect(UI_CLICK_SELECTOR).toBe('.sueca-btn, .lang-btn');
  });

  it('matches intended buttons once via closest; skips noise', () => {
    const wrap = document.createElement('div');
    const btn = document.createElement('button');
    btn.className = 'sueca-btn';
    const inner = document.createElement('span');
    btn.appendChild(inner);
    wrap.appendChild(btn);
    document.body.appendChild(wrap);

    expect(resolveUiClickTarget(inner)).toBe(btn);
    expect(resolveUiClickTarget(document.createElement('div'))).toBeNull();

    btn.disabled = true;
    expect(resolveUiClickTarget(inner)).toBeNull();
  });
});
