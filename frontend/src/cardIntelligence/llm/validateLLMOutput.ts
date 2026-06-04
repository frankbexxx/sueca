import { cardsMatch } from '../shared/clone';
import {
  MiniLLMDecisionInput,
  MiniLLMDecisionOutput,
  MiniLLMFallbackReason,
  ValidationResult,
} from './types';

function resolveFallbackCard(input: MiniLLMDecisionInput) {
  if (input.legalMoves.length === 0) {
    return input.fallbackMove;
  }
  const inLegal = input.legalMoves.some((c) => cardsMatch(c, input.fallbackMove));
  return inLegal ? input.fallbackMove : input.legalMoves[0];
}

export function validateLLMOutput(
  input: MiniLLMDecisionInput,
  raw: MiniLLMDecisionOutput | null
): ValidationResult {
  const warnings: string[] = [];
  const fallbackCard = resolveFallbackCard(input);

  if (!raw) {
    return {
      appliedCard: fallbackCard,
      appliedSource: 'fallback',
      validByEngine: false,
      usedFallback: true,
      fallbackReason: 'invalid_json',
      warnings: ['null provider output'],
    };
  }

  if (raw.latencyMs >= input.timeoutMs) {
    return {
      appliedCard: fallbackCard,
      appliedSource: 'fallback',
      validByEngine: false,
      usedFallback: true,
      fallbackReason: 'timeout',
      warnings: [`latency ${raw.latencyMs}ms >= timeout ${input.timeoutMs}ms`],
    };
  }

  if (raw.fallbackRecommended) {
    return {
      appliedCard: fallbackCard,
      appliedSource: 'fallback',
      validByEngine: false,
      usedFallback: true,
      fallbackReason: 'fallback_recommended',
      warnings: ['provider recommended fallback'],
    };
  }

  const index = raw.selectedCardIndex;
  if (
    index === null ||
    index === undefined ||
    index < 0 ||
    index >= input.legalMoves.length
  ) {
    return {
      appliedCard: fallbackCard,
      appliedSource: 'fallback',
      validByEngine: false,
      usedFallback: true,
      fallbackReason: 'invalid_index',
      warnings: [`invalid selectedCardIndex: ${String(index)}`],
    };
  }

  const cardFromIndex = input.legalMoves[index];
  const selected = raw.selectedCard ?? cardFromIndex;

  if (!input.legalMoves.some((m) => cardsMatch(m, selected))) {
    return {
      appliedCard: fallbackCard,
      appliedSource: 'fallback',
      validByEngine: false,
      usedFallback: true,
      fallbackReason: 'illegal_card',
      warnings: ['selectedCard not in legalMoves'],
    };
  }

  if (!input.encodedState.hand.some((h) => cardsMatch(h, selected))) {
    return {
      appliedCard: fallbackCard,
      appliedSource: 'fallback',
      validByEngine: false,
      usedFallback: true,
      fallbackReason: 'illegal_card',
      warnings: ['selectedCard not in hand'],
    };
  }

  if (raw.confidence === 'low' && raw.fallbackRecommended) {
    return {
      appliedCard: fallbackCard,
      appliedSource: 'fallback',
      validByEngine: false,
      usedFallback: true,
      fallbackReason: 'low_confidence_policy',
      warnings: ['low confidence with fallback recommended'],
    };
  }

  return {
    appliedCard: selected,
    appliedSource: 'mini_llm',
    validByEngine: true,
    usedFallback: false,
    fallbackReason: null,
    warnings,
  };
}

export function emptyLegalMovesResult(
  input: MiniLLMDecisionInput
): ValidationResult {
  return {
    appliedCard: input.fallbackMove,
    appliedSource: 'fallback',
    validByEngine: false,
    usedFallback: true,
    fallbackReason: 'empty_legal_moves' as MiniLLMFallbackReason,
    warnings: ['legalMoves empty'],
  };
}
