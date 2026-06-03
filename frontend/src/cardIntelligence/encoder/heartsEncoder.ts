import { Card } from '../../types/game';
import { CardDecisionLogEvent } from '../shared/types/logEvents';
import { TrickEndEvent } from '../shared/types/trickEndEvent';
import { HeartsLogFields } from '../shared/types/variantLogFields';
import { heartsTrickPoints } from '../history/historySelectors';
import { HeartsEncoding } from './types';
import { inferTrickLeader, standardTrickWinnerIndex } from './trickHelpers';

function isDangerousHeartsCard(card: Card): boolean {
  return card.suit === 'hearts' || (card.rank === 'Q' && card.suit === 'spades');
}

export function encodeHeartsVariant(
  event: CardDecisionLogEvent,
  trickEndEvent: TrickEndEvent | undefined,
  currentWinner: number | null
): HeartsEncoding {
  const vf = event.variantFields as HeartsLogFields;
  const plays = event.roundPlayHistory;
  const queenSpadesPlayed = plays.some((p) => p.card.rank === 'Q' && p.card.suit === 'spades');

  let pointsInTrick: number | null = null;
  if (trickEndEvent?.pointsInTrick !== null && trickEndEvent?.pointsInTrick !== undefined) {
    pointsInTrick = trickEndEvent.pointsInTrick;
  } else {
    const trick =
      event.trickAfter.length > 0 ? event.trickAfter : event.trickBefore;
    if (trick.length > 0) {
      pointsInTrick = heartsTrickPoints(trick);
    }
  }

  const dangerousCardsInHand = event.handBefore.filter(isDangerousHeartsCard);

  const partnerIndex = (event.playerIndex + 2) % 4;
  let trickIsSafeAndPointless: boolean | null = null;
  if (currentWinner === event.playerIndex || currentWinner === partnerIndex) {
    trickIsSafeAndPointless = pointsInTrick === 0;
  }

  let canCleanDangerousCard: boolean | null = null;
  if (dangerousCardsInHand.length > 0) {
    canCleanDangerousCard = event.legalMoves.some((m) => isDangerousHeartsCard(m));
  }

  return {
    heartsBroken: vf.heartsBroken,
    queenSpadesPlayed,
    pointsInTrick,
    dangerousCardsInHand,
    trickIsSafeAndPointless,
    canCleanDangerousCard,
  };
}

export function resolveHeartsCurrentWinner(
  event: CardDecisionLogEvent,
  trickEndEvent: TrickEndEvent | undefined
): number | null {
  if (trickEndEvent) return trickEndEvent.winnerIndex;
  const trick = event.trickAfter.length > 0 ? event.trickAfter : event.trickBefore;
  const trickLeader = inferTrickLeader(event.playerIndex, event.turnIndex);
  return standardTrickWinnerIndex(trick, trickLeader, null);
}
