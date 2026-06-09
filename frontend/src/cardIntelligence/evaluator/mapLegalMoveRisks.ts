import { Card } from '../../types/game';
import { getClassificationRiskRank } from './aggregateResults';
import { evaluateHypotheticalMove } from './evaluateHypotheticalMove';
import {
  LegalMoveRiskEntry,
  LegalMoveRiskMapInput,
  LegalMoveRiskMapResult,
} from './types';

function toRiskEntry(
  card: Card,
  evaluation: ReturnType<typeof evaluateHypotheticalMove>
): LegalMoveRiskEntry {
  return {
    card,
    classification: evaluation.classification,
    confidence: evaluation.confidence,
    reasonShort: evaluation.reasonShort,
    metricResults: evaluation.metricResults,
    betterAlternatives: evaluation.betterAlternatives,
    equivalentAlternatives: evaluation.equivalentAlternatives,
    riskRank: getClassificationRiskRank(evaluation.classification),
  };
}

function compareRiskEntries(a: LegalMoveRiskEntry, b: LegalMoveRiskEntry): number {
  if (b.riskRank !== a.riskRank) {
    return b.riskRank - a.riskRank;
  }
  return a.reasonShort.localeCompare(b.reasonShort);
}

/**
 * Maps comparative risk across all legal moves for a pre_decision encoded state.
 */
export function mapLegalMoveRisks(
  input: LegalMoveRiskMapInput
): LegalMoveRiskMapResult {
  const warnings: string[] = [];

  if (input.encodedState.encodeMode !== 'pre_decision') {
    warnings.push('encodedState.encodeMode must be pre_decision');
    return {
      entries: [],
      sortedByRisk: [],
      bestEntry: null,
      worstEntry: null,
      warnings,
    };
  }

  if (input.legalMoves.length === 0) {
    warnings.push('legalMoves is empty');
    return {
      entries: [],
      sortedByRisk: [],
      bestEntry: null,
      worstEntry: null,
      warnings,
    };
  }

  const entries = input.legalMoves.map((card) => {
    const evaluation = evaluateHypotheticalMove({
      encodedState: input.encodedState,
      hypotheticalCard: card,
      legalMoves: input.legalMoves,
      metricContext: input.metricContext,
      fixtureId: input.fixtureId,
      evaluatorMode: input.evaluatorMode,
      viewType: input.viewType,
      rawLogEvent: input.rawLogEvent,
      tierBTestContext: input.tierBTestContext,
    });
    return toRiskEntry(card, evaluation);
  });

  const sortedByRisk = [...entries].sort(compareRiskEntries);
  const bestEntry =
    sortedByRisk.length > 0
      ? sortedByRisk.reduce((best, cur) =>
          cur.riskRank < best.riskRank ? cur : best
        )
      : null;
  const worstEntry = sortedByRisk.length > 0 ? sortedByRisk[0] : null;

  return {
    entries,
    sortedByRisk,
    bestEntry,
    worstEntry,
    warnings,
  };
}
