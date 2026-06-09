# IMPLEMENTATION_9_DEV_SEEDED_GAME_LAB — Relatório final

**ID:** `IMPLEMENTATION_9_DEV_SEEDED_GAME_LAB`  
**Prompt:** [IMPLEMENTATION_9_DEV_SEEDED_GAME_LAB_PROMPT.md](../implementation-prompts/IMPLEMENTATION_9_DEV_SEEDED_GAME_LAB_PROMPT.md)  
**Data:** 2026-06-06  
**Estado:** implementação concluída — **H9 OK** (Francisco, 2026-06-06)

---

## Ficheiros criados

### `frontend/src/cardIntelligence/devLab/`

| Ficheiro | Função |
|----------|--------|
| `types.ts` | `DevLabScenario`, `SeededGameResult`, `ScenarioRunResult`, schema 9.0.0 |
| `errors.ts` | `DevLabScenarioError` |
| `validateScenario.ts` | validação legalMoves / variant / chosenCard |
| `presetScenarios.ts` | `ALL_DEV_LAB_SCENARIOS`, `labFromFixture`, `listScenarios` |
| `seededRandom.ts` | mulberry32, `generateSeededDeal`, `dealHash` determinístico |
| `runScenario.ts` | pipeline offline ciEncode → evaluateDecision → report |
| `scenarioReport.ts` | `buildScenarioReport` texto legível |
| `index.ts` | exports módulo |
| `presetScenarios.test.ts` | — (coberto em runScenario.test) |
| `seededRandom.test.ts` | T1–T2 determinismo, 40/52 cartas |
| `runScenario.test.ts` | 4 presets, K02 contractId, S16/SP09/H13 |
| `scenarioReport.test.ts` | formato report |

### `frontend/src/cardIntelligence/debug/`

| Ficheiro | Função |
|----------|--------|
| `devLabConsole.ts` | `installCardIntelligenceDevLabConsole`, `window.__ci*` lab |
| `devLabConsole.test.ts` | flag off / DEBUG only / dupla flag |

---

## Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| `frontend/src/config/features.ts` | `CARD_INTELLIGENCE_DEV_LAB` (default off) |
| `frontend/src/index.tsx` | dynamic import `devLabConsole` se DEBUG && DEV_LAB |
| `frontend/src/cardIntelligence/index.ts` | re-exports devLab (opcional) |

**Não alterados:** `GameBoard.tsx`, `playWithLogging.ts`, `*Game.ts`, `*Strategy.ts`, `Deck.ts`, motores scoring, LLM provider.

---

## Cenários preset criados

| ID | Fixture | Jogo | Métrica |
|----|---------|------|---------|
| `LAB_K02` | K02 | King | K♥ obrigatório |
| `LAB_SP09` | SP09 | Spades | Bid cumprido / evitar bag |
| `LAB_S16` | S16 | Sueca | Manilha antes do Ás |
| `LAB_H13` | H13 | Hearts | Q♠ perigo / limpar |

---

## Helpers console (lista §10.2)

| Helper | Função |
|--------|--------|
| `__ciListScenarios()` | ids + humanNote |
| `__ciRunScenario(id, opts?)` | pipeline completo |
| `__ciRunSeededGame({ variant, seed })` | deal + dealHash |
| `__ciScenarioReport(id, opts?)` | só texto |
| `__ciExportScenario(id, opts?)` | Blob JSONL envelope |
| `window.__ciLab` | namespace opcional com os mesmos métodos |

---

## Como activar/desactivar flags

```bash
cd frontend
REACT_APP_CARD_INTELLIGENCE_DEBUG=true \
REACT_APP_CARD_INTELLIGENCE_DEV_LAB=true \
npm start
```

Prod / lab off: omitir `REACT_APP_CARD_INTELLIGENCE_DEV_LAB` (default **false**). `CARD_INTELLIGENCE_DEBUG` sozinho **não** activa lab.

---

## Testes executados + contagens

```bash
CI=true npm test -- --testPathPattern=devLab --watchAll=false
# 4 suites, 18 tests OK

CI=true npm test -- --testPathPattern=cardIntelligence --watchAll=false
# 35 suites, 183 tests OK

CI=true npm test -- --watchAll=false
# 70 suites, 377 tests OK
```

Fonte: Jest CI run 2026-06-06.

---

## Exemplo buildScenarioReport (LAB_K02)

```
Card Intelligence — Dev Lab Report
Scenario: LAB_K02 (king)
Metric: K02 — K♥ obrigatório na 1.ª oportunidade legal (lead).
Fixture: K02

--- Encode (Player View) ---
contractId: no_king_hearts
mustPlayKingHeartsNow: true

--- Evaluation ---
classification: good
reasonShort: …
metricResults: K02 good

Warnings: (none)
```

Fonte: `runScenario.test.ts` — `LAB_K02` → `contractId: no_king_hearts`, evaluation K02 aplicável.

---

## Exemplo SeededGameResult (seed 42)

```json
{
  "schemaVersion": "9.0.0",
  "variant": "sueca",
  "seed": "42",
  "dealHash": "<determinístico — ver seededRandom.test.ts>",
  "cardOrder": ["…40 códigos estáveis…"],
  "generatedAt": "…"
}
```

Mesma seed 2× → mesmo `dealHash` (`seededRandom.test.ts` T1).

---

## Confirmação zero gameplay + grep hot path

```bash
grep -rE "devLab|runScenario|__ciRunScenario|__ciListScenarios" \
  frontend/src/components \
  frontend/src/cardIntelligence/logger/playWithLogging.ts \
  frontend/src/models/games
# exit code 1 — zero matches
```

---

## Confirmação prod/flags off

Build prod default: `CI=true npm run build` — **OK**.

Com flags lab off, helpers não instalados — **confirmado em prod** (Francisco):

- `typeof window.__ciRunScenario === 'undefined'`
- `typeof window.__ciListScenarios === 'undefined'`

---

## Checkpoints humanos

**H9:** OK — 2026-06-06 (Francisco)

Validação manual:

| Check | Resultado |
|-------|-----------|
| `__ciListScenarios()` | 4 presets (LAB_K02, LAB_SP09, LAB_S16, LAB_H13) |
| `__ciRunScenario` ×4 | Report legível; encode + evaluation; `classification: good` |
| Seed 42 Sueca | `seed hash match: true` → `4034c6b9` |
| Jogo real | 2 jogadas Sueca — UX inalterada |
| Prod helpers off | `__ciRunScenario` / `__ciListScenarios` → `undefined` |

**Nota v0:** todos os presets emitiram warning `trick_end missing for trickIndex N` — aceite (fixtures sem TrickEndEvent; evaluator avaliou na mesma). P1: enriquecer presets se métrica depender de trick_end.

---

## Gaps / deferidos

| ID | Tema | Estado |
|----|------|--------|
| Q1 | `source: 'test'` em eventos lab | ✅ implementado |
| Q2 | Persist IDB lab runs | off default (P1) |
| Q3 | Seeded → simulação vazas via motor | v1 — v0 deal only |
| Q4 | Schema 9.0.0 só tipos devLab | ✅ |
| Q5 | UI panel | skip v0 |
| Q6–Q8 | seeded eval completo, labScenarioId, LLM mock | deferidos P1/v1 |

Engine inject v1 documentado fora scope.

---

## Próximos passos

1. Provider LLM real / Evaluator v1 / bots — **após** Impl 9 fechada (H9 OK)
2. P1: presets extra (S08, K10, S12), `persistToIdb` opt-in, TrickEndEvent opcional nos presets

---

## Como validar H9 (checklist §17)

Ver [IMPLEMENTATION_9_DEV_SEEDED_GAME_LAB_PROMPT.md](../implementation-prompts/IMPLEMENTATION_9_DEV_SEEDED_GAME_LAB_PROMPT.md) §17 — script consola copy-paste.
