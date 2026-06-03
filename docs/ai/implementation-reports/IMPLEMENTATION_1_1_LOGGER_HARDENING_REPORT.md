# IMPLEMENTATION_1.1_LOGGER_HARDENING — Relatório final

**Data:** 2026-06-03  
**Base:** [IMPLEMENTATION_1_LOGGER_V0_REPORT.md](./IMPLEMENTATION_1_LOGGER_V0_REPORT.md) + hotfix H1 legalMoves

---

## 1. Ficheiros criados

| Ficheiro | Propósito |
|----------|-----------|
| `frontend/src/cardIntelligence/logger/logFailureTelemetry.ts` | Contador dev + `recordLogFailure` único |
| `frontend/src/cardIntelligence/logger/playWithLogging.ts` | Choke point play + log |
| `frontend/src/cardIntelligence/logger/playWithLogging.test.ts` | Regressão play+log |

---

## 2. Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| `frontend/src/cardIntelligence/logger/buildCardDecisionEvent.ts` | `legalMoves` obrigatório fora de testes; fallback `extractLegalMoves` só `NODE_ENV === 'test'` |
| `frontend/src/cardIntelligence/logger/CardIntelligenceLogger.ts` | `LogCardDecisionInput.legalMoves` required; reset failure count em tests |
| `frontend/src/cardIntelligence/logger/index.ts` | Telemetry unificada; export helpers |
| `frontend/src/cardIntelligence/index.ts` | Barrel: `playCardAndLogDecision`, `playFirstLegalAndLogDecision`; remove `extractLegalMoves` público |
| `frontend/src/components/GameBoard.tsx` | 3 paths via helpers; remove padrão manual duplicado |

**Não alterados:** `frontend/src/ai/**` (só import read-only de `playFirstLegal`), regras, bots, joiner, `GameActions.tsx`.

---

## 3. Resumo técnico

### Evolução

| Fase | Abordagem |
|------|-----------|
| Impl 1 | `capturePlayDecision` pós-`playCard` |
| Hotfix H1 | 3× `extractLegalMoves` manual no `GameBoard` |
| **Impl 1.1** | **`playWithLogging`** — snapshot **antes** de mutar, log **depois** de sucesso |

### Contratos

- **`legalMoves`:** obrigatório em `logCardDecision`; produção rebenta se omitido (`buildCardDecisionEvent`).
- **Snapshot:** tirado antes de `playCard` / `playFirstLegal`; `stateBefore` = `getCurrentState()` imediato antes do play (caller).
- **`CARD_INTELLIGENCE_LOGGER_ENABLED=false`:** play corre sempre; snapshot/log saltados.
- **Fail-silent gameplay:** erros de log não alteram return de `playCard`; **dev:** `recordLogFailure` + warn com contador.

---

## 4. Hook GameBoard

| Fluxo | Helper |
|-------|--------|
| AI principal (~L555) | `playCardAndLogDecision` |
| AI fallback (~L564) | `playFirstLegalAndLogDecision` |
| Humano host/solo (~L676) | `playCardAndLogDecision` |

Side-effects (sons, `publishHostAiPlay`, `afterHostMutation`) permanecem no `GameBoard` após boolean success.

---

## 5. Observabilidade dev

- `recordLogFailure(error)` — único ponto de warn (sem duplicar em `capturePlayDecision`)
- `getLogFailureCount()` / `resetLogFailureCountForTests()` — testes
- Formato: `[CardIntelligence] log failed (N total)`

---

## 6. Testes

```bash
cd frontend && CI=true npm test -- --watchAll=false --testPathPattern=cardIntelligence
CI=true npm run build
```

**Resultado:** 6 suites, **15 tests** — **PASS**  
Build: `CI=true npm run build` — **PASS**

Cobertura nova (`playWithLogging.test.ts`):

- success → evento; `chosenCard ∈ legalMoves`
- play falha → store vazio
- store reject → play true + `failureCount === 1`
- `playFirstLegal` 2.º índice legal
- logger disabled → play sem evento

---

## 7. Gameplay

- Ordem play → sons/callbacks inalterada
- Bots e regras intactos
- Joiner skip inalterado

---

## 8. Flag logger disabled

Com `REACT_APP_CARD_INTELLIGENCE_LOGGER=false`: helpers executam `playCard`/`playFirstLegal` normalmente; zero `extractLegalMoves` nem writes IDB.

---

## 9. H1 re-validação (Francisco)

1. `npm start` ou produção pós-deploy
2. Partida solo Sueca — cartas tuas + bots
3. Consola: zero `[CardIntelligence] log failed`
4. IndexedDB → `cardIntelligenceLogs` → `events` (N > 0)
5. Por evento: `classification: "unknown"`, `reason: null`, `chosenCard ∈ legalMoves`

Opcional: `vercel --prod` antes do teste telefone.

---

## 10. Issues deferidos

Ver §12 do [relatório Impl 1](./IMPLEMENTATION_1_LOGGER_V0_REPORT.md) — **H1-D1** React `GameActions` (P2).

---

## 11. Próximo passo

H1 OK → `IMPLEMENTATION_2_ROUND_HISTORY_PROMPT.md`
