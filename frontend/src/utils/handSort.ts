import { Card, CARD_HIERARCHY, GameState, GameVariant, Suit } from '../types/game';
import { loadHandPreferences, TrumpPosition } from '../constants/handPreferences';

export interface HandSortOptions {
  enabled: boolean;
  suitOrder: Suit[];
  trumpPosition: TrumpPosition;
  variant: GameVariant;
  trumpSuit: Suit | null;
}

function rankValue(card: Card, variant: GameVariant): number {
  return CARD_HIERARCHY[card.rank] ?? 0;
}

function compareCards(a: Card, b: Card, variant: GameVariant): number {
  const diff = rankValue(b, variant) - rankValue(a, variant);
  if (diff !== 0) return diff;
  return a.id.localeCompare(b.id);
}

function buildSuitSequence(
  suitOrder: Suit[],
  trumpSuit: Suit | null,
  trumpPosition: TrumpPosition
): Suit[] {
  if (!trumpSuit || trumpPosition === 'natural') {
    return [...suitOrder];
  }
  const withoutTrump = suitOrder.filter((s) => s !== trumpSuit);
  if (trumpPosition === 'left') {
    return [trumpSuit, ...withoutTrump];
  }
  return [...withoutTrump, trumpSuit];
}

export function sortHand(hand: Card[], options: HandSortOptions): Card[] {
  if (!options.enabled || hand.length <= 1) {
    return hand;
  }

  const suitSequence = buildSuitSequence(
    options.suitOrder,
    options.trumpSuit,
    options.trumpPosition
  );
  const groups = new Map<Suit, Card[]>();
  suitSequence.forEach((suit) => groups.set(suit, []));

  for (const card of hand) {
    const bucket = groups.get(card.suit);
    if (bucket) {
      bucket.push(card);
    } else {
      groups.set(card.suit, [card]);
    }
  }

  const sorted: Card[] = [];
  for (const suit of suitSequence) {
    const cards = groups.get(suit);
    if (!cards?.length) continue;
    sorted.push(...cards.sort((a, b) => compareCards(a, b, options.variant)));
    groups.delete(suit);
  }

  Array.from(groups.values()).forEach((cards) => {
    sorted.push(...cards.sort((a, b) => compareCards(a, b, options.variant)));
  });

  return sorted;
}

export function getHandSortOptions(state: GameState, prefs = loadHandPreferences()): HandSortOptions {
  return {
    enabled: prefs.sortEnabled,
    suitOrder: prefs.suitOrder,
    trumpPosition: prefs.trumpPosition,
    variant: state.variant ?? 'sueca',
    trumpSuit: state.trumpSuit
  };
}

export function applyHandSortToState(state: GameState, prefs = loadHandPreferences()): void {
  const options = getHandSortOptions(state, prefs);
  if (!options.enabled) return;
  state.players.forEach((player) => {
    player.hand = sortHand(player.hand, options);
  });
}
