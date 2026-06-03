import { GameState } from '../../types/game';
import { GameAdapter } from '../../models/games/GameAdapter';
import { negativeTrickPenalty } from '../../models/games/king/kingScoring';
import { KingNegativeContract } from '../../models/games/king/kingContracts';
import {
  heartsInTrick,
  kingHeartsInTrick,
  menInTrick,
  queensInTrick,
} from '../../models/games/king/kingScoring';
import {
  acesSeenFromPlays,
  countSuitInPlays,
  countTrumpInPlays,
  hasQueenSpadesInTrick,
  heartsTrickPoints,
  suecaTrickPoints,
} from './historySelectors';
import { TrickEndVariantFields, TrickPlayRecord } from './types';

function readKingPtState(state: GameState): Record<string, unknown> | null {
  const king = state.variantState?.king as Record<string, unknown> | undefined;
  return king ?? null;
}

function readKingSimplifiedState(state: GameState): Record<string, unknown> | null {
  const king = state.variantState?.kingSimplified as Record<string, unknown> | undefined;
  return king ?? null;
}

function readSpadesState(state: GameState): Record<string, unknown> | null {
  const spades = state.variantState?.spades as Record<string, unknown> | undefined;
  return spades ?? null;
}

function readHeartsState(state: GameState): Record<string, unknown> | null {
  const hearts = state.variantState?.hearts as Record<string, unknown> | undefined;
  return hearts ?? null;
}

function penalizingCardIdsKingPt(
  contract: KingNegativeContract | null,
  trick: TrickPlayRecord[]
): string[] {
  if (!contract) return [];
  const cards = trick.map((p) => p.card);
  switch (contract) {
    case 'no_hearts':
      return heartsInTrick(cards).map((c) => c.id);
    case 'no_men':
      return menInTrick(cards).map((c) => c.id);
    case 'no_queens':
      return queensInTrick(cards).map((c) => c.id);
    case 'no_king_hearts':
      return kingHeartsInTrick(cards).map((c) => c.id);
    default:
      return [];
  }
}

function isKingPtEngine(state: GameState): boolean {
  return Boolean(readKingPtState(state));
}

export function extractTrickEndVariantFields(
  adapter: GameAdapter,
  stateAfter: GameState,
  trickPlays: TrickPlayRecord[],
  winnerIndex: number,
  trickNumberForKing: number | null
): TrickEndVariantFields {
  const variant = adapter.variant;
  const allPlays = trickPlays;

  if (variant === 'sueca') {
    const partnerIndex = (winnerIndex + 2) % 4;
    const winnerTeam = stateAfter.players[winnerIndex]?.team;
    const partnerTeam = stateAfter.players[partnerIndex]?.team;
    return {
      partnerIndex,
      partnerWinning: winnerTeam !== undefined && winnerTeam === partnerTeam,
      acesSeen: acesSeenFromPlays(allPlays),
      trumpCardsSeenCount: countTrumpInPlays(allPlays, stateAfter.trumpSuit),
    };
  }

  if (variant === 'spades') {
    const spades = readSpadesState(stateAfter);
    const winnerTeam = (stateAfter.players[winnerIndex]?.team ?? 1) as 1 | 2;
    return {
      spadesBroken: Boolean(spades?.spadesBroken),
      spadesSeenInTrick: countSuitInPlays(trickPlays, 'spades'),
      winnerTeam,
      team1Tricks: typeof spades?.team1Tricks === 'number' ? spades.team1Tricks : null,
      team2Tricks: typeof spades?.team2Tricks === 'number' ? spades.team2Tricks : null,
    };
  }

  if (variant === 'hearts') {
    const hearts = readHeartsState(stateAfter);
    const trickCards = trickPlays.map((p) => p.card);
    const roundPoints = hearts?.roundPoints;
    return {
      heartsBroken: Boolean(hearts?.heartsBroken),
      heartsSeenInTrick: countSuitInPlays(trickPlays, 'hearts'),
      queenSpadesInTrick: hasQueenSpadesInTrick(trickCards),
      roundPointsSnapshot: Array.isArray(roundPoints)
        ? (roundPoints as number[]).slice()
        : [0, 0, 0, 0],
    };
  }

  if (variant === 'king') {
    if (isKingPtEngine(stateAfter)) {
      const king = readKingPtState(stateAfter)!;
      const contract = (king.contract as KingNegativeContract | null) ?? null;
      const trickNumber =
        trickNumberForKing ??
        (typeof king.trickNumber === 'number' ? king.trickNumber + 1 : 1);
      return {
        engine: 'king_pt',
        contractId: typeof king.contract === 'string' ? king.contract : null,
        contractType: typeof king.phase === 'string' ? king.phase : null,
        festaPhase: typeof king.festaPhase === 'string' ? king.festaPhase : null,
        festaMode: typeof king.festaMode === 'string' ? king.festaMode : null,
        noTrump: typeof king.noTrump === 'boolean' ? king.noTrump : null,
        trickNumber,
        penalizingCardIds: penalizingCardIdsKingPt(contract, trickPlays),
      };
    }

    const simplified = readKingSimplifiedState(stateAfter);
    const handType =
      simplified?.handType === 'positive' || simplified?.handType === 'negative'
        ? simplified.handType
        : 'negative';
    return {
      engine: 'king_simplified',
      handType,
      handIndex: typeof simplified?.handIndex === 'number' ? simplified.handIndex : 0,
      trickScoreDelta: handType === 'negative' ? -5 : 5,
    };
  }

  return {
    partnerIndex: 0,
    partnerWinning: false,
    acesSeen: acesSeenFromPlays(allPlays),
    trumpCardsSeenCount: 0,
  };
}

export function deriveTrickPoints(
  adapter: GameAdapter,
  stateAfter: GameState,
  trickCards: TrickPlayRecord[],
  trickNumberForKing: number | null
): { pointsInTrick: number | null; penaltiesInTrick: number | null } {
  const cards = trickCards.map((p) => p.card);

  switch (adapter.variant) {
    case 'sueca':
      return { pointsInTrick: suecaTrickPoints(cards), penaltiesInTrick: null };
    case 'hearts':
      return { pointsInTrick: heartsTrickPoints(cards), penaltiesInTrick: null };
    case 'spades':
      return { pointsInTrick: null, penaltiesInTrick: null };
    case 'king': {
      if (isKingPtEngine(stateAfter)) {
        const king = readKingPtState(stateAfter)!;
        const contract = (king.contract as KingNegativeContract | null) ?? null;
        const trickNumber =
          trickNumberForKing ??
          (typeof king.trickNumber === 'number' ? king.trickNumber + 1 : 1);
        if (contract) {
          const penalty = negativeTrickPenalty(contract, cards, trickNumber);
          return { pointsInTrick: null, penaltiesInTrick: penalty > 0 ? penalty : null };
        }
        if (king.festaMode === 'positive') {
          return { pointsInTrick: 25, penaltiesInTrick: null };
        }
        return { pointsInTrick: null, penaltiesInTrick: null };
      }
      const simplified = readKingSimplifiedState(stateAfter);
      const handType = simplified?.handType === 'positive' ? 'positive' : 'negative';
      const delta = handType === 'negative' ? -5 : 5;
      return { pointsInTrick: handType === 'positive' ? delta : null, penaltiesInTrick: handType === 'negative' ? Math.abs(delta) : null };
    }
    default:
      return { pointsInTrick: null, penaltiesInTrick: null };
  }
}
