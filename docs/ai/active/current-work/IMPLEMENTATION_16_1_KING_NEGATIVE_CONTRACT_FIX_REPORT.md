# IMPLEMENTATION_16.1 — King negative contract hotfix — Relatório

**ID:** `IMPLEMENTATION_16.1_KING_NEGATIVE_CONTRACT_FIX`  
**Parente:** [IMPLEMENTATION_16_KING_BOT_METRICS_UPGRADE_REPORT.md](./IMPLEMENTATION_16_KING_BOT_METRICS_UPGRADE_REPORT.md)  
**Data:** 2026-06-06  
**Estado:** hotfix concluído — **H16-OK: OK — 2026-09-17** (fecho KING-H16-OK-CLOSURE-01)

---

## Causa corrigida

Smoke manual Impl 16 **FAIL** em `no_tricks` e `no_hearts`:

- Heurística `pickLowestRankIndex` / `pickSafeSlough` **sem** saber se a carta ganha a vaza.
- `no_tricks`: guardava honras; descartava sempre a mais baixa mesmo quando podia perder descarregando alta.
- `no_hearts`: void perdedor jogava carta baixa inútil em vez de livrar copas.

**Não** é King v2 — correção da entrega Impl 16 nos contratos afectados.

---

## Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| [`kingTrickHelpers.ts`](../../frontend/src/ai/games/king/kingTrickHelpers.ts) | `cardWouldWinTrickKing`, `playToUnloadWhileLosing`, `playNoTricksNegative`, `playNoHeartsNegative` |
| [`KingPlayStrategy.ts`](../../frontend/src/ai/games/king/KingPlayStrategy.ts) | Routing `no_tricks` / `no_hearts` / `no_king_hearts`; `playerIndex` no pipeline |
| [`kingTrickHelpers.test.ts`](../../frontend/src/ai/games/king/kingTrickHelpers.test.ts) | Unitários winner/unload/hearts void |
| [`KingPlayStrategy.test.ts`](../../frontend/src/ai/games/king/KingPlayStrategy.test.ts) | Suite 16.1 (12 cenários) + `trickLeader` em `makeState` |

**Não alterados:** `KingPtGame.ts`, UI, LLM, Easy, `chooseKingSimplifiedCard`, positivo, `KingAuctionStrategy`.

---

## Lógica implementada

| Contrato | Comportamento |
|----------|---------------|
| **no_tricks** | Follow/void: perder se possível; entre losers → **maior** rank; forçado a ganhar → **menor** winner. Lead: baixo (K03 pool). |
| **no_hearts** / **no_king_hearts** | Lead: K03 intacto. Follow in-suit: `playToUnloadWhileLosing`. Void, vaza sem ♥, perdemos: **♥ mais alta** legal. |
| **K02** | Gate no topo — inalterado |
| **no_last_two** | Blocos intactos |

---

## Testes criados / actualizados

| ID | Cenário |
|----|---------|
| 16.1-1 | `no_tricks` in-suit ambas perdem → alta |
| 16.1-2 | T6 — evita ganhar (7♠ não A♠) |
| 16.1-3 | `no_tricks` void → A♣ não 2♦ |
| 16.1-4 | Índice legal |
| 16.1-5 | T5 — void `no_hearts` → descarta ♥ |
| 16.1-6 | `no_hearts` in-suit unload alta |
| 16.1-7 | `no_hearts` evita ganhar |
| 16.1-8 | T10 K03 lead |
| 16.1-9/10 | T1/T3 K02/K03 |
| 16.1-11 | Simplified inalterado |
| Regressão | T7/T8/T9, `no_last_two`, T4 `no_queens` |

---

## Testes executados

```bash
npm test -- --testPathPattern=ai/games/king --watchAll=false   # 32 passed
CI=true npm run build                                           # OK
```

| Suite | Testes |
|-------|--------|
| `KingPlayStrategy.test.ts` | 20 |
| `kingTrickHelpers.test.ts` | 12 |

**Grep hot path:** zero `cardIntelligence` / `evaluateDecision` em `frontend/src/ai` (fora testes).

---

## Confirmação

- [x] Zero alteração motor/regras/UI/LLM
- [x] Easy intocado
- [x] Simplified intocado
- [x] K02/K03 regressão verde

---

## Checkpoint

**H16-OK:** **OK — 2026-09-17** — re-smoke King PT Medium (seeded full match + suites):

- [x] `no_tricks` / `no_hearts` / restantes negativos — full match 6/6 sem stall  
- [x] Festas 4/4 + auction multi-round suites (preference, watermark, 8-or-nulls, pass permanente)  
- [x] Soma global final = 0 · CI logger sem regressão  

Assinado no fecho **KING-H16-OK-CLOSURE-01** (`kingH16FullMatch.smoke.test.ts`).
