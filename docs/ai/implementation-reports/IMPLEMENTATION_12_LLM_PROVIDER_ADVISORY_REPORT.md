# IMPLEMENTATION_12_LLM_PROVIDER_ADVISORY — Relatório final

**ID:** `IMPLEMENTATION_12_LLM_PROVIDER_ADVISORY`  
**Prompt:** [IMPLEMENTATION_12_LLM_PROVIDER_ADVISORY_PROMPT.md](../implementation-prompts/IMPLEMENTATION_12_LLM_PROVIDER_ADVISORY_PROMPT.md) v1.1  
**Data:** 2026-05-31  
**Estado:** implementação concluída — **H12A OK** 2026-06-06; **H12B pendente** (Ollama real + CORS)

---

## Ficheiros criados

### `frontend/src/cardIntelligence/llm/providers/`

| Ficheiro | Função |
|----------|--------|
| `providerErrors.ts` | `ProviderError` tipado (network, timeout, parse, http, aborted, config) |
| `parseProviderJson.ts` | Parse JSON directo + extracção `{...}` de texto livre |
| `parseProviderJson.test.ts` | 5 testes |
| `ollamaProvider.ts` | `createOllamaProvider` — POST `/api/generate`, AbortController, `format: json` |
| `ollamaProvider.test.ts` | 4 testes (fetch mock, parse fail, HTTP 500, timeout) |
| `providerConfig.ts` | `readLlmProviderConfigFromEnv`, `resolveProvider` |
| `providerConfig.test.ts` | 4 testes (mock default, ollama configured, empty model → mock) |

---

## Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| [`frontend/src/config/features.ts`](../../frontend/src/config/features.ts) | `CARD_INTELLIGENCE_LLM_PROVIDER`, `LLM_ENDPOINT`, `LLM_MODEL` |
| [`frontend/src/cardIntelligence/llm/types.ts`](../../frontend/src/cardIntelligence/llm/types.ts) | `ProviderCallMetadata`; `providerId?`, `providerLatencyMs?` em `MiniLLMAdvisoryResult` |
| [`frontend/src/cardIntelligence/llm/getMiniLLMAdvice.ts`](../../frontend/src/cardIntelligence/llm/getMiniLLMAdvice.ts) | `resolveProvider()`; `buildAdvisoryResult`; metadata em todos os returns |
| [`frontend/src/cardIntelligence/llm/getMiniLLMAdvice.test.ts`](../../frontend/src/cardIntelligence/llm/getMiniLLMAdvice.test.ts) | Asserts `providerId`, provider throw fallback |
| [`frontend/src/cardIntelligence/llm/index.ts`](../../frontend/src/cardIntelligence/llm/index.ts) | Exports provider layer |
| [`frontend/.env.example`](../../frontend/.env.example) | Vars LLM comentadas + nota CORS Ollama |
| [`docs/ai/implementation-prompts/IMPLEMENTATION_12_LLM_PROVIDER_ADVISORY_PROMPT.md`](../implementation-prompts/IMPLEMENTATION_12_LLM_PROVIDER_ADVISORY_PROMPT.md) | v1.1 pós-análise |

**Não alterados:** `GameBoard.tsx`, `playWithLogging.ts`, bots, `*PlayStrategy`, `aiClient`, motores jogo, `debugConsole.ts` (helper já existia).

---

## Provider implementado

| Provider | ID | Quando activo |
|----------|-----|---------------|
| Mock (default) | `mock:local-stub-v0` | `PROVIDER=mock` ou model vazio ou flags off |
| Ollama local | `ollama:<model>` | `PROVIDER=ollama` + `LLM_MODEL` non-empty + advisory on |

**Cadeia:** `resolveProvider()` → Ollama se configurado → senão mock → `validateLLMOutput` → fallback se inválido.

---

## Feature flags e defaults

| Flag | Default |
|------|---------|
| `REACT_APP_CARD_INTELLIGENCE_LLM_ADVISORY` | `false` |
| `REACT_APP_CARD_INTELLIGENCE_LLM_PROVIDER` | `mock` |
| `REACT_APP_CARD_INTELLIGENCE_LLM_ENDPOINT` | `http://localhost:11434` |
| `REACT_APP_CARD_INTELLIGENCE_LLM_MODEL` | `''` (Ollama disabled) |

Helper `__ciGetMiniLLMAdvice`: requer `DEBUG && LLM_ADVISORY` (inalterado).

---

## Testes executados

```bash
npm test -- --testPathPattern=cardIntelligence/llm --watchAll=false   # 28 passed
npm test -- --testPathPattern=cardIntelligence --watchAll=false         # 243 passed
CI=true npm run build                                                 # OK
```

**Novos testes:** +14 (providers + getMiniLLMAdvice asserts). Total cardIntelligence: **243** (era 229).

---

## Exemplo advisory output

**Mock advisory OK:**

```json
{
  "mode": "advisory",
  "providerId": "mock:local-stub-v0",
  "providerLatencyMs": 0,
  "advisoryCard": { "id": "2c" },
  "validByEngine": true,
  "usedFallback": false,
  "rawOutput": { "modelId": "mock:local-stub-v0", "latencyMs": 0 }
}
```

**Provider error fallback:**

```json
{
  "mode": "advisory",
  "providerId": "mock:local-stub-v0",
  "usedFallback": true,
  "fallbackReason": "provider_error",
  "reasonShort": "Provider error — fallback move."
}
```

**Disabled (flag off):**

```json
{
  "mode": "disabled",
  "providerId": "disabled",
  "usedFallback": true,
  "fallbackReason": "disabled"
}
```

---

## Confirmação zero gameplay

- Zero imports de `getMiniLLMAdvice` / `resolveProvider` / `ollamaProvider` fora `cardIntelligence/`
- Zero referências LLM em `components/` ou hooks de gameplay
- Nenhuma alteração em `GameBoard`, `playWithLogging`, bots, motores

---

## Confirmação fallback

| Cenário | Cobertura |
|---------|-----------|
| Flag off | `mode: disabled` |
| Provider throw | `provider_error` |
| Ollama parse fail | `provider_error` (via catch) |
| Ollama timeout | `ProviderError timeout` → `provider_error` |
| illegal_card mock | `illegal_card` fallback |
| Model vazio + provider=ollama | resolve → mock |

---

## Dev Lab / report P1

**Deferido v0** (D10/D11): `includeLlmAdvice` em `runScenario` e secção LLM no report flow não implementados neste passo. Helper `__ciGetMiniLLMAdvice` suficiente para H12.

---

## `.env.example` — vars LLM documentadas

Adicionadas em [`frontend/.env.example`](../../frontend/.env.example) com comentários para DEBUG, ADVISORY, PROVIDER, ENDPOINT, MODEL e nota `OLLAMA_ORIGINS=*`.

---

## CORS Ollama — nota dev

Fetch browser → `http://localhost:11434` pode falhar sem CORS no daemon Ollama. Para teste H12 real:

```bash
OLLAMA_ORIGINS=* ollama serve
```

Alternativa: H12 **OK parcial** só com mock (aceite §20).

---

## Gaps / deferidos

| Item | Estado |
|------|--------|
| WebLLM browser | P2 |
| Dev Lab `includeLlmAdvice` | P1 deferido |
| Report flow secção LLM | P1 deferido |
| Retry Ollama | Defer |
| Streaming | Defer |

---

## Checkpoints

| Checkpoint | Estado |
|------------|--------|
| CI Impl 12 | OK |
| **H12A** | **OK** — 2026-06-06 (Francisco) |
| **H12B** | **Pendente** — Ollama real + CORS + latência |

### Evidência H12A (2026-06-06)

| Teste | Resultado |
|-------|-----------|
| IDB | 40 plays; evento com `legalMoves: 3` |
| Helper com flags | `typeof __ciGetMiniLLMAdvice === 'function'` |
| Mock advisory | `mode: advisory`, `providerId: mock:local-stub-v0`, `validByEngine: true`, `usedFallback: false` |
| Metadata | `providerLatencyMs: 0`, `modelId: mock:local-stub-v0` |
| Carta legal | `legal check: true` |
| Zero gameplay | `cardUnchanged: true` |
| Flags off (A6) | `typeof __ciGetMiniLLMAdvice === 'undefined'` |
| Prod Vercel | Jogo normal sem flags LLM — não partido |

**H12B (pendente):** `PROVIDER=ollama` + `OLLAMA_ORIGINS=*` + advice num evento IDB com latência/model reais.

---

## Próximos passos

1. **H12B** — Ollama local + CORS (opcional para fecho Impl 12 completo)
2. P1 Dev Lab / report flow LLM (opcional)
3. **Melhoria bots** — após H12B ou H12A OK (gate roadmap)
4. Decision assist — **não** antes de gates F7

---

## Actualização plano/status

Actualizado: `IMPLEMENTATION_PLAN_AI.md` + `CARD_INTELLIGENCE_STATUS_REPORT.md` (H12A OK).
