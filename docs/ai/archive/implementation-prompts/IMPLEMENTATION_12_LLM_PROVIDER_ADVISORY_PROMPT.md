# IMPLEMENTATION_12_LLM_PROVIDER_ADVISORY — Prompt de implementação

**ID:** `IMPLEMENTATION_12_LLM_PROVIDER_ADVISORY`  
**Plano pai:** [IMPLEMENTATION_PLAN_AI.md](../IMPLEMENTATION_PLAN_AI.md) v1.4 — próximo bloco pós-Impl 11 + H11 OK  
**Design base:** [FASE_7_MINI_LLM_DESIGN.md](../FASE_7_MINI_LLM_DESIGN.md) v1.1 §6–§11 · [FASE_4_ENCODER_DESIGN.md](../FASE_4_ENCODER_DESIGN.md) · [FASE_5_AVALIADOR_DESIGN.md](../FASE_5_AVALIADOR_DESIGN.md)  
**Status report:** [CARD_INTELLIGENCE_STATUS_REPORT.md](../CARD_INTELLIGENCE_STATUS_REPORT.md) v1.6 · [ROADMAP_COMPLIANCE_REVIEW.md](../reviews/ROADMAP_COMPLIANCE_REVIEW.md) · [TECHNICAL_INTEGRITY_REVIEW.md](../reviews/TECHNICAL_INTEGRITY_REVIEW.md)  
**Pré-requisitos:** [IMPLEMENTATION_8_MINI_LLM_ADVISORY_REPORT.md](../implementation-reports/IMPLEMENTATION_8_MINI_LLM_ADVISORY_REPORT.md) · [IMPLEMENTATION_9_DEV_SEEDED_GAME_LAB_REPORT.md](../implementation-reports/IMPLEMENTATION_9_DEV_SEEDED_GAME_LAB_REPORT.md) · [IMPLEMENTATION_10_DEBUG_REPORT_FLOW_REPORT.md](../implementation-reports/IMPLEMENTATION_10_DEBUG_REPORT_FLOW_REPORT.md) · [IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md](../implementation-reports/IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md) — **H11 OK** recomendado  
**Código base:** [`frontend/src/cardIntelligence/llm/`](../../frontend/src/cardIntelligence/llm/) · [`debug/`](../../frontend/src/cardIntelligence/debug/) · [`devLab/`](../../frontend/src/cardIntelligence/devLab/) · [`config/features.ts`](../../frontend/src/config/features.ts)  
**Data:** 2026-05-31  
**Scope desta prompt:** guia **executável** para o **primeiro provider LLM real** em modo advisory/debug. **v1.1** incorpora revisão pós-análise (providerId explícito, CORS, timeout, `.env.example`).

**Tipo de documento:** prompt de **implementação** (Agent mode) — não é relatório de estado, não é CI, não é o relatório pós-código (**§19**).

**Mapa de secções (referências internas — usar estes números):**

| § | Conteúdo |
|---|----------|
| §1–§2 | Objectivo, escopo |
| §3 | Regra central, cadeia fallback |
| §4 | Código existente (baseline Impl 8) |
| §5–§6 | Interface provider, Ollama, config |
| §7 | Integração debug / Dev Lab / report |
| §8–§9 | Validação output, reporting |
| §10 | Prompt template (reutilizar) |
| §11–§12 | Ficheiros, feature flags |
| §13–§15 | Ordem impl, testes, CI |
| §16–§18 | Critérios, riscos, decisões D1–D12 |
| **§19** | **Relatório final pós-código** |
| **§20** | **Checkpoint H12** (humano) |
| **§21** | Dúvidas Q1–Q10 |
| **§22** | Metadados |

**Posicionamento no roadmap:**

```
Impl 1–11 (fechados) → Impl 12 Provider LLM real (advisory/debug) → Melhoria bots → Decision assist (futuro)
```

**Princípio:** Implementation 12 **activa** o conselheiro com provider local real (Ollama) — **só** quando flags debug explícitas pedem advice. A LLM **nunca** joga carta; engine/validator continua soberano; mock permanece fallback.

| Camada | Metáfora | Impl |
|--------|----------|------|
| Logger | Gravador | 1–2 |
| Encoder | Tradutor | 3 |
| Avaliador v1 Tier B | Juiz heurísticas | 11 |
| Dev Lab + Report Flow | Laboratório legível | 9–10 |
| Mini-LLM mock | Conselheiro stub | 8 |
| **Provider LLM real** | **Conselheiro local** | **12 (esta prompt)** |

**Checkpoint humano H12:** validação **pós**-Impl 12 — flags debug + provider local (se disponível) → advice num cenário Dev Lab ou evento IDB → confirmar **zero cartas jogadas**, carta sugerida legal, fallback funcional, report com provider/model/latência. **Não** confundir com H8 (mock only) nem H11 (evaluator Tier B).

**Gates:**

| Fase | Bloqueio |
|------|----------|
| Redigir/ler esta prompt | **Nenhum** |
| Implementar código Impl 12 | **H11 OK recomendado** (evaluator + Dev Lab Tier B estáveis) |
| Checkpoint H12 humano | **Depois** de CI verde + relatório Impl 12 |

**Supersede Impl 8 (provider):** Impl 8 entregou **mock only** — zero rede. **Esta prompt prevalece:** adicionar provider real **local-first** (Ollama) mantendo mock como default e fallback.

**Supersede F7 §7 (rollout v0):** F7 lista Ollama/WebLLM na cadeia. **Impl 12 v0:** Ollama configurável + mock fallback; WebLLM **P2** (§2.2).

**Supersede nomenclatura user (`call(input)`):** interface canónica existente é `MiniLLMProvider.complete(prompt, input)` — **não renomear**; §5 documenta equivalência semântica.

**Supersede plano-mãe (integração):** qualquer menção futura a hook LLM em `GameBoard` — **proibido** v0 Impl 12; apenas helpers debug + Dev Lab opcional.

**Estado repo ao redigir esta prompt:**

| Artefacto | Estado |
|-----------|--------|
| `cardIntelligence/llm/` | **Existe** — mock, validate, promptTemplate, getMiniLLMAdvice |
| `llm/providers/` | **Não existe** — criar §11 |
| Provider real | **Não existe** — mock default |
| `__ciGetMiniLLMAdvice` | **Existe** — `DEBUG && LLM_ADVISORY` |
| Dev Lab LLM | **Não integrado** — P1 §7.3 |
| Report flow secção LLM | **Não existe** — P1 §7.4 |
| Flags provider | **Não existem** — propor §12 |

---

## Ficheiros-fonte obrigatórios (ler antes de implementar)

| Ficheiro | O que verificar |
|----------|-----------------|
| [`llm/types.ts`](../../frontend/src/cardIntelligence/llm/types.ts) | `MiniLLMProvider`, `MiniLLMAdvisoryResult`, fallback reasons |
| [`llm/getMiniLLMAdvice.ts`](../../frontend/src/cardIntelligence/llm/getMiniLLMAdvice.ts) | Orquestrador; provider inject via options |
| [`llm/mockProvider.ts`](../../frontend/src/cardIntelligence/llm/mockProvider.ts) | Factory mock; behaviours teste |
| [`llm/validateLLMOutput.ts`](../../frontend/src/cardIntelligence/llm/validateLLMOutput.ts) | Regras V1–V9 |
| [`llm/promptTemplate.ts`](../../frontend/src/cardIntelligence/llm/promptTemplate.ts) | Player View allowlist; JSON estrito |
| [`llm/buildMiniLLMInput.ts`](../../frontend/src/cardIntelligence/llm/buildMiniLLMInput.ts) | Pipeline offline pre_decision |
| [`debug/debugConsole.ts`](../../frontend/src/cardIntelligence/debug/debugConsole.ts) | `__ciGetMiniLLMAdvice` |
| [`devLab/runScenario.ts`](../../frontend/src/cardIntelligence/devLab/runScenario.ts) | Cenários seeded — hook advice P1 |
| [`config/features.ts`](../../frontend/src/config/features.ts) | Padrão `REACT_APP_*` |
| Relatório [Impl 8](../implementation-reports/IMPLEMENTATION_8_MINI_LLM_ADVISORY_REPORT.md) | Baseline mock advisory |
| Relatório [Impl 10](../implementation-reports/IMPLEMENTATION_10_DEBUG_REPORT_FLOW_REPORT.md) | Report flow |
| Relatório [Impl 11](../implementation-reports/IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md) | Evaluator hints no input LLM |

---

## Instruções para o agente implementador

1. Confirmar **H11 OK recomendado**; ler esta prompt + FASE_7 §6–§11 + relatórios Impl 8–11.
2. Implementar **apenas** §2.1; recusar §2.2.
3. Ordem de implementação **D12:** providerConfig → providerErrors → ollamaProvider → resolveProvider → getMiniLLMAdvice → testes → debug/Dev Lab P1 → relatório §19.
4. **Zero** gameplay, bots, `GameBoard`, `playWithLogging`, motores `*Game.ts`, `*PlayStrategy`, `aiClient`.
5. **Não** activar decision assist; **não** auto-chamar LLM no hot path.
6. **Não** guardar API keys; **não** provider cloud por defeito; **não** depender de internet para jogo normal.
7. Provider real **disabled por defeito** — mock/fallback se flags off ou config incompleta.
8. Toda resposta passa `validateLLMOutput` — illegal → fallback (§8).
9. Timeout + abort obrigatórios no provider real (§5.3).
10. Reutilizar `buildPromptTemplate` — **não** duplicar prompt (§10).
11. Chamadas LLM **só** via acção debug explícita (`__ciGetMiniLLMAdvice`, Dev Lab opt-in) — nunca automático em partida live.
12. CI: §15 + grep hot path §15.3.
13. Relatório final **§19**; validação humana **§20** (H12).
14. Actualizar `IMPLEMENTATION_PLAN_AI.md` + `CARD_INTELLIGENCE_STATUS_REPORT.md` **no relatório Impl 12** (não nesta fase documental).
15. Manter **390+** testes cardIntelligence verdes (baseline pós-Impl 11); novos testes provider isolados com `fetch` mock.
16. **Obrigatório:** popular `providerId` e `providerLatencyMs` em **todos** os returns de `getMiniLLMAdvice` (§7.1.1) — não só trocar origem do provider.
17. Documentar vars LLM em [`frontend/.env.example`](../../frontend/.env.example) no relatório §19.

---

# 1. Objectivo

Implementation 12 fecha o gap **«conselheiro com provider real local»** da Card Intelligence:

1. Completar camada **provider-agnostic** com implementação **Ollama** mínima e configurável.
2. Integrar **apenas** em modo **advisory/debug** — helpers existentes + extensões Dev Lab/report opcionais.
3. Garantir **fallback 100%** — mock, heurística baseline, ou primeira legal; nunca bloquear gameplay.
4. Reportar metadata útil: provider, modelId, latencyMs, fallbackUsed, validationWarnings, reasonShort.

**Não é objectivo:** melhorar qualidade das sugestões LLM, treinar modelo, decision assist, ou ligar ao GameBoard.

---

# 2. Escopo

## 2.1 Dentro do escopo (v0)

| # | Entrega |
|---|---------|
| 1 | Pasta `llm/providers/` — config, errors, Ollama |
| 2 | `resolveProvider()` — selecciona mock vs Ollama via flags/env |
| 3 | Ollama: endpoint + model configuráveis; **disabled** sem config válida |
| 4 | Timeout + AbortController; error handling tipado |
| 5 | Parse JSON estrito + extracção de JSON de texto livre (fallback se falhar) |
| 6 | Integração em `getMiniLLMAdvice` — provider real quando flags + config OK |
| 7 | `__ciGetMiniLLMAdvice` continua a funcionar; enriquecer resultado com provider metadata |
| 8 | **P1:** Dev Lab `includeLlmAdvice` opcional em `runScenario` |
| 9 | **P1:** secção LLM opcional no report flow (event/scenario) |
| 10 | Testes unitários provider + regressão mock |
| 11 | Feature flags §12 — tudo **off** por defeito |

## 2.2 Fora do escopo (proibido v0)

| Item | Motivo |
|------|--------|
| Decision assist / decision-only | F7 §6 — fase posterior |
| Jogar carta no GameBoard | Regra central roadmap |
| Alterar bots / `*PlayStrategy` / `aiClient` | Scope Card Intelligence separado |
| Alterar regras de jogo / motores `*Game.ts` | Intocável |
| Treinar / fine-tuning modelo | Fora produto |
| Cloud provider obrigatório (OpenAI, Anthropic, etc.) | Local-first; sem API keys |
| Guardar prompts/respostas em backend | Local-only |
| UI visual nova | Debug consola suficiente v0 |
| WebLLM/browser LLM | **P2** — só se trivial; default defer §21 Q2 |
| Multiplayer | Fora Card Intelligence v0 |
| Chamada LLM automática em partida | Proibido — acção debug explícita only |
| Hook em `playWithLogging` | Hot path proibido |

---

# 3. Regra central e cadeia fallback

## 3.1 Regras absolutas

| Regra | Implementação |
|-------|---------------|
| LLM **nunca** joga carta | `getMiniLLMAdvice` devolve `MiniLLMAdvisoryResult` only |
| LLM **nunca** escolhe fora de `legalMoves` | `validateLLMOutput` V1–V3 |
| Engine/validator soberano | Carta aplicada no jogo = heurística/humano; advisory é observação |
| Fallback obrigatório | Toda falha → `fallbackMove` ou 1.ª legal |
| Nunca bloquear gameplay | Fail-silent; sem await LLM no hot path |
| Sem chamada automática | Só `__ciGetMiniLLMAdvice` / Dev Lab opt-in |

## 3.2 Cadeia fallback Impl 12 (advisory)

```
1. Flags off / provider não configurado     → mode disabled ou mock stub
2. Provider throw / network error           → fallback + provider_error
3. Timeout / abort                        → fallback + timeout
4. JSON inválido / parse fail               → fallback + invalid_json
5. selectedCardIndex ∉ [0, legalMoves)      → fallback + invalid_index
6. selectedCard ∉ legalMoves ou ∉ hand      → fallback + illegal_card
7. fallbackRecommended=true                 → fallback + fallback_recommended
8. confidence low + fallbackRecommended     → fallback + low_confidence_policy
9. Resposta válida                          → advisoryCard legal; usedFallback=false
```

**Nota D4:** `confidence: low` **sem** `fallbackRecommended` → **warning** only; manter sugestão se V1–V3 passam (alinhado F7 V5).

## 3.3 Modos runtime

| Modo | Condição | Provider | Output |
|------|----------|----------|--------|
| **disabled** | `LLM_ADVISORY=false` e sem `forceAdvisory` | nenhum | fallbackMove; `mode: disabled` |
| **advisory mock** | flags on; provider=mock ou Ollama indisponível | mock | advisory validado |
| **advisory ollama** | flags on; provider=ollama; endpoint+model OK | Ollama HTTP | advisory validado ou fallback |

---

# 4. Código existente (baseline — não recriar)

## 4.1 Módulo `llm/` (Impl 8)

Já implementado e **reutilizar**:

- `MiniLLMProvider.complete(prompt, input)` — contrato provider
- `getMiniLLMAdvice(input, options?)` — orquestrador; `options.provider` override
- `validateLLMOutput` — V1–V9
- `buildPromptTemplate` + `sanitizeEncodedStateForPrompt`
- `buildMiniLLMInput` / `buildMiniLLMInputFromStoredEvent`
- `createMockProvider` / `getDefaultMockProvider`

## 4.2 Debug (Impl 7–10)

- `window.__ciGetMiniLLMAdvice(eventId)` — iff `CARD_INTELLIGENCE_DEBUG && CARD_INTELLIGENCE_LLM_ADVISORY`
- `forceAdvisory: true` no helper — bypass flag single para testes internos **não** expor em prod
- Report flow: `__ciEventReport`, `__ciScenarioReport` — sem secção LLM hoje

## 4.3 Dev Lab (Impl 9 + 11.1)

- `runScenario`, presets `LAB_*` — encode + evaluate; **sem** LLM hoje
- Candidato P1: `RunScenarioOptions.includeLlmAdvice?: boolean`

## 4.4 Gaps a fechar (Impl 12)

| Gap | Acção |
|-----|-------|
| Só mock provider | Adicionar Ollama + resolver |
| Sem env endpoint/model | `providerConfig.ts` + features |
| AdvisoryResult sem providerId explícito | Campo opcional §9 |
| Dev Lab sem advice | P1 §7.3 |
| Report sem LLM | P1 §7.4 |

---

# 5. Interface provider e Ollama

## 5.1 Interface canónica (manter)

```typescript
export interface MiniLLMProvider {
  readonly id: string;  // ex: 'ollama:local', 'mock:local-stub-v0'
  complete(
    prompt: string,
    input: MiniLLMDecisionInput
  ): Promise<MiniLLMDecisionOutput>;
}
```

**Não** introduzir `call(input)` paralelo — extend via wrapper interno se necessário para testes.

## 5.2 Extensões opcionais (types.ts)

Adicionar **sem breaking change**:

```typescript
export interface ProviderCallMetadata {
  providerId: string;
  modelId: string | null;
  latencyMs: number;
  aborted: boolean;
}

export interface MiniLLMAdvisoryResult {
  // ... campos existentes ...
  providerId?: string;           // 'mock' | 'ollama' | 'disabled'
  providerLatencyMs?: number;
  validationWarnings?: string[]; // alias explícito para warnings de validação
}
```

Preferir preencher `providerId` a partir de `rawOutput.modelId` + resolver id — documentar no relatório.

## 5.3 Ollama provider (`ollamaProvider.ts`)

### Config mínima

| Campo | Fonte | Default |
|-------|-------|---------|
| `endpoint` | `REACT_APP_CARD_INTELLIGENCE_LLM_ENDPOINT` | `http://localhost:11434` |
| `model` | `REACT_APP_CARD_INTELLIGENCE_LLM_MODEL` | **obrigatório** se provider=ollama |
| `timeoutMs` | input.timeoutMs ou `DEFAULT_MINI_LLM_TIMEOUT_MS` (1500) | 1500 |

### API Ollama v0

Usar **`POST {endpoint}/api/generate`** (simples, streaming off):

```json
{
  "model": "<model>",
  "prompt": "<promptTemplate output>",
  "stream": false,
  "format": "json"
}
```

**Alternativa aceite:** `/api/chat` com `messages: [{ role: 'user', content: prompt }]` se `format: json` mais fiável — escolher uma; documentar em D1.

### Fluxo interno

1. `AbortController` — abort ao `timeoutMs`
2. `fetch` — **sem** credentials; CORS local dev only
3. Medir `latencyMs` (performance.now)
4. Extrair `response` string do JSON Ollama
5. `parseProviderJson(response)` — §5.4
6. Mapear para `MiniLLMDecisionOutput` com `requestId` do input
7. Em erro: **throw** `ProviderError` tipado (§6) — `getMiniLLMAdvice` captura → fallback
8. **`modelId`:** preencher `MiniLLMDecisionOutput.modelId` com o nome do modelo configurado (não deixar null)
9. **`latencyMs`:** medir com `performance.now()` do início do fetch até parse concluído — deve ser **≤** `input.timeoutMs` se abort funcionou; se ≥ timeout, validator aplica fallback (T15)

### Timeout alinhado (provider + validator)

| Camada | Comportamento |
|--------|---------------|
| Ollama fetch | `AbortController` aborta ao `input.timeoutMs` |
| Provider throw | `ProviderError` code `timeout` ou `aborted` |
| `validateLLMOutput` | Se `raw.latencyMs >= input.timeoutMs` → fallback `timeout` |

Ambas as camadas devem estar alinhadas — testes T7 + T15.

### Disabled behaviour

Se `model` vazio ou `CARD_INTELLIGENCE_LLM_PROVIDER !== 'ollama'`:

- `createOllamaProvider()` **não** deve ser instanciado
- `resolveProvider()` devolve mock

## 5.4 Parse JSON da resposta

```typescript
function parseProviderJson(rawText: string): Partial<MiniLLMDecisionOutput> | null
```

1. Trim whitespace
2. Tentar `JSON.parse` directo
3. Se falhar: regex extrair primeiro `{...}` balanceado (controlado; limite tamanho ex. 8KB)
4. Validar campos mínimos: `selectedCardIndex`, `confidence`, `reasonShort`
5. Truncar `reasonShort` a `input.maxReasonLength`
6. `consideredMetricIds` — array ou `[]`
7. `fallbackRecommended` — boolean default false
8. `selectedCard` — opcional; resolver via index se null

**Nunca** confiar em `selectedCard` sem validar contra `legalMoves` — `validateLLMOutput` final.

## 5.5 Factory

```typescript
export function createOllamaProvider(config: OllamaProviderConfig): MiniLLMProvider;
export function isOllamaConfigured(config?: OllamaProviderConfig): boolean;
```

`id`: `'ollama:local'` ou `'ollama:' + model` — consistente nos testes.

---

# 6. Config e erros

## 6.1 `providerConfig.ts`

```typescript
export type LlmProviderKind = 'mock' | 'ollama';

export interface LlmProviderConfig {
  kind: LlmProviderKind;
  ollama?: {
    endpoint: string;
    model: string;
  };
}

export function readLlmProviderConfigFromEnv(): LlmProviderConfig;
export function resolveProvider(config?: LlmProviderConfig): MiniLLMProvider;
```

**Regras resolve:**

| Condição | Provider |
|----------|----------|
| `kind !== 'ollama'` | mock |
| `kind === 'ollama'` mas model vazio | mock + warning interno |
| `kind === 'ollama'` + model OK | Ollama |
| Ollama throw em runtime | fallback (não trocar provider mid-request) |

## 6.2 `providerErrors.ts`

```typescript
export class ProviderError extends Error {
  readonly code: 'network' | 'timeout' | 'parse' | 'http' | 'aborted' | 'config';
  readonly statusCode?: number;
}
```

Usar em testes para assert fallback reason `provider_error` vs `timeout`.

---

# 7. Integração debug / advisory only

## 7.1 `getMiniLLMAdvice.ts` (alteração mínima)

Substituir:

```typescript
const provider = options.provider ?? getDefaultMockProvider();
```

Por:

```typescript
const provider = options.provider ?? resolveProvider();
```

Manter `options.provider` para testes inject mock behaviours.

**Não** alterar lógica disabled/advisory existente — apenas origem do provider.

## 7.1.1 Popular metadata no result (obrigatório)

Após resolver provider, **todos** os caminhos de return em `getMiniLLMAdvice` devem incluir:

```typescript
const providerId = options.provider?.id ?? provider.id;

// disabled / error / success:
return {
  // ... campos existentes ...
  providerId,
  providerLatencyMs: raw?.latencyMs ?? undefined,
};
```

| Caminho | `providerId` | `providerLatencyMs` |
|---------|--------------|---------------------|
| `mode: disabled` | `'disabled'` ou omit | omit |
| `provider_error` catch | `provider.id` | omit |
| advisory success/fallback | `provider.id` | `raw.latencyMs` |

**Não** inferir `providerId` só de `rawOutput.modelId` — usar `MiniLLMProvider.id` (`mock:local-stub-v0`, `ollama:local`).

Helper interno sugerido: `buildAdvisoryResult(...)` para evitar duplicação nos 3 returns.

## 7.2 Helper `__ciGetMiniLLMAdvice` (manter)

Ficheiro: [`debug/debugConsole.ts`](../../frontend/src/cardIntelligence/debug/debugConsole.ts)

- Condição: `CARD_INTELLIGENCE_DEBUG && CARD_INTELLIGENCE_LLM_ADVISORY` — **inalterada**
- Pipeline: `buildMiniLLMInputFromStoredEvent` → `getMiniLLMAdvice(..., { forceAdvisory: true, includePromptText: true })`
- **Não** auto-invocar em `__ciEventReport` v0 unless P1 §7.4 flag separada

### Exemplo consola pós-Impl 12

```javascript
await __ciGetMiniLLMAdvice('<eventId>')
// → MiniLLMAdvisoryResult com providerId, rawOutput.modelId, latencyMs
```

## 7.3 Dev Lab — P1 opcional v0

Ficheiro: [`devLab/runScenario.ts`](../../frontend/src/cardIntelligence/devLab/runScenario.ts)

```typescript
export interface RunScenarioOptions {
  fixtureId?: string;
  includeLlmAdvice?: boolean;  // default false
}
```

Quando `includeLlmAdvice === true` **e** flags LLM on:

1. Construir `MiniLLMDecisionInput` a partir do cenário (reutilizar encoder devLab existente)
2. `getMiniLLMAdvice(input, { forceAdvisory: true })`
3. Anexar `llmAdvisory?: MiniLLMAdvisoryResult` ao resultado do scenario

**Teste mínimo:** `runScenario` com mock provider inject + `includeLlmAdvice: true` → result defined.

**Não** obrigatório para fechar Impl 12 se tempo curto — marcar no relatório §19.

## 7.4 Report flow — P1 opcional v0

Ficheiros: [`debug/reportFlow/`](../../frontend/src/cardIntelligence/debug/reportFlow/)

Opção: `ReportFlowOptions.includeLlmAdvisory?: boolean`

Quando true + evento com play válido:

- Secção texto **«LLM Advisory (debug)»** com: providerId, modelId, latencyMs, advisoryCard, confidence, reasonShort, usedFallback, warnings

**Default:** `false` — zero impacto reports actuais.

---

# 8. Validação output

Reutilizar [`validateLLMOutput.ts`](../../frontend/src/cardIntelligence/llm/validateLLMOutput.ts) **sem enfraquecer** regras.

## 8.1 Mapa validação → fallback

| Condição | fallbackReason |
|----------|----------------|
| null raw | `invalid_json` |
| latencyMs >= timeoutMs | `timeout` |
| fallbackRecommended | `fallback_recommended` |
| index inválido | `invalid_index` |
| carta illegal | `illegal_card` |
| low + fallbackRecommended | `low_confidence_policy` |

## 8.2 Provider-specific pré-validação

Antes de `validateLLMOutput`, o provider **não** deve marcar `validByEngine: true` — deixar `null`; validator decide.

## 8.3 Testes obrigatórios validação

Reutilizar behaviours mock existentes + novos testes Ollama parse:

- illegal_card → fallback
- invalid_index → fallback
- valid index → advisory legal

---

# 9. Reporting (advisory result)

Campos que o humano H12 deve ver (JSON ou report text):

| Campo | Fonte |
|-------|-------|
| `providerId` / provider usado | `resolveProvider` / `MiniLLMProvider.id` |
| `modelId` | `rawOutput.modelId` |
| `latencyMs` | `rawOutput.latencyMs` |
| `fallbackUsed` | `usedFallback` |
| `fallbackReason` | `fallbackReason` |
| `validationWarnings` | `warnings[]` |
| `reasonShort` | advisory ou mensagem fallback |
| `advisoryCard` | carta final pós-validação |
| `validByEngine` | boolean |

**Exemplo advisory Ollama OK:**

```json
{
  "schemaVersion": "7.0.0",
  "mode": "advisory",
  "providerId": "ollama:local",
  "advisoryCard": { "suit": "hearts", "rank": "4", "id": "4h" },
  "advisoryCardIndex": 1,
  "confidence": "medium",
  "reasonShort": "Evitar levar vaza — carta baixa segura.",
  "usedFallback": false,
  "validByEngine": true,
  "rawOutput": {
    "modelId": "llama3.2:3b",
    "latencyMs": 842
  },
  "warnings": []
}
```

**Exemplo fallback (provider off):**

```json
{
  "mode": "disabled",
  "usedFallback": true,
  "fallbackReason": "disabled",
  "providerId": "mock"
}
```

---

# 10. Prompt template (reutilizar)

**Não** duplicar — usar [`buildPromptTemplate`](../../frontend/src/cardIntelligence/llm/promptTemplate.ts).

Garantias já presentes (verificar regressão):

| Requisito | Onde |
|-----------|------|
| Player View apenas | `sanitizeEncodedStateForPrompt` allowlist |
| legalMoves explícitas | índices numerados no prompt |
| Formato JSON estrito | secção RESPONSE FORMAT |
| Proibição carta ilegal | instrução textual no template |
| reasonShort curta | `maxReasonLength` no input |
| fallbackMove baseline | incluído no prompt |

**Teste:** snapshot ou assert substrings chave — não alterar texto salvo bug.

---

# 11. Ficheiros

## 11.1 Criar

| Ficheiro | Função |
|----------|--------|
| `llm/providers/providerConfig.ts` | Env, resolveProvider |
| `llm/providers/providerErrors.ts` | ProviderError |
| `llm/providers/ollamaProvider.ts` | Ollama HTTP + parse |
| `llm/providers/parseProviderJson.ts` | Parse controlado (ou inline ollama) |
| `llm/providers/providerConfig.test.ts` | Config + resolve |
| `llm/providers/ollamaProvider.test.ts` | fetch mock, timeout, parse |
| `llm/providers/parseProviderJson.test.ts` | JSON/texto livre |

## 11.2 Alterar (mínimo)

| Ficheiro | Alteração |
|----------|-----------|
| `llm/getMiniLLMAdvice.ts` | `resolveProvider()` default |
| `llm/types.ts` | `providerId?`, `ProviderCallMetadata` opcional |
| `llm/index.ts` | exports dev provider (se necessário testes) |
| `config/features.ts` | flags §12 |
| `debug/debugConsole.ts` | log provider id no console.info opcional |
| `devLab/runScenario.ts` | P1 includeLlmAdvice |
| `devLab/types.ts` | P1 llmAdvisory no result |
| `debug/reportFlow/*` | P1 secção LLM |
| `cardIntelligence/index.ts` | exports mínimos se necessário |

## 11.3 Não alterar

- `GameBoard.tsx`, `playWithLogging.ts`, `*Game.ts`, `*PlayStrategy.ts`, `aiClient.ts`
- `validateLLMOutput.ts` — salvo bugfix documentado
- `promptTemplate.ts` — salvo correção segurança Player View

---

# 12. Feature flags

Adaptar ao padrão CRA existente (`REACT_APP_*` em [`features.ts`](../../frontend/src/config/features.ts)):

| Constante TS | Env var | Default | Notas |
|--------------|---------|---------|-------|
| `CARD_INTELLIGENCE_LLM_ADVISORY` | `REACT_APP_CARD_INTELLIGENCE_LLM_ADVISORY` | **false** | Já existe |
| `CARD_INTELLIGENCE_LLM_PROVIDER` | `REACT_APP_CARD_INTELLIGENCE_LLM_PROVIDER` | `'mock'` | `'mock'` \| `'ollama'` |
| `CARD_INTELLIGENCE_LLM_ENDPOINT` | `REACT_APP_CARD_INTELLIGENCE_LLM_ENDPOINT` | `'http://localhost:11434'` | Só usado se ollama |
| `CARD_INTELLIGENCE_LLM_MODEL` | `REACT_APP_CARD_INTELLIGENCE_LLM_MODEL` | `''` (vazio) | Ollama disabled se vazio |

**Dupla protecção helper:** manter `CARD_INTELLIGENCE_DEBUG === true` para `__ciGetMiniLLMAdvice`.

**Prod default:** todas false/mock → zero rede LLM; mock não chama HTTP.

### Arranque dev completo (H12)

```bash
cd frontend
REACT_APP_CARD_INTELLIGENCE_DEBUG=true \
REACT_APP_CARD_INTELLIGENCE_LLM_ADVISORY=true \
REACT_APP_CARD_INTELLIGENCE_LLM_PROVIDER=ollama \
REACT_APP_CARD_INTELLIGENCE_LLM_ENDPOINT=http://localhost:11434 \
REACT_APP_CARD_INTELLIGENCE_LLM_MODEL=llama3.2:3b \
REACT_APP_CARD_INTELLIGENCE_DEV_LAB=true \
npm start
```

---

# 13. Ordem de implementação (commits sugeridos)

1. `providerErrors.ts` + types mínimos
2. `parseProviderJson.ts` + testes
3. `providerConfig.ts` + features flags
4. `ollamaProvider.ts` + testes fetch mock
5. `getMiniLLMAdvice.ts` — wire resolveProvider
6. Regressão `getMiniLLMAdvice.test.ts` + mock behaviours
7. P1 Dev Lab / report flow (se tempo)
8. Relatório §19 + actualização plano/status no relatório

---

# 14. Testes mínimos

## 14.1 Tabela T1–T15

| ID | Teste | Esperado |
|----|-------|----------|
| **T1** | Mock provider default (sem flags) | `mode: disabled` ou mock; zero fetch |
| **T2** | `resolveProvider` kind=mock | mock id |
| **T3** | kind=ollama, model vazio | mock fallback |
| **T4** | Ollama JSON válido (fetch mock) | advisory legal; usedFallback=false |
| **T5** | Ollama resposta texto + JSON embedded | parse OK |
| **T6** | Ollama resposta inválida | fallback invalid_json |
| **T7** | Ollama timeout (abort) | fallback timeout |
| **T8** | Ollama HTTP 500 | fallback provider_error |
| **T9** | selectedCardIndex fora range | fallback invalid_index |
| **T10** | selectedCard illegal | fallback illegal_card |
| **T11** | Provider throw | fallback provider_error |
| **T12** | `getMiniLLMAdvice` forceAdvisory + mock | regressão Impl 8 |
| **T13** | P1 runScenario includeLlmAdvice | llmAdvisory defined |
| **T14** | parseProviderJson truncates reasonShort | len <= max |
| **T15** | latencyMs >= timeoutMs | fallback timeout pós-provider |

## 14.2 Padrão teste Ollama

```typescript
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    response: JSON.stringify({
      selectedCardIndex: 0,
      confidence: 'medium',
      reasonShort: 'test',
      consideredMetricIds: [],
      fallbackRecommended: false,
    }),
  }),
});
```

Usar `jest.useFakeTimers()` para timeout T7.

## 14.3 Regressão suites existentes

- `llm/*.test.ts` — todas verdes
- `debugConsoleAlias.test.ts` — LLM_ADVISORY false default
- cardIntelligence total — não regressão

---

# 15. CI e grep hot path

## 15.1 Comandos

```bash
cd frontend
npm test -- --testPathPattern=cardIntelligence/llm --watchAll=false
npm test -- --testPathPattern=cardIntelligence --watchAll=false
CI=true npm run build
```

## 15.2 Critério verde

- Todos T1–T12 **obrigatórios**
- T13 **opcional** se P1 deferido
- Build CRA verde

## 15.3 Grep hot path (zero import)

```bash
rg "getMiniLLMAdvice|resolveProvider|ollamaProvider" frontend/src \
  --glob '!**/cardIntelligence/**' \
  --glob '!**/*.test.*'
```

Esperado: **zero** matches fora `cardIntelligence/`.

Adicional:

```bash
rg "__ciGetMiniLLMAdvice|CARD_INTELLIGENCE_LLM" frontend/src/components frontend/src/hooks
```

Esperado: **zero**.

---

# 16. Critérios de sucesso (Impl 12)

- [ ] Provider Ollama implementado e configurável via env
- [ ] Mock permanece default e fallback
- [ ] Nenhuma carta jogada automaticamente
- [ ] Toda sugestão ∈ legalMoves ou fallback
- [ ] Timeout/abort/parse error → fallback
- [ ] Metadata provider/model/latency no result
- [ ] Flags off em prod — zero exposição provider
- [ ] Testes T1–T12 verdes; build OK
- [ ] Grep hot path zero
- [ ] Relatório Impl 12 §19 entregue

---

# 17. Riscos

| Risco | Mitigação |
|-------|-----------|
| CORS Ollama no browser | **Alta** — fetch CRA → `localhost:11434` pode falhar sem CORS. Mitigação: `OLLAMA_ORIGINS=*` no daemon Ollama; ou proxy dev; H12 OK parcial mock-only; documentar em §19 + `.env.example` |
| Latência > timeout | Abort + fallback; não retry automático v0 |
| Modelo devolve prose | parseProviderJson + fallback |
| Env vars em bundle CRA | Sem secrets; endpoint local only; warn no relatório |
| Regressão mock | T12 + behaviours existentes |
| Scope creep decision assist | Recusar §2.2; code review grep |

---

# 18. Decisões D1–D12

| ID | Decisão |
|----|---------|
| **D1** | API Ollama v0: **`/api/generate`** + `format: json` — `/api/chat` alternativa documentada no relatório se necessário |
| **D2** | Interface **`complete(prompt, input)`** mantida — não `call(input)` |
| **D3** | Provider default **`mock`** — Ollama só se `PROVIDER=ollama` + model non-empty |
| **D4** | `confidence: low` sem `fallbackRecommended` → **warning**, não fallback automático |
| **D5** | Sem API keys; sem cloud default |
| **D6** | Timeout = `input.timeoutMs` (1500 default); AbortController no fetch |
| **D7** | Parse JSON: direct → extract `{...}` → null/fallback |
| **D8** | `validateLLMOutput` soberano — provider não seta `validByEngine: true` |
| **D9** | Helper LLM: dupla flag DEBUG + LLM_ADVISORY inalterada |
| **D10** | Dev Lab LLM — **P1** opcional; não bloqueia fecho Impl 12 |
| **D11** | Report flow LLM — **P1** opcional; default off |
| **D12** | Ordem impl: config → parse → ollama → wire → testes → P1 → relatório |

---

# 19. Relatório final esperado (pós-código)

Criar [`docs/ai/implementation-reports/IMPLEMENTATION_12_LLM_PROVIDER_ADVISORY_REPORT.md`](../implementation-reports/IMPLEMENTATION_12_LLM_PROVIDER_ADVISORY_REPORT.md):

```markdown
# IMPLEMENTATION_12_LLM_PROVIDER_ADVISORY — Relatório final

## Ficheiros criados
## Ficheiros alterados
## Provider implementado (Ollama + mock fallback)
## Feature flags e defaults
## Testes executados + contagens
## Exemplo advisory output (mock + Ollama se testado)
## Confirmação zero gameplay + grep hot path
## Confirmação fallback (timeout, parse, illegal, provider off)
## Dev Lab / report P1 (feito ou deferido)
## Gaps / deferidos (WebLLM, Q7–Q10)
## `.env.example` — vars LLM documentadas
## CORS Ollama — nota dev (OLLAMA_ORIGINS)
## Checkpoints — **H12:** OK | Pendente | OK parcial (mock-only)
## Actualização IMPLEMENTATION_PLAN + STATUS (Impl 12)
## Próximos passos (melhoria bots / decision assist futuro)
```

---

# 20. Checkpoint H12 (humano — copy-paste)

**Pré-requisito:** H11 OK — **não** re-validar evaluator Tier B aqui.

## 20.1 Pré-requisitos locais

- Ollama instalado **opcional** — H12 pode ser **OK parcial** só com mock (D10 no relatório)
- Se Ollama: `ollama pull <model>` alinhado com `REACT_APP_CARD_INTELLIGENCE_LLM_MODEL`

## 20.2 Arranque

```bash
cd frontend
REACT_APP_CARD_INTELLIGENCE_DEBUG=true \
REACT_APP_CARD_INTELLIGENCE_LLM_ADVISORY=true \
REACT_APP_CARD_INTELLIGENCE_LLM_PROVIDER=ollama \
REACT_APP_CARD_INTELLIGENCE_LLM_ENDPOINT=http://localhost:11434 \
REACT_APP_CARD_INTELLIGENCE_LLM_MODEL=llama3.2:3b \
REACT_APP_CARD_INTELLIGENCE_DEV_LAB=true \
npm start
```

**Teste fallback (provider off):** repetir com `REACT_APP_CARD_INTELLIGENCE_LLM_PROVIDER=mock` ou model vazio.

## 20.3 Script consola

```javascript
(async () => {
  // 1) Fallback — provider mock / disabled config
  console.log('--- mock/disabled ---');
  const events = await __ciLoadEvents();
  const { plays } = __ci.split(events);
  const play = plays.find((p) => p.legalMoves?.length > 1) ?? plays[0];
  if (play) {
    const mockAdvice = await __ciGetMiniLLMAdvice(play.eventId);
    console.log({
      mode: mockAdvice?.mode,
      usedFallback: mockAdvice?.usedFallback,
      providerId: mockAdvice?.providerId,
      advisoryCard: mockAdvice?.advisoryCard,
      validByEngine: mockAdvice?.validByEngine,
    });
  }

  // 2) Dev Lab scenario (evaluator + optional LLM P1)
  console.log('--- Dev Lab LAB_K02 ---');
  console.log(await __ciScenarioReport('LAB_K02'));

  // 3) Ollama — só se provider=ollama e model OK
  if (play) {
    console.log('--- ollama advisory ---');
    const ollamaAdvice = await __ciGetMiniLLMAdvice(play.eventId);
    console.log({
      providerId: ollamaAdvice?.providerId,
      modelId: ollamaAdvice?.rawOutput?.modelId,
      latencyMs: ollamaAdvice?.rawOutput?.latencyMs,
      usedFallback: ollamaAdvice?.usedFallback,
      fallbackReason: ollamaAdvice?.fallbackReason,
      warnings: ollamaAdvice?.warnings,
      reasonShort: ollamaAdvice?.reasonShort,
      advisoryCard: ollamaAdvice?.advisoryCard,
      validByEngine: ollamaAdvice?.validByEngine,
    });
  }

  console.log('H12 — confirmar: nenhuma carta jogada; advisory legal ou fallback');
})();
```

## 20.4 Checklist H12

**Obrigatório para `H12: OK`:**

- [ ] Jogo normal (sem flags) — **sem** `__ciGetMiniLLMAdvice`; gameplay inalterado
- [ ] Flags debug + LLM — helper disponível
- [ ] Advice **não** joga carta (inspecionar mesa antes/depois)
- [ ] Carta sugerida ∈ legalMoves quando `validByEngine: true`
- [ ] Provider off / model vazio → fallback; `usedFallback: true`
- [ ] Timeout simulado (teste Jest) ou Ollama parado → fallback
- [ ] Result inclui provider/model/latency quando Ollama OK
- [ ] Grep hot path zero

**Recomendado:**

- [ ] Ollama local real num evento IDB ou Dev Lab P1
- [ ] Report flow secção LLM (se P1 implementado)

**H12 OK parcial:** mock + fallback + testes CI verdes; Ollama manual deferido — anotar no relatório.

## 20.5 Assinatura

Relatório Impl 12 secção Checkpoints: `**H12:** OK — YYYY-MM-DD` ou `**H12:** OK parcial — …`

---

# 21. Dúvidas documentadas

| ID | Tema | Resolução v1 |
|----|------|--------------|
| **Q1** | Nome env vars (`CARD_INTELLIGENCE_*` vs `REACT_APP_*`) | **Fechado** — seguir CRA `REACT_APP_*` + export TS sem prefixo §12 |
| **Q2** | WebLLM browser | **Defer P2** — Ollama HTTP suficiente v0; reavaliar se CORS bloquear dev |
| **Q3** | Integrar advice no `__ciScenarioReport` | **P1** — secção LLM opcional; helper isolado suficiente v0 |
| **Q4** | `low_confidence` → fallback? | **Fechado D4** — só se `fallbackRecommended` |
| **Q5** | H12 exige Ollama real? | **Fechado** — OK parcial mock-only aceite |
| **Q6** | `/api/generate` vs `/api/chat` | **Fechado D1** — generate first; documentar swap no relatório se falhar |
| **Q7** | Guardar prompt no IDB | **Defer** — fora scope; opcional debug future |
| **Q8** | Retry Ollama 1x | **Defer** — no retry v0 (latência) |
| **Q9** | Streaming Ollama | **Defer** — `stream: false` v0 |
| **Q10** | Modelo default recomendado | **Documentar** no relatório Impl 12 (ex. `llama3.2:3b`); env vazio = disabled |
| **Q11** | `providerId` no result | **Fechado v1.1** — §7.1.1 obrigatório em todos os returns |
| **Q12** | CORS browser | **Fechado** — OLLAMA_ORIGINS; H12 parcial mock OK |

---

# 22. Metadados, referências e histórico

## Referências

- [IMPLEMENTATION_PLAN_AI.md](../IMPLEMENTATION_PLAN_AI.md)
- [CARD_INTELLIGENCE_STATUS_REPORT.md](../CARD_INTELLIGENCE_STATUS_REPORT.md)
- [ROADMAP_AI.md](../ROADMAP_AI.md)
- [FASE_7_MINI_LLM_DESIGN.md](../FASE_7_MINI_LLM_DESIGN.md)
- [IMPLEMENTATION_8_MINI_LLM_ADVISORY_REPORT.md](../implementation-reports/IMPLEMENTATION_8_MINI_LLM_ADVISORY_REPORT.md)
- [IMPLEMENTATION_9_DEV_SEEDED_GAME_LAB_REPORT.md](../implementation-reports/IMPLEMENTATION_9_DEV_SEEDED_GAME_LAB_REPORT.md)
- [IMPLEMENTATION_10_DEBUG_REPORT_FLOW_REPORT.md](../implementation-reports/IMPLEMENTATION_10_DEBUG_REPORT_FLOW_REPORT.md)
- [IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md](../implementation-reports/IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md)
- [IMPLEMENTATION_8_MINI_LLM_ADVISORY_PROMPT.md](./IMPLEMENTATION_8_MINI_LLM_ADVISORY_PROMPT.md)
- [ROADMAP_COMPLIANCE_REVIEW.md](../reviews/ROADMAP_COMPLIANCE_REVIEW.md)
- [TECHNICAL_INTEGRITY_REVIEW.md](../reviews/TECHNICAL_INTEGRITY_REVIEW.md)

## Histórico desta prompt

| Versão | Data | Nota |
|--------|------|------|
| 1.0 | 2026-05-31 | Prompt inicial pós-H11; Ollama local-first; mock fallback; D1–D12; H12 |
| 1.1 | 2026-05-31 | Revisão pós-análise: §7.1.1 providerId; timeout/modelId §5.3; CORS §17; 390+ tests; `.env.example` §19; Q11–Q12 |

---

**Fim da prompt — aprovada para implementação (Agent mode).**
