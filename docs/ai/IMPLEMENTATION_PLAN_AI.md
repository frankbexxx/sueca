# Plano de Implementação — Card Intelligence

Documento operacional para transformar o [ROADMAP_AI](ROADMAP_AI.md) e os desenhos Fase 0–7 em **código incremental**.

**Data:** 2026-06-06  
**Versão:** 1.5  
**Scope:** planeamento operacional — **Impl 1–15 executadas** (H14 OK · H15-OK parcial); **Impl 16 prompt v1.1 aprovada** — próximo: código King bot

---

## Regra obrigatória (todas as implementações)

Antes de **qualquer** fase passar a código:

```
1. prompt/plano específico da implementação   ← obrigatório
2. implementação com base nessa prompt
3. relatório final de implementação
```

**Nunca saltar directamente para código.**

Cada implementação abaixo tem coluna **Prompt antes de código: sim** — significa criar ficheiro em `docs/ai/implementation-prompts/` **antes** de tocar no repositório.

---

# 1. Resumo

Este plano traduz a cadeia documental:

```
Fase 1 — métricas · Fase 2A/2B — prioridades/fixtures
    ↓
Fase 3 — logger → Impl 1 (+ Impl 2 histórico)
    ↓
Fase 4 — encoder → Impl 3
    ↓
Fase 2B golden cases → Impl 4
    ↓
Fase 5 — avaliador → Impl 5
    ↓
Fase 6 — memória → Impl 6
    ↓
Debug/export → Impl 7
    ↓
Fase 7 — mini-LLM advisory → Impl 8
    ↓
Dev Seeded Game Lab → Impl 9
    ↓
Debug Report Flow → Impl 10
    ↓
(depois) Evaluator v1 · Provider LLM real · melhoria bots
```

**Princípios:** pequeno, sequencial, reversível, **local-first**, bots existentes intactos, regras do jogo intocadas salvo prompt própria.

**Estado actual do repo (2026-06-06):** módulo `frontend/src/cardIntelligence/` **implementado** (~139 ficheiros TS); Impl 1–10 + relatórios; H9/H10 OK; ver [CARD_INTELLIGENCE_STATUS_REPORT.md](CARD_INTELLIGENCE_STATUS_REPORT.md).

## Estrutura de módulo (decisão fechada)

**Localização:** `frontend/src/cardIntelligence/` — **não** misturar com `frontend/src/ai/`. A AI actual (`*Strategy.ts`, `aiClient`, etc.) fica **intacta**.

```
frontend/src/cardIntelligence/
├── logger/
├── encoder/
├── evaluator/
├── memory/
└── shared/          # types, storage helpers, flags
```

Card Intelligence é camada **nova** e **separada** da AI de gameplay existente.

---

# 2. Ordem recomendada de implementação

Visão conservadora — **11 blocos** (0–10), cada um com prompt dedicada (excepto sub-entregas documentadas §2.1).

| # | ID | Nome curto |
|---|-----|------------|
| 0 | `IMPLEMENTATION_0_PREP` | Preparação documental/técnica |
| 1 | `IMPLEMENTATION_1_LOGGER_V0` | Logger v0 |
| 2 | `IMPLEMENTATION_2_ROUND_HISTORY` | Histórico transversal de cartas |
| 3 | `IMPLEMENTATION_3_ENCODER_V0` | Encoder v0 |
| 4 | `IMPLEMENTATION_4_FIXTURES_2B` | Fixtures 2B como testes |
| 5 | `IMPLEMENTATION_5_EVALUATOR_V0` | Avaliador v0 |
| 6 | `IMPLEMENTATION_6_MEMORY_V0` | Memory v0 |
| 7 | `IMPLEMENTATION_7_DEBUG_EXPORT` | Debug / export JSONL |
| 8 | `IMPLEMENTATION_8_MINI_LLM_ADVISORY` | Mini-LLM advisory only |
| 9 | `IMPLEMENTATION_9_DEV_SEEDED_GAME_LAB` | Dev Seeded Game Lab |
| 10 | `IMPLEMENTATION_10_DEBUG_REPORT_FLOW` | Debug Report Flow |

### 2.1 Excepções processuais (hotfixes sem prompt dedicada)

| Sub-entrega | Relatório | Notas |
|-------------|-----------|-------|
| Impl 1.1 Logger Hardening | `IMPLEMENTATION_1_1_LOGGER_HARDENING_REPORT.md` | Excepção aceite — ver [ROADMAP_COMPLIANCE_REVIEW.md](reviews/ROADMAP_COMPLIANCE_REVIEW.md) §D1 |
| Impl 2 H2 Hotfix | `IMPLEMENTATION_2_H2_HOTFIX_REPORT.md` | Deep snapshot Sueca trick_end |
| Impl 3.1 King Encoder Fix | `IMPLEMENTATION_3_ENCODER_V0_REPORT.md` §8.1 | Patch encoder-only |
| Impl 16.1 King negative contract fix | `IMPLEMENTATION_16_1_KING_NEGATIVE_CONTRACT_FIX_REPORT.md` | Hotfix pós-smoke FAIL Impl 16 |

**Regra futura:** sub-entregas devem ter prompt mínima antes de código.

### 2.2 Bloco bot metrics + provider (Impl 12–16)

| # | ID | Nome curto | Estado |
|---|-----|------------|--------|
| 12 | `IMPLEMENTATION_12_LLM_PROVIDER_ADVISORY` | Provider LLM advisory | ✅ Relatório |
| 13 | `IMPLEMENTATION_13_BOT_METRICS_UPGRADE` | Sueca bot metrics (S08/S11/S02) | ✅ **H13 OK** |
| 14 | `IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE` | Spades bot metrics (SP09/SP08/SP06) | ✅ **H14 OK** |
| 15 | `IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE` | Hearts bot metrics (H11/H13/H07) | ✅ **H15-OK parcial** |
| 16 | `IMPLEMENTATION_16_KING_BOT_METRICS_UPGRADE` | King PT bot metrics (K02/K03/K01) | ✅ Código + CI; **H16-OK pendente** |

**Próximo passo código:** smoke manual → **H16-OK**; depois King v2 / Simplified.

**Pré-requisito Impl 16:** H15-OK parcial registado (Impl 15 relatório 2026-06-06).

**Defer pós-Impl 16:** King Simplified · K10/K06/K07 festa · King v2 · Sueca S23 / Spades escola / Hearts v2.

---

## Implementação 0 — Preparação documental/técnica

**Objectivo:** confirmar paths, nomes, consistência `docs/ai/` — **zero código**.

- Confirmar que desenhos F3–F7 têm versões alinhadas (schema 3.0.0 … 7.0.0).
- Confirmar lista de 23 fixtures activos ([FASE_2B](FASE_2B_FIXTURES_METRICAS.md)).
- Confirmar gaps PHASE0 (`playedCards` Sueca-only, `history` vazio).
- Definir convenção de pasta: `frontend/src/cardIntelligence/` (subpastas §1).
- **Não código.**

---

## Decisões transversais (fechadas v1.1)

| Tema | Decisão |
|------|---------|
| **Persistência** | IndexedDB principal (`cardIntelligenceLogs`); `localStorage` só fallback se IDB indisponível — dev/minimal logs. Sem backend, sem sync. |
| **Hook logger** | v0: ponto mínimo onde jogada é aplicada (provavelmente `GameBoard` / play flow). Uma **função central** de log — não espalhar por componentes. Tendência futura: boundary adapter/game-engine. |
| **TrickEnd** | Impl 1 = `CardDecisionLogEvent` only. `TrickEndEvent` documentado/preparado; implementação real = **Impl 2** (ou Impl 1 só se trivial e sem mexer no motor). Não bloquear Logger v0. |
| **Testes** | Golden tests = regressão CI automática. Checkpoints humanos H1/H3/H5 **obrigatórios** — não substituem análise humana. |
| **Debug/export UI** | **Dev-only** — flag `REACT_APP_CARD_INTELLIGENCE_DEBUG` (padrão CRA do projecto; equivalente a `VITE_*`). Nunca visível por defeito em produção. |

---

## Implementação 1 — Logger v0

**Base:** [FASE_3_LOGGER_DESIGN.md](FASE_3_LOGGER_DESIGN.md)

**Objectivo:**

- Tipos/schemas `CardDecisionLogEvent` (schema **3.0.0**).
- Serviço local — **IndexedDB** `cardIntelligenceLogs` (fallback `localStorage` mínimo só se IDB indisponível).
- Eventos mínimos de **play** (`CardDecisionLogEvent`) — **sem** `TrickEndEvent` completo (Impl 2).
- `classification: "unknown"` sempre; `reason: null` sempre.
- Hook passivo pós-jogada aplicada — função central `logCardDecision(...)`; v0 provavelmente `GameBoard` play flow.
- `roundPlayHistory` snapshot por evento (acumulação básica — refinada na Impl 2).
- **Não** avaliar; **Não** alterar jogada; **Não** bloquear por TrickEnd.

---

## Implementação 2 — Histórico transversal de cartas

**Base:** [PHASE0_INVENTORY.md](PHASE0_INVENTORY.md) §6 · [FASE_3_LOGGER_DESIGN.md](FASE_3_LOGGER_DESIGN.md) §3

**Objectivo:**

- Histórico jogável **todos os jogos** (Sueca, Spades, Hearts, King).
- **Não** depender de `GameState.playedCards` (Sueca-only).
- Logger acumula `roundPlayHistory` a partir de eventos (`CardDecisionLogEvent` + **`TrickEndEvent` implementado aqui**).
- Dados prontos para encoder F4.

---

## Implementação 3 — Encoder v0

**Base:** [FASE_4_ENCODER_DESIGN.md](FASE_4_ENCODER_DESIGN.md)

**Objectivo:**

- `EncodedDecisionState` (schema **4.0.0**).
- **Player View** default; Engine View opcional/debug.
- `encodeMode: pre_decision` e `post_decision`.
- Campos **P0** por jogo (F2A §encoder): trunfo/trick Sueca; bid/bags Spades; heartsBroken/Q♠ Hearts; `mustPlayKingHeartsNow` King.

---

## Implementação 4 — Fixtures 2B como testes / golden cases

**Base:** [FASE_2B_FIXTURES_METRICAS.md](FASE_2B_FIXTURES_METRICAS.md) · [FASE_2B_ARQUIVO_FIXTURES.md](FASE_2B_ARQUIVO_FIXTURES.md)

**Objectivo:**

- Transformar fixtures **P0 prioritários** em casos de teste (estado mínimo representável).
- Começar por subset: T01, K02, K03, SP09, H13, S08 — expandir para 23.
- **Sem** avaliador completo ainda — validar encoder + schemas.
- Golden: input estático → `EncodedDecisionState` esperado (snapshots).

---

## Implementação 5 — Avaliador v0

**Base:** [FASE_5_AVALIADOR_DESIGN.md](FASE_5_AVALIADOR_DESIGN.md)

**Objectivo:**

- Classificar decisões **P0** (ordem F2A/F5):
  - **T01** legalidade
  - **King** K02, K03
  - **Spades** SP09, SP06
  - **Sueca** S08, S12, S16
  - **Hearts** H11, H13
- Output **separado** do log (`DecisionEvaluationResult`, schema **5.0.0**).
- `good` / `medium` / `bad` / `unknown` + `partialEvaluation`.
- «Pior vence» v0; **offline** / pós-partida — não hot path.

---

## Implementação 6 — Memory v0

**Base:** [FASE_6_MEMORIA_APRENDIZAGEM_DESIGN.md](FASE_6_MEMORIA_APRENDIZAGEM_DESIGN.md)

**Objectivo:**

- `MetricMemoryAggregate` (schema **6.0.0**).
- Agregados por bot/jogador/jogo/métrica.
- Contagens, `badRate`, trends simples.
- IndexedDB `cardIntelligenceMemory` — **local only**.
- **Sem** `ingestQueue` v0; só decisões já avaliadas F5.

---

## Implementação 7 — Debug / Export

**Objectivo:**

- Export JSONL (logs, avaliações, agregados).
- Painel/debug mínimo — **dev-only** (`REACT_APP_CARD_INTELLIGENCE_DEBUG`).
- Relatório pós-jogo textual simples («2× S16 bad nesta partida»).
- **Sem** backend; export manual/opt-in; **nunca** UI debug em produção por defeito.

---

## Implementação 8 — Mini-LLM advisory only

**Base:** [FASE_7_MINI_LLM_DESIGN.md](FASE_7_MINI_LLM_DESIGN.md)

**Objectivo:**

- **Advisory mode only** — não decision assist.
- Provider-agnostic (`MiniLLMProvider` interface).
- Escopo **play only** (§4.2 F7).
- Validação engine se sugestão for aplicada; fallback sempre.
- Rollout: disabled default → advisory; **nunca** decision-only.
- `decisionSource: mini_llm` só após `validByEngine`.

---

## Implementação 9 — Dev Seeded Game Lab

**Base:** [CARD_INTELLIGENCE_STATUS_REPORT.md](CARD_INTELLIGENCE_STATUS_REPORT.md) · [FASE_2B_FIXTURES_METRICAS.md](FASE_2B_FIXTURES_METRICAS.md) · pipeline Impl 1–8

**Problema:** validar regras, métricas, logging, encoder, evaluator e mini-LLM apenas com partidas normais é ineficiente — o shuffle é aleatório e não reproduz facilmente situações como K♥ obrigatório (King), Q♠ (Hearts), bag (Spades), manilha antes do Ás (Sueca), duas últimas (King), cortes/trunfos específicos.

**Objectivo:**

- Área **developer-only** (flag dedicada; **não** visível em produção por defeito) para testar cenários controlados e jogos **seeded**.
- **Não** alterar regras, bots nem gameplay normal.

**Capacidades futuras (v1 documental → implementação na prompt Impl 9):**

| Capacidade | Descrição |
|------------|-----------|
| Cenários pré-construídos | Carregar presets alinhados a fixtures/métricas (S08, K02, SP09, …) |
| Seed fixa | Gerar jogo random com seed repetível — sempre o mesmo baralho/distribuição |
| Variante | Sueca, Spades, Hearts, King |
| Cenário / métrica | Escolher situação-alvo sem jogar manualmente até aparecer |
| Simulação lógica | Avançar estado/decisões offline ou semi-offline (sem depender só de UI) |
| Pipeline CI completo | Logs → encode → evaluate → memory → report → preparar advisory LLM |

**Fora de scope Impl 9:**

- Alterar motores de regras ou scoring
- Substituir ou melhorar bots (`frontend/src/ai/*`)
- Provider LLM real (Impl posterior)
- UI em produção

**Posição na ordem:** **após Impl 8**, **antes** de provider LLM real, Evaluator v1 amplo ou melhoria de bots.

**Estado:** ✅ concluída — H9 OK (2026-06-06).

---

## Implementação 10 — Debug Report Flow

**Base:** [IMPLEMENTATION_10_DEBUG_REPORT_FLOW_PROMPT.md](implementation-prompts/IMPLEMENTATION_10_DEBUG_REPORT_FLOW_PROMPT.md) · relatórios Impl 7–9

**Problema:** pipeline offline funcional mas validação humana ainda console-heavy; `postGameReport` e `devLab` report isolados.

**Objectivo:**

- Relatórios legíveis (texto + JSON schema **10.0.0**) para scenario / event / game / export.
- Helpers `__ciEventReport`, `__ciGameReport`, `__ciExportReport`; `__ciScenarioReport` canónico em `debugConsole`.
- `postGameReport` delega para game report; único `formatHumanReport.ts`.
- Warnings `trick_end missing` → `[info]` quando eval OK (H9).

**Fora de scope v0:** LLM real no report; persist report IDB; UI visual.

**Posição na ordem:** **após Impl 9**, **antes** de Evaluator v1 / provider LLM real.

**Estado:** ✅ concluída — H10 OK (2026-06-06).

---

# 3. Tabelas por implementação

## Implementação 0 — `IMPLEMENTATION_0_PREP`

| Campo | Conteúdo |
|-------|----------|
| **Objectivo** | Validar docs/paths; zero código |
| **Documentos base** | ROADMAP_AI, PHASE0, FASE_1–7, FASE_2A/2B |
| **Ficheiros prováveis a tocar** | Nenhum código — só `docs/ai/` se correcções menores |
| **Novos ficheiros prováveis** | Este plano; pasta `docs/ai/implementation-prompts/` (vazia até Impl 1) |
| **Dependências** | Docs F3–F7 fechados |
| **Riscos** | Inconsistência schema entre fases; drift nomes métricas |
| **Testes mínimos** | Checklist manual: 23 fixtures listados; schema versions |
| **Critérios de sucesso** | Francisco confirma docs consistentes; paths acordados |
| **Prompt antes de código** | **Sim** — `IMPLEMENTATION_0_PREP_PROMPT.md` (opcional se só checklist) |

---

## Implementação 1 — `IMPLEMENTATION_1_LOGGER_V0`

| Campo | Conteúdo |
|-------|----------|
| **Objectivo** | Logger passivo v0; IndexedDB; classification unknown |
| **Documentos base** | FASE_3, PHASE0 §2.1, FASE_2A |
| **Ficheiros prováveis a tocar** | `frontend/src/components/GameBoard.tsx`, `frontend/src/models/games/GameAdapter.ts`, `frontend/src/types/game.ts` (tipos partilhados se necessário) |
| **Novos ficheiros prováveis** | `frontend/src/cardIntelligence/logger/*`, `frontend/src/cardIntelligence/shared/types/logEvents.ts`, `frontend/src/cardIntelligence/shared/storage/logStore.ts`, testes `*.test.ts` |
| **Dependências** | Impl 0 |
| **Riscos** | Logging altera timing; quota IDB; hook no hot path; scope creep TrickEnd |
| **Testes mínimos** | Schema validation; evento após play; classification sempre unknown; jogo termina igual logger on/off; **sem** TrickEnd obrigatório |
| **Critérios de sucesso** | Eventos play persistidos (IDB); zero classificação; zero impacto resultado; função central única |
| **Hook** | v0: `GameBoard`/play flow → chama `logCardDecision()` central; fail-silent; tendência adapter boundary |
| **Prompt antes de código** | **Sim** → `implementation-prompts/IMPLEMENTATION_1_LOGGER_V0_PROMPT.md` |

---

## Implementação 2 — `IMPLEMENTATION_2_ROUND_HISTORY`

| Campo | Conteúdo |
|-------|----------|
| **Objectivo** | `roundPlayHistory` correcto em 4 jogos; **`TrickEndEvent` real** |
| **Documentos base** | FASE_3 §3, PHASE0 §6 items 4–5 |
| **Ficheiros prováveis a tocar** | `cardIntelligence/logger/*`, `cardIntelligence/shared/*`, adapters `*Game.ts` (só se precisar emitir trick end sem mexer regras) |
| **Novos ficheiros prováveis** | `logger/roundHistoryAccumulator.ts`, `shared/types/trickEndEvent.ts`, testes por variant |
| **Dependências** | Impl 1 |
| **Riscos** | Duplicar histórico Sueca `playedCards`; ordem cartas trick |
| **Testes mínimos** | 4 variants: N jogadas → history length; Spades/Hearts/King ≠ vazio |
| **Critérios de sucesso** | Encoder-ready history sem `GameState.playedCards` |
| **Prompt antes de código** | **Sim** |

---

## Implementação 3 — `IMPLEMENTATION_3_ENCODER_V0`

| Campo | Conteúdo |
|-------|----------|
| **Objectivo** | `EncodedDecisionState` Player View; campos P0 |
| **Documentos base** | FASE_4, FASE_2A §encoder, FASE_3 |
| **Ficheiros prováveis a tocar** | `cardIntelligence/encoder/*`, logger types |
| **Novos ficheiros prováveis** | `encoder/encodeDecision.ts`, `encoder/variants/*.ts`, `shared/types/encodedState.ts`, testes |
| **Dependências** | Impl 1, Impl 2 |
| **Riscos** | Player View leak; campos King `mustPlayKingHeartsNow` |
| **Testes mínimos** | pre/post modes; hidden omitido player view; P0 fields per game |
| **Critérios de sucesso** | Encode from log event; `chosenCard` null pre / filled post |
| **Prompt antes de código** | **Sim** |

---

## Implementação 4 — `IMPLEMENTATION_4_FIXTURES_2B`

| Campo | Conteúdo |
|-------|----------|
| **Objectivo** | Golden tests a partir fixtures 2B |
| **Documentos base** | FASE_2B, FASE_2B_ARQUIVO, FASE_4 |
| **Ficheiros prováveis a tocar** | `cardIntelligence/__fixtures__/*`, testes encoder |
| **Novos ficheiros prováveis** | `fixtures/T01_*.ts`, `fixtures/S08_*.ts`, …; `encoder/fixtures.test.ts` |
| **Dependências** | Impl 3 |
| **Riscos** | Fixtures markdown ≠ estado encodable; scope creep para 40 arquivados |
| **Testes mínimos** | ≥6 fixtures P0 encode; estados mínimos documentados |
| **Critérios de sucesso** | CI verde em snapshots encoder; gaps listados |
| **Prompt antes de código** | **Sim** |

---

## Implementação 5 — `IMPLEMENTATION_5_EVALUATOR_V0`

| Campo | Conteúdo |
|-------|----------|
| **Objectivo** | Avaliador P0 offline; store separado |
| **Documentos base** | FASE_5, FASE_2A ordem P0, FASE_2B |
| **Ficheiros prováveis a tocar** | `cardIntelligence/evaluator/*`, storage evaluations |
| **Novos ficheiros prováveis** | `evaluator/evaluateDecision.ts`, `evaluator/metrics/p0/*.ts`, `evaluator/types.ts`, testes por fixture |
| **Dependências** | Impl 3, Impl 4 |
| **Riscos** | Avaliador no hot path; opinativo demais; catálogo vs código |
| **Testes mínimos** | T01 illegal→bad; K02 obligation; SP09 bag; partial vs unknown; pior vence |
| **Critérios de sucesso** | Fixtures P0 prioritários passam; log bruto inalterado |
| **Prompt antes de código** | **Sim** |

---

## Implementação 6 — `IMPLEMENTATION_6_MEMORY_V0`

| Campo | Conteúdo |
|-------|----------|
| **Objectivo** | Agregados simples; badRate; local IDB |
| **Documentos base** | FASE_6 |
| **Ficheiros prováveis a tocar** | `cardIntelligence/memory/*` |
| **Novos ficheiros prováveis** | `memory/ingest.ts`, `memory/aggregates.ts`, `memory/memoryStore.ts`, testes ingest |
| **Dependências** | Impl 5 |
| **Riscos** | Agregados enviesados; mix evaluator versions |
| **Testes mínimos** | 3 bad SP09 → badRate; partialCount separado; sem ingest sem F5 |
| **Critérios de sucesso** | Agregado bot:medium:spades:SP09 incrementa após avaliações |
| **Prompt antes de código** | **Sim** |

---

## Implementação 7 — `IMPLEMENTATION_7_DEBUG_EXPORT`

| Campo | Conteúdo |
|-------|----------|
| **Objectivo** | JSONL export; debug UI mínimo |
| **Documentos base** | FASE_3 export, FASE_6 §7.3, FASE_5 §13 |
| **Ficheiros prováveis a tocar** | `cardIntelligence/export/*`, dev UI opcional `frontend/src/components/dev/` |
| **Novos ficheiros prováveis** | `export/jsonlExport.ts`, `export/postGameReport.ts` |
| **Dependências** | Impl 1–6 (pelo menos 1+5 para valor) |
| **Riscos** | Export dados locais sensíveis; UI em prod |
| **Testes mínimos** | Round-trip JSONL; export filtrado por gameId; UI oculta sem `REACT_APP_CARD_INTELLIGENCE_DEBUG` |
| **Critérios de sucesso** | Francisco exporta partida (dev flag on); zero UI debug em build prod default |
| **Prompt antes de código** | **Sim** |

---

## Implementação 8 — `IMPLEMENTATION_8_MINI_LLM_ADVISORY`

| Campo | Conteúdo |
|-------|----------|
| **Objectivo** | Advisory only; provider stub; play phase only |
| **Documentos base** | FASE_7 v1.1 |
| **Ficheiros prováveis a tocar** | `cardIntelligence/miniLlm/*`, `features.ts`, `GameBoard.tsx` (hook advisory) |
| **Novos ficheiros prováveis** | `miniLlm/provider.ts`, `miniLlm/types.ts`, `miniLlm/advisory.ts`, stub provider test |
| **Dependências** | Impl 3, Impl 6 recomendado, Impl 7 opcional |
| **Riscos** | Scope creep decision assist; provider lock-in; latência |
| **Testes mínimos** | Stub provider; illegal suggestion rejected; fallback chain; disabled default |
| **Critérios de sucesso** | Advisory text only; zero cartas jogadas pela LLM em v0; flag off = zero calls |
| **Prompt antes de código** | **Sim** |

---

## Implementação 9 — `IMPLEMENTATION_9_DEV_SEEDED_GAME_LAB`

| Campo | Conteúdo |
|-------|----------|
| **Objectivo** | Lab dev com seeds e presets; cenários repetíveis; alimentar pipeline Card Intelligence sem shuffle aleatório |
| **Documentos base** | FASE_2B, fixtures existentes, CARD_INTELLIGENCE_STATUS_REPORT, Impl 1–8 reports |
| **Ficheiros prováveis a tocar** | `frontend/src/config/features.ts`, `cardIntelligence/` (nova subpasta `lab/` ou `devLab/`), routing dev-only |
| **Novos ficheiros prováveis** | `lab/scenarios/*`, `lab/seededGame.ts`, `lab/runScenario.ts`, testes golden por cenário, prompt dedicada |
| **Dependências** | Impl 1–8 (logger, encoder, evaluator, memory, debug, LLM mock) |
| **Riscos** | Confundir lab com gameplay prod; leak de presets em build prod; duplicar fixtures |
| **Testes mínimos** | Mesmo seed → mesmo estado; cenário K02 → log+encode+eval reprodutível; flag off → zero UI/lab |
| **Critérios de sucesso** | Repetir cenário métrico em &lt;1 min sem jogar manualmente; pipeline offline verde; prod sem lab |
| **Prompt antes de código** | **Sim** → `implementation-prompts/IMPLEMENTATION_9_DEV_SEEDED_GAME_LAB_PROMPT.md` |

**Cenários-alvo (exemplos):**

- King — K♥ obrigatório na 1.ª oportunidade legal
- Hearts — Q♠ perigo / limpar
- Spades — bid cumprido, evitar bag
- Sueca — manilha antes do Ás; ganhar barato (S08); corte/trunfo específico
- King — endgame duas últimas

---

## Implementação 10 — `IMPLEMENTATION_10_DEBUG_REPORT_FLOW`

| Campo | Conteúdo |
|-------|----------|
| **Objectivo** | Relatórios legíveis offline; unificar scenario/event/game/export |
| **Documentos base** | Impl 7–9 reports, FASE 5/6 §export |
| **Ficheiros prováveis a tocar** | `debug/reportFlow/*`, `debugConsole.ts`, `postGameReport.ts`, `devLab/scenarioReport.ts` |
| **Novos ficheiros prováveis** | `reportFlow/build*Report.ts`, `formatHumanReport.ts`, `exportReport.ts`, testes |
| **Dependências** | Impl 7–9 |
| **Riscos** | Duplicar formatos devLab vs report; report gigante |
| **Testes mínimos** | LAB_K02, LAB_H13 informational, event/game synthetic, export text/json/jsonl |
| **Critérios de sucesso** | CI verde; zero gameplay; H10 smoke; prod sem helpers novos |
| **Prompt antes de código** | **Sim** → `IMPLEMENTATION_10_DEBUG_REPORT_FLOW_PROMPT.md` |
| **Checkpoint** | **H10** — scenario lab + event/game IDB; ver prompt §16 |

---

## Implementação 11 — `IMPLEMENTATION_11_EVALUATOR_V1_TIER_B`

| Campo | Conteúdo |
|-------|----------|
| **Objectivo** | Descongelar métricas Tier B (S25, SP14, H10, K10); heurísticas conservadoras offline |
| **Documentos base** | FASE_5 §4.2/§8.5, FASE_2A/2B, Impl 5/10 reports |
| **Ficheiros prováveis a tocar** | `evaluator/metricEvaluators.ts`, `aggregateResults.ts`, `encoder/heartsEncoder.ts`, fixtures mínimas |
| **Novos ficheiros prováveis** | `evaluator/tierBHelpers.ts`, `encoder/heartsMoonThreat.ts`, `tierBv1.test.ts` |
| **Dependências** | Impl 5, Impl 10 (H10 OK recomendado) |
| **Riscos** | Regressão Tier A; H10 falso positivo moon; SP14 partial em logs reais |
| **Testes mínimos** | Golden K10/SP14 good, H10/S25 partial; sintéticos T1–T12; grep hot path |
| **Critérios de sucesso** | CI verde; sem `tierBPartial`; schema evaluator 5.0.0 |
| **Prompt antes de código** | **Sim** → `IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_PROMPT.md` |
| **Relatório** | [IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md](implementation-reports/IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md) |
| **Hotfix 11.1** | Dev Lab Tier B presets — § relatório Impl 11 |
| **Checkpoint** | **H11** — **OK** 2026-06-06 |

---

# 4. Primeira implementação recomendada

## Estado actual (2026-06-06)

**Impl 1–15 concluídos.** **H13 OK** · **H14 OK** · **H15-OK parcial** (Hearts — gap cartas altas → v2).

**Impl 16:** código concluído — [relatório](implementation-reports/IMPLEMENTATION_16_KING_BOT_METRICS_UPGRADE_REPORT.md); **H16-OK pendente** smoke.

**Próximo passo recomendado:** smoke King PT Medium/Hard → **H16-OK** → King v2 / Simplified / gaps transversais.

## Se a reiniciar do zero (referência histórica)

**`IMPLEMENTATION_1_LOGGER_V0`**

É a base de toda a Card Intelligence: sem eventos estruturados não há encoder, avaliador, memória nem LLM.

## Antes de qualquer linha de código

A **próxima tarefa documental** deve ser:

```
docs/ai/implementation-prompts/IMPLEMENTATION_1_LOGGER_V0_PROMPT.md
```

Essa prompt deve conter, no mínimo:

- Escopo exacto: **só `CardDecisionLogEvent` play** — bids P1; TrickEnd = Impl 2
- Lista de ficheiros a criar/alterar (`frontend/src/cardIntelligence/`, **não** `frontend/src/ai/`)
- Schema 3.0.0 campo a campo
- Hook: função central `logCardDecision()` — v0 em `GameBoard`/play flow; fail-silent; tendência adapter
- Persistência: IndexedDB primary; localStorage fallback dev-only
- Testes e critérios de sucesso
- Explicitamente: **não** preencher classification/reason; **não** bloquear por TrickEnd

**Ordem de trabalho:**

```
IMPLEMENTATION_PLAN_AI.md          ← este documento (feito)
        ↓
IMPLEMENTATION_1_LOGGER_V0_PROMPT.md   ← próximo passo
        ↓
código logger v0
        ↓
relatório final Impl 1
        ↓
IMPLEMENTATION_2_ROUND_HISTORY_PROMPT.md
        ↓
…
```

---

# 5. Granularidade

| Regra | Detalhe |
|-------|---------|
| Uma PR / entrega por implementação | Facilita review e revert |
| Não juntar logger + encoder | Dependência sequencial clara |
| Não juntar avaliador + memória | Avaliador estável antes de agregados |
| Não juntar export + mini-LLM | LLM mock (Impl 8) antes de provider real |
| Não juntar game lab + provider LLM real | Lab seeded (Impl 9) antes de Ollama/WebLLM |
| Não juntar report flow + Evaluator v1 | Report flow (Impl 10) antes de Tier B evaluator |
| Bots intocados | Hooks passivos; `frontend/src/ai/` intocado; heurísticas permanecem default |
| Regras intocadas | Alterar `Game.ts` / scoring = prompt própria explícita |

**Tamanho alvo:** cada implementação implementável e testável em **1–3 sessões** de trabalho focado.

---

# 6. Regras de segurança

| # | Regra |
|---|-------|
| S1 | **Não** alterar regras de jogo sem prompt/implementação própria |
| S2 | **Não** alterar bots/heurísticas existentes sem necessidade |
| S3 | **Não** substituir AI existente — Card Intelligence **acima** |
| S4 | **Não** activar mini-LLM por defeito — disabled / flag off |
| S5 | **Não** usar backend — local-first, IndexedDB (+ localStorage fallback dev) |
| S6 | **Não** usar informação escondida na Player View (encoder/avaliador/LLM) |
| S7 | **Nunca** escolher carta ilegal — engine + T01 |
| S8 | **Fallback sempre** — heurística → externa Sueca → 1.ª legal |
| S9 | Logger v0 **não** classifica — unknown/null fixos |
| S10 | Avaliador **offline** v0 — não bloquear UI |
| S11 | Memória **não** auto-corrige bots |
| S12 | LLM v0 **advisory only** — decision assist só após rollout F7 |
| S13 | Debug/export UI **dev-only** — `REACT_APP_CARD_INTELLIGENCE_DEBUG`; nunca prod default |
| S14 | Logger: **uma** função central — não espalhar hooks |
| S15 | Game Lab **dev-only** — flag dedicada; nunca activo em produção por defeito; não altera fluxo normal de jogo |

---

# 7. Estratégia de testes

## 7.1 Por camada

| Camada | Tipo de teste |
|--------|---------------|
| Schemas / helpers | Unitários — validação schemaVersion, campos obrigatórios |
| Logger | Unit + integração — evento após play; on/off regressão gameplay |
| roundPlayHistory | Unit por variant — 4 jogos |
| Encoder | Snapshots golden fixtures 2B; Player vs Engine view |
| Avaliador | Golden por metricId P0; T01 gate; partial vs unknown |
| Memória | Unit ingest — contagens, badRate, separação partial/unknown |
| Export | Round-trip JSONL |
| Mini-LLM | Stub provider; rejeição ilegal; timeout → fallback |
| Game Lab | Mesmo seed → mesmo baralho; cenário preset → eventos esperados; integração log→eval |

## 7.2 Regras transversais

| Garantia | Como |
|----------|------|
| Logging não altera resultado | Teste A/B mesma seed com logger on/off |
| Avaliador não corre no logger v0 | Logger tests não invocam evaluator |
| Avaliador não no hot path v0 | Sem hook síncrono em `playCard` |
| Gameplay regressão | Smoke test partida completa por jogo após cada impl |
| Fixtures 2B | Prioridade P0 antes de expandir para 23 |
| Golden vs humano | CI golden = regressão automática; checkpoints H1/H3/H5 = validação humana **obrigatória** — testes **não** substituem análise humana |

## 7.3 Ferramentas

- Vitest (padrão existente em `frontend/src/services/*.test.ts`)
- Snapshots encoder/avaliador versionados no repo
- **Não** E2E browser obrigatório v0 — unit/integration suficientes

---

# 8. Marcos de validação humana (Francisco)

Checkpoints **obrigatórios** antes de avançar (regra formal). **Distinção CI vs manual:** CI OK ≠ Humano OK — ver [CARD_INTELLIGENCE_STATUS_REPORT.md](CARD_INTELLIGENCE_STATUS_REPORT.md) §6.

| # | Após | CI | Manual | Estado global |
|---|------|-----|--------|---------------|
| H1 | Logger v0 (Impl 1) | OK | Pendente | Parcial |
| H2 | roundPlayHistory (Impl 2) | OK | Pendente | Parcial |
| H3 | Encoder v0 (Impl 3) | OK | Pendente | Parcial |
| H4 | Fixtures (Impl 4) | OK | Pendente | Parcial |
| H5 | Avaliador v0 (Impl 5) | OK | Pendente | Parcial |
| H6 | Memory (Impl 6) | OK | Pendente | Parcial |
| H7 | Debug/Export (Impl 7) | OK | Parcial | Parcial |
| H8 | Mini-LLM (Impl 8) | OK | Pendente | Parcial |
| H9 | Dev Lab (Impl 9) | OK | **OK** 2026-06-06 | **OK** |
| H10 | Debug Report Flow (Impl 10) | OK | **OK** 2026-06-06 | **OK** |
| H11 | Evaluator v1 Tier B (Impl 11 + 11.1) | OK | **OK** 2026-06-06 | **OK** |
| H13 | Sueca bot metrics (Impl 13) | OK | **OK** 2026-06-06 | **OK** |
| H14 | Spades bot metrics (Impl 14) | OK | **OK** 2026-06-06 | **OK** |
| H15 | Hearts bot metrics (Impl 15) | OK | **Parcial** 2026-06-06 | **Parcial** — cartas altas v2 |
| H16 | King bot metrics (Impl 16) | — | Pendente | Prompt v1.1 aprovada; código pendente |

**Bloqueio formal:** plano original exige OK explícito antes de Impl N+1. Na prática, Impl 2–10 avançaram com **CI-only** para H1–H8; H9/H10 fechados manualmente. Recomenda-se smoke H1–H8 antes de melhoria de bots.

**Golden tests (CI):** regressão automática — complementam, **não substituem**, validação manual.

---

# 9. Resultado esperado deste plano

| Pergunta | Resposta |
|----------|----------|
| **Por onde começar?** | **Impl 16 King bot** — prompt v1.1 aprovada |
| **O que não fazer ainda?** | King Simplified / festa / decision assist LLM |
| **Impl 1–15** | ✅ Concluídas — ver `implementation-reports/` |
| **Impl 16** | 📋 Prompt aprovada — código + H16-OK pendente |
| **Que prompt antes de código?** | Uma por implementação em `docs/ai/implementation-prompts/` |
| **Como evitar scope creep?** | Granularidade §5; P0 only avaliador; LLM advisory only; checkpoints H1–H11 |

## O que fica de fora (explicitamente)

| Fora de scope até impl dedicada | Motivo |
|----------------------------------|--------|
| Provider LLM real (Ollama/WebLLM) | Após Evaluator v1 + smoke H7/H8 |
| Decision assist LLM | Rollout F7 — após advisory estável + lab |
| Bids/pass/leilão LLM | F7 v1/v2 |
| Backend sync | ROADMAP local-first |
| Treino ML / fine-tuning | F6 learning futuro |
| Alterar `SuecaStrategy` / bots | Só se prompt própria |
| 40 fixtures arquivados F2B | P2/P3 — não bloquear v0 |
| SP01 bid evaluation in-play | BidEvent separado — P1 |

---

# Dúvidas documentadas — resolvidas (v1.1)

| # | Tema | Decisão fechada |
|---|------|-----------------|
| 1 | Localização módulo | `frontend/src/cardIntelligence/` com `logger/`, `encoder/`, `evaluator/`, `memory/`, `shared/` — **não** misturar com `frontend/src/ai/` |
| 2 | TrickEnd vs Impl 1 | Impl 1 = `CardDecisionLogEvent` only; TrickEnd real em Impl 2; não bloquear Logger v0 |
| 3 | IndexedDB vs localStorage | IDB principal; localStorage fallback dev/minimal se IDB indisponível; sem backend/sync |
| 4 | Hook GameBoard vs adapter | v0: play flow (`GameBoard`); função central única; tendência adapter boundary; fail-silent |
| 5 | Golden CI vs validação humana | Golden = regressão CI; H1/H3/H5 humanos obrigatórios — não substituir |
| 6 | Dev UI export | `REACT_APP_CARD_INTELLIGENCE_DEBUG` (padrão CRA); nunca prod default |

---

## Referências

- [ROADMAP_AI.md](ROADMAP_AI.md)
- [PHASE0_INVENTORY.md](PHASE0_INVENTORY.md)
- [FASE_1_METRICAS.md](FASE_1_METRICAS.md)
- [FASE_2A_PRIORIDADES_METRICAS.md](FASE_2A_PRIORIDADES_METRICAS.md)
- [FASE_2B_FIXTURES_METRICAS.md](FASE_2B_FIXTURES_METRICAS.md)
- [FASE_3_LOGGER_DESIGN.md](FASE_3_LOGGER_DESIGN.md)
- [FASE_4_ENCODER_DESIGN.md](FASE_4_ENCODER_DESIGN.md)
- [FASE_5_AVALIADOR_DESIGN.md](FASE_5_AVALIADOR_DESIGN.md)
- [FASE_6_MEMORIA_APRENDIZAGEM_DESIGN.md](FASE_6_MEMORIA_APRENDIZAGEM_DESIGN.md)
- [CARD_INTELLIGENCE_STATUS_REPORT.md](CARD_INTELLIGENCE_STATUS_REPORT.md)
- [reviews/ROADMAP_COMPLIANCE_REVIEW.md](reviews/ROADMAP_COMPLIANCE_REVIEW.md)
- [reviews/TECHNICAL_INTEGRITY_REVIEW.md](reviews/TECHNICAL_INTEGRITY_REVIEW.md)
- [implementation-prompts/IMPLEMENTATION_16_KING_BOT_METRICS_UPGRADE_PROMPT.md](implementation-prompts/IMPLEMENTATION_16_KING_BOT_METRICS_UPGRADE_PROMPT.md)
- [implementation-reports/IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE_REPORT.md](implementation-reports/IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE_REPORT.md)

---

## Histórico

| Versão | Data | Nota |
|--------|------|------|
| 1.0 | 2026-05-31 | Plano inicial — Impl 0–8, regra prompt→código→relatório |
| 1.1 | 2026-05-31 | Decisões fechadas: estrutura módulo, TrickEnd/Impl2, IDB, hook central, golden+humano, debug flag |
| 1.2 | 2026-06-04 | Impl 9 `DEV_SEEDED_GAME_LAB` — após Impl 8, antes de provider LLM real / bots |
| 1.3 | 2026-06-06 | Impl 10 `DEBUG_REPORT_FLOW`; H9/H10 OK; excepções 1.1/H2/3.1; estado repo actualizado |
| 1.4 | 2026-06-06 | Impl 11 Evaluator Tier B + hotfix 11.1 Dev Lab; H11 OK |
| 1.5 | 2026-06-06 | Impl 12–15 concluídas (H13/H14 OK, H15 parcial); Impl 16 prompt v1.1 aprovada; §2.2 bot metrics |
