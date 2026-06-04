# IMPLEMENTATION_7_DEBUG_EXPORT — Relatório final

**ID:** `IMPLEMENTATION_7_DEBUG_EXPORT`  
**Prompt:** [IMPLEMENTATION_7_DEBUG_EXPORT_PROMPT.md](../implementation-prompts/IMPLEMENTATION_7_DEBUG_EXPORT_PROMPT.md)  
**Data:** 2026-05-31  
**Estado:** implementação concluída — **H7 pendente** (validação manual Francisco)

---

## Ficheiros criados

### `frontend/src/cardIntelligence/debug/`

| Ficheiro | Função |
|----------|--------|
| `types.ts` | `ExportOptions`, `ExportResult`, envelope 7.0.0, tipos evaluate/clear |
| `readLogs.ts` | `loadAllLogEvents`, filtros, `summarizeLogEvents` (migrado H3) |
| `evaluateStoredEvents.ts` | `findTrickEndForPlay`, `ciEncode`, evaluate offline |
| `exportJsonl.ts` | `buildJsonlLines`, `exportCardIntelligenceJsonl`, download Blob |
| `readMemory.ts` | `listMemoryAggregates`, `ingestEvaluationsOffline` |
| `postGameReport.ts` | `buildPostGameReport` — texto resumo |
| `clearDebugData.ts` | clear IDB logs/memory + double confirm |
| `debugConsole.ts` | `installCardIntelligenceDebugConsole` + `window.__ci*` |
| `index.ts` | exports módulo |
| `exportJsonl.test.ts` | envelope, vazio, raw, imutabilidade |
| `evaluateStoredEvents.test.ts` | filtros, imutabilidade, player view |
| `postGameReport.test.ts` | contagens métricas |

---

## Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| `frontend/src/cardIntelligence/debugConsole.ts` | Re-export fino H3 → `debug/` |
| `frontend/src/cardIntelligence/debugConsole.test.ts` | imports + testes pairing trickEnd |
| `frontend/src/cardIntelligence/index.ts` | exports dev: export, evaluate, memory helpers |
| `frontend/src/index.tsx` | dynamic import `./cardIntelligence/debug/debugConsole` |

**Não alterados:** `GameBoard.tsx`, `playWithLogging.ts`, bots, motores `*Game.ts`, evaluator core, memory ingest hot path, encoder stub `memoryContext`.

---

## Resumo técnico

1. **Migração H3** — funções de leitura/encode movidas para `debug/`; raiz `debugConsole.ts` mantém compatibilidade de import.

2. **Export JSONL** — envelope **7.0.0** default; `payload` preserva schema interno (3/4/5/6); modo `raw` opt-in; export vazio = 1 linha `export_meta` (`lineCount: 0`).

3. **Evaluate offline** — `findTrickEndForPlay` por `gameId` + `trickIndex`; player view default; **sem** persistência de evaluations (alinhado Impl 5).

4. **Memory offline** — `ingestEvaluationsOffline` / `__ciIngestEvaluations` explícito; export memory só com `includeMemory: true`.

5. **Fail-silent** — export retorna `ExportResult { lineCount, warnings, filename }`; erros parciais → warnings, não throw na UI.

6. **Dev-only** — `CARD_INTELLIGENCE_DEBUG`; dynamic import; chunk separado (~3.65 kB) no build prod.

---

## Helpers disponíveis (`window.__ci*`)

| Helper | Função |
|--------|--------|
| `__ci` | namespace (`loadEvents`, `exportJsonl`, …) |
| `__ciLoadEvents()` | todos eventos IDB |
| `__ciSummarize(events?)` | contagens |
| `__ciEncode(play, opts?)` | encode (player default) |
| `__ciExportLogsJsonl(opts?)` | download JSONL |
| `__ciEncodeEvent(eventId)` | play + trickEnd + encoded |
| `__ciEvaluateEvent(eventId, opts?)` | encode + evaluate offline |
| `__ciEvaluateGame(gameId?, opts?)` | batch por partida |
| `__ciListMemory(query?)` | agregados memory |
| `__ciIngestEvaluations(items)` | ingest offline explícito |
| `__ciPostGameReport(gameId?)` | texto resumo |
| `__ciClearAllCardIntelligenceData(opts?)` | apaga IDB (double confirm) |

Aliases legados H3 mantidos (`__ciLoadEvents`, `__ciEncode`, `__ciSummarize`).

---

## Como activar / desactivar

| Flag | Efeito |
|------|--------|
| `npm start` | debug ON (`NODE_ENV=development`) |
| `REACT_APP_CARD_INTELLIGENCE_DEBUG=true` | debug ON em build servido |
| Prod default (sem flag) | **sem** `window.__ci*` |
| `REACT_APP_CARD_INTELLIGENCE_LOGGER=false` | desliga logger (independente do debug) |

---

## Testes executados

```bash
cd frontend
CI=true npm test -- --testPathPattern=debug --watchAll=false
# 4 suites debug*

CI=true npm test -- --testPathPattern=cardIntelligence --watchAll=false
# 27 suites, 151 passed

CI=true npm run build
# OK (chunk debug separado 205.*.js)

grep -r "exportCardIntelligenceJsonl\|ingestEvaluationsOffline\|evaluateStoredPlay" \
  frontend/src --include="*playWithLogging*" --include="*GameBoard*"
# no matches
```

**Novos testes Impl 7:** +13 (138 → 151 total cardIntelligence).

---

## Exemplo export JSONL (envelope)

```jsonl
{"exportRecordType":"card_decision_log","schemaVersion":"7.0.0","exportedAt":"2026-05-31T14:00:00.000Z","source":"cardIntelligence/debug/exportJsonl","payload":{"eventId":"evt-export-1","schemaVersion":"3.0.0","variant":"spades","classification":"unknown"}}
{"exportRecordType":"export_meta","schemaVersion":"7.0.0","exportedAt":"2026-05-31T14:00:00.000Z","source":"cardIntelligence/debug/exportJsonl","payload":{"lineCount":0,"warnings":[],"options":{"format":"envelope"}}}
```

Com `{ includeEvaluations: true }` — linhas adicionais `encoded_state` + `evaluation` por play.

---

## Exemplo `postGameReport`

```
Card Intelligence — resumo offline
Game: game-abc
Variant: spades
Decisões: 12
  2× SP09 bad
  1× SP06 good
Memory aggregates: 4 entradas
  SP09: good=2 bad=0 evaluated=2
```

---

## Confirmação zero gameplay

- Nenhum hook em `playWithLogging`, `GameBoard`, bots ou estratégias AI.
- Evaluator e memory **não** correm automaticamente em partida.
- Export **read-only** — não muta logs IDB.
- `evaluateStoredPlay` testado para imutabilidade do `CardDecisionLogEvent`.

---

## Confirmação prod / flag off

- `index.tsx`: `installCardIntelligenceDebugConsole` só se `CARD_INTELLIGENCE_DEBUG`.
- Build prod: chunk debug lazy-loaded; sem side-effect se flag false.
- Validar H7: `typeof window.__ci === 'undefined'` em build prod servido sem `REACT_APP_CARD_INTELLIGENCE_DEBUG`.

---

## Riscos / gaps (v0)

| Gap | Nota |
|-----|------|
| D15 duplicate ingest | Evaluator SP09+T06 → 2× `metricResults`; batch ingest sem idempotência |
| Pairing trickEnd | Última vaza sem `trick_end` → warning; encode/eval prosseguem se possível |
| Clear IDB | `deleteDatabase` — pode falhar se outro tab aberto (`onblocked` resolve silencioso) |
| DebugPanel UI | **Não implementado** v0 (consola suficiente) |
| Persist evaluations IDB | Deferido v1+ |

---

## Próximos passos — Impl 8 Mini-LLM advisory

1. H7 humano: jogar → `__ciEvaluateEvent` → export → confirmar prod sem helpers.
2. OK explícito Francisco pós-H7.
3. Impl 8: advisory only; encode pré-decisão + contexto avaliação; **não** substituir juiz F5.

---

## Como validar H7 (checklist)

1. [ ] `npm start` — mensagem `[CardIntelligence] Debug console ready (Impl 7)`
2. [ ] Jogar cartas; `await __ciLoadEvents()` → eventos
3. [ ] `__ciSummarize(await __ciLoadEvents())`
4. [ ] `await __ciEvaluateEvent('<eventId>')` → `viewTypeUsed: 'player'`
5. [ ] `await __ciExportLogsJsonl({ includeEvaluations: true })` → ficheiro parseável
6. [ ] Opcional: ingest + `__ciListMemory()` + export `{ includeMemory: true }`
7. [ ] Build prod sem flag: sem `window.__ci`
8. [ ] OK para Impl 8

---

## Histórico

| Versão | Data | Nota |
|--------|------|------|
| 1.0 | 2026-05-31 | Impl 7 Debug/Export v0 — módulo `debug/`, JSONL envelope, helpers __ci* |
