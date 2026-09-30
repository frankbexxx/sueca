/**
 * @vitest-environment jsdom
 * UX-SUECA-01/03 — Sueca hand ritual modal (human + AI + focus).
 */
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SuecaDealingModal } from './SuecaDealingModal';
import type { DealAlignment, PlayDirection, PlayerType } from '../types/game';
import {
  ritualFocusForPhase,
  SUECA_RITUAL_TEST_TIMINGS
} from '../models/games/suecaHandRitual';
import { asSeat, cutterForDealer, shufflerForDealer } from '../models/games/suecaRules';

vi.mock('../i18n/useLanguage', () => ({
  useLanguage: () => ({
    language: 'pt',
    t: {
      modals: {
        dealingTitle: 'Distribuição',
        dealerLabel: 'Dealer:',
        dealPrompt: 'Por onde queres distribuir?',
        dealPhysicalRight: 'Pela direita',
        dealPhysicalLeft: 'Pela esquerda',
        dealConfirm: 'Distribuir',
        shuffling: (name: string) => `${name} está a baralhar…`,
        cutting: (name: string) => `${name} corta o baralho`,
        dealerDeciding: (name: string) => `${name} está a decidir por onde distribuir…`,
        willDealRight: (name: string) => `${name} vai distribuir pela direita`,
        willDealLeft: (name: string) => `${name} vai distribuir pela esquerda`
      }
    }
  })
}));

function players(
  types: PlayerType[] = ['human', 'ai', 'ai', 'ai'],
  names = ['P1', 'P2', 'P3', 'P4']
) {
  return names.map((name, i) => ({ name, type: types[i] }));
}

describe('SuecaDealingModal ritual (UX-SUECA-03)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  function renderModal(opts: {
    playDirection: PlayDirection;
    dealerIndex: number;
    playerTypes?: PlayerType[];
    onConfirm?: (a: DealAlignment) => void;
    onRitualFocusChange?: ReturnType<typeof vi.fn>;
    random?: () => number;
  }) {
    const onConfirm = opts.onConfirm ?? vi.fn();
    const onRitualFocusChange = opts.onRitualFocusChange ?? vi.fn();
    act(() => {
      root.render(
        <SuecaDealingModal
          playDirection={opts.playDirection}
          dealerIndex={opts.dealerIndex}
          players={players(opts.playerTypes)}
          onConfirm={onConfirm}
          onRitualFocusChange={onRitualFocusChange}
          random={opts.random ?? (() => 0)}
          timings={SUECA_RITUAL_TEST_TIMINGS}
        />
      );
    });
    return { onConfirm, onRitualFocusChange };
  }

  function advance(ms: number) {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  }

  it('uses table-ritual overlay (no heavy dialog scrim class alone)', () => {
    renderModal({ playDirection: 'right', dealerIndex: 0 });
    expect(
      container.querySelector('.dealing-modal-overlay--table-ritual')
    ).not.toBeNull();
    expect(container.querySelector('.dealing-modal-kicker')?.textContent).toMatch(
      /Distribuição/i
    );
  });

  it('reports ritualFocus shuffler → cutter → dealer then clears on unmount', () => {
    const dealerIndex = 0;
    const { onRitualFocusChange } = renderModal({ playDirection: 'right', dealerIndex });
    expect(onRitualFocusChange).toHaveBeenCalledWith(
      ritualFocusForPhase('shuffle', dealerIndex)
    );
    expect(container.querySelector('.dealing-modal--ritual-clearance')).not.toBeNull();
    expect(container.querySelector('.dealing-modal--ritual-plaque')).not.toBeNull();
    advance(SUECA_RITUAL_TEST_TIMINGS.shuffleMs);
    expect(onRitualFocusChange).toHaveBeenCalledWith(
      ritualFocusForPhase('cut', dealerIndex)
    );
    advance(SUECA_RITUAL_TEST_TIMINGS.cutMs);
    expect(onRitualFocusChange).toHaveBeenCalledWith(
      ritualFocusForPhase('dealer-decision', dealerIndex)
    );

    act(() => root.unmount());
    expect(onRitualFocusChange).toHaveBeenCalledWith(null);
  });

  it('shows shuffle first, then cut, using canonical seats', () => {
    const dealerIndex = 0;
    const shuffler = shufflerForDealer(asSeat(dealerIndex));
    const cutter = cutterForDealer(asSeat(dealerIndex));
    renderModal({ playDirection: 'right', dealerIndex });

    expect(container.querySelector('[data-ritual-phase]')?.getAttribute('data-ritual-phase')).toBe(
      'shuffle'
    );
    expect(container.textContent).toContain(`P${shuffler + 1} está a baralhar…`);

    advance(SUECA_RITUAL_TEST_TIMINGS.shuffleMs);
    expect(container.querySelector('[data-ritual-phase]')?.getAttribute('data-ritual-phase')).toBe(
      'cut'
    );
    expect(container.textContent).toContain(`P${cutter + 1} corta o baralho`);
  });

  it.each([
    { play: 'right' as const, physical: 'right' as const, expectAlign: 'same' as const },
    { play: 'right' as const, physical: 'left' as const, expectAlign: 'opposite' as const },
    { play: 'left' as const, physical: 'left' as const, expectAlign: 'same' as const },
    { play: 'left' as const, physical: 'right' as const, expectAlign: 'opposite' as const }
  ])(
    'human dealer play=$play physical=$physical → $expectAlign',
    ({ play, physical, expectAlign }) => {
      const { onConfirm } = renderModal({
        playDirection: play,
        dealerIndex: 0,
        playerTypes: ['human', 'ai', 'ai', 'ai']
      });
      advance(SUECA_RITUAL_TEST_TIMINGS.shuffleMs);
      advance(SUECA_RITUAL_TEST_TIMINGS.cutMs);

      const choice = container.querySelector(
        `[data-physical-deal="${physical}"]`
      ) as HTMLButtonElement;
      act(() => choice.click());
      expect(choice.classList.contains('is-selected')).toBe(true);
      expect(choice.querySelector('.deal-select-check--empty')).toBeNull();
      const other = container.querySelector(
        `[data-physical-deal="${physical === 'right' ? 'left' : 'right'}"]`
      ) as HTMLButtonElement;
      expect(other.querySelector('.deal-select-check--empty')).not.toBeNull();

      const cta = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Distribuir')
      ) as HTMLButtonElement;
      act(() => cta.click());
      expect(onConfirm).toHaveBeenCalledWith(expectAlign);
    }
  );

  it('AI dealer: no interactive choice; focus stays on dealer through result', () => {
    const dealerIndex = 2;
    const { onConfirm, onRitualFocusChange } = renderModal({
      playDirection: 'right',
      dealerIndex,
      playerTypes: ['human', 'ai', 'ai', 'ai'],
      random: () => 0.9
    });
    advance(SUECA_RITUAL_TEST_TIMINGS.shuffleMs);
    advance(SUECA_RITUAL_TEST_TIMINGS.cutMs);
    expect(onRitualFocusChange).toHaveBeenCalledWith(
      ritualFocusForPhase('dealer-decision', dealerIndex)
    );
    expect(container.querySelector('[data-physical-deal]')).toBeNull();
    advance(SUECA_RITUAL_TEST_TIMINGS.aiDecisionMs);
    expect(onRitualFocusChange).toHaveBeenCalledWith(
      ritualFocusForPhase('dealer-decision-result', dealerIndex)
    );
    advance(SUECA_RITUAL_TEST_TIMINGS.decisionResultMs);
    expect(onConfirm).toHaveBeenCalledWith('opposite');
  });
});
