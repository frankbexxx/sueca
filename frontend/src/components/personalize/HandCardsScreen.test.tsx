/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SettingsHandScreen } from '../screens/SettingsScreens';
import { loadCardSkinPreferences } from '../../constants/cardSkinPreferences';
import { loadDealAnimationSpeed } from '../../constants/dealAnimationPreferences';
import { loadAutoPauseTrick } from '../../utils/trickAutoContinue';
import { loadHandPreferences } from '../../constants/handPreferences';
import { STORAGE_KEYS } from '../../constants/gameConstants';
import {
  resolveEffectiveBack,
  resolveEffectiveDeck
} from '../../constants/cardDeckRegistry';
import { DEAL_ANIMATION_DELAY_MS } from '../../constants/dealAnimationPreferences';
import { dealSuecaFromCardOrder } from '../../models/games/suecaDeal';
import { Card } from '../../types/game';

vi.mock('../../i18n/useLanguage', () => ({
  useLanguage: () => ({
    language: 'pt',
    t: {
      shell: { back: 'Voltar' },
      settingsScreen: {
        hubHand: 'Mão e Cartas',
        hubHandHint: 'Baralho, verso, ordenação e ritmo'
      },
      moreScreen: {
        sortHand: 'Ordenar mão',
        suitOrder: 'Ordem de naipes',
        trumpPosition: 'Posição do trunfo',
        trumpLeft: 'Esquerda',
        trumpRight: 'Direita',
        trumpNatural: 'Natural',
        autoPauseTrick: 'Pausa auto entre vazas'
      }
    }
  })
}));

function deck40(): Card[] {
  const suits: Card['suit'][] = ['clubs', 'diamonds', 'hearts', 'spades'];
  const ranks: Card['rank'][] = ['2', '3', '4', '5', '6', 'Q', 'J', 'K', '7', 'A'];
  const cards: Card[] = [];
  let n = 0;
  for (const suit of suits) {
    for (const rank of ranks) {
      cards.push({ suit, rank, id: `c${n++}` });
    }
  }
  return cards;
}

describe('Mão e Cartas / SettingsHandScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('selects front and back independently and persists', () => {
    render(<SettingsHandScreen showBack onBack={() => undefined} />);
    expect(screen.getByTestId('hand-cards-screen')).toBeTruthy();

    fireEvent.click(screen.getByTestId('card-front-cardmeister'));
    fireEvent.click(screen.getByTestId('card-back-casino-06'));

    expect(loadCardSkinPreferences()).toEqual({
      cardFrontId: 'cardmeister',
      cardBackId: 'casino-06'
    });
    expect(resolveEffectiveDeck('midnight', '', undefined).id).toBe('cardmeister');
    expect(resolveEffectiveBack('midnight', undefined).id).toBe('casino-06');
    // Changing front must not reset back
    fireEvent.click(screen.getByTestId('card-front-casino'));
    expect(loadCardSkinPreferences().cardFrontId).toBe('casino');
    expect(loadCardSkinPreferences().cardBackId).toBe('casino-06');
  });

  it('persists hand sort, suit order, deal speed, auto-pause', () => {
    render(<SettingsHandScreen showBack onBack={() => undefined} />);

    fireEvent.click(screen.getByTestId('hand-sort-toggle'));
    fireEvent.change(screen.getByTestId('hand-suit-order'), {
      target: { value: 'alphabetical' }
    });
    fireEvent.click(screen.getByTestId('deal-speed-paused'));
    fireEvent.click(screen.getByTestId('hand-auto-pause'));

    expect(loadHandPreferences().sortEnabled).toBe(false);
    expect(loadHandPreferences().suitOrderPreset).toBe('alphabetical');
    expect(loadDealAnimationSpeed()).toBe('paused');
    expect(loadAutoPauseTrick()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.DEAL_ANIMATION_SPEED)).toBe('paused');
  });

  it('deal animation preference never changes Sueca deal outcome', () => {
    localStorage.setItem(STORAGE_KEYS.DEAL_ANIMATION_SPEED, 'fast');
    const a = dealSuecaFromCardOrder(deck40(), 0, 'A', 'left');
    localStorage.setItem(STORAGE_KEYS.DEAL_ANIMATION_SPEED, 'paused');
    const b = dealSuecaFromCardOrder(deck40(), 0, 'A', 'left');
    expect(a.hands.map((h) => h.map((c) => c.id))).toEqual(
      b.hands.map((h) => h.map((c) => c.id))
    );
    expect(a.trumpCard?.id).toBe(b.trumpCard?.id);
    expect(DEAL_ANIMATION_DELAY_MS.fast).not.toBe(DEAL_ANIMATION_DELAY_MS.paused);
  });

  it('card skin cannot affect deal assignment', () => {
    localStorage.setItem(STORAGE_KEYS.CARD_FRONT, 'cardmeister');
    localStorage.setItem(STORAGE_KEYS.CARD_BACK, 'casino-08');
    const a = dealSuecaFromCardOrder(deck40(), 1, 'A', 'left');
    localStorage.setItem(STORAGE_KEYS.CARD_FRONT, 'casino');
    localStorage.setItem(STORAGE_KEYS.CARD_BACK, 'suecao-navy');
    const b = dealSuecaFromCardOrder(deck40(), 1, 'A', 'left');
    expect(a.hands.flat().map((c) => c.id)).toEqual(b.hands.flat().map((c) => c.id));
  });
});
