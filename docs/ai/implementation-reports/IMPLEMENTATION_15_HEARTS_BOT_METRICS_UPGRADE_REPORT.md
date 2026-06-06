# IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE — Relatório final

**ID:** `IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE`  
**Prompt:** [IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE_PROMPT.md](../implementation-prompts/IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE_PROMPT.md) v1.1  
**Data:** 2026-06-06  
**Estado:** implementação concluída — **H15-OK: Pendente** (smoke manual)

---

## Ficheiros criados

| Ficheiro | Função |
|----------|--------|
| [`heartsTrickHelpers.ts`](../../frontend/src/ai/games/hearts/heartsTrickHelpers.ts) | `penaltyScore`, `heartsTrickPoints`, `playFollow` pipeline H13→H07→H11→H02, `playLead` |
| [`heartsTrickHelpers.test.ts`](../../frontend/src/ai/games/hearts/heartsTrickHelpers.test.ts) | 10 testes unitários helpers |

---

## Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| [`HeartsPlayStrategy.ts`](../../frontend/src/ai/games/hearts/HeartsPlayStrategy.ts) | Medium/Hard usam `playFollow` + `playLead` partilhados |
| [`HeartsPlayStrategy.test.ts`](../../frontend/src/ai/games/hearts/HeartsPlayStrategy.test.ts) | T1–T10 (medium + hard onde aplicável) |

**Não alterados:** `HeartsGame.ts`, `HeartsPassStrategy.ts`, UI, `cardIntelligence/` runtime, LLM, outros jogos.

---

## Métricas implementadas

| ID | Melhoria | Difficulty |
|----|----------|------------|
| **H11** | ♠ led in-suit → **menor** espada (não Q♠ por defeito) | Medium + Hard |
| **H13** | 4.º jogador + trick 0 pts → slough **carta perigosa** (max penalty entre perigosas) | Medium + Hard |
| **H07** (+ **H01**) | Trick penalizante → preferir legal que **não ganha**; forced = min damage | Medium + Hard |

## Métricas já existentes (confirmadas)

| ID | Estado |
|----|--------|
| **H02** | Dump off-suit default após gates — T4 regressão |
| **H03** | Lead menor penalização — T5 |
| **H04/H08** | Hard lead non-♥ — T8 |
| **H05/H06** | Pass inalterado v0 |

---

## Antes / depois

| Cenário | Antes | Depois |
|---------|-------|--------|
| ♠ led; Q♠ + 2♠ in-suit | Jogava Q♠ (max penalty dump) | Joga **2♠** (H11) |
| 4.º jogador; trick ♣ 0 pts; Q♠ + 2♦ | Dump baixo ou Q♠ acidental | Joga **Q♠** limpar (H13) |
| Trick com ♥; A♥ + 2♣ legais | Podia ganhar com A♥ | Joga **2♣** (H07) |
| ♣ led void; slough Q♠ | Q♠ dump | Mantido (H02) T4 |

---

## Testes executados

```bash
npm test -- --testPathPattern=ai/games/hearts --watchAll=false   # 34 passed
rg "evaluateDecision|getMiniLLMAdvice|deriveMoonThreatLevel" frontend/src/ai --glob '!**/*.test.*'  # zero
CI=true npm run build                                           # OK
```

| Suite | Testes |
|-------|--------|
| `HeartsPlayStrategy.test.ts` | 17 |
| `heartsTrickHelpers.test.ts` | 10 |
| `HeartsPassStrategy.test.ts` | 7 (inalterado) |

---

## Validação evaluator offline

Deferido (§4.3 opcional). **Nota:** não existe `evaluateH07` — H07 validado via **H01** proxy + testes T1/T6.

Fixtures H11/H13 disponíveis para `HeartsPlayStrategy.metrics.test.ts` futuro.

---

## Confirmações

| Item | Estado |
|------|--------|
| Zero alteração regras / motores | OK |
| Zero LLM live | OK |
| Zero evaluator hot path | OK |
| Easy intocado | OK |
| `HeartsPassStrategy` inalterado | OK |

---

## Gaps (§7 prompt)

| Gap | Estado |
|-----|--------|
| H10 bloquear moon | Hearts v2 |
| H09 moon no bot | v2 |
| H12 meninos | v2 |
| H14 forçar Q♠ | v2 |
| H13 vaza nossa antes 4.º jogador | v0.1 |
| H13 fixture 2 cartas vs bot §D11 | Encoder offline only |
| Sueca S23 / Spades escola | Impl 13/14 |

---

## Checkpoints

| Checkpoint | Estado |
|------------|--------|
| CI testes + build | OK |
| **H15-OK** smoke Medium/Hard | **Pendente** |

Assinatura: `**H15-OK:** OK — YYYY-MM-DD`

### Smoke sugerido

- Não apanhar pontos sem necessidade (H07)
- Q♠ não jogada à toa em ♠ led (H11)
- Limpar Q♠/♥ em vaza nossa sem pontos (H13)

---

## Próximos passos

1. Checkpoint **H15-OK** — partida Hearts Medium/Hard.
2. Hearts bot v2 — H10 moon block, H12 meninos, H13 early «vaza nossa».
3. King bot (Impl 16+).

---

**Fim do relatório Impl 15.**
