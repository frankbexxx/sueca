# IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE — Relatório final

**ID:** `IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE`  
**Prompt:** [IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE_PROMPT.md](../implementation-prompts/IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE_PROMPT.md) v1.1  
**Data:** 2026-06-06  
**Estado:** implementação concluída — **H14 OK** 2026-06-06 (Francisco)

---

## Ficheiros criados

| Ficheiro | Função |
|----------|--------|
| [`spadesTrickHelpers.ts`](../../frontend/src/ai/games/spades/spadesTrickHelpers.ts) | `partnerIsWinning`, `cardWouldWinTrickSpades`, min winner, SP06/SP09 helpers |
| [`spadesTrickHelpers.test.ts`](../../frontend/src/ai/games/spades/spadesTrickHelpers.test.ts) | 8 testes unitários helpers |

---

## Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| [`SpadesPlayStrategy.ts`](../../frontend/src/ai/games/spades/SpadesPlayStrategy.ts) | SP09 `avoidBags` gate; SP08 min winning ♠; SP06 `playWhenPartnerWinning` |
| [`SpadesPlayStrategy.test.ts`](../../frontend/src/ai/games/spades/SpadesPlayStrategy.test.ts) | T1–T10 (medium + hard onde aplicável) |

**Não alterados:** `SpadesGame.ts`, `SpadesBidEstimator.ts`, `GameBoard`, motores, `cardIntelligence/` runtime, LLM, UI, outros jogos.

---

## Métricas implementadas

| ID | Melhoria | Difficulty |
|----|----------|------------|
| **SP09** | Bid cumprido → `playAvoidWinning` (slough; sem overtrump ♠ medium L99–108; lead `lowestCard`) | Medium + Hard |
| **SP08** | Cortar/ganhar com **menor** ♠ vencedora (`pickLowestWinningSpadeIndex`) | Medium + Hard |
| **SP06** | Parceiro a ganhar → não roubar; forced win = **menor** vencedor (`playWhenPartnerWinning`) | Medium + Hard |

## Métricas já existentes (confirmadas)

| ID | Estado |
|----|--------|
| **SP04** | Lead non-♠ quando possível — mantido |
| **SP07** | Hard min in-suit winner quando `needTricks` — mantido |
| **SP05** | Gates `needTricks` — mantidos |

---

## Antes / depois

| Cenário | Antes | Depois |
|---------|-------|--------|
| Bid cumprido + ♠ na vaza (medium) | Overtrump com `spadesInHand[0]` | Slough ou menor winner |
| Bid cumprido + A♠ ou 2♣ legal | Podia ganhar com A♠ | Joga 2♣ |
| Void cut needTricks 7♠ + A♠ | Medium: `lowestCard` (OK); trump branch: `[0]` | `pickLowestWinningSpadeIndex` → 7♠ |
| Parceiro ganha; só 7♠ e A♠ | `lowestCard` → 7♠ por rank (acidental) | `playWhenPartnerWinning` explícito |
| Lead bid cumprido 2♣ + A♠ | `pool[0]` (ordem-dependent) | `lowestCard(pool)` → 2♣ |

---

## Testes executados

```bash
npm test -- --testPathPattern=ai/games/spades --watchAll=false   # 33 passed
rg "evaluateDecision|getMiniLLMAdvice" frontend/src/ai --glob '!**/*.test.*'  # zero
CI=true npm run build                                           # OK
```

| Suite | Testes |
|-------|--------|
| `SpadesPlayStrategy.test.ts` | 18 (T1–T10 + regressões) |
| `spadesTrickHelpers.test.ts` | 8 |
| `SpadesBidEstimator.test.ts` | 7 (inalterado) |

---

## Validação evaluator offline

Deferido (§4.3 prompt opcional). Fixtures SP06/SP08/SP09 disponíveis para teste futuro `SpadesPlayStrategy.metrics.test.ts`.

---

## Confirmações

| Item | Estado |
|------|--------|
| Zero alteração regras / motores | OK |
| Zero LLM live | OK |
| Zero evaluator hot path | OK |
| Easy intocado | OK |
| `SpadesBidEstimator` inalterado | OK |

---

## Gaps (§7 prompt)

| Gap | Estado |
|-----|--------|
| SP14 quebrar bid adversária 8+ | Defer Spades v2 |
| SP01 bid conservador | Defer bid phase |
| Nil / blind nil | Fora scope |
| Medium in-suit `winners[0]` vs min winner (L117) | Defer v0.1 |
| Score global / memory / LLM decision assist | Roadmap |

### Observação Spades v2 (smoke H14 — Francisco)

**«Mandar putos à escola»** continua com problema **análogo ao Sueca S23** (cf. [Impl 13 §observação](./IMPLEMENTATION_13_BOT_METRICS_UPGRADE_REPORT.md)): o bot tende a usar **carta demasiado baixa por defeito** (ex. 2♠ / rank mínimo via `lowestCard`) quando o contexto pede carta **média/alta controlada** para forçar adversário — alinhado com **SP15** (destrunfar) e regra FASE_1 «não 2♠ escola». **Fora scope Impl 14 v0**; candidata a **Spades bot v2** — sem alteração de código nesta impl.

---

## Checkpoints

| Checkpoint | Estado |
|------------|--------|
| CI testes + build | OK |
| **H14** smoke Medium/Hard | **OK** — 2026-06-06 (Francisco) |

### Evidência H14 (2026-06-06)

| Canal | Resultado |
|-------|-----------|
| Jest `ai/games/spades` | **33/33** OK |
| Smoke manual | Spades **Medium/Hard** — jogo normal OK |

**Notas smoke manual:**

- Parceiro / bags / corte mínimo — comportamento geral OK (SP06/SP09/SP08).
- Ver observação **Spades v2 / escola** acima (análogo Sueca S23 — deferido).

---

## Próximos passos

1. **Spades bot v2** — **SP14**, **SP01**, **SP15** / «escola» (carta média vs 2♠ por defeito), medium in-suit min winner.
2. **Sueca bot v2** — S23 (Rei vs intermédia) — mesmo padrão estratégico.
3. Hearts / King bots (Impl 15+).

---

**Fim do relatório Impl 14.**
