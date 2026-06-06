import { CARD_INTELLIGENCE_LLM_ADVISORY } from '../../config/features';
import { cardsMatch } from '../shared/clone';
import { buildPromptTemplate } from './promptTemplate';
import { resolveProvider } from './providers/providerConfig';
import {
  GetMiniLLMAdviceOptions,
  MiniLLMAdvisoryResult,
  MiniLLMDecisionInput,
  MiniLLMDecisionOutput,
  MINI_LLM_SCHEMA_VERSION,
  MiniLLMFallbackReason,
  ValidationResult,
} from './types';
import { validateLLMOutput } from './validateLLMOutput';

function buildDisabledResult(
  input: MiniLLMDecisionInput,
  reason: MiniLLMFallbackReason,
  warnings: string[] = []
): MiniLLMAdvisoryResult {
  const advisoryCardIndex = input.fallbackMoveIndex;
  return {
    schemaVersion: MINI_LLM_SCHEMA_VERSION,
    requestId: input.requestId,
    mode: 'disabled',
    providerId: 'disabled',
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

function buildAdvisoryResult(params: {
  input: MiniLLMDecisionInput;
  providerId: string;
  validated: ValidationResult;
  raw: MiniLLMDecisionOutput | null;
  confidence: 'high' | 'medium' | 'low';
  reasonShort: string;
  consideredMetricIds: string[];
  fallbackReason: MiniLLMFallbackReason | null;
  promptText?: string;
  warnings: string[];
}): MiniLLMAdvisoryResult {
  const advisoryCardIndex = params.input.legalMoves.findIndex((c) =>
    cardsMatch(c, params.validated.appliedCard)
  );

  return {
    schemaVersion: MINI_LLM_SCHEMA_VERSION,
    requestId: params.input.requestId,
    mode: 'advisory',
    providerId: params.providerId,
    providerLatencyMs: params.raw?.latencyMs,
    advisoryCard: params.validated.appliedCard,
    advisoryCardIndex:
      advisoryCardIndex >= 0 ? advisoryCardIndex : params.input.fallbackMoveIndex,
    confidence: params.confidence,
    reasonShort: params.reasonShort,
    consideredMetricIds: params.consideredMetricIds,
    usedFallback: params.validated.usedFallback,
    fallbackReason: params.fallbackReason,
    rawOutput: params.raw,
    validByEngine: params.validated.validByEngine,
    promptText: params.promptText,
    warnings: params.warnings,
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
  const provider = options.provider ?? resolveProvider();
  const providerId = options.provider?.id ?? provider.id;

  let raw = null;
  try {
    raw = await provider.complete(prompt, input);
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : String(error));
    const validated = validateLLMOutput(input, null);
    return buildAdvisoryResult({
      input,
      providerId,
      validated,
      raw: null,
      confidence: 'low',
      reasonShort: 'Provider error — fallback move.',
      consideredMetricIds: [],
      fallbackReason: 'provider_error',
      promptText: options.includePromptText ? prompt : undefined,
      warnings,
    });
  }

  const validated = validateLLMOutput(input, raw);

  return buildAdvisoryResult({
    input,
    providerId,
    validated,
    raw,
    confidence: raw.confidence,
    reasonShort: raw.reasonShort,
    consideredMetricIds: raw.consideredMetricIds,
    fallbackReason: validated.fallbackReason,
    promptText: options.includePromptText ? prompt : undefined,
    warnings: [...warnings, ...validated.warnings],
  });
}
