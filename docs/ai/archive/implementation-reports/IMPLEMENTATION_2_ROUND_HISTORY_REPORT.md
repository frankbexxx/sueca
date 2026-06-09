# IMPLEMENTATION_2_ROUND_HISTORY — Relatório final

**Data:** 2026-06-03  
**Prompt:** [IMPLEMENTATION_2_ROUND_HISTORY_PROMPT.md](../implementation-prompts/IMPLEMENTATION_2_ROUND_HISTORY_PROMPT.md) v1.1  
**Pré-requisitos:** Impl 1 + 1.1 (H1 OK)

---

## 1. Ficheiros criados

| Ficheiro | Propósito |
|----------|-----------|
| `frontend/src/cardIntelligence/history/types.ts` | `TrickPlayRecord`, `CompletedTrickRecord`, `TrickEndVariantFields` |
| `frontend/src/cardIntelligence/history/roundHistory.ts` | `RoundHistoryEngine` — acumulador plays + vazas completas |
| `frontend/src/cardIntelligence/history/trickEvents.ts` | `isTrickJustClosed`, `buildTrickEndEvent` |
| `frontend/src/cardIntelligence/history/historySelectors.ts` | Selectors read-only (aces, pontos Sueca/Hearts) |
| `frontend/src/cardIntelligence/history/variantTrickFields.ts` | `extractTrickEndVariantFields`, `deriveTrickPoints` |
| `frontend/src/cardIntelligence/history/roundHistory.test.ts` | Testes engine |
| `frontend/src/cardIntelligence/history/trickEvents.test.ts` | TrickEnd + persistência + variants |
| `frontend/src/cardIntelligence/history/historySelectors.test.ts` | Selectors |

---

## 2. Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| `logger/playWithLogging.ts` | Após play: `logCardDecision` + `logTrickEndDecision` (fire-and-forget) |
| `logger/CardIntelligenceLogger.ts` | `recordPlayInHistory`; `logTrickEndDecision`; reset engine |
| `logger/buildCardDecisionEvent.ts` | `roundPlayHistory` ← `roundHistoryEngine.snapshotEntries()` |
| `logger/roundHistorySession.ts` | Delega para `roundHistoryEngine` (compat testes) |
| `logger/buildCardDecisionEvent.test.ts` | Pre-seed history antes de build |
| `shared/types/trickEndEvent.ts` | Schema final (`winnerIndex`, `plays[]`, `variantFields`, …) |
| `shared/types/logEvents.ts` | Union `LogEvent = CardDecisionLogEvent \| TrickEndEvent` |
| `shared/storage/logStore.ts` | `appendLogEvent(event: LogEvent, …)` |
| `shared/storage/logStore.localStorage.ts` | Mesma union `LogEvent` |

**Não alterados:** motores `*Game.ts`, `GameBoard` (sem novos hooks), bots, `applyHostAction` (gap v0 §2.4).

---

## 3. Resumo técnico

### Arquitectura

- **`RoundHistoryEngine`:** regista cada play em `logCardDecision` (sync, antes do build); snapshot em `CardDecisionLogEvent.roundPlayHistory`.
- **`TrickEndEvent`:** emitido na **4.ª carta** via `logTrickEndDecision` em `playWithLogging` (`isTrickJustClosed`: 3→4 cartas + `waitingForTrickEnd`).
- **Fire-and-forget:** `void log…().catch(recordLogFailure)` — helpers síncronos inalterados.
- **Sueca `currentPlayerIndex`:** `winnerIndex` de `stateAfter.lastTrickWinner`; plays usam `playerIndex` do registo, não `stateAfter.currentPlayerIndex`.

### Schema TrickEnd — breaking change vs stub Impl 1

| Stub Impl 1 | Schema final Impl 2 |
|-------------|---------------------|
| `trickWinner` | `winnerIndex` |
| `trickPoints` | `pointsInTrick` (+ `penaltiesInTrick`) |
| — | `plays[]`, `variantFields`, `contractId`, `roundPlayHistory`, … |

Sem dados TrickEnd em produção antes desta impl — safe rename.

### IDB

- Mesma DB `cardIntelligenceLogs`, store `events`.
- Polimorfismo JSON via `eventType: 'trick_end'`.
- **Sem bump** `LOG_DB_VERSION`.

---

## 4. Campos null / gaps por variant

| Variant | `pointsInTrick` | `penaltiesInTrick` | Notas |
|---------|-----------------|-------------------|--------|
| Sueca | soma `CARD_POINTS` | null | `variantFields`: aces, trump count, partner |
| Spades | null | null | tricks count pré-Continue = snapshot nullable |
| Hearts | `heartsTrickPoints` | null | `roundPoints` snapshot pré-`finishTrick` |
| King PT | festa + / null | `negativeTrickPenalty` read-only | `engine: king_pt` |
| King Simplified | +5 se positive | 5 se negative | `engine: king_simplified` |

---

## 5. Testes

```bash
cd frontend
CI=true npm test -- --watchAll=false --testPathPattern=cardIntelligence
CI=true npm run build
```

**Resultado:** 9 suites, **26 tests** — **PASS**  
Build: **PASS**

---

## 6. H2 — checklist manual (Francisco)

- [ ] Solo/host local — partida com vazas completas
- [ ] IndexedDB → `cardIntelligenceLogs` → `events`
- [ ] Por jogada: `CardDecisionLogEvent` continua (classification unknown)
- [ ] Por vaza: ~1 evento `eventType: 'trick_end'`
- [ ] TrickEnd: `plays.length === 4`, `winnerIndex` plausível
- [ ] `roundPlayHistory` coerente (Impl 1 já acumulava; validar pós-migração + TrickEnd)
- [ ] Gameplay/UX inalterados (Continuar, sons)

Opcional: `vercel --prod` antes de teste telefone.

---

## 7. Gameplay

- Zero alteração a regras, scoring, bots.
- Logger off → history + TrickEnd skipped; play inalterado.

---

## 8. Gaps para Impl 3 Encoder

- `Player View` / filtragem `visiblePlayedCards`
- Voids inferidos (`playerVoidInference`)
- Spades bags, bids/tricks pós-Continue
- Hearts moon tracking
- King PT scoring completo quando `finishTrick`-only
- Multiplayer `applyHostAction` / joiner (§9)

---

## 9. Issues deferidos

| ID | Item |
|----|------|
| MP-v0 | `applyHostAction` — jogadas remotas sem hook |
| H1-D1 | React `GameActions` setState |
| P2 | `GameStartEvent`, `BidEvent`, etc. |

---

## 10. Referências

- [IMPLEMENTATION_1_1_LOGGER_HARDENING_REPORT.md](./IMPLEMENTATION_1_1_LOGGER_HARDENING_REPORT.md)
- [FASE_3_LOGGER_DESIGN.md](../FASE_3_LOGGER_DESIGN.md) §4–§6
- [FASE_4_ENCODER_DESIGN.md](../FASE_4_ENCODER_DESIGN.md)
