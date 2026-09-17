# IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE — Relatório final

**ID:** `IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE`  
**Prompt:** [IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE_PROMPT.md](../../archive/implementation-prompts/IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE_PROMPT.md) v1.1  
**Data:** 2026-06-06  
**Estado:** implementação concluída — **H15-OK: OK — 2026-09-17** (HEARTS-H15-OK-CLOSURE-01)

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
| **Cartas altas guardadas** — desfazer perigo cedo | **H15-OK** — ver observação abaixo |
| Sueca S23 / Spades escola | Impl 13/14 |

### Observação Hearts v2 (smoke H15-OK — Francisco)

Em jogo real (**Medium/Hard**), comportamento **«assim assim»**: os bots tendem a **guardar cartas altas/perigosas** (Q♠, ♥ altas, honras) quando deveriam **desfazer-se delas** num contexto seguro — padrão humano FASE_1 (limpar perigo, **H12** meninos, **H13** alargado).

**Causas prováveis no código v0:**

- **H13** só dispara no **4.º jogador** (`trick.length === 3`) — muitas vazas «nossas» sem pontos ficam de fora.
- **H11** seguir ♠ com espada **baixa** mantém Q♠/K♠ na mão (correcto para H11, conflito com «sair cedo do perigo»).
- **H07** entre non-winners escolhe **menor** penalização → retém altas em vez de slough agressivo (H02 só no fallback).
- **H12** meninos / pass fino — **fora v0**.

**Fora scope Impl 15 v0** — candidata **Hearts bot v2** (H13 v0.1 + H12 + slough perigo em contexto seguro mais cedo). Sem alteração de código nesta assinalação.

---

## Checkpoints

| Checkpoint | Estado |
|------------|--------|
| CI testes + build | OK |
| **H15-OK** smoke Medium/Hard | **OK — 2026-09-17** |

Assinatura: `**H15-OK:** OK — 2026-09-17` (HEARTS-H15-OK-CLOSURE-01)

### Evidência H15-OK (2026-09-17)

| Canal | Resultado |
|-------|-----------|
| Vitest Hearts targeted + smoke | **PASS** (`heartsH15FullMatch.smoke.test.ts` Medium/Hard; pass L/R/across/hold; first-trick void; broken; Q♠; moon deltas/display) |
| Regras / AI legal | **PASS** — sem stalls; sem cartas duplicadas/perdidas |
| Gap «cartas altas guardadas» | **DEFERRED** Hearts bot v2 — **não** bloqueia H15-OK funcional |

### Evidência histórica (2026-06-06 — Parcial)

| Canal | Resultado |
|-------|-----------|
| Jest `ai/games/hearts` | **34/34** OK |
| Smoke manual | Medium/Hard — **assim assim**; gap polish v2 |

---

## Próximos passos

1. ~~Fechar H15-OK~~ — **DONE** 2026-09-17  
2. **Hearts bot v2** (opcional) — H13 alargado, **H12** meninos, slough perigo cedo; H10 moon.  
3. Gaps transversais restantes.

---

**Fim do relatório Impl 15.**
