import { Card } from '../../../types/game';
import { DEFAULT_MAX_REASON_LENGTH } from '../types';

const MAX_RAW_TEXT_BYTES = 8192;

export interface ParsedProviderResponse {
  selectedCardIndex: number | null;
  selectedCard: Card | null;
  confidence: 'high' | 'medium' | 'low';
  reasonShort: string;
  consideredMetricIds: string[];
  fallbackRecommended: boolean;
}

function truncateReason(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

function extractBalancedJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

function normalizeConfidence(value: unknown): 'high' | 'medium' | 'low' {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }
  return 'medium';
}

function normalizeMetricIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function normalizeCard(value: unknown): Card | null {
  if (!value || typeof value !== 'object') return null;
  const card = value as Partial<Card>;
  if (
    typeof card.suit !== 'string' ||
    typeof card.rank !== 'string' ||
    typeof card.id !== 'string'
  ) {
    return null;
  }
  return { suit: card.suit, rank: card.rank, id: card.id };
}

function normalizeParsedObject(
  parsed: Record<string, unknown>,
  maxReasonLength: number
): ParsedProviderResponse | null {
  const indexValue = parsed.selectedCardIndex;
  const selectedCardIndex =
    typeof indexValue === 'number' && Number.isFinite(indexValue)
      ? indexValue
      : null;

  const reasonValue = parsed.reasonShort;
  if (typeof reasonValue !== 'string' || reasonValue.trim().length === 0) {
    return null;
  }

  return {
    selectedCardIndex,
    selectedCard: normalizeCard(parsed.selectedCard),
    confidence: normalizeConfidence(parsed.confidence),
    reasonShort: truncateReason(reasonValue.trim(), maxReasonLength),
    consideredMetricIds: normalizeMetricIds(parsed.consideredMetricIds),
    fallbackRecommended: parsed.fallbackRecommended === true,
  };
}

export function parseProviderJson(
  rawText: string,
  maxReasonLength = DEFAULT_MAX_REASON_LENGTH
): ParsedProviderResponse | null {
  const trimmed = rawText.trim().slice(0, MAX_RAW_TEXT_BYTES);
  if (!trimmed) return null;

  const candidates = [trimmed];
  const extracted = extractBalancedJsonObject(trimmed);
  if (extracted && extracted !== trimmed) {
    candidates.push(extracted);
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Record<string, unknown>;
      const normalized = normalizeParsedObject(parsed, maxReasonLength);
      if (normalized) return normalized;
    } catch {
      // try next candidate
    }
  }

  return null;
}
