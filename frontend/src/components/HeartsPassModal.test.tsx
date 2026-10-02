import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HeartsPassModal, HeartsPassReceipt } from './HeartsPassModal';
import { HeartsGame, getHeartsState, isHeartsPassExchangeLocked } from '../models/games/HeartsGame';
import { isHeartsPassActive } from '../utils/gameFlowOrchestrator';

const names = ['Ana', 'Bia', 'Carla', 'Dina'];

function renderPass(direction: string, selectedCount: number, onConfirm = () => undefined) {
  return render(
    <HeartsPassModal
      passDirection={direction}
      playerNames={names}
      localPlayerIndex={0}
      selectedCount={selectedCount}
      onConfirm={onConfirm}
    />
  );
}

describe('Hearts pass surface', () => {
  beforeEach(() => {
    localStorage.setItem('sueca-language', 'pt');
  });

  it('counts the selection and enables Passar 3 cartas only at 3', () => {
    const onConfirm = vi.fn();
    const view = renderPass('left', 0, onConfirm);
    expect(screen.getByText('0 de 3 selecionadas')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Passar 3 cartas' })).toBeDisabled();
    expect(document.querySelector('select')).toBeNull();

    view.rerender(
      <HeartsPassModal
        passDirection="left"
        playerNames={names}
        localPlayerIndex={0}
        selectedCount={1}
        onConfirm={onConfirm}
      />
    );
    expect(screen.getByText('1 de 3 selecionadas')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Passar 3 cartas' })).toBeDisabled();

    view.rerender(
      <HeartsPassModal
        passDirection="left"
        playerNames={names}
        localPlayerIndex={0}
        selectedCount={2}
        onConfirm={onConfirm}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Passar 3 cartas' }));
    expect(onConfirm).not.toHaveBeenCalled();

    view.rerender(
      <HeartsPassModal
        passDirection="left"
        playerNames={names}
        localPlayerIndex={0}
        selectedCount={3}
        onConfirm={onConfirm}
      />
    );
    expect(screen.queryByText('2 de 3 selecionadas')).toBeNull();
    expect(screen.getByText('3 de 3 selecionadas')).toBeTruthy();
    const confirm = screen.getByRole('button', { name: 'Passar 3 cartas' });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Continuar')).toBeNull();
  });

  it('names left, right, and across from the existing pass target', () => {
    const { rerender } = renderPass('left', 0);
    expect(screen.getByText('Passa 3 cartas à esquerda · Bia')).toBeTruthy();

    rerender(
      <HeartsPassModal
        passDirection="right"
        playerNames={names}
        localPlayerIndex={0}
        selectedCount={0}
        onConfirm={() => undefined}
      />
    );
    expect(screen.getByText('Passa 3 cartas à direita · Dina')).toBeTruthy();

    rerender(
      <HeartsPassModal
        passDirection="across"
        playerNames={names}
        localPlayerIndex={0}
        selectedCount={0}
        onConfirm={() => undefined}
      />
    );
    expect(screen.getByText('Passa 3 cartas em frente · Carla')).toBeTruthy();
  });

  it('uses the English pass copy', () => {
    localStorage.setItem('sueca-language', 'en');
    renderPass('left', 2);
    expect(screen.getByText('Pass cards')).toBeTruthy();
    expect(screen.getByText('Pass 3 cards to the left · Bia')).toBeTruthy();
    expect(screen.getByText('2 of 3 selected')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pass 3 cards' })).toBeDisabled();
  });

  it('does not render pass controls on a hold hand', () => {
    const { container } = renderPass('hold', 0);
    expect(container.querySelector('[data-testid="hearts-pass-surface"]')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();

    const game = new HeartsGame();
    game.initialize(names, { localPlayerIndex: 0, aiDifficulty: 'easy' });
    const internal = game as unknown as { state: ReturnType<HeartsGame['getCurrentState']> };
    const hearts = getHeartsState(internal.state);
    hearts.passDirection = 'hold';
    hearts.waitingForPass = false;
    internal.state.variantState = { ...internal.state.variantState, hearts };
    expect(isHeartsPassActive('hearts', internal.state)).toBe(false);
  });

  it('blocks a fourth card and allows deselection without reordering the hand', () => {
    const game = new HeartsGame();
    game.initialize(names, { localPlayerIndex: 0, aiDifficulty: 'easy' });
    const before = game.getCurrentState().players[0].hand.map((card) => card.id);
    game.togglePassCard(0, 0);
    game.togglePassCard(1, 0);
    game.togglePassCard(2, 0);
    game.togglePassCard(3, 0);
    expect(getHeartsState(game.getCurrentState()).humanPassIndices).toEqual([0, 1, 2]);
    game.togglePassCard(1, 0);
    expect(getHeartsState(game.getCurrentState()).humanPassIndices).toEqual([0, 2]);
    expect(game.getCurrentState().players[0].hand.map((card) => card.id)).toEqual(before);
  });

  it('clears the pass sheet state and keeps the 800 ms receipt lock', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const game = new HeartsGame();
    game.initialize(names, { localPlayerIndex: 0, aiDifficulty: 'easy' });
    game.togglePassCard(0, 0);
    game.togglePassCard(1, 0);
    game.togglePassCard(2, 0);
    expect(game.confirmPass(0)).toBe(true);
    const hearts = getHeartsState(game.getCurrentState());
    expect(hearts.waitingForPass).toBe(false);
    expect(hearts.humanPassIndices).toEqual([]);
    expect(hearts.passExchangeUntilMs).toBe(1_000_800);
    expect(isHeartsPassExchangeLocked(hearts, 1_000_000)).toBe(true);
    expect(isHeartsPassActive('hearts', game.getCurrentState())).toBe(false);
    vi.useRealTimers();
  });

  it('shows the receipt line from the existing beat copy', () => {
    render(<HeartsPassReceipt />);
    expect(screen.getByRole('status').textContent).toBe('Cartas recebidas');
    expect(document.querySelector('select')).toBeNull();
    expect(document.querySelectorAll('[data-testid="hearts-pass-surface"]')).toHaveLength(0);
  });
});
