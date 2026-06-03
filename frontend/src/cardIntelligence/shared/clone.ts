import { Card, GameState } from '../../types/game';
import { ScoreSnapshot } from './types/logEvents';

export function cloneCard(card: Card): Card {
  return { suit: card.suit, rank: card.rank, id: card.id };
}

export function cloneCards(cards: Card[]): Card[] {
  return cards.map(cloneCard);
}

export function buildScoreSnapshot(state: GameState): ScoreSnapshot {
  return {
    raw: {
      scores: { ...state.scores },
      gameScore: { ...state.gameScore },
      variant: state.variant ?? null,
      variantState: state.variantState
        ? (JSON.parse(JSON.stringify(state.variantState)) as Record<string, unknown>)
        : null,
    },
  };
}

export function cardsMatch(a: Card, b: Card): boolean {
  return a.id === b.id || (a.suit === b.suit && a.rank === b.rank);
}
