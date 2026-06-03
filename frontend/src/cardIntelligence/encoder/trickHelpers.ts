import { CARD_HIERARCHY, Card, Suit } from '../../types/game';
import { trickWinnerIndex } from '../../models/games/trickUtils';

export function inferTrickLeader(playerIndex: number, turnIndex: number): number {
  return (playerIndex - turnIndex + 4) % 4;
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
  trumpSuit: Suit | null
): number | null {
  if (trick.length === 0 || !trumpSuit) return null;
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

export function standardTrickWinnerIndex(
  trick: Card[],
  trickLeader: number,
  trumpSuit: Suit | null
): number | null {
  if (trick.length === 0) return null;
  return trickWinnerIndex(trick, trickLeader, trumpSuit);
}

export function cardWouldWinTrickSueca(
  card: Card,
  trickBefore: Card[],
  trickLeader: number,
  trumpSuit: Suit | null
): boolean {
  if (!trumpSuit) return false;
  const trick = [...trickBefore, card];
  const winner = suecaTrickWinnerIndex(trick, trickLeader, trumpSuit);
  const cardIndex = trick.length - 1;
  return winner === (trickLeader + cardIndex) % 4;
}

export function cardWouldWinTrickStandard(
  card: Card,
  trickBefore: Card[],
  trickLeader: number,
  trumpSuit: Suit | null
): boolean {
  const trick = [...trickBefore, card];
  const winner = standardTrickWinnerIndex(trick, trickLeader, trumpSuit);
  const cardIndex = trick.length - 1;
  return winner === (trickLeader + cardIndex) % 4;
}

export function lowestWinningCardSueca(
  legalMoves: Card[],
  trickBefore: Card[],
  trickLeader: number,
  trumpSuit: Suit | null
): Card | null {
  const winners = legalMoves.filter((c) =>
    cardWouldWinTrickSueca(c, trickBefore, trickLeader, trumpSuit)
  );
  if (winners.length === 0) return null;
  return winners.reduce((best, cur) =>
    CARD_HIERARCHY[cur.rank] < CARD_HIERARCHY[best.rank] ? cur : best
  );
}

export function lowestTrumpThatWinsSueca(
  legalMoves: Card[],
  trickBefore: Card[],
  trickLeader: number,
  trumpSuit: Suit | null
): Card | null {
  if (!trumpSuit || trickBefore.length === 0) return null;
  const trumps = legalMoves.filter((c) => c.suit === trumpSuit);
  const winners = trumps.filter((c) =>
    cardWouldWinTrickSueca(c, trickBefore, trickLeader, trumpSuit)
  );
  if (winners.length === 0) return null;
  return winners.reduce((best, cur) =>
    CARD_HIERARCHY[cur.rank] < CARD_HIERARCHY[best.rank] ? cur : best
  );
}
