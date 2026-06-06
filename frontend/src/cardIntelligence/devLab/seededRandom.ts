import { Card, GameVariant, Rank, Suit } from '../../types/game';
import { SeededGameOptions, SeededGameResult } from './types';
import { DEV_LAB_SCHEMA_VERSION } from './types';

const SUIT_LETTER: Record<Suit, string> = {
  clubs: 'c',
  diamonds: 'd',
  hearts: 'h',
  spades: 's',
};

const SUITS: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
const STANDARD_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUECA_RANKS: Rank[] = ['2', '3', '4', '5', '6', 'Q', 'J', 'K', '7', 'A'];

export function normalizeSeed(seed: number | string): number {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return seed >>> 0;
  }
  const text = String(seed);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function variantDeckType(variant: GameVariant): 'sueca40' | 'standard52' {
  return variant === 'sueca' ? 'sueca40' : 'standard52';
}

function buildBaseDeck(variant: GameVariant): Card[] {
  const deckType = variantDeckType(variant);
  const ranks = deckType === 'sueca40' ? SUECA_RANKS : STANDARD_RANKS;
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of ranks) {
      const code = `${rank}${SUIT_LETTER[suit]}`;
      cards.push({ suit, rank, id: code });
    }
  }
  return cards;
}

function fisherYatesShuffle(cards: Card[], rng: () => number): Card[] {
  const deck = cards.map((card) => ({ ...card }));
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cutDeck(cards: Card[], cutPoint: number): Card[] {
  if (cards.length <= 1) return cards;
  const point = Math.max(1, Math.min(cutPoint, cards.length - 1));
  return [...cards.slice(point), ...cards.slice(0, point)];
}

function stableHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateSeededDeal(options: SeededGameOptions): SeededGameResult {
  const normalized = normalizeSeed(options.seed);
  const rng = createSeededRng(normalized);
  let deck = fisherYatesShuffle(buildBaseDeck(options.variant), rng);

  if (options.cutPoint !== undefined) {
    deck = cutDeck(deck, options.cutPoint);
  }

  const cardOrder = deck.map((card) => card.id);
  const dealHash = stableHash(cardOrder.join('|'));

  return {
    schemaVersion: DEV_LAB_SCHEMA_VERSION,
    variant: options.variant,
    seed: String(options.seed),
    dealHash,
    cardOrder,
    generatedAt: new Date().toISOString(),
  };
}
