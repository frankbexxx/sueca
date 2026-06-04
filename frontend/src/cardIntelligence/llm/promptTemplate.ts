import { EncodedDecisionState } from '../encoder/types';

const PROMPT_ALLOWLIST: (keyof EncodedDecisionState)[] = [
  'schemaVersion',
  'variant',
  'phase',
  'encodeMode',
  'viewType',
  'playerIndex',
  'hand',
  'legalMoves',
  'currentTrick',
  'trickPosition',
  'ledSuit',
  'trumpSuit',
  'currentWinner',
  'visiblePlayedCards',
  'importantCardsSeen',
  'scoreContext',
  'riskContext',
  'metricContext',
  'variantEncoding',
  'hiddenInformationPolicy',
];

export function sanitizeEncodedStateForPrompt(
  encodedState: EncodedDecisionState
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of PROMPT_ALLOWLIST) {
    if (key === 'hiddenInformationPolicy' && key in encodedState) {
      const policy = encodedState.hiddenInformationPolicy;
      out[key] = {
        viewType: policy.viewType,
        inferenceAllowed: policy.inferenceAllowed,
        sourceOfTruth: policy.sourceOfTruth,
      };
      continue;
    }
    if (key in encodedState) {
      out[key] = encodedState[key];
    }
  }
  return out;
}

function formatCard(card: { suit: string; rank: string; id?: string }): string {
  return card.id ?? `${card.rank}${card.suit[0]}`;
}

export function buildPromptTemplate(input: import('./types').MiniLLMDecisionInput): string {
  const stateJson = JSON.stringify(
    sanitizeEncodedStateForPrompt(input.encodedState),
    null,
    2
  );

  const legalLines = input.legalMoves
    .map((c, i) => `${i}: ${formatCard(c)}`)
    .join('\n');

  const metricLines = input.metricContext
    .filter((m) => m.applicable)
    .map((m) => `- ${m.metricId}: ${m.reasonShort ?? m.metricNameHuman ?? ''}`)
    .join('\n');

  const evalLines =
    input.evaluatorHints
      ?.map((h) => `- ${h.metricId} (${h.riskLevel}): ${h.reasonShort}`)
      .join('\n') ?? '';

  const memoryLines =
    input.memoryContext
      ?.map(
        (h) =>
          `- ${h.metricId}: ${h.reasonShort}${
            h.badRate != null ? ` (badRate=${h.badRate})` : ''
          }`
      )
      .join('\n') ?? '';

  const mandatoryRules =
    input.rulesContext.mandatoryRules?.map((r) => `- ${r}`).join('\n') ?? '';

  return [
    'SYSTEM:',
    'You are a trick-taking card game specialist assistant.',
    'You MUST choose ONLY from the legal move list provided.',
    'You MUST NOT invent cards not in the player hand or legal_moves.',
    'You MUST NOT assume hidden opponent cards beyond encoded state (player view).',
    'If uncertain, set confidence to "low" and fallbackRecommended to true.',
    '',
    `GAME: ${input.variant}`,
    `OBJECTIVE: ${input.rulesContext.objectiveShort}`,
    input.rulesContext.contractSummary
      ? `CONTRACT: ${input.rulesContext.contractSummary}`
      : '',
    mandatoryRules ? `MANDATORY RULES:\n${mandatoryRules}` : '',
    '',
    'ENCODED STATE (JSON, player view, pre-decision):',
    stateJson,
    '',
    'LEGAL MOVES (indexed):',
    legalLines,
    '',
    'METRICS TO CONSIDER (applicable only, not verdicts):',
    metricLines || '(none)',
    '',
    evalLines ? `EVALUATOR HINTS:\n${evalLines}\n` : '',
    memoryLines ? `MEMORY HINTS (advisory, may be wrong):\n${memoryLines}\n` : '',
    `BASELINE MOVE (heuristic fallback): index ${input.fallbackMoveIndex} — ${formatCard(input.fallbackMove)}`,
    '',
    'Respond with STRICT JSON only, no markdown:',
    '{',
    '  "selectedCardIndex": <number index into legal_moves>,',
    '  "selectedCard": "<card string matching legal_moves[index]>",',
    '  "confidence": "high" | "medium" | "low",',
    `  "reasonShort": "<max ${input.maxReasonLength} chars, technical>",`,
    '  "consideredMetricIds": ["..."],',
    '  "fallbackRecommended": false',
    '}',
    '',
    `FORBIDDEN: any card index outside 0..${input.legalMoves.length - 1}.`,
  ]
    .filter(Boolean)
    .join('\n');
}
