# IMPLEMENTATION_8_MINI_LLM_ADVISORY — Relatório final

**ID:** `IMPLEMENTATION_8_MINI_LLM_ADVISORY`  
**Prompt:** [IMPLEMENTATION_8_MINI_LLM_ADVISORY_PROMPT.md](../implementation-prompts/IMPLEMENTATION_8_MINI_LLM_ADVISORY_PROMPT.md) (revisão A1–A6 aplicada)  
**Data:** 2026-05-31  
**Estado:** implementação concluída — **H8 pendente** (validação manual Francisco)

---

## Ficheiros criados

### `frontend/src/cardIntelligence/llm/`

| Ficheiro | Função |
|----------|--------|
| `types.ts` | Schemas 7.0.0, `MiniLLMAdvisoryResult`, `MiniLLMFallbackReason`, provider types |
| `validateLLMOutput.ts` | Regras V1–V9; carta sempre legal ou fallback |
| `buildRulesContext.ts` | Objectivos por variant; King contract-first; Hearts anti-pontos |
| `promptTemplate.ts` | `buildPromptTemplate`, `sanitizeEncodedStateForPrompt` (allowlist) |
| `mockProvider.ts` | `MockMiniLLMProvider` + factories de teste; zero rede |
| `buildMiniLLMInput.ts` | `buildMiniLLMInput`, `buildMiniLLMInputFromStoredEvent`, `mapMetricResultsToEvaluatorHints` |
| `getMiniLLMAdvice.ts` | Orquestrador advisory; fail-silent; flag-aware |
| `index.ts` | Exports públicos |
| `*.test.ts` | 14 testes (4 suites) |

---

## Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| [`frontend/src/config/features.ts`](../../frontend/src/config/features.ts) | `CARD_INTELLIGENCE_LLM_ADVISORY` (default **false**) |
| [`frontend/src/cardIntelligence/debug/debugConsole.ts`](../../frontend/src/cardIntelligence/debug/debugConsole.ts) | `__ciGetMiniLLMAdvice` iff `DEBUG && LLM_ADVISORY` |
| [`frontend/src/cardIntelligence/index.ts`](../../frontend/src/cardIntelligence/index.ts) | Exports dev llm |
| [`docs/ai/implementation-prompts/IMPLEMENTATION_8_MINI_LLM_ADVISORY_PROMPT.md`](../implementation-prompts/IMPLEMENTATION_8_MINI_LLM_ADVISORY_PROMPT.md) | Revisão A1–A6 (§16/§18, D6, §9.4, sanitize, D16) |

**Não alterados:** `GameBoard.tsx`, `playWithLogging.ts`, bots, `*PlayStrategy`, `aiClient`, motores jogo.

---

## Resumo técnico

1. **`getMiniLLMAdvice`** — modo `disabled` se flag off; `advisory` com `forceAdvisory` (helper dev). **Nunca** chama `playCard`.

2. **`MockMiniLLMProvider`** — devolve baseline legal; behaviours de teste: illegal, invalid_index, fallback_recommended, throw.

3. **`validateLLMOutput`** — illegal / invalid index / fallbackRecommended → `fallbackMove`; `validByEngine: true` só se carta ∈ legalMoves ∩ hand.

4. **`sanitizeEncodedStateForPrompt`** — allowlist top-level; `hiddenInformationPolicy` sem `excludedFields` (evita leak de nomes engine no prompt).

5. **Pipeline offline** — `buildMiniLLMInputFromStoredEvent` reutiliza pairing Impl 7 + encode **pre_decision**; hints evaluator via §9.4; memory opcional.

6. **Flags duplas** — helper LLM só com `CARD_INTELLIGENCE_DEBUG && CARD_INTELLIGENCE_LLM_ADVISORY`.

---

## Helpers disponíveis

| Helper | Condição |
|--------|----------|
| `window.__ciGetMiniLLMAdvice(eventId, opts?)` | Ambas flags true |
| `window.__ci.getMiniLLMAdvice` | Idem (namespace) |

**Activar localmente:**

```bash
REACT_APP_CARD_INTELLIGENCE_DEBUG=true \
REACT_APP_CARD_INTELLIGENCE_LLM_ADVISORY=true \
npm start
```

**Prod default:** sem flags → `__ciGetMiniLLMAdvice` **undefined**.

---

## Exemplo `MiniLLMAdvisoryResult` (JSON)

```json
{
  "schemaVersion": "7.0.0",
  "requestId": "llm-1735689600000-abc123",
  "mode": "advisory",
  "advisoryCard": { "suit": "clubs", "rank": "2", "id": "2c" },
  "advisoryCardIndex": 0,
  "confidence": "medium",
  "reasonShort": "Mock stub — baseline heuristic move.",
  "consideredMetricIds": ["S16"],
  "usedFallback": false,
  "fallbackReason": null,
  "validByEngine": true,
  "warnings": []
}
```

Com flag off:

```json
{
  "mode": "disabled",
  "usedFallback": true,
  "fallbackReason": "disabled",
  "validByEngine": false
}
```

---

## Testes executados

```bash
cd frontend
CI=true npm test -- --testPathPattern=llm --watchAll=false
# 14 passed (4 suites)

CI=true npm test -- --testPathPattern=cardIntelligence --watchAll=false
# 31 suites, 165 passed (+14 vs Impl 7)

CI=true npm run build
REACT_APP_CARD_INTELLIGENCE_LLM_ADVISORY=true CI=true npm run build
# OK both

grep -r "getMiniLLMAdvice\|MockMiniLLMProvider" frontend/src \
  --include="*GameBoard*" --include="*playWithLogging*" --include="*PlayStrategy*"
# no matches
```

---

## Confirmação zero gameplay

- Nenhum hook em `GameBoard`, bots, estratégias AI.
- Mini-LLM **não** corre em live gameplay — só helper dev explícito.
- Zero chamadas provider real (mock only; sem fetch/Ollama/WebLLM em `llm/`).

---

## Gaps / riscos (v1+)

| Gap | Nota |
|-----|------|
| Provider real (Ollama/WebLLM) | v1 |
| Decision assist + GameBoard | v1 — proibido v0 |
| `decisionSource: mini_llm` no logger | v1 |
| `llm/` → `debug/` import | OK v0 (D16); extrair pairing para `shared/` se bundle exigir |
| `fallbackMove` = `legalMoves[0]` em debug | v1: heurística bot real |
| UI coach advisory | v1 |

---

## Próximos passos

1. **H8 humano** — checklist §14 da prompt.
2. v1: provider real + decision assist (com validação engine obrigatória).
3. Logger `decisionSource` quando decision assist estável.

---

## Como validar H8 (checklist)

1. [ ] `REACT_APP_CARD_INTELLIGENCE_DEBUG=true REACT_APP_CARD_INTELLIGENCE_LLM_ADVISORY=true npm start`
2. [ ] Evento IDB existente → `await __ciGetMiniLLMAdvice('<eventId>')`
3. [ ] `advisoryCard` ∈ `legalMoves`; `promptText` sem `"opponentHands"` / `"deckRemaining"`
4. [ ] Confirmar **nenhuma carta jogada** automaticamente
5. [ ] Prod sem flags: `typeof window.__ciGetMiniLLMAdvice === 'undefined'`
6. [ ] OK para v1 provider real

---

## Histórico

| Versão | Data | Nota |
|--------|------|------|
| 1.0 | 2026-05-31 | Impl 8 advisory mock-only; llm/; flags duplas; 165 testes CI |
