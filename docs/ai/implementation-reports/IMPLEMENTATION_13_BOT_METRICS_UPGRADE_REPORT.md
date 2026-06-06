# IMPLEMENTATION_13_BOT_METRICS_UPGRADE — Relatório final

**ID:** `IMPLEMENTATION_13_BOT_METRICS_UPGRADE`  
**Prompt:** [IMPLEMENTATION_13_BOT_METRICS_UPGRADE_PROMPT.md](../implementation-prompts/IMPLEMENTATION_13_BOT_METRICS_UPGRADE_PROMPT.md) v1.0  
**Data:** 2026-06-06  
**Estado:** implementação concluída — **H13 OK** 2026-06-06 (Francisco)

---

## Ficheiros criados

| Ficheiro | Função |
|----------|--------|
| [`suecaTrickHelpers.ts`](../../frontend/src/ai/games/sueca/suecaTrickHelpers.ts) | S16 ace/7; trick winner; min/max rank; `cardWouldWinTrickSueca` |
| [`suecaTrickHelpers.test.ts`](../../frontend/src/ai/games/sueca/suecaTrickHelpers.test.ts) | 3 testes helpers |
| [`SuecaStrategy.test.ts`](../../frontend/src/ai/games/sueca/SuecaStrategy.test.ts) | T1–T10 métricas + regressão |

---

## Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| [`SuecaStrategy.ts`](../../frontend/src/ai/games/sueca/SuecaStrategy.ts) | S16 lead filter; S19 partner-not-steal; S08 via `pickCheapestWinner` |

**Não alterados:** `SuecaGame.ts`, `Game.ts`, `GameBoard.tsx`, motores, `cardIntelligence/` (runtime), LLM, outros jogos.

---

## Métricas implementadas

| ID | Melhoria | Difficulty |
|----|----------|------------|
| **S16** | Não liderar **7** de naipe enquanto **Ás desse naipe** não visto em `playedCards` | Medium + Hard |
| **S19 / T05** | Parceiro a ganhar vaza → jogar carta que **não rouba** (menor descarte); se só winners, menor winner | Medium + Hard |
| **S08** | Ao ganhar, escolher **menor** carta vencedora (`pickCheapestWinner`) | Medium + Hard |

## Métricas já existentes (confirmadas)

| ID | Estado |
|----|--------|
| **S12** | Trunfo mínimo vencedor — smoke T5 |
| **S11 / S15** | Descarte baixo — lógica existente mantida |

---

## Antes / depois (esperado)

| Cenário | Antes | Depois |
|---------|-------|--------|
| Lead 7♦ + 4♦, Ás ♦ por sair | Podia abrir 7 | Abre 4♦ |
| Parceiro ganha com A, K+2 na mão | Podia subir K | Joga 2 |
| Ganhar trick com 9 e K disponíveis | Já min em muitos casos | Garantido via `pickCheapestWinner` |

---

## Testes executados

```bash
npm test -- --testPathPattern=ai/games/sueca --watchAll=false   # 13 passed
npm test -- --testPathPattern=cardIntelligence --watchAll=false # 243 passed
CI=true npm run build                                           # OK
```

**Novos testes:** +13 (Sueca bot).

---

## Validação evaluator offline

Não ligado ao runtime. Fixtures S16/S08/S19 disponíveis para validação manual Dev Lab / testes futuros (§4.3 prompt — deferido).

---

## Confirmações

| Item | Estado |
|------|--------|
| Zero alteração regras / motores | OK |
| Zero LLM live | OK |
| Zero evaluator hot path | OK (grep `ai/` sem evaluator) |
| Easy bot intocado | OK (T6) |
| Cartas legais | OK (ctx + testes) |

---

## Gaps (deferidos §7)

- S05 anti-puxar trunfo cedo  
- S25 destrunfar parceiro  
- S04 singleton lead  
- S08 cutRisk (encoder partial)  
- S16 inferência Ás parceiro  
- Spades / Hearts / King bots  
- Teste integração bot + `evaluateDecision` (opcional)

### Observação Sueca v2 (smoke H13 — Francisco)

Quando a AI tenta evitar **«mandar putos à escola»** (métrica **S23**, Hard — fora scope v0), **não** deve usar **Rei por defeito**; preferir carta **intermédia/alta controlada** quando fizer sentido estrategicamente (cf. [FASE_1_METRICAS.md](../FASE_1_METRICAS.md) §S23). Candidata a **Sueca bot v2** — sem alteração de código nesta impl.

---

## Checkpoints

| Checkpoint | Estado |
|------------|--------|
| CI Impl 13 | OK |
| **H13** | **OK** — 2026-06-06 (Francisco) |

### Evidência H13 (2026-06-06)

| Canal | Resultado |
|-------|-----------|
| Jest `SuecaStrategy.test.ts` | **10/10** OK (T1–T10) |
| Smoke manual | Sueca **Medium + Hard** — jogo normal OK |

**Notas smoke manual:**

- Nenhuma manilha aberta indevidamente antes do Ás — comportamento correcto (S16).
- Descarte/jogo geral pareceu correcto (S19/S08 observação qualitativa).
- Ver observação **Sueca v2 / S23** acima (Rei vs carta intermédia — deferido).

---

## Próximos passos

1. **Sueca bot v2** — S05, S25, S23 (Rei vs intermédia), cutRisk S08  
2. **Impl 14** — Spades ou outro jogo  
3. **H12B** — Ollama smoke (opcional, independente)

---

## Actualização plano/status

Actualizado: `IMPLEMENTATION_PLAN_AI.md` + `CARD_INTELLIGENCE_STATUS_REPORT.md` (H13 OK 2026-06-06).
