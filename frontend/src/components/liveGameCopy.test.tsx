/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { translations } from '../i18n/translations';
import { GameSetupScreen } from './screens/GameSetupScreen';
import { KingKohRevealModal } from './KingKohRevealModal';
import { KingPtGame, getKingPtState } from '../models/games/KingPtGame';
import { setP1Name } from '../services/setupPreferences';
import type { GameState } from '../types/game';

const SUECA_PT =
  '10 cartas por jogador, distribuídas em blocos. O sentido do jogo mantém-se durante a partida; em cada mão, o distribuidor pode dar no mesmo sentido ou no sentido oposto.';
const SUECA_EN =
  '10 cards per player, dealt in blocks. Play direction stays fixed for the match; each hand, the distributor may deal the same way or the opposite way.';

describe('live game copy', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    setP1Name('Francisco');
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function renderSetup(language: 'pt' | 'en') {
    localStorage.setItem('sueca-language', language);
    act(() => {
      root.render(
        <GameSetupScreen
          onStartGame={() => undefined}
          initialVariant="sueca"
          lockVariant
        />
      );
    });
  }

  it('uses the Sueca setup sentence and distribuidor in Portuguese', () => {
    expect(translations.pt.playSetup.suecaDealSummary).toBe(SUECA_PT);
    renderSetup('pt');
    expect(container.textContent).toContain(SUECA_PT);
    expect(container.textContent).toMatch(/distribuidor/);
    expect(container.textContent).not.toMatch(/\bdealer\b/i);
    expect(container.textContent).toContain('Jogadores');
    expect(container.textContent).toContain('Regras');
    expect(container.textContent).toContain('Dificuldade');
    expect(container.textContent).toContain('Começar');
    expect(container.textContent).toContain('TU');
    expect(container.textContent).toContain('IA');
  });

  it('localizes the Sueca setup sentence and chrome in English', () => {
    expect(translations.en.playSetup.suecaDealSummary).toBe(SUECA_EN);
    renderSetup('en');
    expect(container.textContent).toContain(SUECA_EN);
    expect(container.textContent).toMatch(/distributor/);
    expect(container.textContent).toContain('Players');
    expect(container.textContent).toContain('Rules');
    expect(container.textContent).toContain('Difficulty');
    expect(container.textContent).toContain('Start');
    expect(container.textContent).toContain('YOU');
    expect(container.textContent).toContain('AI');
    expect(container.textContent).not.toContain('Jogadores');
    expect(container.textContent).not.toContain('Começar');
  });

  it('keeps Spades Pontos in Portuguese and Score in English', () => {
    expect(translations.pt.spadesStatus.scoreShort).toBe('Pontos');
    expect(translations.en.spadesStatus.scoreShort).toBe('Score');
    expect(translations.pt.spadesBid.nil).toBe('Nil');
    expect(translations.pt.spadesBid.blindNil).toBe('Blind nil');
    expect(translations.pt.spadesStatus.bagsLine(3)).toContain('bags');
    expect(translations.en.spadesBid.confirm).toBe('Confirm bid');
  });

  it('localizes the King of Hearts reveal in Portuguese and English', () => {
    const opening = kohAtStep(0);
    const finished = kohAtStep(1);

    localStorage.setItem('sueca-language', 'pt');
    act(() => {
      root.render(
        <KingKohRevealModal
          gameState={opening}
          getCardImage={() => ''}
          onNext={() => undefined}
          onConfirm={() => undefined}
        />
      );
    });
    expect(container.textContent).toContain('Viragem do Rei de Copas');
    expect(container.textContent).toContain('Iniciar viragem');
    expect(container.textContent).toContain('Viragem automática até sair o K♥');

    act(() => {
      root.render(
        <KingKohRevealModal
          gameState={finished}
          getCardImage={() => ''}
          onNext={() => undefined}
          onConfirm={() => undefined}
        />
      );
    });
    expect(container.textContent).toContain('Começar partida');
    expect(container.textContent).toContain('dono da 1.ª festa');

    act(() => root.unmount());
    root = createRoot(container);
    localStorage.setItem('sueca-language', 'en');
    act(() => {
      root.render(
        <KingKohRevealModal
          gameState={opening}
          getCardImage={() => ''}
          onNext={() => undefined}
          onConfirm={() => undefined}
        />
      );
    });
    expect(container.textContent).toContain('King of Hearts draw');
    expect(container.textContent).toContain('Start the draw');
    expect(container.textContent).toContain('First player:');

    act(() => {
      root.render(
        <KingKohRevealModal
          gameState={finished}
          getCardImage={() => ''}
          onNext={() => undefined}
          onConfirm={() => undefined}
        />
      );
    });
    expect(container.textContent).toContain('Start match');
    expect(container.textContent).toContain('owner of the 1st festa');
  });
});

function kohAtStep(step: number): GameState {
  const game = new KingPtGame();
  const state = game.initialize(['Ana', 'Bruno', 'Carla', 'Diogo'], {
    rulesPresetId: 'king-pt-normal'
  });
  const king = getKingPtState(state);
  king.kohReveal = {
    startPlayerIndex: 0,
    winnerIndex: 1,
    step,
    sequence: [
      { playerIndex: 0, card: { suit: 'clubs', rank: '2', id: '2c' } },
      { playerIndex: 1, card: { suit: 'hearts', rank: 'K', id: 'kh' } }
    ]
  };
  return {
    ...state,
    variantState: { ...state.variantState, kingPt: king }
  };
}
