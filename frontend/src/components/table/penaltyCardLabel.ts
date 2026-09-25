import type { Card } from '../../types/game';

const RANK_PT: Record<string, string> = {
  A: 'Ás',
  K: 'Rei',
  Q: 'Dama',
  J: 'Valete',
  '10': '10',
  '9': '9',
  '8': '8',
  '7': '7',
  '6': '6',
  '5': '5',
  '4': '4',
  '3': '3',
  '2': '2'
};

const SUIT_PT: Record<string, string> = {
  hearts: 'Copas',
  diamonds: 'Ouros',
  clubs: 'Paus',
  spades: 'Espadas'
};

const RANK_EN: Record<string, string> = {
  A: 'Ace',
  K: 'King',
  Q: 'Queen',
  J: 'Jack'
};

const SUIT_EN: Record<string, string> = {
  hearts: 'Hearts',
  diamonds: 'Diamonds',
  clubs: 'Clubs',
  spades: 'Spades'
};

/** Accessible label for HUD penalty miniatures (press-to-enlarge). */
export function formatPenaltyCardAriaLabel(
  card: Pick<Card, 'rank' | 'suit'>,
  locale: 'pt' | 'en' = 'pt'
): string {
  if (locale === 'pt') {
    const rank = RANK_PT[card.rank] ?? card.rank;
    const suit = SUIT_PT[card.suit] ?? card.suit;
    return `${rank} de ${suit} — manter premido para ampliar`;
  }
  const rank = RANK_EN[card.rank] ?? card.rank;
  const suit = SUIT_EN[card.suit] ?? card.suit;
  return `${rank} of ${suit} — press and hold to enlarge`;
}
