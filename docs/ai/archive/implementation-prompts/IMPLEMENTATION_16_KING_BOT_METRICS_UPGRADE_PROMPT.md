# IMPLEMENTATION_16_KING_BOT_METRICS_UPGRADE — Prompt de implementação

**ID:** `IMPLEMENTATION_16_KING_BOT_METRICS_UPGRADE`  
**Plano pai:** [IMPLEMENTATION_PLAN_AI.md](../IMPLEMENTATION_PLAN_AI.md) v1.4+ — próximo bloco pós-Impl 15 + **H15-OK parcial**  
**Design base:** [FASE_1_METRICAS.md](../FASE_1_METRICAS.md) · [FASE_2A_PRIORIDADES_METRICAS.md](../FASE_2A_PRIORIDADES_METRICAS.md) · [FASE_2B_FIXTURES_METRICAS.md](../FASE_2B_FIXTURES_METRICAS.md) · [FASE_5_AVALIADOR_DESIGN.md](../FASE_5_AVALIADOR_DESIGN.md)  
**Status report:** [CARD_INTELLIGENCE_STATUS_REPORT.md](../CARD_INTELLIGENCE_STATUS_REPORT.md) · [ROADMAP_COMPLIANCE_REVIEW.md](../reviews/ROADMAP_COMPLIANCE_REVIEW.md) · [TECHNICAL_INTEGRITY_REVIEW.md](../reviews/TECHNICAL_INTEGRITY_REVIEW.md)  
**Pré-requisitos:** [IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md](../implementation-reports/IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md) · [IMPLEMENTATION_13_BOT_METRICS_UPGRADE_REPORT.md](../implementation-reports/IMPLEMENTATION_13_BOT_METRICS_UPGRADE_REPORT.md) · [IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE_REPORT.md](../implementation-reports/IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE_REPORT.md) · [IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE_REPORT.md](../implementation-reports/IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE_REPORT.md) — **H14 OK** · **H15-OK parcial** 2026-06-06  
**Código base:** [`frontend/src/ai/games/king/`](../../frontend/src/ai/games/king/) · [`frontend/src/cardIntelligence/`](../../frontend/src/cardIntelligence/) · [`frontend/src/models/games/KingPtGame.ts`](../../frontend/src/models/games/KingPtGame.ts) · [`frontend/src/models/games/KingSimplifiedGame.ts`](../../frontend/src/models/games/KingSimplifiedGame.ts)  
**Data:** 2026-06-06  
**Scope desta prompt:** guia **executável** para melhoria **controlada** do bot **King PT** (Medium/Hard play) — **v1.1 aprovada para implementação** após review.

**Tipo de documento:** prompt de **implementação** (Agent mode) — relatório pós-código em **§8**.

**Naming checkpoints vs métricas:** checkpoint humano **H16-OK** (Impl 16) ≠ métricas King **K10/K15** — ver §15 Q10.

**Princípio King — contrato-first (prioridade fixa):**

```
1. contrato activo
2. regra obrigatória (K♥, não puxar ♥)
3. penalização activa
4. risco futuro (defer v0)
5. carta
```

**Mapa de secções:**

| § | Conteúdo |
|---|----------|
| §1 | Inventário bot King actual |
| §2 | Mapeamento métrica → código |
| §3 | Escopo exacto v0 (máx. 3 melhorias) |
| §4 | Testes |
| §5 | Integração Card Intelligence (offline only) |
| §6 | Critérios de sucesso |
| §7 | Gaps |
| **§8** | Relatório final esperado (pós-código) — template |
| §9 | Checkpoint **H16-OK** (humano) |
| §10–§13 | Ficheiros, ordem impl, CI, riscos |
| **§14** | Decisões D1–D14 |
| **§15** | Dúvidas Q1–Q10 |
| **§16** | Metadados |

**Posicionamento no roadmap:**

```
Impl 1–15 → Impl 16 King Bot Metrics (PT) → King v2 / Simplified → LLM decision assist (futuro)
```

**Princípio central:** Repetir modelo **Impl 13–15** — métricas locais validadas; **não** LLM live; **não** alterar motores/regras/UI.

| Camada | Papel | Impl 16 |
|--------|-------|---------|
| Card Intelligence | Fixtures K00/K02/K03/K01 + evaluators | **Validação** offline |
| `KingPlayStrategy` (PT) | Heurística play | **Alvo v0** |
| `KingAuctionStrategy` | Festa/leilão | **Fora v0** |
| `chooseKingSimplifiedCard` | King Simplified | **Defer v0** (sem contrato) |
| `KingPtGame.ts` / motor | Regras + `mustPlayKingOfHearts` | **Intocável** (reutilizar exports) |

**Checkpoint humano H16-OK:** testes King PT verdes + smoke partida Medium/Hard; contrato/K♥/copas/nulos óbvios.

**Gates:**

| Fase | Bloqueio |
|------|----------|
| Redigir/ler esta prompt | **Nenhum** |
| Implementar código Impl 16 | **H15-OK parcial** + **aprovação prompt v1.1** |
| Checkpoint H16-OK | CI verde + relatório Impl 16 |

**Modelo Impl 15:** helpers + pipeline partilhado medium/hard; Easy intocado; evaluator só testes.

---

## Instruções para o agente implementador

1. Confirmar **H15-OK parcial**; ler §1–§3 + fixtures K02/K03/K01 + [`KingPlayStrategy.ts`](../../frontend/src/ai/games/king/KingPlayStrategy.ts).
2. Implementar **apenas** §3 em **`chooseKingPtCard`** (King **PT** Medium/Hard); **não** alterar `chooseKingSimplifiedCard` v0 salvo §D6.
3. **Zero** alteração em `KingPtGame.ts` scoring/regras (salvo import já existente), UI, festa flow, LLM, evaluator hot path.
4. Cada mudança **mapeia** métrica §2; cada mudança tem **teste** §4.
5. **Easy** intocado — §D3.
6. **Leilão/festa (`KingAuctionStrategy`)** — **fora v0** — §D7.
7. Pipeline **contrato-first** §3.6 antes de heurísticas legacy.
8. Preferir [`kingTrickHelpers.ts`](../../frontend/src/ai/games/king/kingTrickHelpers.ts) — duplicar mínimo de [`kingObligations.ts`](../../frontend/src/cardIntelligence/shared/kingObligations.ts) **sem** import `cardIntelligence/` — §D9.
9. Reutilizar **`mustPlayKingOfHearts`** de [`KingPtGame.ts`](../../frontend/src/models/games/KingPtGame.ts) (já importado) — §D10.
10. Relatório **§8**; checkpoint **§9 H16-OK**.
11. Ordem impl **§11 / D2**: **K02 → K03 → K01/K00** — **D14** = expandir testes only.
12. **Não** substituir blocos `no_tricks` / `no_last_two` — inserir gates **antes** (§D5).
13. Testes usam `canPlayCard: () => true` — assert **escolha** do bot, não legalidade motor (§4.1).

---

# 1. Inventário do bot King actual

## 1.1 Variantes — PT vs Simplified

| Variante | Motor | AI play | Estado contrato | Impl 16 v0 |
|----------|-------|---------|-----------------|------------|
| **King PT** | [`KingPtGame.ts`](../../frontend/src/models/games/KingPtGame.ts) | `chooseKingPtCard` | `KingPtVariantState.contract`, festa, trickNumber | **Alvo** |
| **King Simplified** | [`KingSimplifiedGame.ts`](../../frontend/src/models/games/KingSimplifiedGame.ts) | `chooseKingSimplifiedCard` | Só `handType === 'negative'` | **Defer v0** |

**Nota:** Simplified **não** recebe `contractId` — métricas K02/K03/K01 **impossíveis** sem refactor motor. Documentar gap §7; smoke opcional sem alteração.

## 1.2 Onde está a AI

| Camada | Ficheiro | Função |
|--------|----------|--------|
| Play PT | [`KingPlayStrategy.ts`](../../frontend/src/ai/games/king/KingPlayStrategy.ts) | `chooseKingPtCard`, `ptNegativeDump`, `mediumNegativeDump`, positive lead/follow |
| Play Simplified | idem | `chooseKingSimplifiedCard` |
| Festa/leilão | [`KingAuctionStrategy.ts`](../../frontend/src/ai/games/king/KingAuctionStrategy.ts) | `runOneAiFestaStep` — random/heurística mínima |
| Motor PT | `KingPtGame.chooseAICard` → `chooseKingPtCard` | `mustPlayKingOfHearts`, `isMen`, legal moves |
| Legal moves | [`LegalMoveFilter.ts`](../../frontend/src/ai/core/LegalMoveFilter.ts) | `getLegalIndices` |
| Testes PT | [`KingPlayStrategy.test.ts`](../../frontend/src/ai/games/king/KingPlayStrategy.test.ts) | 8 casos (easy, no_hearts lead, positive hard, no_last_two, no_tricks) |
| Testes Simplified | — | **Nenhum** |
| Testes auction | — | **Nenhum** |

## 1.3 Easy / Medium / Hard (King PT)

| Difficulty | Negativo (`gameIndex < 6` ou festa negativa) | Positivo / festa |
|------------|---------------------------------------------|------------------|
| **easy** | random legal | random legal |
| **medium** | Lead: non-♥ lowest; follow: `mediumNegativeDump` / `ptNegativeDump` | Lead high; follow min winner |
| **hard** | **`ptNegativeDump`** (mesmo core medium) | Lead low; follow min winner in-suit |

**Escopo Impl 16:** **Medium + Hard play King PT** negativo + gates contrato em paths partilhados. Positivo **K09** já parcial — regressão only v0.

## 1.4 Fluxo escolha carta (PT)

```
KingPtGame.chooseAICard
  → getLegalIndices (motor canPlayCard — K♥ obligation enforced in motor too)
  → chooseKingPtCard(adapter, state, playerIndex, king, difficulty)
```

## 1.5 Festa / contrato (fora v0 play)

```
KingAuctionStrategy.runOneAiFestaStep — auction, negotiation, fallback, festa setup
```

Evaluator **K06/K07** — fase festa; **não** alterar v0.

## 1.6 Heurísticas existentes — gaps confirmados

### `ptNegativeDump` (medium + hard negativo)

```typescript
// Follow void — K02 parcial:
if (kingIdx >= 0 && mustPlayKingOfHearts(player, led, king)) return kingIdx;
// Dump penalização — K01 parcial (void off-suit):
const dump = valid.find(/* contract penalty match */);
// Follow in-suit — GAP:
if (inSuit.length) return inSuit[0];  // ordem arbitrária; não evita Q/K/♥ penalizados
```

### Lead negativo medium (L258–267)

- Non-♥ pool + lowest rank — **K03 parcial** (`no_hearts`).
- **Gap K02:** lead com `no_king_hearts` + K♥ legal → escolhe **menor** ♥ (ex. 3♥) em vez de **K♥** obrigatório (fixture K02).

### `mediumNegativeDump`

- **`no_tricks` / `no_last_two`** — lógica dedicada parcial (**K12/K05/K10**).
- Fallback `ptNegativeDump` — gaps K01 in-suit.

### Positivo

- `mediumPositiveFollow` / `chooseKingPtHard` positivo — **K09** min winner — **OK** parcial (teste existente).

### King Simplified

- Negativo: `valid[0]` ou lowest lead — **sem contrato**.
- Hard follow: dump max penalty off-suit — **sem K00–K03**.

## 1.7 Métricas / evaluator / fixtures / Dev Lab

| ID | Fixture | Dev Lab | Evaluator |
|----|---------|---------|-----------|
| **K00** | [`K00_FIXTURE`](../../frontend/src/cardIntelligence/fixtures/kingFixtures.ts) | — | `evaluateK00` |
| **K02** | K02_FIXTURE | `LAB_K02` | `evaluateK02` |
| **K03** | K03_FIXTURE | — | `evaluateK03` |
| **K01** | K01_FIXTURE | — | `evaluateK01` |
| **K10** | K10_FIXTURE | `LAB_K10` | `evaluateK10` Tier B |
| **K08** | — | — | `evaluateK08` |
| **K09** | — | — | `evaluateK09` |
| **K12** | — | — | `evaluateK12` |

Encoder: [`kingEncoder.ts`](../../frontend/src/cardIntelligence/encoder/kingEncoder.ts) + [`kingObligations.ts`](../../frontend/src/cardIntelligence/shared/kingObligations.ts) — spec offline; **não** importar no bot runtime.

---

# 2. Mapeamento métrica → código

| Métrica humana | ID | No bot PT? | Ficheiro / zona | Risco | Impl 16? |
|----------------|-----|------------|-----------------|-------|----------|
| Contrato activo — evitar alvo penalizado | **K00** | **Parcial** | Lead non-♥; dump void; gap in-suit | Baixo | **Sim #3** (unificar com K01) |
| Descarte consciente por contrato | **K01** | **Parcial** | `ptNegativeDump` dump find; gap in-suit L23–24 | Baixo | **Sim #3** |
| K♥ 1.ª oportunidade legal | **K02** | **Parcial** | Follow void L25–28; **gap lead** | Baixo | **Sim #1** |
| Não puxar copas com alternativa | **K03** | **Parcial** | Medium lead L258–267; hard duplicado | Baixo | **Sim #2** — ver nota motor §3.4 |
| Liderança negativa fora copas | **K04** | **Parcial** | Medium lead non-♥ | Baixo | Coberto por K03/K00 lead |
| Nulos — evitar vazas | **K12** | **Parcial** | `no_tricks` block L203–216 | Médio | **Defer v0** — teste regressão existe |
| Positivos — ganhar mínimo | **K09** | **Sim** | `mediumPositiveFollow`, hard positivo | Baixo | Regressão only |
| Damas e homens | **K08** | **Parcial** | Overlap K01 `no_men`/`no_queens` | Baixo | Via K01 filter |
| Duas últimas / trick 11 | **K10** | **Parcial** | `no_last_two` L152–201 | Alto | **Defer v0** |
| Festa leilão | **K06** | Legado random | `KingAuctionStrategy` | Alto | **Fora** |
| Festa fallback | **K07** | Legado random | idem | Alto | **Fora** |
| Score-aware / K11 / K15 | — | **Não** | — | Alto | Fora |

---

# 3. Escopo exacto da implementação futura

## 3.1 Dentro do scope (v0) — máx. 3 métricas

| Métrica | Entrega |
|---------|---------|
| **K02** | **Obrigação K♥** em **lead + follow** antes de qualquer heurística (`mustPlayKingOfHearts` + histórico se necessário) |
| **K03** | **Não liderar ♥** quando `no_hearts` / `no_king_hearts` e existir legal off-suit (`computeCannotLeadHearts` espelho) |
| **K01 + K00** | **Slough consciente:** entre legais, preferir carta que **não** viola contrato activo; in-suit **menor** rank que não leva penalização se possível |

**Ordem de implementação** (§11 / **D2**): **K02 → K03 → K01/K00**.

**Entregas de suporte** (não contam como 4.ª métrica):

| Entrega | Nota |
|---------|------|
| `kingTrickHelpers.ts` | `isPenaltyCardForContract`, `pickSafeSlough`, `playKingPtNegativeLead/Follow` |
| Expandir `KingPlayStrategy.test.ts` T1–T10 | King **PT** only |
| `KingPlayStrategy.metrics.test.ts` | Opcional K02/K03 fixtures |

## 3.2 Fora do scope (proibido v0)

| Item | Motivo |
|------|--------|
| **King Simplified** bot metrics | Sem `contractId` — §D6 |
| **K06/K07** leilão/festa | User + ambíguo |
| **K10** duas últimas avançado | Tier B; parcial existe |
| **K12** nulos festa (além regressão `no_tricks`) | Ambíguo festaMode |
| Escolha estratégica contrato | Fora |
| Score global K11/K15 | Fora |
| LLM / decision assist / memory live | Roadmap |
| Alterar `KingPtGame` regras/scoring | User |
| Rewrite total `KingPlayStrategy` | Risco |
| Hearts v2 / Sueca S23 / Spades escola | Outras impl |

## 3.3 Melhoria — K02 (K♥ obrigatório) — impl **#1**

**Estado actual:** `mustPlayKingOfHearts` só em `ptNegativeDump` **follow void** (L25–28). **Lead ignora** — viola fixture K02.

**Spec:**

```typescript
// Primeiro gate em playKingPtNegative (lead + follow):
const khIdx = valid.findIndex(i => isKingHearts(hand[i]));
if (khIdx >= 0 && mustPlayKingOfHearts(player, ledSuit, king)) {
  return khIdx;
}
```

- `ledSuit = trick.length ? trick[0].suit : null`
- Alinhar [`evaluateK02`](../../frontend/src/cardIntelligence/evaluator/metricEvaluators.ts) + `LAB_K02`
- **Não** duplicar regra do motor — usar export `mustPlayKingOfHearts` (§D10)

## 3.4 Melhoria — K03 (não puxar copas) — impl **#2**

**Nota motor vs bot:** [`heartsLeadForbidden`](../../frontend/src/models/games/KingPtGame.ts) + `canPlayCard` já **proíbem** liderar ♥ em `no_hearts` / `no_king_hearts` quando há off-suit legal em runtime real. **K03 no bot** vale sobretudo para: (1) unificar medium/hard num pipeline; (2) testes com adapter permissivo; (3) alinhamento evaluator offline. **Não** é redundante em CI/testes.

**Spec lead (`trick.length === 0`):**

- Se `contract ∈ { no_hearts, no_king_hearts }` **e** existe legal non-♥ → jogar entre non-♥ (lowest rank — K04).
- Se só ♥ legais → jogar (K02 pode forçar K♥ antes).

**Spec follow:** K03 evaluator só lead — follow coberto por K01/K00 slough.

**Hard negativo:** unificar com medium via `playKingPtNegativeLead` — hoje hard usa `ptNegativeDump` lead via `chooseKingPtHard` → incluir gate K03.

## 3.5 Melhoria — K01 + K00 (descarte consciente) — impl **#3**

**Duas funções distintas** (semânticas opostas — §13):

| Helper | Uso | Semântica |
|--------|-----|-----------|
| **`pickPenaltyDumpVoid`** | Follow void off-suit (legacy L29–37) | Preferir descartar carta **penalizada** do contrato |
| **`pickSafeSlough`** | Follow in-suit + fallback seguro | Preferir carta **não** penalizada; lowest rank se forced |

**Spec in-suit / slough seguro:**

```typescript
function isPenaltyCardForContract(card: Card, contract: KingNegativeContract | null): boolean {
  // no_hearts → ♥; no_queens → Q; no_men → isMen; no_king_hearts → K♥
}
// Entre valid: preferir !isPenaltyCardForContract
// In-suit: pickLowestRank among safe; se só penalizadas → lowest rank (forced)
```

Substituir `inSuit[0]` e `dump ?? valid[0]` por **`pickSafeSlough(valid, hand, contract)`**.

Substituir `inSuit[0]` por **`pickSafeSlough`**. Manter **`pickPenaltyDumpVoid`** para void off-suit (não confundir).

**K00** (`no_hearts`): subset de K01 filter — um helper unificado.

## 3.6 Pipeline contrato-first — `playKingPtNegative`

```
K02 (K♥) → lead? → K03 (non-♥) | follow → no_tricks/no_last_two (intactos) → K01 pickSafeSlough | pickPenaltyDumpVoid void
```

```typescript
function playKingPtNegative(valid, player, state, king, difficulty): number {
  const hand = player.hand;
  const trick = state.currentTrick;
  const led = trick.length ? trick[0].suit : null;

  // 1) K02 — obrigação K♥
  // 2) Lead → K03 + K04 (non-♥ low)
  // 3) no_tricks / no_last_two — manter blocos existentes (regressão)
  // 4) Follow in-suit / safe → K01/K00 pickSafeSlough
  // 5) Follow void off-suit → pickPenaltyDumpVoid (legacy penalty dump)
  // 6) Fallback mínimo (should shrink)
}
```

`chooseKingPtCard` medium/hard negativo chama **um** pipeline; positivo **inalterado** v0.

## 3.7 O que já existe — não reimplementar

| Métrica | Acção |
|---------|-------|
| **K09** positivo min winner | Manter; teste hard existente |
| **K05/K10** `no_last_two` fases | Manter blocos L152–201; regressão T existente |
| **K12** `no_tricks` in-suit lowest | Manter L203–216; regressão T existente |
| **KingAuctionStrategy** | Inalterado |

---

# 4. Testes

## 4.1 Expandir [`KingPlayStrategy.test.ts`](../../frontend/src/ai/games/king/KingPlayStrategy.test.ts) — **King PT only**

| ID | Cenário | Métrica | Assert |
|----|---------|---------|--------|
| **T1** | `no_king_hearts`; lead; K♥ + 3♥ legais | K02 | Joga K♥ — **medium + hard** |
| **T2** | `no_king_hearts`; follow void ♠; K♥ + 2♣ | K02 | Joga K♥ |
| **T3** | `no_hearts`; lead; K♥ + 2♣ | K03 | Joga 2♣ — **medium + hard** |
| **T4** | `no_queens`; follow; D♠ + 4♣ legais off-suit | K01 | Joga 4♣ (não D♠) |
| **T5** | `no_hearts`; follow ♥ led; 5♥ + 2♣ void | K00 | Joga 2♣ |
| **T6** | `no_tricks`; follow in-suit 7♠ vs A♠ | K12 | Joga 7♠ — **regressão** existente |
| **T7** | Easy — índice legal | — | regressão |
| **T8** | Positivo hard min winner | K09 | regressão existente |
| **T9** | Sem legais → -1 | — | regressão |
| **T10** | Medium/Hard negativo lead `no_hearts` non-♥ | K03 | não lead ♥ |

**Nota testes:** `makeAdapter(allLegal=true)` — intencional (padrão Impl 14/15). Asserts sobre **índice/carta escolhida**; legalidade real fica no motor.

## 4.2 King Simplified (defer v0)

Sem testes novos v0 — documentar gap §7.

## 4.3 Integração Card Intelligence (opcional recomendado)

```typescript
// KingPlayStrategy.metrics.test.ts — evaluator offline only
// LAB_K02, fixtures K03/K01
```

**Proibido:** import evaluator em `KingPlayStrategy.ts`.

## 4.4 Dev Lab smoke (opcional)

```javascript
await __ciScenarioReport('LAB_K02')
await __ciScenarioReport('LAB_K10')  // evaluator baseline; bot não implementa K10 v0
```

*Não confundir com checkpoint **§9 H16-OK**.*

---

# 5. Integração com Card Intelligence

| Uso | Permitido | Proibido |
|-----|-----------|----------|
| Fixtures K00/K02/K03/K01 como spec | Sim | — |
| `LAB_K02` smoke | Sim | — |
| `evaluateDecision` em `*.test.*` | Sim | — |
| Evaluator / encoder no hot path bot | — | **Sim** |
| Import `cardIntelligence/` em `KingPlayStrategy.ts` | — | **Sim** |

---

# 6. Critérios de sucesso

- [ ] Máx. 3 melhorias §3 (**K02, K03, K01/K00**) — ordem **§11 / D2**
- [ ] `KingPlayStrategy.test.ts` T1–T10 verdes (+ regressões); T1/T3 **medium + hard**
- [ ] **`chooseKingSimplifiedCard` inalterado** v0
- [ ] **`KingAuctionStrategy` inalterado** v0
- [ ] Pipeline contrato-first §3.6 antes de slough legacy
- [ ] `npm test` + `CI=true npm run build` verdes
- [ ] Easy intocado; grep evaluator hot path zero
- [ ] Relatório **§8** + **§9 H16-OK**

---

# 7. Gaps (deferidos)

| Gap | Próximo passo |
|-----|---------------|
| **King Simplified** métricas contrato | Impl 16b ou motor passa contract |
| **K06/K07** leilão/festa AI | Impl festa separada |
| **K10** trick 11/12 planificado | King v2; LAB_K10 evaluator only |
| **K12** nulos festa (`festaMode`) | v2 se spec fechada |
| **K13/K14** voids / caçar K♥ | Hard v2 |
| **K11/K15** score-aware | Fora |
| Hearts v2 cartas altas | Impl 15 relatório |
| Sueca S23 / Spades escola | Impl 13/14 |
| «Mandar putos à escola» transversal | **Fora** desta impl |
| **K02 histórico K♥** — motor vs encoder `kingHeartsPlayedInHistory` | v2; documentar relatório §8 |

---

# 8. Relatório final esperado (pós-código)

Criar [`docs/ai/implementation-reports/IMPLEMENTATION_16_KING_BOT_METRICS_UPGRADE_REPORT.md`](../implementation-reports/IMPLEMENTATION_16_KING_BOT_METRICS_UPGRADE_REPORT.md):

```markdown
# IMPLEMENTATION_16_KING_BOT_METRICS_UPGRADE — Relatório final

## Ficheiros criados / alterados
## Variante: King PT only (Simplified defer)
## Métricas implementadas (K02, K03, K01/K00)
## Métricas já existentes confirmadas (K09, K12 no_tricks, no_last_two)
## Testes executados + contagens
## Antes/depois por métrica
## Validação evaluator offline (se aplicável)
## Nota: divergência motor `mustPlayKingOfHearts` vs encoder `kingHeartsPlayedInHistory` — documentar §7
## Nota: K03 redundante em runtime real; valor em testes/unificação
## Confirmação zero regras / zero LLM live / zero evaluator hot path
## Gaps §7
## Checkpoints — H16-OK: OK | Pendente | Parcial
## Próximos passos (King Simplified / K10 / festa)
```

---

# 9. Checkpoint H16-OK (humano)

**Pré-requisito:** H15-OK parcial registado — não re-validar Hearts aqui.

## 9.1 CI (obrigatório)

```bash
cd frontend
npm test -- --testPathPattern=KingPlayStrategy --watchAll=false
CI=true npm run build
```

## 9.2 Smoke manual (recomendado — não exaustivo)

Partida **King PT** Medium ou Hard — jogos negativos variados:

- [ ] Contrato activo respeitado (sem ♥ em `no_hearts` quando evitável)
- [ ] **K♥** jogado na 1.ª oportunidade legal (`no_king_hearts`)
- [ ] Não puxa copas com alternativa (K03)
- [ ] Em **nulos** / `no_tricks`, evita ganhar quando observável
- [ ] Sem cartas ilegais / erros UI

**Não** exigir: leilão festa, K10 trick 11, Simplified, todos os contratos.

## 9.3 Assinatura

Relatório Impl 16: `**H16-OK:** OK | Parcial — YYYY-MM-DD`

---

# 10. Ficheiros

## 10.1 Criar (provável)

| Ficheiro | Função |
|----------|--------|
| `ai/games/king/kingTrickHelpers.ts` | `pickSafeSlough`, `pickPenaltyDumpVoid`, gates K02/K03 |
| `ai/games/king/kingTrickHelpers.test.ts` | unitários K02/K03/K01 |
| `ai/games/king/KingPlayStrategy.metrics.test.ts` | opcional evaluator |

## 10.2 Alterar (mínimo)

| Ficheiro | Alteração |
|----------|-----------|
| [`KingPlayStrategy.ts`](../../frontend/src/ai/games/king/KingPlayStrategy.ts) | Pipeline negativo PT; K02/K03/K01 |
| [`KingPlayStrategy.test.ts`](../../frontend/src/ai/games/king/KingPlayStrategy.test.ts) | T1–T10 |

## 10.3 Não alterar

- [`KingPtGame.ts`](../../frontend/src/models/games/KingPtGame.ts) — regras/scoring (exports OK)
- [`KingSimplifiedGame.ts`](../../frontend/src/models/games/KingSimplifiedGame.ts)
- [`KingAuctionStrategy.ts`](../../frontend/src/ai/games/king/KingAuctionStrategy.ts)
- `cardIntelligence/**` runtime · UI · LLM

---

# 11. Ordem de implementação (**D2**)

1. `kingTrickHelpers.ts` + testes
2. **`playKingPtNegative`** pipeline §3.6
3. **K02** gate K♥ (lead + follow)
4. **K03** lead non-♥
5. **K01/K00** `pickSafeSlough` (in-suit) + manter `pickPenaltyDumpVoid` (void)
6. Refactor `chooseKingPtCard` medium/hard → pipeline único negativo
7. Expandir testes T1–T10
8. (Opcional) metrics test + LAB_K02
9. Relatório **§8** + **§9 H16-OK**

---

# 12. CI e grep

```bash
cd frontend
npm test -- --testPathPattern=ai/games/king --watchAll=false
npm test -- --testPathPattern=cardIntelligence --watchAll=false
CI=true npm run build
```

```bash
rg "evaluateDecision|getMiniLLMAdvice|kingObligations|kingEncoder" frontend/src/ai --glob '!**/*.test.*'
rg "cardIntelligence/evaluator" frontend/src/models/games
```

Esperado: **zero** fora testes.

---

# 13. Riscos

| Risco | Mitigação |
|-------|-----------|
| K02 vs K03 lead (só ♥) | K02 **antes** de K03; K03 só se K02 false |
| Duplicar regra K♥ vs motor | Usar `mustPlayKingOfHearts` export — §D10 |
| Regressão `no_last_two` / `no_tricks` | **Inserir** gates no topo; **não** rewrite blocos L152–216 — §D5 |
| pickSafeSlough vs penalty dump | Funções **separadas** §3.5 |
| K03 redundante runtime | OK — testes + pipeline; documentar relatório |
| Motor vs encoder K♥ histórico | v2 gap; v0 usa `mustPlayKingOfHearts` — §D13 |
| Adapter permissivo testes | Assert carta escolhida — §4.1 |
| Medium/hard divergem | Pipeline único `playKingPtNegative` |
| Simplified scope creep | **Defer** explícito §D6 |
| Festa auction touch | Proibido §D7 |

---

# 14. Decisões D1–D14

| ID | Decisão |
|----|---------|
| **D1** | v0: **King PT** play Medium/Hard only |
| **D2** | Máx. **3**: **K02, K03, K01/K00** (ordem: K02 → K03 → K01) |
| **D3** | **Easy** intocado |
| **D4** | Positivo **K09** — regressão only |
| **D5** | Manter blocos `no_tricks` / `no_last_two` — não rewrite |
| **D6** | **King Simplified defer** v0 |
| **D7** | **KingAuctionStrategy defer** v0 |
| **D8** | **K10/K06/K07 defer** |
| **D9** | `kingTrickHelpers.ts`; **não** import `cardIntelligence/` |
| **D10** | Reutilizar `mustPlayKingOfHearts` + `isMen` de `KingPtGame` |
| **D11** | Contrato-first ordem fixa §3.6 |
| **D12** | K00 unificado em K01 slough helper |
| **D13** | K♥: `mustPlayKingOfHearts` v0; encoder `kingHeartsPlayedInHistory` = gap v2 relatório |
| **D14** | Expandir testes PT; pass/auction inalterados |

---

# 15. Dúvidas Q1–Q10

| ID | Tema | Resolução v1 |
|----|------|--------------|
| **Q1** | King Simplified na mesma impl? | **Defer** — sem contractId |
| **Q2** | K12 nulos festa vs `no_tricks` | v0: regressão `no_tricks` only; festa nulos v2 |
| **Q3** | Import `kingObligations.ts`? | **Não** — duplicar mínimo ou usar exports motor §D10 |
| **Q4** | K02 lead — motor já força? | Motor valida legal; bot deve **escolher** K♥ — T1 |
| **Q5** | Hard negativo = medium pipeline? | **Sim** — unificar §3.6 |
| **Q6** | K01 in-suit forced queen | Lowest rank se só penalizadas — documentar relatório |
| **Q7** | LAB_K10 no smoke | Opcional evaluator; bot não K10 v0 |
| **Q8** | Positivo alterar? | **Não** v0 |
| **Q9** | `roundPlayHistory` / K♥ já jogado | Motor **sem** histórico; encoder **com** — v0 motor OK; alinhar v2 |
| **Q10** | H16 vs K10/K15 | **H16-OK** = checkpoint Impl 16; **K10/K15** = métricas King |
| **Q11** | K03 vs `heartsLeadForbidden` | Runtime redundante; bot+testes+evaluator alinhados — §3.4 |

---

# 16. Metadados

## Referências

- [IMPLEMENTATION_PLAN_AI.md](../IMPLEMENTATION_PLAN_AI.md)
- [CARD_INTELLIGENCE_STATUS_REPORT.md](../CARD_INTELLIGENCE_STATUS_REPORT.md)
- [ROADMAP_AI.md](../ROADMAP_AI.md)
- [FASE_1_METRICAS.md](../FASE_1_METRICAS.md) §King PT
- [FASE_2A_PRIORIDADES_METRICAS.md](../FASE_2A_PRIORIDADES_METRICAS.md) §King P0
- [IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE_REPORT.md](../implementation-reports/IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE_REPORT.md) — modelo + H15-OK parcial
- [IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE_PROMPT.md](./IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE_PROMPT.md) — estrutura

## Histórico

| Versão | Data | Nota |
|--------|------|------|
| 1.0 | 2026-06-06 | Prompt inicial pós-H15-OK parcial; King PT K02/K03/K01; PT vs Simplified; gaps código |
| 1.1 | 2026-06-06 | Review: K03/motor; pickSafeSlough vs penalty dump; K♥ histórico; adapter testes; aprovada para impl |

---

**Fim da prompt v1.1 — pronta para Agent mode (Impl 16).**
