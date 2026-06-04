import { CARD_INTELLIGENCE_LLM_ADVISORY } from '../../config/features';
import { cardsMatch } from '../shared/clone';
import { buildPromptTemplate } from './promptTemplate';
import { getDefaultMockProvider } from './mockProvider';
import {
  GetMiniLLMAdviceOptions,
  MiniLLMAdvisoryResult,
  MiniLLMDecisionInput,
  MINI_LLM_SCHEMA_VERSION,
} from './types';
import { validateLLMOutput } from './validateLLMOutput';

function buildDisabledResult(
  input: MiniLLMDecisionInput,
  reason: import('./types').MiniLLMFallbackReason,
  warnings: string[] = []
): MiniLLMAdvisoryResult {
  const advisoryCardIndex = input.fallbackMoveIndex;
  return {
    schemaVersion: MINI_LLM_SCHEMA_VERSION,
    requestId: input.requestId,
    mode: 'disabled',
    advisoryCard: input.fallbackMove,
    advisoryCardIndex,
    confidence: 'low',
    reasonShort: 'Advisory disabled — using fallback move.',
    consideredMetricIds: [],
    usedFallback: true,
    fallbackReason: reason,
    rawOutput: null,
    validByEngine: false,
    warnings,
  };
}

export async function getMiniLLMAdvice(
  input: MiniLLMDecisionInput,
  options: GetMiniLLMAdviceOptions = {}
): Promise<MiniLLMAdvisoryResult> {
  const warnings: string[] = [];

  if (input.encodedState.phase !== 'play') {
    return buildDisabledResult(input, 'phase_not_play', [
      `phase=${input.encodedState.phase}`,
    ]);
  }

  if (input.legalMoves.length === 0) {
    return buildDisabledResult(input, 'empty_legal_moves', ['no legal moves']);
  }

  const advisoryEnabled =
    options.forceAdvisory === true || CARD_INTELLIGENCE_LLM_ADVISORY;

  if (!advisoryEnabled) {
    return buildDisabledResult(input, 'disabled');
  }

  const prompt = buildPromptTemplate(input);
  const provider = options.provider ?? getDefaultMockProvider();

  let raw = null;
  try {
    raw = await provider.complete(prompt, input);
  } catch (error) {
    warnings.push(
      error instanceof Error ? error.message : String(error)
    );
    const validated = validateLLMOutput(input, null);
    return {
      schemaVersion: MINI_LLM_SCHEMA_VERSION,
      requestId: input.requestId,
      mode: 'advisory',
      advisoryCard: validated.appliedCard,
      advisoryCardIndex: input.legalMoves.findIndex((c) =>
        cardsMatch(c, validated.appliedCard)
      ),
      confidence: 'low',
      reasonShort: 'Provider error — fallback move.',
      consideredMetricIds: [],
      usedFallback: true,
      fallbackReason: 'provider_error',
      rawOutput: null,
      validByEngine: false,
      promptText: options.includePromptText ? prompt : undefined,
      warnings,
    };
  }

  const validated = validateLLMOutput(input, raw);
  const advisoryCardIndex = input.legalMoves.findIndex((c) =>
    cardsMatch(c, validated.appliedCard)
  );

  return {
    schemaVersion: MINI_LLM_SCHEMA_VERSION,
    requestId: input.requestId,
    mode: 'advisory',
    advisoryCard: validated.appliedCard,
    advisoryCardIndex: advisoryCardIndex >= 0 ? advisoryCardIndex : input.fallbackMoveIndex,
    confidence: raw.confidence,
    reasonShort: raw.reasonShort,
    consideredMetricIds: raw.consideredMetricIds,
    usedFallback: validated.usedFallback,
    fallbackReason: validated.fallbackReason,
    rawOutput: raw,
    validByEngine: validated.validByEngine,
    promptText: options.includePromptText ? prompt : undefined,
    warnings: [...warnings, ...validated.warnings],
  };
}
