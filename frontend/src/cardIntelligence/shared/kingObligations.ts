import { Card, Suit } from '../../types/game';
import { cardsMatch } from './clone';
import { CardDecisionLogEvent, RoundPlayEntry } from './types/logEvents';

type PlayEntry = RoundPlayEntry;

export function isKingHearts(card: Card): boolean {
  return card.rank === 'K' && card.suit === 'hearts';
}

export function kingHeartsPlayedInHistory(plays: PlayEntry[]): boolean {
  return plays.some((p) => isKingHearts(p.card));
}

/** Exclude current play when logger recorded it before building the event. */
export function roundPlayHistoryBeforeCurrentDecision(
  event: CardDecisionLogEvent
): RoundPlayEntry[] {
  const history = event.roundPlayHistory;
  if (history.length === 0) return history;

  const last = history[history.length - 1];
  const chosen = event.chosenCard;
  if (
    last.playerIndex === event.playerIndex &&
    last.turnIndex === event.turnIndex &&
    last.trickIndex === event.trickIndex &&
    last.roundIndex === event.roundIndex &&
    cardsMatch(last.card, chosen)
  ) {
    return history.slice(0, -1);
  }

  return history;
}

/**
 * Read-only mirror of King PT obligation (FASE_4 §6.4 + king.md).
 * Does not import KingGame — duplicated minimal rule for encoder + future evaluator.
 */
export function computeMustPlayKingHeartsNow(params: {
  hand: Card[];
  legalMoves: Card[];
  ledSuit: Suit | null;
  trickBefore: Card[];
  contractId: string | null;
  roundPlayHistory: PlayEntry[];
}): boolean {
  const { hand, legalMoves, ledSuit, trickBefore, contractId, roundPlayHistory } = params;

  if (contractId !== 'no_king_hearts') return false;

  const hasKh = hand.some(isKingHearts);
  if (!hasKh) return false;

  const khLegal = legalMoves.some(isKingHearts);
  if (!khLegal) return false;

  if (kingHeartsPlayedInHistory(roundPlayHistory)) return false;

  const effectiveLed = ledSuit ?? (trickBefore.length > 0 ? trickBefore[0].suit : null);
  if (effectiveLed && hand.some((c) => c.suit === effectiveLed && !isKingHearts(c))) {
    return false;
  }

  return true;
}

export function computeCannotLeadHearts(params: {
  hand: Card[];
  trickBefore: Card[];
  contractId: string | null;
}): boolean | null {
  const { hand, trickBefore, contractId } = params;
  if (trickBefore.length > 0) return false;
  if (contractId !== 'no_hearts' && contractId !== 'no_king_hearts') return null;
  const hasNonHeart = hand.some((c) => c.suit !== 'hearts');
  return hasNonHeart;
}
