import { CardDecisionLogEvent } from '../shared/types/logEvents';
import { TrickEndEvent } from '../shared/types/trickEndEvent';
import {
  acesSeenFromPlays,
  countTrumpInPlays,
  sevensSeenFromPlays,
} from '../history/historySelectors';
import { SuecaLogFields } from '../shared/types/variantLogFields';
import { SuecaEncoding } from './types';
import {
  cardWouldWinTrickSueca,
  inferTrickLeader,
  lowestTrumpThatWinsSueca,
  lowestWinningCardSueca,
  suecaTrickWinnerIndex,
} from './trickHelpers';

function deriveCutRisk(trumpSeenCount: number, trickLen: number): 'low' | 'medium' | 'high' {
  if (trumpSeenCount >= 6) return 'high';
  if (trumpSeenCount >= 3 || trickLen >= 2) return 'medium';
  return 'low';
}

export function encodeSuecaVariant(
  event: CardDecisionLogEvent,
  trickEndEvent: TrickEndEvent | undefined,
  currentWinner: number | null
): SuecaEncoding {
  const vf = event.variantFields as SuecaLogFields;
  const partnerIndex = vf.partnerIndex ?? (event.playerIndex + 2) % 4;
  const teamIndex = vf.teamIndex ?? 1;
  const plays = event.roundPlayHistory;
  const trumpSuit = event.trumpSuit;
  const acesSeenBySuit = acesSeenFromPlays(plays);
  const sevensSeenBySuit = sevensSeenFromPlays(plays);
  const trumpSeenCount = countTrumpInPlays(plays, trumpSuit);

  let partnerWinning: boolean | null = null;
  if (trickEndEvent?.variantFields && 'partnerWinning' in trickEndEvent.variantFields) {
    partnerWinning = trickEndEvent.variantFields.partnerWinning;
  } else if (currentWinner !== null) {
    partnerWinning = currentWinner === partnerIndex;
  }

  const trickLeader = inferTrickLeader(event.playerIndex, event.turnIndex);

  let canWinCheaply: boolean | null = null;
  const cheapestWinner = lowestWinningCardSueca(
    event.legalMoves,
    event.trickBefore,
    trickLeader,
    trumpSuit
  );
  if (cheapestWinner) {
    canWinCheaply = true;
  } else if (event.legalMoves.length > 0 && trumpSuit) {
    const anyWinner = event.legalMoves.some((c) =>
      cardWouldWinTrickSueca(c, event.trickBefore, trickLeader, trumpSuit)
    );
    canWinCheaply = anyWinner ? false : null;
  }

  let canCutWithLowestTrump: boolean | null = null;
  const lowestTrumpWinner = lowestTrumpThatWinsSueca(
    event.legalMoves,
    event.trickBefore,
    trickLeader,
    trumpSuit
  );
  if (lowestTrumpWinner) {
    canCutWithLowestTrump = true;
  } else if (
    event.trickBefore.length > 0 &&
    trumpSuit &&
    event.ledSuit &&
    !event.handBefore.some((c) => c.suit === event.ledSuit)
  ) {
    const hasTrumpLegal = event.legalMoves.some((c) => c.suit === trumpSuit);
    canCutWithLowestTrump = hasTrumpLegal ? false : null;
  }

  const cutRisk =
    trumpSuit && event.trickBefore.length > 0
      ? deriveCutRisk(trumpSeenCount, event.trickBefore.length)
      : null;

  return {
    partnerIndex,
    teamIndex,
    acesSeenBySuit,
    sevensSeenBySuit,
    trumpSeenCount,
    partnerWinning,
    canWinCheaply,
    canCutWithLowestTrump,
    cutRisk,
  };
}

export function resolveSuecaCurrentWinner(
  event: CardDecisionLogEvent,
  trickEndEvent: TrickEndEvent | undefined
): number | null {
  if (trickEndEvent) return trickEndEvent.winnerIndex;
  if (event.currentWinnerBefore !== null) return event.currentWinnerBefore;
  if (event.currentWinnerAfter !== null) return event.currentWinnerAfter;
  const trick = event.trickAfter.length > 0 ? event.trickAfter : event.trickBefore;
  const trickLeader = inferTrickLeader(event.playerIndex, event.turnIndex);
  return suecaTrickWinnerIndex(trick, trickLeader, event.trumpSuit);
}
