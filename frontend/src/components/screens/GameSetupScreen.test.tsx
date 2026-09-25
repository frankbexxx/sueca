/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameSetupScreen } from './GameSetupScreen';
import {
  getDifficultyForVariant,
  getPlayerNamesForVariant,
  savePlayerNamesForVariant,
  setDifficultyForVariant,
  setP1Name
} from '../../services/setupPreferences';

vi.mock('../../i18n/useLanguage', () => ({
  useLanguage: () => ({
    language: 'pt',
    t: {
      startMenu: {
        errorPlayer1Required: 'Nome do jogador 1 é obrigatório',
        aiDifficulty: 'Dificuldade',
        dealingMethod: 'Distribuição',
        playerPlaceholder: (i: number) => `Player ${i + 1}`
      },
      playSetup: {
        title: 'Nova partida',
        subtitle: 'Escolhe o jogo',
        subtitleVariant: (g: string) => `Configurar ${g}`,
        rulesPreset: 'Modo de regras'
      },
      moreScreen: { playerName: 'Nome' }
    }
  })
}));

describe('GameSetupScreen production redesign', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    localStorage.clear();
    setP1Name('Francisco');
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function renderSetup(
    props: Partial<React.ComponentProps<typeof GameSetupScreen>> & {
      initialVariant: 'sueca' | 'spades' | 'hearts' | 'king';
    }
  ) {
    const onStartGame = vi.fn();
    const onBack = vi.fn();
    act(() => {
      root.render(
        <GameSetupScreen
          onStartGame={onStartGame}
          onBack={onBack}
          showBack
          lockVariant
          {...props}
        />
      );
    });
    return { onStartGame, onBack };
  }

  it('Hearts has no Rules section and sticky Começar', () => {
    renderSetup({ initialVariant: 'hearts' });
    expect(container.textContent).toContain('Preparar a mesa');
    expect(container.textContent).toContain('Hearts');
    expect(container.textContent).not.toContain('Regras');
    expect(container.querySelector('.setup-cta')).not.toBeNull();
    expect(container.textContent).toMatch(/TU/);
    expect(container.textContent).toMatch(/IA/);
  });

  it('Sueca shows distribution options mapped to A/B', () => {
    const { onStartGame } = renderSetup({ initialVariant: 'sueca' });
    expect(container.textContent).toContain('Regras');
    expect(container.textContent).toContain('Padrão');
    expect(container.textContent).toContain('Dealer recebe primeiro');
    expect(container.textContent).toContain('última carta define o trunfo');

    const dealerFirst = Array.from(container.querySelectorAll('.setup-deal-option')).find(
      (el) => el.textContent?.includes('Dealer recebe primeiro')
    ) as HTMLButtonElement;
    act(() => dealerFirst.click());

    const start = container.querySelector('.setup-cta') as HTMLButtonElement;
    act(() => start.click());
    expect(onStartGame).toHaveBeenCalledTimes(1);
    expect(onStartGame.mock.calls[0][0].dealingMethod).toBe('B');
    expect(onStartGame.mock.calls[0][0].gameVariant).toBe('sueca');
  });

  it('King synthetic shows read-only mode and no preset selector', () => {
    const { onStartGame } = renderSetup({
      initialVariant: 'king',
      initialRulesPresetId: 'king-pt-synthetic'
    });
    expect(container.textContent).toContain('King Sintético');
    expect(container.textContent).toContain('Todos os negativos + 4 Festas');
    expect(container.textContent).not.toMatch(/Modo de regras/);
    expect(container.querySelectorAll('.setup-deal-option').length).toBe(0);

    act(() => (container.querySelector('.setup-cta') as HTMLButtonElement).click());
    expect(onStartGame).toHaveBeenCalledTimes(1);
    expect(onStartGame.mock.calls[0][0].rulesPresetId).toBe('king-pt-synthetic');
  });

  it('King normal Home seed locks normal preset', () => {
    const { onStartGame } = renderSetup({
      initialVariant: 'king',
      initialRulesPresetId: 'king-pt-normal'
    });
    expect(container.textContent).toContain('King');
    expect(container.querySelector('.setup-mode-chip')?.textContent).toBe('King');
    act(() => (container.querySelector('.setup-cta') as HTMLButtonElement).click());
    expect(onStartGame.mock.calls[0][0].rulesPresetId).toBe('king-pt-normal');
  });

  it('Spades keeps Normal/Nil selectable in Setup', () => {
    const { onStartGame } = renderSetup({ initialVariant: 'spades' });
    expect(container.textContent).toContain('Regras');
    expect(container.textContent).toMatch(/nil/i);

    const nil = Array.from(container.querySelectorAll('.setup-deal-option')).find((el) =>
      el.textContent?.toLowerCase().includes('nil')
    ) as HTMLButtonElement;
    act(() => nil.click());
    act(() => (container.querySelector('.setup-cta') as HTMLButtonElement).click());
    expect(onStartGame.mock.calls[0][0].rulesPresetId).toBe('spades-pt-nil');
  });

  it('difficulty is per-game and passed to config', () => {
    setDifficultyForVariant('hearts', 'easy');
    setDifficultyForVariant('sueca', 'medium');
    const { onStartGame } = renderSetup({ initialVariant: 'hearts' });
    expect(
      container.querySelector('.setup-segment-btn.is-selected')?.textContent
    ).toBe('Fácil');

    const hard = Array.from(container.querySelectorAll('.setup-segment-btn')).find(
      (b) => b.textContent === 'Difícil'
    ) as HTMLButtonElement;
    act(() => hard.click());
    act(() => (container.querySelector('.setup-cta') as HTMLButtonElement).click());
    expect(onStartGame.mock.calls[0][0].aiDifficulty).toBe('hard');
    expect(getDifficultyForVariant('hearts')).toBe('hard');
    expect(getDifficultyForVariant('sueca')).toBe('medium');
  });

  it('same P1 name and TU badge across all variants', () => {
    setP1Name('Francisco');
    const variants: Array<{
      initialVariant: 'sueca' | 'spades' | 'hearts' | 'king';
      initialRulesPresetId?: 'king-pt-normal' | 'king-pt-synthetic';
    }> = [
      { initialVariant: 'sueca' },
      { initialVariant: 'hearts' },
      { initialVariant: 'spades' },
      { initialVariant: 'king', initialRulesPresetId: 'king-pt-normal' },
      { initialVariant: 'king', initialRulesPresetId: 'king-pt-synthetic' }
    ];

    for (const props of variants) {
      act(() => root.unmount());
      root = createRoot(container);
      renderSetup(props);
      const youSeat = container.querySelector('.setup-seat--you .setup-seat-btn');
      expect(youSeat?.textContent, props.initialVariant).toContain('Francisco');
      expect(youSeat?.textContent, props.initialVariant).toMatch(/TU/);
      expect(container.querySelectorAll('.setup-badge--you').length).toBeGreaterThanOrEqual(1);
    }
  });

  it('keeps TU badge visible while editing P1', () => {
    setP1Name('Francisco');
    renderSetup({ initialVariant: 'spades' });
    const youBtn = container.querySelector('.setup-seat--you .setup-seat-btn') as HTMLButtonElement;
    act(() => youBtn.click());
    expect(container.querySelector('.setup-seat-input')).not.toBeNull();
    expect(container.querySelector('.setup-seat--you .setup-badge--you')?.textContent).toBe('TU');
  });

  it('P2–P4 bots stay independent between games; IA badge remains', () => {
    savePlayerNamesForVariant('sueca', ['Francisco', 'Manel', 'S3', 'S4']);
    savePlayerNamesForVariant('king', ['Francisco', 'KingBot', 'K3', 'K4']);
    renderSetup({ initialVariant: 'sueca' });
    expect(container.textContent).toContain('Manel');
    expect(container.textContent).toMatch(/IA/);
    expect(getPlayerNamesForVariant('king')[1]).toBe('KingBot');
  });

  it('custom bot name still shows IA badge', () => {
    savePlayerNamesForVariant('sueca', ['Francisco', 'Manel', 'S3', 'S4']);
    renderSetup({ initialVariant: 'sueca' });
    const manelSeat = Array.from(container.querySelectorAll('.setup-seat-btn')).find((b) =>
      b.textContent?.includes('Manel')
    );
    expect(manelSeat?.textContent).toMatch(/IA/);
  });

  it('Começar starts once with sticky CTA', () => {
    const { onStartGame } = renderSetup({ initialVariant: 'hearts' });
    const cta = container.querySelector('.setup-cta') as HTMLButtonElement;
    expect(cta).not.toBeNull();
    act(() => {
      cta.click();
      cta.click();
    });
    expect(onStartGame).toHaveBeenCalledTimes(1);
  });

  it('back does not start a game', () => {
    const { onStartGame, onBack } = renderSetup({ initialVariant: 'hearts' });
    act(() => (container.querySelector('.setup-back') as HTMLButtonElement).click());
    expect(onBack).toHaveBeenCalled();
    expect(onStartGame).not.toHaveBeenCalled();
  });
});
