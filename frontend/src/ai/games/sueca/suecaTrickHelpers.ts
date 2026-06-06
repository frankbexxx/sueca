import { CARD_HIERARCHY, Card, GameState, Suit } from '../../../types/game';

export function isAceSeenInSuit(state: GameState, suit: Suit): boolean {
  return state.playedCards.some((c) => c.suit === suit && c.rank === 'A');
}

/** S16 — do not lead a 7 (manilha) before the ace of that suit has been seen. */
export function isSevenLeadBlocked(state: GameState, card: Card): boolean {
  if (card.rank !== '7') return false;
  return !isAceSeenInSuit(state, card.suit);
}

export function suecaCompareTrickCards(
  card1: Card,
  card2: Card,
  leadSuit: Suit,
  trumpSuit: Suit
): number {
  const isTrump1 = card1.suit === trumpSuit;
  const isTrump2 = card2.suit === trumpSuit;
  if (isTrump1 && !isTrump2) return 1;
  if (!isTrump1 && isTrump2) return -1;
  if (isTrump1 && isTrump2) {
    return CARD_HIERARCHY[card1.rank] - CARD_HIERARCHY[card2.rank];
  }
  if (card1.suit === leadSuit && card2.suit !== leadSuit) return 1;
  if (card1.suit !== leadSuit && card2.suit === leadSuit) return -1;
  if (card1.suit === leadSuit && card2.suit === leadSuit) {
    return CARD_HIERARCHY[card1.rank] - CARD_HIERARCHY[card2.rank];
  }
  return 0;
}

export function suecaTrickWinnerIndex(
  trick: Card[],
  trickLeader: number,
  trumpSuit: Suit
): number | null {
  if (trick.length === 0) return null;
  const leadSuit = trick[0].suit;
  let winningIndex = 0;
  let winningCard = trick[0];
  for (let i = 1; i < trick.length; i++) {
    if (suecaCompareTrickCards(trick[i], winningCard, leadSuit, trumpSuit) > 0) {
      winningIndex = i;
      winningCard = trick[i];
    }
  }
  return (trickLeader + winningIndex) % 4;
}

export function cardWouldWinTrickSueca(
  card: Card,
  trickBefore: Card[],
  trickLeader: number,
  trumpSuit: Suit
): boolean {
  const trick = [...trickBefore, card];
  const winner = suecaTrickWinnerIndex(trick, trickLeader, trumpSuit);
  if (winner === null) return false;
  const cardIndex = trick.length - 1;
  return winner === (trickLeader + cardIndex) % 4;
}

export function pickLowestRank<T extends { card: Card }>(entries: T[]): T {
  return entries.reduce((best, cur) =>
    CARD_HIERARCHY[cur.card.rank] < CARD_HIERARCHY[best.card.rank] ? cur : best
  );
}

export function pickHighestRank<T extends { card: Card }>(entries: T[]): T {
  return entries.reduce((best, cur) =>
    CARD_HIERARCHY[cur.card.rank] > CARD_HIERARCHY[best.card.rank] ? cur : best
  );
}
