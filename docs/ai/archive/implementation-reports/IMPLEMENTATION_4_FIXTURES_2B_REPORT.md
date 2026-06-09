# IMPLEMENTATION_4_FIXTURES_2B — Relatório final

**ID:** `IMPLEMENTATION_4_FIXTURES_2B`  
**Prompt:** [IMPLEMENTATION_4_FIXTURES_2B_PROMPT.md](../implementation-prompts/IMPLEMENTATION_4_FIXTURES_2B_PROMPT.md)  
**Data:** 2026-05-31  
**Estado:** implementação concluída — **H4 pendente** (validação manual Francisco)

---

## Ficheiros criados

### `frontend/src/cardIntelligence/fixtures/`

| Ficheiro | Função |
|----------|--------|
| `types.ts` | `FixtureCase`, `FixtureTier`, expectativas golden |
| `buildFixtureEvent.ts` | Wrap `createTestLogEvent`, `source: 'fixture'` |
| `cards.ts` | Cartas reutilizáveis (`C.*`) |
| `suecaFixtures.ts` | S08, S16, S19, S12, S25 |
| `spadesFixtures.ts` | SP01, SP06, SP09, SP08, SP14 |
| `heartsFixtures.ts` | H01, H05, H13, H11, H10 |
| `kingFixtures.ts` | K00, K02, K03, K01, K10 |
| `transversalFixtures.ts` | T01, T04, T06 |
| `index.ts` | `ALL_FIXTURES` (23), `getFixtureById`, `FIXTURE_IDS` |
| `fixturesGolden.test.ts` | Registry, golden por fixture, T01×4, T06×3, T04-King |

### Documentação

| Ficheiro | Função |
|----------|--------|
| `docs/ai/implementation-prompts/IMPLEMENTATION_4_FIXTURES_2B_PROMPT.md` | Prompt executável (pré-existente nesta sessão) |

---

## Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| `encoder/metricContext.ts` | Novos `MetricDef`: **SP01, SP14, S25, K10, H10** |
| `encoder/metricContext.test.ts` | Smoke dos 5 MetricDef |
| `cardIntelligence/index.ts` | Export `ALL_FIXTURES`, `getFixtureById`, `FixtureCase` |

**Não alterados:** `playWithLogging.ts`, `GameBoard.tsx`, bots, motores `*Game.ts`, avaliador, memória, UI.

---

## Testes executados

```bash
cd frontend
CI=true npm test -- --testPathPattern=fixtures --watchAll=false
# 34 passed (registry 23 + parametrized)

CI=true npm test -- --testPathPattern=cardIntelligence --watchAll=false
# 87 passed (18 suites)

npm run build
# OK
```

---

## Fixtures por jogo

| Jogo | IDs implementados | Tier B |
|------|-------------------|--------|
| Sueca | S08, S16, S19, S12, S25 | S25 (`allowPartial`, `cutRisk` null ao lead) |
| Spades | SP01, SP06, SP09, SP08, SP14 | SP14 (`allowPartial`, bags/trick context parcial) |
| Hearts | H01, H05, H13, H11, H10 | H10 (`moonStillPossible` ausente v0) |
| King | K00, K02, K03, K01, K10 | — |
| Transversal | T01, T04, T06 | — |

**Registry:** `ALL_FIXTURES.length === 23`, IDs únicos. T01×4 / T06×3 / T04-King **fora** do array.

---

## Ajustes durante implementação

| Fixture | Nota |
|---------|------|
| **K02** | Lead vazio (1.ª oportunidade legal); `roundPlayHistory` duplicado (Impl 3.1) |
| **H13** | `trickAfter` = snapshot pré-jogada (sem Q♠ na vaza) — senão `pointsInTrick` inclui 13 pts da Q♠ |
| **SP08 / K01** | Cartas `hA`, `h7` adicionadas a `cards.ts` |
| **King T06** | Teste parametrizado usa `noTrump: true` (`nulosMode`) |

---

## Gaps documentados

| Gap | Notas |
|-----|-------|
| **SP01** | Proxy play-phase; bid real → Impl 5 |
| **H05** | Proxy pass (cartas perigosas na mão) |
| **S25** | `cutRisk` null ao lead; void parceiro / destrunfar parcial |
| **H10** | `moonStillPossible` ausente v0 |
| **H13** | `trickIsSafeAndPointless` depende de snapshot pré-jogada no fixture |
| **kingSimplified** | Fora de scope |

---

## Confirmação zero gameplay

`git diff` limita-se a:

- `frontend/src/cardIntelligence/fixtures/` (novo)
- `encoder/metricContext.ts` + teste
- `cardIntelligence/index.ts` (exports dev/test)

Sem alterações em `GameBoard`, `*Game.ts`, bots, logger hot path.

---

## Próximos passos Impl 5

1. Importar `ALL_FIXTURES` / `getFixtureById('K02')` no avaliador.
2. Comparar `chosenCard` vs alternativas legais por métrica principal.
3. Ordem P0 FASE_2A sugerida: T01, K02, K03, SP09, …
4. Fechar gaps Tier B (S25 voids, H10 moon, SP01 bid phase).

---

## Checkpoint H4 (humano)

- [ ] Amostra S08, K02, SP09 — narrativa FASE_2B ↔ `humanNote` ↔ encode
- [ ] Nenhuma alteração visível em jogo normal
- [ ] Tier B gaps aceites
- [ ] Aprovação para Impl 5 Evaluator v0
