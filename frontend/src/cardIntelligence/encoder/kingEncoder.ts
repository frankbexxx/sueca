import { CardDecisionLogEvent } from '../shared/types/logEvents';
import { TrickEndEvent } from '../shared/types/trickEndEvent';
import { KingLogFields } from '../shared/types/variantLogFields';
import {
  computeCannotLeadHearts,
  computeMustPlayKingHeartsNow,
  kingHeartsPlayedInHistory,
  roundPlayHistoryBeforeCurrentDecision,
} from '../shared/kingObligations';
import { KingEncoding } from './types';
import { inferTrickLeader, standardTrickWinnerIndex } from './trickHelpers';

const KING_PENALTY_MAP: Record<string, number> = {
  no_hearts: 1,
  no_king_hearts: 160,
  no_queens: 40,
  no_men: 20,
  no_last_two: 90,
};

interface KingPtSnapshot {
  contract?: string;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function readKingPtSnapshot(event: CardDecisionLogEvent): KingPtSnapshot | null {
  const raw = event.scoreBefore.raw;
  const variantState = raw.variantState as Record<string, unknown> | null | undefined;
  const kingPt = variantState?.kingPt as KingPtSnapshot | undefined;
  return kingPt ?? null;
}

export function resolveKingContractId(event: CardDecisionLogEvent): string | null {
  const vf = event.variantFields as KingLogFields;
  const snapshot = readKingPtSnapshot(event);
  return vf.contractId ?? event.contract ?? readString(snapshot?.contract) ?? null;
}

export function encodeKingVariant(
  event: CardDecisionLogEvent,
  trickEndEvent: TrickEndEvent | undefined
): KingEncoding {
  const vf = event.variantFields as KingLogFields;
  const contractId = resolveKingContractId(event);
  const contractType = vf.contractType ?? contractId;

  const historyBeforePlay = roundPlayHistoryBeforeCurrentDecision(event);
  const kingHeartsPlayed = kingHeartsPlayedInHistory(historyBeforePlay);
  const mustPlayKingHeartsNow = computeMustPlayKingHeartsNow({
    hand: event.handBefore,
    legalMoves: event.legalMoves,
    ledSuit: event.ledSuit,
    trickBefore: event.trickBefore,
    contractId,
    roundPlayHistory: historyBeforePlay,
  });

  const cannotLeadHearts = computeCannotLeadHearts({
    hand: event.handBefore,
    trickBefore: event.trickBefore,
    contractId,
  });

  const penaltyMap =
    contractId && KING_PENALTY_MAP[contractId] !== undefined
      ? { [contractId]: KING_PENALTY_MAP[contractId] }
      : contractId
        ? { [contractId]: 0 }
        : null;

  let contractPenaltiesInTrick: number | null = null;
  if (trickEndEvent?.penaltiesInTrick !== null && trickEndEvent?.penaltiesInTrick !== undefined) {
    contractPenaltiesInTrick = trickEndEvent.penaltiesInTrick;
  }

  const trickIndex = event.trickIndex ?? 0;
  const trickNumberForLastTwo = trickIndex >= 0 ? trickIndex + 1 : null;
  const isLastTwoPhase =
    trickNumberForLastTwo !== null && trickNumberForLastTwo >= 11 && trickNumberForLastTwo <= 12;

  const nulosMode = vf.noTrump ?? null;

  return {
    contractId,
    contractType,
    festaPhase: vf.festaPhase,
    trumpSuit: event.trumpSuit,
    noTrump: vf.noTrump,
    kingHeartsPlayed,
    mustPlayKingHeartsNow,
    cannotLeadHearts,
    penaltyMap,
    contractPenaltiesInTrick,
    nulosMode: nulosMode ?? null,
    isLastTwoPhase,
    trickNumberForLastTwo,
  };
}

export function resolveKingCurrentWinner(
  event: CardDecisionLogEvent,
  trickEndEvent: TrickEndEvent | undefined
): number | null {
  if (trickEndEvent) return trickEndEvent.winnerIndex;
  const trick = event.trickAfter.length > 0 ? event.trickAfter : event.trickBefore;
  const trickLeader = inferTrickLeader(event.playerIndex, event.turnIndex);
  return standardTrickWinnerIndex(trick, trickLeader, event.trumpSuit);
}
