/**
 * @vitest-environment jsdom
 * UX-SUECA-04 — post-Distribuir presentation card.
 */
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SuecaPostDealCard } from './SuecaPostDealCard';
import type { SuecaPostDealPhase } from '../models/games/suecaHandRitual';

vi.mock('../i18n/useLanguage', () => ({
  useLanguage: () => ({
    language: 'pt',
    t: {
      modals: {
        dealingTitle: 'Distribuição',
        willDealRight: (name: string) => `${name} vai distribuir pela direita`,
        willDealLeft: (name: string) => `${name} vai distribuir pela esquerda`,
        distributing: 'A distribuir…',
        trumpRevealTitle: 'Trunfo',
        firstPlayerStarts: (name: string) => `${name} começa`
      }
    }
  })
}));

describe('SuecaPostDealCard (UX-SUECA-04)', () => {
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

  function renderPhase(phase: SuecaPostDealPhase, physical: 'right' | 'left' = 'right') {
    act(() => {
      root.render(
        <SuecaPostDealCard
          phase={phase}
          dealerName="Ana"
          firstPlayerName="Bruno"
          physicalDeal={physical}
          trumpCard={{ suit: 'hearts', rank: 'A', id: 'hA' }}
        />
      );
    });
  }

  it('deal-confirmed shows dealer + physical deal copy', () => {
    renderPhase('deal-confirmed', 'right');
    expect(container.textContent).toContain('Ana vai distribuir pela direita');
    expect(container.querySelector('[data-post-deal-phase="deal-confirmed"]')).toBeTruthy();
  });

  it('distributing shows A distribuir…', () => {
    renderPhase('distributing');
    expect(container.textContent).toContain('A distribuir…');
  });

  it('trump-reveal shows Trunfo kicker and card', () => {
    renderPhase('trump-reveal');
    expect(container.textContent).toContain('Trunfo');
    expect(container.querySelector('.dealing-modal-trump-card')).toBeTruthy();
  });

  it('first-player shows starts copy', () => {
    renderPhase('first-player');
    expect(container.textContent).toContain('Bruno começa');
  });

  it('UX-SUECA-06 ritual card uses clearance class', () => {
    renderPhase('first-player');
    const card = container.querySelector('.dealing-modal--ritual-clearance');
    expect(card).toBeTruthy();
    expect(card?.classList.contains('dealing-modal--ritual')).toBe(true);
  });

  it('UX-SUECA-07 ritual card uses horizontal plaque class', () => {
    renderPhase('first-player');
    const card = container.querySelector('.dealing-modal--ritual-plaque');
    expect(card).toBeTruthy();
    expect(card?.classList.contains('dealing-modal--ritual-clearance')).toBe(true);
  });
});
