/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SuecaDealingModal } from './SuecaDealingModal';
import type { DealAlignment, PlayDirection } from '../types/game';

vi.mock('../i18n/useLanguage', () => ({
  useLanguage: () => ({
    language: 'pt',
    t: {
      modals: {
        dealingTitle: 'Distribuição',
        dealAlignmentLabel: 'Sentido da distribuição',
        dealAlignmentSame: 'Mesmo sentido do jogo',
        dealAlignmentOpposite: 'Sentido oposto ao jogo',
        dealAlignmentSameHint:
          'Distribui no mesmo sentido do jogo. O dealer recebe por último e a última carta define o trunfo.',
        dealAlignmentOppositeHint:
          'Distribui no sentido oposto. A primeira carta do dealer define o trunfo.',
        playDirectionReadonlyRight: 'Jogo: pela direita',
        playDirectionReadonlyLeft: 'Jogo: pela esquerda',
        startGame: 'Iniciar Jogo',
        dealingMethodA: 'Standard',
        dealingMethodB: 'Dealer First',
        dealingDirLeft: 'Esquerda',
        dealingDirRight: 'Direita'
      }
    }
  })
}));

describe('SuecaDealingModal (ARCH-SUECA-06)', () => {
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

  function renderModal(opts: {
    playDirection: PlayDirection;
    dealAlignment?: DealAlignment;
    onAlignmentChange?: (a: DealAlignment) => void;
  }) {
    const onAlignmentChange = opts.onAlignmentChange ?? vi.fn();
    const onConfirm = vi.fn();
    act(() => {
      root.render(
        <SuecaDealingModal
          round={1}
          playDirection={opts.playDirection}
          dealAlignment={opts.dealAlignment ?? 'same'}
          onAlignmentChange={onAlignmentChange}
          onConfirm={onConfirm}
        />
      );
    });
    return { onAlignmentChange, onConfirm };
  }

  it('RIGHT session: same default, opposite available, no Method/absolute selectors', () => {
    renderModal({ playDirection: 'right' });
    expect(container.textContent).toContain('Jogo: pela direita');
    expect(container.textContent).toContain('Mesmo sentido do jogo');
    expect(container.textContent).toContain('Sentido oposto ao jogo');
    expect(container.textContent).not.toMatch(/Standard|Dealer First|Método/);
    expect(container.textContent).not.toMatch(/Esquerda \(horário\)|Direita \(anti/);
    expect(container.querySelector('input[name="sueca-deal-method"]')).toBeNull();
    expect(container.querySelector('input[name="sueca-deal-dir"]')).toBeNull();

    const radios = container.querySelectorAll('input[name="sueca-deal-alignment"]');
    expect(radios).toHaveLength(2);
    expect((radios[0] as HTMLInputElement).checked).toBe(true);
  });

  it('LEFT session: same labels; play direction read-only; alignment change does not expose play editor', () => {
    const { onAlignmentChange } = renderModal({ playDirection: 'left' });
    expect(container.textContent).toContain('Jogo: pela esquerda');
    expect(container.querySelector('input[name="sueca-deal-alignment"]')).not.toBeNull();
    // No interactive control for play direction
    expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(2);

    const opposite = Array.from(container.querySelectorAll('label')).find((l) =>
      l.textContent?.includes('Sentido oposto')
    );
    act(() => {
      opposite?.querySelector('input')?.click();
    });
    expect(onAlignmentChange).toHaveBeenCalledWith('opposite');
  });
});
