import { CARD_HIERARCHY, Card, Suit } from '../../types/game';
import { cardsMatch } from '../shared/clone';
import {
  cardWouldWinTrickStandard,
  cardWouldWinTrickSueca,
  inferTrickLeader,
} from '../encoder/trickHelpers';
import {
  HeartsEncoding,
  KingEncoding,
  SpadesEncoding,
  SuecaEncoding,
} from '../encoder/types';
import { EvaluatorContext, MetricEvaluationResult } from './types';

export function isMetricApplicable(
  ctx: EvaluatorContext,
  metricId: string
): boolean {
  const entry = ctx.metricContext.find((m) => m.metricId === metricId);
  if (!entry) return false;
  if (ctx.evaluatorMode === 'strict') {
    return entry.applicable && entry.missingFields.length === 0;
  }
  return entry.applicable;
}

export function notApplicable(metricId: string): MetricEvaluationResult {
  return {
    metricId,
    classification: 'not_applicable',
    reasonShort: 'Métrica não aplicável neste contexto.',
    betterAlternatives: [],
  };
}

export function result(
  metricId: string,
  classification: MetricEvaluationResult['classification'],
  reasonShort: string,
  betterAlternatives: Card[] = []
): MetricEvaluationResult {
  return { metricId, classification, reasonShort, betterAlternatives };
}

export function trickLeader(ctx: EvaluatorContext): number {
  return inferTrickLeader(ctx.state.playerIndex, ctx.state.turnIndex);
}

export function chosenWinsTrickSueca(ctx: EvaluatorContext): boolean {
  return cardWouldWinTrickSueca(
    ctx.chosenCard,
    ctx.state.currentTrick.slice(0, -1).length > 0
      ? ctx.state.currentTrick.slice(0, ctx.state.trickPosition)
      : ctx.state.currentTrick.filter((_, i) => i < ctx.state.trickPosition),
    trickLeader(ctx),
    ctx.state.trumpSuit
  );
}

export function chosenWinsTrickStandard(ctx: EvaluatorContext): boolean {
  const trickBefore =
    ctx.state.trickPosition > 0
      ? ctx.state.currentTrick.slice(0, ctx.state.trickPosition)
      : [];
  return cardWouldWinTrickStandard(
    ctx.chosenCard,
    trickBefore,
    trickLeader(ctx),
    ctx.state.variant === 'sueca' ? ctx.state.trumpSuit : null
  );
}

export function lowestWinningStandard(
  ctx: EvaluatorContext,
  trump: Suit | null
): Card | null {
  const trickBefore =
    ctx.state.trickPosition > 0
      ? ctx.state.currentTrick.slice(0, ctx.state.trickPosition)
      : [];
  const leader = trickLeader(ctx);
  const winners = ctx.legalMoves.filter((c) =>
    cardWouldWinTrickStandard(c, trickBefore, leader, trump)
  );
  if (winners.length === 0) return null;
  return winners.reduce((best, cur) =>
    CARD_HIERARCHY[cur.rank] < CARD_HIERARCHY[best.rank] ? cur : best
  );
}

export function lowestWinningSpade(ctx: EvaluatorContext): Card | null {
  const trickBefore = ctx.state.currentTrick;
  const leader = trickLeader(ctx);
  const spades = ctx.legalMoves.filter((c) => c.suit === 'spades');
  const winners = spades.filter((c) =>
    cardWouldWinTrickStandard(c, trickBefore, leader, 'spades')
  );
  if (winners.length === 0) return null;
  return winners.reduce((best, cur) =>
    CARD_HIERARCHY[cur.rank] < CARD_HIERARCHY[best.rank] ? cur : best
  );
}

export function suecaEnc(ctx: EvaluatorContext): SuecaEncoding {
  return ctx.state.variantEncoding as SuecaEncoding;
}

export function spadesEnc(ctx: EvaluatorContext): SpadesEncoding {
  return ctx.state.variantEncoding as SpadesEncoding;
}

export function heartsEnc(ctx: EvaluatorContext): HeartsEncoding {
  return ctx.state.variantEncoding as HeartsEncoding;
}

export function kingEnc(ctx: EvaluatorContext): KingEncoding {
  return ctx.state.variantEncoding as KingEncoding;
}

export function isLeading(ctx: EvaluatorContext): boolean {
  return ctx.state.trickPosition === 0 || ctx.state.currentTrick.length === 0;
}

export function compareChosenToCheapestWinner(
  ctx: EvaluatorContext,
  metricId: string,
  cheapest: Card | null,
  winFn: (c: Card) => boolean
): MetricEvaluationResult | null {
  if (!cheapest) return null;
  if (cardsMatch(ctx.chosenCard, cheapest)) {
    return result(metricId, 'good', 'Ganhou com a carta mínima que chega.');
  }
  if (winFn(ctx.chosenCard)) {
    return result(
      metricId,
      'medium',
      'Ganhou, mas havia carta mais baixa que chegava.',
      [cheapest]
    );
  }
  return result(metricId, 'good', 'Não subiu desnecessariamente.');
}

export function detectIncompleteContext(
  ctx: EvaluatorContext,
  metricResults: MetricEvaluationResult[]
): boolean {
  if (metricResults.some((r) => r.classification === 'partial')) {
    return true;
  }

  if (ctx.state.variant === 'sueca') {
    const s = suecaEnc(ctx);
    const strategic = ['S08', 'S12', 'T04'];
    if (ctx.state.currentTrick.length === 0) return false;
    for (const id of strategic) {
      const entry = ctx.metricContext.find((m) => m.metricId === id);
      if (entry?.applicable && s.cutRisk === null) return true;
    }
  }

  return false;
}

export function tierBPartialMetric(
  ctx: EvaluatorContext,
  metricId: string,
  reason: string
): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, metricId)) {
    return result(metricId, 'partial', reason);
  }
  return null;
}
