# IMPLEMENTATION_6_MEMORY_V0 — Relatório final

**ID:** `IMPLEMENTATION_6_MEMORY_V0`  
**Prompt:** [IMPLEMENTATION_6_MEMORY_V0_PROMPT.md](../implementation-prompts/IMPLEMENTATION_6_MEMORY_V0_PROMPT.md)  
**Data:** 2026-05-31  
**Estado:** implementação concluída — **H6 pendente** (validação manual Francisco)

---

## Ficheiros criados

### `frontend/src/cardIntelligence/memory/`

| Ficheiro | Função |
|----------|--------|
| `types.ts` | `MemoryIngestRecord`, `MetricMemoryAggregate`, `MemoryStore`, `MemoryQuery`, schema **6.0.0** |
| `aggregateMemory.ts` | Contagem §4.1, `badRate`/`partialRate`, trend FIFO 40, `buildMemoryId` |
| `ingestEvaluation.ts` | `ingestEvaluationResult`, `buildMemoryIngestRecord` |
| `memoryStore.ts` | `InMemoryMemoryStore`, `getMemoryStore`, `setMemoryStoreForTests` |
| `memoryDb.ts` | IDB `cardIntelligenceMemory` schema |
| `memoryStore.indexedDb.ts` | `IndexedDbMemoryStore` (runtime dev) |
| `memoryQueries.ts` | `queryMemory`, `listAggregates`, `getAggregateById` |
| `index.ts` | Exports públicos |
| `aggregateMemory.test.ts` | Casos A–E §4.3 + trend §5.2 |
| `ingestEvaluation.test.ts` | badRate, partial/unknown, isolamento, imutabilidade, trend |
| `memoryGolden.test.ts` | Pipeline SP09 fixture |

---

## Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| `frontend/src/cardIntelligence/index.ts` | Export `ingestEvaluationResult`, `buildMemoryIngestRecord`, `queryMemory`, tipos memory |

**Não alterados:** `playWithLogging.ts`, `GameBoard.tsx`, bots, motores `*Game.ts`, evaluator, encoder stub `memoryContext`.

---

## Resumo técnico

1. **`buildMemoryIngestRecord`** — monta `MemoryIngestRecord` a partir de `CardDecisionLogEvent` + `EncodedDecisionState` + `DecisionEvaluationResult` (versões pipeline, `metricResults`, subjectId canónico §8).

2. **`ingestEvaluationResult`** — valida `evaluatorVersion`; agrega por **`metricResults`** (primário) ou fallback `activatedMetricIds`; aplica §4.1 por métrica; actualiza `sessionMemory` rollup leve.

3. **`aggregateMemory`** — `partial` e `unknown` separados; `partialEvaluation` adicional quando global good/medium/bad; FIFO `recentOutcomes` (40) → trend `worsening`/`improving`/`stable`.

4. **Storage** — IndexedDB `cardIntelligenceMemory` em runtime; testes usam **`InMemoryMemoryStore`** via `setMemoryStoreForTests`.

5. **Sem live hook** — ingest só em testes/dev explícito; evaluator inalterado e imutável após ingest.

---

## Testes executados

```bash
cd frontend
CI=true npm test -- --testPathPattern=memory --watchAll=false
# 14 passed (3 suites)

CI=true npm test -- --testPathPattern=cardIntelligence --watchAll=false
# 138 passed (24 suites)

CI=true npm run build
# OK
```

| Suite | Testes |
|-------|--------|
| `aggregateMemory.test.ts` | 7 |
| `ingestEvaluation.test.ts` | 6 |
| `memoryGolden.test.ts` | 1 |
| **Total memory** | **14** |
| **Total cardIntelligence** | **138** (+14 vs Impl 5) |

---

## Exemplos `MetricMemoryAggregate` (H6)

Pipeline: fixture → encode → evaluate → `buildMemoryIngestRecord` → `ingestEvaluationResult` → `queryMemory`.

### 1. SP09 fixture (good) — `bot:medium:seat-0`

Nota: evaluator emite **2** entradas `SP09` good (`SP09` + routing `T06`) — memória conta cada `metricResults` (§4.4).

```json
{
  "memoryId": "bot|bot:medium:seat-0|spades|SP09|null|5.0.0",
  "metricId": "SP09",
  "goodCount": 2,
  "badCount": 0,
  "partialCount": 0,
  "unknownCount": 0,
  "badRate": 0,
  "trend": "unknown",
  "confidence": "low"
}
```

### 2. Três ingests SP09 `bad` sintéticos

```json
{
  "metricId": "SP09",
  "badCount": 3,
  "evaluatedCount": 3,
  "badRate": 1,
  "commonMistakes": ["Bid cumprido — overtrick desnecessário (bag)."]
}
```

### 3. H10 Tier B — métrica H10

```json
{
  "metricId": "H10",
  "variant": "hearts",
  "partialCount": 1,
  "goodCount": 0,
  "badCount": 0,
  "badRate": 0
}
```

### 4. Caso §4.3 C — bad + `partialEvaluation`

Após um ingest com `classification: bad`, `partialEvaluation: true`:

```json
{
  "badCount": 1,
  "partialCount": 1,
  "badRate": 1
}
```

### 5. Trend — 20 good + 20 bad (mesmo agregado)

```json
{
  "totalCount": 40,
  "trend": "worsening",
  "confidence": "medium"
}
```

---

## Confirmação zero gameplay

```bash
grep -r "ingestEvaluationResult" frontend/src --include="*playWithLogging*" --include="*GameBoard*"
# (sem matches)
```

Diff limitado a `cardIntelligence/memory/` + exports em `index.ts`.

---

## Gaps deferidos (v1+)

| Gap | Notas |
|-----|-------|
| Export JSONL / dashboard | Impl 7 |
| `memoryExamples` store IDB completo | Impl 7 |
| Table Memory persistente | v1+ |
| `ingestQueue` | v1+ |
| Recalc agregados em bump major evaluator | v1+ |
| Wire `memoryContext` no encoder | v1+ |
| Dedupe `metricResults` duplicados (SP09/T06) no evaluator | v1+ (memória reflecte F5 actual) |
| IDB smoke em Jest | testes in-memory only v0 |

---

## Como validar H6 (checklist)

Francisco **não** precisa de abrir o jogo. Basta:

- [ ] `CI=true npm test -- --testPathPattern=cardIntelligence` verde
- [ ] `CI=true npm run build` verde
- [ ] Ler os **5 exemplos** acima — fazem sentido como **estatística**, não como «jogada certa/errada»?
- [ ] Confirmar: memória **não** corre em partida live (`grep` §Confirmação)
- [ ] OK explícito antes de Impl 7 (Debug/Export)

---

## Próximos passos (Impl 7)

1. Export JSONL de agregados + logs + evaluations.
2. Painel debug dev-only (`REACT_APP_CARD_INTELLIGENCE_DEBUG`).
3. Relatório pós-partida textual («3× SP09 bad nesta sessão»).

---

## Referências

- [IMPLEMENTATION_6_MEMORY_V0_PROMPT.md](../implementation-prompts/IMPLEMENTATION_6_MEMORY_V0_PROMPT.md)
- [IMPLEMENTATION_5_EVALUATOR_V0_REPORT.md](./IMPLEMENTATION_5_EVALUATOR_V0_REPORT.md)
- [FASE_6_MEMORIA_APRENDIZAGEM_DESIGN.md](../FASE_6_MEMORIA_APRENDIZAGEM_DESIGN.md)
