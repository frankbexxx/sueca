# IMPLEMENTATION_16_KING_BOT_METRICS_UPGRADE — Relatório final

**ID:** `IMPLEMENTATION_16_KING_BOT_METRICS_UPGRADE`  
**Prompt:** [IMPLEMENTATION_16_KING_BOT_METRICS_UPGRADE_PROMPT.md](../implementation-prompts/IMPLEMENTATION_16_KING_BOT_METRICS_UPGRADE_PROMPT.md) v1.1  
**Data:** 2026-06-06  
**Estado:** implementação concluída — **H16-OK: Pendente** (smoke manual)

---

## Ficheiros criados

| Ficheiro | Função |
|----------|--------|
| [`kingTrickHelpers.ts`](../../frontend/src/ai/games/king/kingTrickHelpers.ts) | K02 `tryPlayK02`, K03 `playKingPtNegativeLead`, K01/K00 `pickSafeSlough`, void `pickPenaltyDumpVoid`, `playKingPtNegativeFollow` |
| [`kingTrickHelpers.test.ts`](../../frontend/src/ai/games/king/kingTrickHelpers.test.ts) | 12 testes unitários helpers |

---

## Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| [`KingPlayStrategy.ts`](../../frontend/src/ai/games/king/KingPlayStrategy.ts) | Pipeline negativo unificado medium/hard via `mediumNegativeDump`; K02 gate no topo; positivo/Simplified inalterados |
| [`KingPlayStrategy.test.ts`](../../frontend/src/ai/games/king/KingPlayStrategy.test.ts) | T1–T10 (medium + hard onde aplicável) |

**Não alterados:** `KingPtGame.ts` regras/scoring, `KingSimplifiedGame.ts`, `KingAuctionStrategy.ts`, UI, `cardIntelligence/` runtime, LLM.

---

## Variante

**King PT only** — Medium/Hard play negativo. `chooseKingSimplifiedCard` inalterado (defer v0).

---

## Métricas implementadas

| ID | Melhoria | Difficulty |
|----|----------|------------|
| **K02** | K♥ na 1.ª oportunidade legal (`mustPlayKingOfHearts`) — lead + follow void | Medium + Hard |
| **K03** | Não liderar ♥ quando alternativa off-suit (`no_hearts` / `no_king_hearts`) | Medium + Hard |
| **K01/K00** | `pickSafeSlough` in-suit; void `pickPenaltyDumpVoid` + fallback safe | Medium + Hard |

## Métricas já existentes confirmadas

| ID | Estado |
|----|--------|
| **K09** | Positivo hard min-winner — T8 regressão |
| **K12** | `no_tricks` in-suit lowest — T6 regressão |
| **K05/K10** | `no_last_two` blocos intactos — testes no_last_two regressão |

---

## Antes / depois

| Cenário | Antes | Depois |
|---------|-------|--------|
| `no_king_hearts` lead; K♥ + 3♥ | Jogava 3♥ (menor ♥) | Joga **K♥** (K02) |
| `no_king_hearts` follow void; K♥ + 2♣ | K♥ (já parcial) | **K♥** via gate unificado |
| Hard negativo lead | `ptNegativeDump` duplicado | Pipeline partilhado com medium |
| Follow in-suit `no_queens`; Q♥ + 5♥ | `inSuit[0]` arbitrário | **5♥** safe lowest (K01) |
| Void `no_hearts`; 5♥ + 2♣ | Dump ♥ ou `valid[0]` | Dump **5♥** (penalty void) |

---

## Testes executados

```bash
npm test -- --testPathPattern=ai/games/king --watchAll=false   # 29 passed
CI=true npm run build                                           # OK
```

| Suite | Testes |
|-------|--------|
| `KingPlayStrategy.test.ts` | 17 |
| `kingTrickHelpers.test.ts` | 12 |

**Grep hot path:** zero imports `cardIntelligence/` / `evaluateDecision` em `frontend/src/ai` (fora testes).

---

## Validação evaluator offline

Deferido (§4.3 opcional). Fixtures K02/K03/K01 + `LAB_K02` disponíveis para teste futuro.

---

## Notas documentadas (§7 / prompt v1.1)

1. **K03 vs motor:** `heartsLeadForbidden` já proíbe ♥ lead em runtime; K03 alinha bot + CI + evaluator.
2. **Motor vs encoder K♥:** `mustPlayKingOfHearts` (motor) não usa `kingHeartsPlayedInHistory` do encoder — gap v2; documentar se divergir pós-K♥ jogado em ronda anterior.
3. **pickSafeSlough vs pickPenaltyDumpVoid:** funções separadas — in-suit safe vs void penalty dump.

---

## Confirmação

- [x] Zero alteração regras/scoring `KingPtGame.ts`
- [x] Zero LLM live / evaluator hot path
- [x] Easy intocado
- [x] `KingAuctionStrategy` inalterado
- [x] Máx. 3 métricas v0 (K02, K03, K01/K00)

---

## Checkpoints

**H16-OK:** Pendente — smoke manual King PT Medium/Hard recomendado:

- [ ] K♥ na 1.ª oportunidade (`no_king_hearts`)
- [ ] Não puxa copas com alternativa
- [ ] Nulos / `no_tricks` sem regressão óbvia
- [ ] Sem cartas ilegais / erros UI

---

## Gaps deferidos (§7)

| Gap | Próximo passo |
|-----|---------------|
| King Simplified métricas | Impl 16b ou motor passa contract |
| K06/K07 festa/leilão | Impl festa |
| K10 trick 11/12 | King v2; LAB_K10 evaluator only |
| K♥ histórico motor/encoder | King v2 |
| Sueca S23 / Spades escola / Hearts v2 | Outras impl |

---

## Próximos passos

1. Smoke manual → assinar **H16-OK** (OK | Parcial).
2. King Simplified / K10 / festa auction (v2).
3. Fechar gaps transversais (escola, cartas altas Hearts).
