# IMPLEMENTATION_5_EVALUATOR_V0 — Relatório final

**ID:** `IMPLEMENTATION_5_EVALUATOR_V0`  
**Prompt:** [IMPLEMENTATION_5_EVALUATOR_V0_PROMPT.md](../implementation-prompts/IMPLEMENTATION_5_EVALUATOR_V0_PROMPT.md)  
**Data:** 2026-05-31  
**Estado:** implementação concluída — **H5 pendente** (validação manual Francisco)

---

## Ficheiros criados

### `frontend/src/cardIntelligence/evaluator/`

| Ficheiro | Função |
|----------|--------|
| `types.ts` | `DecisionEvaluationInput`, `DecisionEvaluationResult`, `MetricEvaluationResult`, schema **5.0.0** |
| `evaluateDecision.ts` | Router: gate T01 → métricas P0 → agregação; `evaluatorMode: strict` default |
| `aggregateResults.ts` | Agregador «pior vence»: `bad > partial > medium > good`; Tier B força `partial` |
| `evalHelpers.ts` | Helpers trick winner, encodings, `compareChosenToCheapestWinner`, contexto incompleto |
| `metricEvaluators.ts` | Avaliadores P0 (transversal, Sueca, Spades, Hearts, King) |
| `index.ts` | Exports públicos |
| `evaluatorGolden.test.ts` | 20 Tier A → `good`; 4 Tier B → `partial` |
| `evaluatorSynthetic.test.ts` | bad/medium sintéticos (T01, K02, SP09, S16, S08, K12, K03, H13) |
| `aggregateResults.test.ts` | Casos L2–L5 da agregação |

### Documentação

| Ficheiro | Função |
|----------|--------|
| `docs/ai/implementation-prompts/IMPLEMENTATION_5_EVALUATOR_V0_PROMPT.md` | Prompt executável (pré-existente nesta sessão) |

---

## Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| `frontend/src/cardIntelligence/index.ts` | Export `evaluateDecision`, tipos e `aggregateMetricResults` (dev/test) |
| `frontend/src/cardIntelligence/fixtures/kingFixtures.ts` | **K03** contrato `no_king_hearts` → **`no_hearts`** (conflito com K02 no lead) |

**Não alterados:** `playWithLogging.ts`, `GameBoard.tsx`, bots, motores `*Game.ts`, logger hot path, persistência.

---

## Métricas P0 implementadas

Ordem de avaliação (`P0_EVALUATION_ORDER`):

| Grupo | IDs |
|-------|-----|
| Gate | **T01** (jogada legal) |
| King | **K02**, **K03**, **K00**, **K01**, **K08**, **K10**, **K09**, **K12** |
| Spades | **SP09**, **SP06**, **SP08**, **SP01**, **SP14** |
| Sueca | **S08**, **S12**, **S16**, **S19**, **S25** |
| Hearts | **H13**, **H01**, **H11**, **H05**, **H10** |
| Transversal | **T04** (Sueca/King economia), **T06** (Spades bag / Hearts pontos / King nulos) |

Notas v0:

- **SP01 / H05** — proxy play-phase / pass + `evaluatorWarnings` no resultado.
- **Tier B** (S25, H10, SP14, K10) — `classification === 'partial'` fixa na agregação, mesmo que alguma métrica devolva `bad` (ex.: H10).
- **K08 / K09 / K12** — cobertos por testes sintéticos, sem fixture novo no registry 23.

---

## Testes executados

```bash
cd frontend
CI=true npm test -- --testPathPattern=evaluator --watchAll=false
# 37 passed (3 suites)

CI=true npm test -- --testPathPattern=cardIntelligence --watchAll=false
# 124 passed (21 suites)

npm run build
# OK
```

| Suite | Testes |
|-------|--------|
| `evaluatorGolden.test.ts` | 24 (20 Tier A + 4 Tier B) |
| `evaluatorSynthetic.test.ts` | 9 |
| `aggregateResults.test.ts` | 4 |
| **Total evaluator** | **37** |
| **Total cardIntelligence** | **124** (+37 vs Impl 4) |

---

## Exemplos `DecisionEvaluationResult` (H5)

Pipeline: `getFixtureById` → `encodeDecisionState` → `evaluateDecision`.  
Textos `reasonShort` em **português de mesa** — validação H5 = ler estes exemplos + testes CI, **sem** reproduzir fixtures no jogo.

### 1. K02 fixture (Tier A) — `good`

```json
{
  "classification": "good",
  "reasonShort": "Jogada legal.",
  "failedMetricIds": [],
  "metricResults": [
    { "metricId": "K02", "classification": "good", "reasonShort": "Cumpriu a obrigação do K♥." }
  ]
}
```

### 2. K02 sintético (esconder K♥) — `bad`

```json
{
  "classification": "bad",
  "reasonShort": "Escondeu o K♥ na 1.ª oportunidade legal.",
  "failedMetricIds": ["K02"],
  "betterAlternatives": ["Kh"]
}
```

### 3. SP09 sintético (bag com A♠) — `bad`

```json
{
  "classification": "bad",
  "reasonShort": "Bid cumprido — overtrick desnecessário (bag).",
  "failedMetricIds": ["SP09"],
  "betterAlternatives": ["2c"]
}
```

### 4. S08 sintético (overkill A♦) — `medium`

Trick `[2♦, 4♦]`; legal `9♦`/`A♦`; escolhido `A♦` quando `9♦` chegava.

```json
{
  "classification": "medium",
  "reasonShort": "Ganhou, mas havia carta mais baixa que chegava.",
  "failedMetricIds": [],
  "betterAlternatives": ["9d"]
}
```

### 5. S16 sintético (manilha 7♦) — `bad`

```json
{
  "classification": "bad",
  "reasonShort": "Abriu manilha de ouros antes do Ás sair.",
  "failedMetricIds": ["S16"]
}
```

### 6. H10 fixture (Tier B) — `partial`

Agregação Tier B: `partial` mesmo com H01 `bad` interno.

```json
{
  "classification": "partial",
  "reasonShort": "Aumentou pontos desnecessários na vaza.",
  "partialEvaluation": true,
  "metricResults": [
    { "metricId": "H10", "classification": "partial", "reasonShort": "Shoot the moon — moonStillPossible indisponível v0." }
  ]
}
```

### 7. SP14 fixture (Tier B) — `partial`

```json
{
  "classification": "partial",
  "reasonShort": "Pressão contra bid alta — avaliação parcial v0.",
  "partialEvaluation": true
}
```

### 8. S25 fixture (Tier B) — `partial`

```json
{
  "classification": "partial",
  "reasonShort": "Destrunfar parceiro — void parceiro indisponível v0.",
  "partialEvaluation": true
}
```

### 9. K10 fixture (Tier B) — `partial`

```json
{
  "classification": "partial",
  "reasonShort": "Endgame duas últimas — contexto incompleto.",
  "partialEvaluation": true
}
```

### 10. K03 fixture — `good` (contrato `no_hearts`)

```json
{
  "classification": "good",
  "reasonShort": "Jogada legal.",
  "metricResults": [
    { "metricId": "K03", "classification": "good", "reasonShort": "Não puxou copas desnecessariamente." },
    { "metricId": "K00", "classification": "good", "reasonShort": "Respeitou o contrato de evitar copas." }
  ]
}
```

---

## Ajustes durante implementação

| Item | Nota |
|------|------|
| **Tier B global** | `tierBPartialMetric` só em `fixtureId` correspondente; agregação força `partial` sempre |
| **K03 fixture** | Contrato alterado para `no_hearts` — evita K02 activo no mesmo lead |
| **H11** | Q♠ sem espadas lideradas → `not_applicable` |
| **H10 Tier B** | Agregação `partial` prevalece sobre H01 `bad` |
| **S08 partial no lead** | `detectIncompleteContext` só com `currentTrick.length > 0` (corrige S16 golden) |
| **S08 sintético medium** | Trick `[2♦,4♦]` — no fixture original só `A♦` ganha vs `K♦` |
| **Spades trump win** | SP06/SP08/SP09 usam trump `'spades'` em `cardWouldWinTrickStandard` |
| **Build** | `[...new Set()]` → `Array.from(new Set())` (target ES5 CRA) |

---

## Confirmação zero gameplay + hot path

```bash
grep -r "evaluateDecision\|cardIntelligence/evaluator" frontend/src --include="*playWithLogging*" --include="*GameBoard*"
# (sem matches)
```

Diff limitado a:

- `frontend/src/cardIntelligence/evaluator/` (novo)
- `frontend/src/cardIntelligence/index.ts` (exports)
- `frontend/src/cardIntelligence/fixtures/kingFixtures.ts` (K03)

Sem alterações em `GameBoard`, `*Game.ts`, bots, logger em runtime.

---

## Gaps deferidos (v1+)

| Gap | Notas |
|-----|-------|
| Persistência evaluations (IndexedDB) | Impl 6 / 7 |
| Hook live em `playWithLogging` / UI | Proibido v0 |
| SP01 bid phase real / H05 pass real | Proxy + warnings |
| S25 void parceiro / destrunfar completo | Tier B parcial |
| H10 `moonStillPossible` | Tier B parcial |
| SP14 pressão bid adversária completa | Tier B parcial |
| K10 endgame duas últimas completo | Tier B parcial |
| Ponderação agregação (não só «pior vence») | v1+ |
| Engine View produção | P2 |
| Duplicação SP09 via T06 em Spades | Limpar routing v1 |
| `pickReason` em fixtures `good` | Agregado mostra T01 genérico; métricas específicas em `metricResults` |

---

## Como validar H5 (checklist)

Francisco **não** precisa de abrir o jogo nem reler TypeScript. Basta:

- [ ] `npm run build` verde
- [ ] `CI=true npm test -- --testPathPattern=cardIntelligence` verde
- [ ] Ler os **10 exemplos** § «Exemplos DecisionEvaluationResult» — `reasonShort` faz sentido à mesa?
- [ ] Tier A: escolhas actuais dos fixtures parecem **boas** (`good`)?
- [ ] Tier B: aceitar **`partial`** como «não avaliável a fundo v0»?
- [ ] Sintéticos bad/medium: erros óbvios (K♥ escondido, bag, manilha, overkill)?
- [ ] Confirmar que **nada** muda durante partida (offline/dev/test only)

---

## Próximos passos (Impl 6+)

1. Memória / agregados sobre decisões avaliadas.
2. Completar métricas Tier B quando encoder tiver campos em falta.
3. Store opcional de `DecisionEvaluationResult` (sem mutar logger).
4. UI export / dashboard (Impl 7).

---

## Referências

- [IMPLEMENTATION_5_EVALUATOR_V0_PROMPT.md](../implementation-prompts/IMPLEMENTATION_5_EVALUATOR_V0_PROMPT.md)
- [IMPLEMENTATION_4_FIXTURES_2B_REPORT.md](./IMPLEMENTATION_4_FIXTURES_2B_REPORT.md)
- [FASE_5_AVALIADOR_DESIGN.md](../FASE_5_AVALIADOR_DESIGN.md)
