# IMPLEMENTATION_11_EVALUATOR_V1_TIER_B — Relatório final

**Data:** 2026-06-06  
**Prompt:** [IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_PROMPT.md](../implementation-prompts/IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_PROMPT.md)  
**Pré-requisito:** H10 OK (Impl 10)  
**Estado CI:** verde — **229** testes `cardIntelligence` (pós-hotfix 11.1), **423** frontend, build OK  
**Checkpoint H11:** **OK — 2026-06-06**

---

## Hotfix 11.1 — Dev Lab Tier B presets (2026-06-06)

**ID:** `IMPLEMENTATION_11.1_TIER_B_DEV_LAB_PRESETS`

### Problema

Dev Lab só expunha 4 presets (`LAB_K02`, `LAB_SP09`, `LAB_S16`, `LAB_H13`). Tier B no browser falhava com `Scenario LAB_SP14 not found`. Além disso, `runScenario` não passava `fixtureId` ao evaluator — H10/S25 no report mostrariam classificação global incorrecta.

### Ficheiros alterados (11.1)

| Ficheiro | Alteração |
|----------|-----------|
| `devLab/presetScenarios.ts` | +4 presets: `LAB_SP14`, `LAB_K10`, `LAB_H10`, `LAB_S25` |
| `devLab/runScenario.ts` | Passa `scenario.fixtureId` a `evaluateDecision` |
| `devLab/runScenario.test.ts` | Registry 8 LABs; asserts Tier B |
| `debug/reportFlow/buildScenarioReport.test.ts` | Reports Tier B: classification + reasonShort + metricResults |

**Zero alterações** em evaluator core, GameBoard, gameplay, bots.

### Presets Dev Lab (8 total)

| ID | Fixture | global esperado v1 |
|----|---------|-------------------|
| `LAB_K02` | K02 | good |
| `LAB_SP09` | SP09 | good |
| `LAB_S16` | S16 | good |
| `LAB_H13` | H13 | good |
| **`LAB_SP14`** | SP14 | **good** |
| **`LAB_K10`** | K10 | **good** |
| **`LAB_H10`** | H10 | **partial** |
| **`LAB_S25`** | S25 | **partial** |

### Comandos H11 browser (pós 11.1)

Arranque:

```bash
cd frontend
REACT_APP_CARD_INTELLIGENCE_DEBUG=true \
REACT_APP_CARD_INTELLIGENCE_DEV_LAB=true \
npm start
```

Consola:

```javascript
await __ciListScenarios()  // 8 cenários

await __ciScenarioReport('LAB_SP14')
await __ciScenarioReport('LAB_K10')
await __ciScenarioReport('LAB_H10')
await __ciScenarioReport('LAB_S25')
```

Regressão Tier A (opcional): `await __ciScenarioReport('LAB_K02')`

**Nota:** script `import('./cardIntelligence/...')` continua inválido no CRA — usar `__ciScenarioReport` acima.

### CI hotfix 11.1

```bash
cd frontend
CI=true npm test -- --testPathPattern=cardIntelligence --watchAll=false  # 229 passed
CI=true npm run build
grep -rE "evaluateDecision" frontend/src/components \
  frontend/src/cardIntelligence/logger/playWithLogging.ts \
  frontend/src/models/games
# zero matches
```

---

## Ficheiros criados

```
frontend/src/cardIntelligence/
├── encoder/heartsMoonThreat.ts
├── evaluator/tierBHelpers.ts
├── evaluator/tierBHelpers.test.ts
└── evaluator/tierBv1.test.ts
```

## Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| `evaluator/metricEvaluators.ts` | Heurísticas K10, SP14, H10, S25 (§4 prompt) |
| `evaluator/aggregateResults.ts` | Removido hack `tierBPartial` (D1) |
| `evaluator/evalHelpers.ts` | Removido `tierBPartialMetric` v0 |
| `evaluator/evaluateDecision.ts` | Passa `tierBTestContext` ao contexto |
| `evaluator/types.ts` | `S25TestContext`, `tierBTestContext` input/context |
| `evaluator/evaluatorGolden.test.ts` | Expected por fixture Tier B (§11.1) |
| `evaluator/aggregateResults.test.ts` | T13 worst-wins; L5 sem force-partial |
| `encoder/types.ts` | `HeartsEncoding.moonThreatLevel` nullable (D6) |
| `encoder/heartsEncoder.ts` | Deriva `moonThreatLevel` |
| `encoder/heartsEncoder.test.ts` | Testes moon |
| `encoder/metricContext.ts` | H10 `neededFields` + `moonThreatLevel` |
| `fixtures/heartsFixtures.ts` | H10: `chosenCard` c3 (evita H01 bad global) |
| `fixtures/spadesFixtures.ts` | SP14: mão `[sA,c2]` (SP08 good coexistente) |

**Zero alterações** em GameBoard, playWithLogging, bots, motores, memory hot path, LLM.

---

## Métricas Tier B melhoradas

| Métrica | Golden / sintético | Classificação típica v1 |
|---------|-------------------|-------------------------|
| **K10** | Golden trick 11 lead c2 | **good** — abriu baixo |
| **SP14** | Golden bid adversária 8, sA ganha | **good** — bloqueou pressão |
| **H10** | Golden fixture | **partial** — moon indisponível (D10) |
| **H10** | Sintético T7 (8 hearts P1 → likely) + c3 | **good** |
| **S25** | Golden | **partial** — void parceiro indisponível (D3) |
| **S25** | Sintético T1/T2 | **good** / **bad** com `tierBTestContext` |

## Quais continuam partial e porquê

| Caso | Motivo |
|------|--------|
| **H10 golden** | `moonThreatLevel` `none`/`null` — história insuficiente (D10) |
| **S25 golden** | Player View — sem inferir void parceiro (D3) |
| **SP14** (não-fixture) | `not_applicable` quando ameaça adversária inactiva — não contamina Tier A |
| **H10** (não-fixture) | `not_applicable` quando moon none/null — não contamina Tier A |

---

## Agregador — confirmação remoção tierBPartial

Bloco removido de `aggregateResults.ts`:

```typescript
// REMOVIDO v0:
if (tierBPartial) classification = 'partial';
```

Agregação v1: **worst-wins** `bad > partial > medium > good > unknown` + `hasIncompleteContext` (Tier A S08).  
`TIER_B_FIXTURE_IDS` mantida só para testes/documentação.

---

## Testes executados + contagens

```bash
cd frontend
CI=true npm test -- --testPathPattern=evaluator --watchAll=false   # 217 cardIntelligence subset
CI=true npm test -- --testPathPattern=cardIntelligence --watchAll=false  # 217 passed
CI=true npm test -- --watchAll=false                                 # 411 passed
CI=true npm run build

grep -rE "evaluateDecision" frontend/src/components \
  frontend/src/cardIntelligence/logger/playWithLogging.ts \
  frontend/src/models/games
# zero matches
```

Novos testes Tier B: `tierBv1.test.ts` (T1–T12), `tierBHelpers.test.ts`, golden §11.1, aggregate T13.

---

## Exemplos `reasonShort` (português de mesa)

| fixture / caso | metricId | classification | reasonShort |
|----------------|----------|----------------|-------------|
| K10 golden | K10 | good | Abriu com carta baixa nas duas últimas. |
| SP14 golden | SP14 | good | Bloqueou pressão da bid adversária. |
| H10 golden | H10 | partial | Shoot the moon — ameaça moon indisponível. |
| S25 golden | S25 | partial | Destrunfar parceiro — void parceiro indisponível. |
| T10 sintético | K10 | bad | Subiu demais na penúltima — risco no_last_two. |
| T5 sintético | SP14 | bad | Deixou escapar vaza com bid adversária em jogo. |
| T7 sintético | H10 | good | Evitou alimentar shoot the moon. |
| T1 sintético | S25 | good | Destrunfou trunfo a favor do parceiro void. |

---

## Confirmação zero gameplay + grep

- `evaluateDecision` **não** referenciado em `components/`, `playWithLogging.ts`, `models/games/`
- Prod gameplay inalterado; evaluator offline/debug/test-only

---

## Encoder `moonThreatLevel`

Campo nullable em `HeartsEncoding` (schema encoder **4.0.0** mantido):

| Nível | Regra |
|-------|-------|
| `null` | Copas não quebradas **ou** história vazia **ou** empate top candidate |
| `none` | Nenhum jogador ≥4 hearts capturados **e** ≥20 pts hearts |
| `possible` | ≥4 hearts **ou** ≥20 pts |
| `likely` | ≥8 hearts **ou** ≥22 pts |

Implementação: `encoder/heartsMoonThreat.ts` (Player View — só `roundPlayHistory` + `heartsBroken`).

---

## Gaps / deferidos (Q7–Q8)

| ID | Tema | Estado |
|----|------|--------|
| **Q7** | Memory `partialCount` drift pós-Tier B | **Deferido** — revalidar quando memory wired |
| **Q8** | STATUS test count | **229** cardIntelligence / **423** frontend (pós-11.1) |
| **D7** | Dev Lab presets Tier B | **Fechado** — hotfix 11.1 (`LAB_SP14`, `LAB_K10`, `LAB_H10`, `LAB_S25`) |

---

## Checkpoints

| Checkpoint | Estado |
|------------|--------|
| **H10** | OK 2026-06-06 (pré-requisito) |
| **H11** | **OK — 2026-06-06** | Jest golden + tierBv1; browser `__ciScenarioReport` LAB_K02, LAB_S25, LAB_H10 (+ CI golden SP14/K10) |

### Evidência H11 (Francisco)

| Canal | Resultado |
|-------|-----------|
| Jest `evaluatorGolden` | Tier A ×20 good; K10/SP14 good; H10/S25 partial |
| Jest `tierBv1` | T1–T12 OK |
| Browser Dev Lab | LAB_K02 good; LAB_S25 partial («void parceiro indisponível»); LAB_H10 partial («ameaça moon indisponível») |
| Hotfix 11.1 | 8 presets; `fixtureId` em `runScenario` |

---

## Actualização IMPLEMENTATION_PLAN + STATUS (Impl 11)

- [IMPLEMENTATION_PLAN_AI.md](../IMPLEMENTATION_PLAN_AI.md) v1.4 — Impl 11 + H11 OK
- [CARD_INTELLIGENCE_STATUS_REPORT.md](../CARD_INTELLIGENCE_STATUS_REPORT.md) v1.6 — Impl 11 + hotfix 11.1, 229 testes CI

---

## Próximos passos

1. **Provider LLM real** — próximo bloco roadmap  
2. **Melhoria bots** — após provider / H5–H6 smoke recomendado  
3. **Q7** — revalidar memory `partialCount` pós-Tier B  
4. **Cosmético P2** — `humanNote` fixtures Tier B (texto «v0»); game report highlights

---

**Estado:** Impl 11 + hotfix 11.1 **fechados** — **H11 OK** 2026-06-06.

**Fim do relatório Impl 11.**
