# IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE — Prompt de implementação

**ID:** `IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE`  
**Plano pai:** [IMPLEMENTATION_PLAN_AI.md](../IMPLEMENTATION_PLAN_AI.md) v1.4+ — próximo bloco pós-Impl 13 + **H13 OK**  
**Design base:** [FASE_1_METRICAS.md](../FASE_1_METRICAS.md) · [FASE_2A_PRIORIDADES_METRICAS.md](../FASE_2A_PRIORIDADES_METRICAS.md) · [FASE_2B_FIXTURES_METRICAS.md](../FASE_2B_FIXTURES_METRICAS.md) · [FASE_5_AVALIADOR_DESIGN.md](../FASE_5_AVALIADOR_DESIGN.md)  
**Status report:** [CARD_INTELLIGENCE_STATUS_REPORT.md](../CARD_INTELLIGENCE_STATUS_REPORT.md) v1.7 · [ROADMAP_COMPLIANCE_REVIEW.md](../reviews/ROADMAP_COMPLIANCE_REVIEW.md) · [TECHNICAL_INTEGRITY_REVIEW.md](../reviews/TECHNICAL_INTEGRITY_REVIEW.md)  
**Pré-requisitos:** [IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md](../implementation-reports/IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md) · [IMPLEMENTATION_13_BOT_METRICS_UPGRADE_REPORT.md](../implementation-reports/IMPLEMENTATION_13_BOT_METRICS_UPGRADE_REPORT.md) — **H13 OK** 2026-06-06 recomendado  
**Código base:** [`frontend/src/ai/games/spades/`](../../frontend/src/ai/games/spades/) · [`frontend/src/cardIntelligence/`](../../frontend/src/cardIntelligence/) · [`frontend/src/models/games/SpadesGame.ts`](../../frontend/src/models/games/SpadesGame.ts)  
**Data:** 2026-06-06  
**Scope desta prompt:** guia **executável** para melhoria **controlada** do bot Spades (Medium/Hard) com métricas validadas — **não implementar neste passo documental**.

**Tipo de documento:** prompt de **implementação** (Agent mode) — relatório pós-código em **§8**.

**Mapa de secções:**

| § | Conteúdo |
|---|----------|
| §1 | Inventário bot Spades actual |
| §2 | Mapeamento métrica → código |
| §3 | Escopo exacto v0 (máx. 3 melhorias) |
| §4 | Testes |
| §5 | Integração Card Intelligence (offline only) |
| §6 | Critérios de sucesso |
| §7 | Gaps |
| **§8** | Relatório final esperado (pós-código) — template |
| §9 | Checkpoint **H14** (humano) |
| §10–§13 | Ficheiros, ordem impl, CI, riscos |
| **§14** | Decisões D1–D12 |
| **§15** | Dúvidas Q1–Q10 |
| **§16** | Metadados |

**Posicionamento no roadmap:**

```
Impl 1–13 (fechados) → Impl 14 Spades Bot Metrics → Spades v2 / Hearts / King → LLM decision assist (futuro)
```

**Princípio central:** Repetir o modelo **Impl 13** — melhorar decisões locais com métricas já validadas; **não** substituir bots, **não** LLM live, **não** alterar regras/motores/UI.

| Camada | Papel | Impl 14 |
|--------|-------|---------|
| Card Intelligence | Juiz offline + fixtures SP06/SP08/SP09/SP14 | **Validação** pós-mudança |
| `SpadesPlayStrategy` + `SpadesBidEstimator` | Heurística gameplay | **Alvo play** (bid defer v0) |
| Mini-LLM | Conselheiro debug | **Fora** |
| `SpadesGame.ts` | Motor + scoring | **Intocável** |

**Checkpoint humano H14:** pós-Impl 14 — testes Spades verdes + smoke partida Medium/Hard; observação qualitativa parceiro/bags/corte mínimo.

**Gates:**

| Fase | Bloqueio |
|------|----------|
| Redigir/ler esta prompt | **Nenhum** |
| Implementar código Impl 14 | **H13 OK recomendado** |
| Checkpoint H14 | Depois de CI verde + relatório Impl 14 |

**Modelo Impl 13:** mesma disciplina — máx. 3 métricas, helpers extraídos se >25 linhas, Easy intocado, evaluator só em testes.

---

## Instruções para o agente implementador

1. Confirmar **H13 OK**; ler §1–§3 + fixtures SP06/SP08/SP09 + [`SpadesPlayStrategy.ts`](../../frontend/src/ai/games/spades/SpadesPlayStrategy.ts).
2. Implementar **apenas** §3 (máx. 3 melhorias play-phase); recusar §7.
3. **Zero** alteração em `SpadesGame.ts` (motor/scoring), UI, `GameBoard`, LLM, memory live, evaluator hot path.
4. Cada mudança **mapeia** métrica §2; cada mudança tem **teste** §4.
5. **Easy** intocado (random play + random bid) — §D3.
6. **Nil / blind nil** — não alterar lógica bid v0 — §D7.
7. Preferir extrair [`spadesTrickHelpers.ts`](../../frontend/src/ai/games/spades/spadesTrickHelpers.ts) (padrão Impl 13 `suecaTrickHelpers`) — §D8.
8. Evaluator offline em testes **opcional** §4.3; **proibido** em runtime bot.
9. CI §12 + grep hot path §12.3.
10. Relatório **§8**; checkpoint humano **§9 (H14)**.
11. Ordem de impl **§11 / D2** (SP09 → SP08 → SP06) — não confundir com numeração §3.1.

---

# 1. Inventário do bot Spades actual

## 1.1 Onde está a AI

| Camada | Ficheiro | Função |
|--------|----------|--------|
| Play strategy | [`SpadesPlayStrategy.ts`](../../frontend/src/ai/games/spades/SpadesPlayStrategy.ts) | `chooseSpadesCard`, `playEasy/Medium/Hard`, `partnerIsWinning` |
| Bid estimator | [`SpadesBidEstimator.ts`](../../frontend/src/ai/games/spades/SpadesBidEstimator.ts) | `chooseSpadesBid`, `estimateHandBid` |
| Motor | [`SpadesGame.ts`](../../frontend/src/models/games/SpadesGame.ts) | `chooseAICard` → `chooseSpadesCard`; `chooseAIBid` → `chooseSpadesBid` |
| Legal moves | [`LegalMoveFilter.ts`](../../frontend/src/ai/core/LegalMoveFilter.ts) | `getLegalIndices(adapter, state, playerIndex)` |
| Difficulty | [`DifficultyProfile.ts`](../../frontend/src/ai/core/DifficultyProfile.ts) | Easy randomness; Medium/Hard deterministic play |
| Testes play | [`SpadesPlayStrategy.test.ts`](../../frontend/src/ai/games/spades/SpadesPlayStrategy.test.ts) | 7 casos (easy, lead ♠, hard min win, partner, -1) |
| Testes bid | [`SpadesBidEstimator.test.ts`](../../frontend/src/ai/games/spades/SpadesBidEstimator.test.ts) | easy range, A♠+K♠, long spades |

**Nota:** Spades **já tem** testes play — expandir §4, não criar ficheiro do zero.

## 1.2 Easy / Medium / Hard

| Difficulty | Play | Bid |
|------------|------|-----|
| **easy** | `playEasy` — carta legal random (`shouldPlayRandom`) | bid 1–4 random |
| **medium** | `playMedium` — lead non-♠ se possível; `needTricks`; partner low | `estimateHandBid`; nil ocasional se enabled |
| **hard** | `playHard` — min winner in-suit; partner low; lowest ♠ se need tricks | `estimateHandBidHard` + long spades; nil ocasional |

**Escopo Impl 14:** **Medium + Hard play only** (§D2). Bid **defer v0** salvo hotfix documentado (§D5).

## 1.3 Fluxo escolha carta

```
GameBoard → SpadesGame.chooseAICard
  → getLegalIndices (adapter.canPlayCard — regras Spades no motor)
  → chooseSpadesCard(adapter, state, playerIndex, spadesState, difficulty)
```

Sem AI externa Spades (local only).

## 1.4 Fluxo bid

```
SpadesGame.chooseAIBid → chooseSpadesBid(hand, nilEnabled, blindNilEnabled, difficulty)
```

Evaluator **SP01** é proxy play-phase v0 — bid real não avaliado no juiz. **Não** alterar bid v0 salvo decisão explícita §15 Q2.

## 1.5 legalMoves

Runtime: `getLegalIndices` via `adapter.canPlayCard` — respeita broken spades, follow suit, etc. **Não** duplicar regras no bot.

## 1.6 Heurísticas existentes (resumo código)

### Variáveis chave

```typescript
needTricks = teamTricks < teamBid  // em playMedium/playHard
partnerIsWinning(playerIndex, state)  // trick winner == partner seat
```

### Liderança (`currentTrick.length === 0`)

- Preferir **non-♠** se disponível (medium + hard) — alinhado **SP04** parcial.
- Se `needTricks`: medium pega último do pool; hard pega **maior** do pool.
- Se bid cumprido: hard usa `lowestCard` — OK parcial **SP09**.

### Seguimento — parceiro

- **`partnerIsWinning` → `lowestCard(valid)`** — medium + hard — **SP06 implementado** (com testes).

### Seguimento — bags (**SP09 gap**)

- In-suit winners: medium só ganha se `needTricks` (L117) — **OK**.
- **Trump já na vaza:** medium L99–108 corta com **`spadesInHand[0]`** sem verificar `needTricks` — **gap SP09 + SP08**.
- Hard void follow: lowest ♠ só se `needTricks` (L176–180) — **OK**.

### Corte mínimo (**SP08 gap**)

- Medium trump branch: **`spadesInHand[0]`** — **não** é mínimo vencedor (L106).
- Hard in-suit: **min winner** quando `needTricks` (L168–170) — **OK**.
- Hard void: `lowestCard(spadesInHand)` — **OK** parcial SP08.
- **Medium in-suit** com `needTricks`: usa `winners[0]` (L117), **não** mínimo vencedor — hard já usa `reduce`. **Fora v0** (§7); não expandir scope.

### Hard — ramo trump explícito

- `playHard` **não** replica o ramo `trumpPlayed` do medium (L99–108); depende de void + `lowestCard(spadesInHand)` quando `needTricks`.
- Provavelmente OK para v0, mas **T4/T5 devem cobrir medium e hard** — validar que hard não regrediu em overtrump ou ♠ não mínima.

### SP06 hardening gap

- Se parceiro ganha mas **só** cartas vencedoras existem → deve jogar **menor** vencedor (espelho Impl 13 S19), não roubar com K♠ sobre parceiro.

## 1.7 Métricas / evaluator / fixtures (Spades P0)

| ID | Fixture | Dev Lab | Evaluator |
|----|---------|---------|-----------|
| **SP06** | [`SP06_FIXTURE`](../../frontend/src/cardIntelligence/fixtures/spadesFixtures.ts) | — | `evaluateSP06` |
| **SP08** | SP08_FIXTURE | — | `evaluateSP08` |
| **SP09** | SP09_FIXTURE | `LAB_SP09` | `evaluateSP09` |
| **SP14** | SP14_FIXTURE | `LAB_SP14` | `evaluateSP14` Tier B |
| **SP01** | SP01_FIXTURE | — | proxy good |

---

# 2. Mapeamento métrica → código

| Métrica humana | ID | No bot? | Ficheiro / zona | Risco | Impl 14? |
|----------------|-----|---------|-----------------|-------|----------|
| Proteger parceiro — jogar baixo | **SP06** / T05 | **Sim** | `partnerIsWinning` L91–94, L152–155 | Baixo | **Sim** — harden forced-win mínimo (padrão Sueca S19) |
| Evitar bags após bid cumprido | **SP09** / T06 | **Parcial** | `needTricks`; gap trump L99–108 | Médio | **Sim** — prioridade impl #1 |
| Cortar com espada mínima | **SP08** | **Parcial** | Medium L106; Hard OK | Baixo | **Sim** — prioridade impl #2 |
| Bid conservador | **SP01** | **Parcial** | `SpadesBidEstimator` | Médio (nil) | **Não v0** — §D5 |
| Não liderar ♠ cedo | **SP04** | **Parcial** | lead non-♠ pool | Baixo | Existente — smoke only |
| Cumprir bid — agressão | **SP05** / SP07 | **Parcial** | `needTricks` gates | Médio | Existente |
| Quebrar bid adversária 8+ | **SP14** | **Não** | — | Alto | **Spades v2** |
| Nil / blind nil | **SP03** | Legado medium | `chooseSpadesBid` | Alto | **Fora scope** |
| Bags regra scoring | **SP11** | Motor | `SpadesGame` | — | Intocável |

---

# 3. Escopo exacto da implementação futura

## 3.1 Dentro do scope (v0)

**Máx. 3 melhorias de métrica** (play-phase only):

| Métrica | Entrega |
|---------|---------|
| **SP09** | Bid cumprido (`avoidBags`): **nunca** ganhar trick desnecessário (incl. overtrump ♠ medium L99–108) |
| **SP08** | Ao cortar/ganhar com ♠ intencionalmente: **menor** espada vencedora (medium + hard) |
| **SP06** | Parceiro a ganhar + só cartas vencedoras → **menor** vencedor legal (`cardWouldWinTrick`, espelho S19) |

**Ordem de implementação** (§11 / **D2**): **SP09 → SP08 → SP06** — gates globais antes do harden SP06.

**Entregas de suporte** (não contam como “4.ª métrica”):

| Entrega | Nota |
|---------|------|
| `spadesTrickHelpers.ts` | Se >25 linhas duplicadas (§D8) |
| `SpadesPlayStrategy.test.ts` T1–T10 | Obrigatório por métrica |
| Teste evaluator offline SP09 | Opcional §4.3 |

## 3.2 Fora do scope (proibido v0)

| Item | Motivo |
|------|--------|
| Nil / blind nil strategy | User + §D7 |
| **SP14** quebrar bid adversária | Contexto score — Spades v2 |
| **SP01** bid conservador refactor | Bid phase; nil side effects |
| Score strategy global / bags acumulados | Ambíguo |
| Void inference profunda | Hard v2 |
| Hearts / King / Sueca v2 | Outras impl |
| LLM / decision assist / memory live | Roadmap |
| Alterar `SpadesGame.ts`, scoring, UI | Regra user |
| Rewrite `SpadesPlayStrategy` | Risco regressão |

## 3.3 Melhoria — SP06 (proteger parceiro) — impl **#3**

**Estado actual:** `partnerIsWinning` + `lowestCard` — **bom** para descarte perdedor.

**Gap:** se **todas** as legais ganham trick → jogar **menor** vencedor (não K♠ sobre parceiro com A♠ na vaza).

**Spec:**

```typescript
if (partnerIsWinning(...)) {
  const nonWinners = valid.filter(i => !cardWouldWinTrick(...));
  if (nonWinners.length > 0) return lowestCard(nonWinners);
  return pickMinimumWinningCard(valid); // forced win
}
```

Substituir bloco actual L91–94 / L152–155 ou unificar num helper `playWhenPartnerWinning`.

**Alinhar** evaluator `evaluateSP06` (steals vs feed).

## 3.4 Melhoria — SP09 (evitar bags) — impl **#1**

**Spec:**

- `avoidBags = teamTricks >= teamBid` (equivalente `!needTricks`).
- Se `avoidBags`:
  - **Não** jogar carta que ganha trick se existir descarte perdedor legal.
  - **Não** overtrump ♠ se bid cumprido — corrigir medium L99–108.
  - **Lead** com bid cumprido: `lowestCard(nonSpadesPool)` — **não** `pool[0]` (ordem de `valid` não garante rank).
- Se **só** winners disponíveis → jogar **menor** winner (minimizar bag damage) — documentar no relatório.

**Invariante:** `needTricks === true` mantém comportamento actual de ganhar tricks necessários.

## 3.5 Melhoria — SP08 (espada mínima) — impl **#2**

**Spec:**

- Quando **intencionalmente** cortar/ganhar com ♠ (`needTricks` ou defesa necessária — v0 só `needTricks`):
  - Escolher **menor** ♠ que ainda ganha trick (não `spadesInHand[0]`).
- Aplicar em medium trump branch e alinhar hard.
- Reutilizar lógica espelho [`lowestWinningSpade`](../../frontend/src/cardIntelligence/encoder/trickHelpers.ts) — **duplicar** em `spadesTrickHelpers` (não importar cardIntelligence no runtime bot).

## 3.6 O que já existe — não reimplementar

| Métrica | Acção |
|---------|-------|
| **SP04** lead non-♠ | Manter; teste smoke opcional |
| **SP06** base partner low | Manter; só harden §3.3 |
| **SP07** hard min in-suit winner | Já em hard L167–170 — regressão |

---

# 4. Testes

## 4.1 Expandir [`SpadesPlayStrategy.test.ts`](../../frontend/src/ai/games/spades/SpadesPlayStrategy.test.ts)

| ID | Cenário | Métrica | Assert |
|----|---------|---------|--------|
| **T1** | Parceiro ganha; K♥ + 2♥ legais | SP06 | Joga 2♥ (existente — regressão) |
| **T2** | Parceiro ganha; só 7♠ e A♠ ganham | SP06 | Joga **7♠** (menor winner) |
| **T3** | teamTricks ≥ teamBid; pode ganhar com A♠ ou descartar 2♣ | SP09 | Joga 2♣ — **medium + hard** |
| **T4** | teamTricks ≥ teamBid; ♠ na vaza; 7♠ e A♠ ganham; 2♣ legal se possível | SP09 | Slough 2♣; se forced, menor ♠ — **medium + hard** |
| **T5** | needTricks; void; trick led ♥; 7♠ e A♠ cortam | SP08 | Joga **7♠** — **medium + hard** |
| **T6** | needTricks; in-suit 7♠ e A♠ vs 5♠ led | SP08 | Joga 7♠ — hard regressão existente |
| **T7** | Easy — índice legal | — | regressão |
| **T8** | Lead bid cumprido; 2♣ e A♠ no pool non-♠ | SP09 | `lowestCard(nonSpades)` → 2♣ — **medium + hard** |
| **T9** | Sem legais → -1 | — | regressão |
| **T10** | Medium/Hard sempre índice ∈ legal | T01 | loop hand sizes |

## 4.2 Bid (defer v0)

Se **SP01** incluído numa v2: usar [`SpadesBidEstimator.test.ts`](../../frontend/src/ai/games/spades/SpadesBidEstimator.test.ts) — **não** expandir v0 salvo Q2.

## 4.3 Integração Card Intelligence (opcional recomendado)

```typescript
// SpadesPlayStrategy.metrics.test.ts — import evaluator só aqui
const fixture = getFixtureById('SP09')!;
// synthetic state → chooseSpadesCard → evaluateDecision offline
// assert SP09 !== 'bad' quando bot escolhe slough
```

**Regra:** zero import `cardIntelligence/evaluator` em `SpadesPlayStrategy.ts`.

## 4.4 Dev Lab smoke H14

```javascript
await __ciScenarioReport('LAB_SP09')
await __ciScenarioReport('LAB_SP14')  // evaluator baseline; bot não implementa SP14 v0
```

---

# 5. Integração com Card Intelligence

| Uso | Permitido | Proibido |
|-----|-----------|----------|
| Fixtures SP06/SP08/SP09 como spec | Sim | — |
| `LAB_SP09` smoke manual | Sim | — |
| `evaluateDecision` em testes bot | Sim | — |
| Evaluator no `chooseSpadesCard` | — | **Sim** |
| Logger / LLM live | Inalterado | Alterar jogada |

---

# 6. Critérios de sucesso

- [ ] Máx. 3 melhorias §3 (**SP09, SP08, SP06 harden** — ordem impl §11)
- [ ] `SpadesPlayStrategy.test.ts` T1–T10 verdes (+ regressões existentes); T3–T5 e T8 em **medium e hard**
- [ ] `SpadesBidEstimator` **inalterado** v0 (ou mudança documentada se Q2 fechada)
- [ ] **Não-goal v0:** medium in-suit `winners[0]` → min winner (L117) — **não** implementar
- [ ] `npm test` + `CI=true npm run build` verdes
- [ ] Bot joga sempre cartas legais
- [ ] Zero alteração motor/regras/UI/LLM live
- [ ] Easy intocado
- [ ] Grep: zero evaluator em `ai/` except `*.test.*`
- [ ] Relatório **§8** + checkpoint **H14 §9**

---

# 7. Gaps (deferidos)

| Gap | Próximo passo |
|-----|---------------|
| **SP14** quebrar bid adversária 8+ | Spades bot v2 (Tier B evaluator já existe) |
| **SP01** bid conservador fino | Bid phase impl separada; nil fora |
| **SP03** nil Hard-only | Remover nil medium random — impl futura |
| **SP13** soma bids 12–14 | Meta-heurística mesa — ambíguo |
| Void inference / SP10 honras ♠ | Hard v2 |
| Medium in-suit min winner (`winners[0]` L117) | Hard já faz reduce L167–170; alinhar medium = v0.1 |
| Hard ramo trump explícito | Validar T4/T5; unificar só se regressão |
| Score-aware agressivo/passivo | Hard v2 |
| Memory / LLM live | Offline only |
| Hearts / King bots | Impl 15+ |
| Sueca v2 (S23 Rei vs intermédia) | Impl 13 relatório |

---

# 8. Relatório final esperado (pós-código)

Criar [`docs/ai/implementation-reports/IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE_REPORT.md`](../implementation-reports/IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE_REPORT.md):

```markdown
# IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE — Relatório final

## Ficheiros criados / alterados
## Métricas implementadas (SP06, SP09, SP08)
## Métricas já existentes confirmadas (SP04, SP07)
## Testes executados + contagens
## Antes/depois por métrica
## Validação evaluator offline (se aplicável)
## Confirmação zero regras / zero LLM live / zero evaluator hot path
## Gaps §7
## Checkpoints — H14: OK | Pendente
## Próximos passos (Spades v2 SP14 / Hearts)
```

---

# 9. Checkpoint H14 (humano)

**Pré-requisito:** H13 OK — não re-validar Sueca aqui.

## 9.1 CI (obrigatório)

```bash
cd frontend
npm test -- --testPathPattern=SpadesPlayStrategy --watchAll=false
npm test -- --testPathPattern=SpadesBidEstimator --watchAll=false
CI=true npm run build
```

## 9.2 Smoke manual (recomendado — não exaustivo)

Partida Spades **Medium ou Hard**:

- [ ] Parceiro **não** roubado sem necessidade (SP06)
- [ ] Com bid cumprido, bot **evita** ganhar tricks óbvios / bags (SP09)
- [ ] Cortes usam ♠ **mínima** suficiente quando observável (SP08)
- [ ] Jogo normal sem erros / cartas ilegais

**Não** exigir validar SP14, nil, ou score global manualmente.

## 9.3 Assinatura

Relatório Impl 14: `**H14:** OK — YYYY-MM-DD`

---

# 10. Ficheiros

## 10.1 Criar (provável)

| Ficheiro | Função |
|----------|--------|
| `ai/games/spades/spadesTrickHelpers.ts` | winner detection, min winning ♠, lowest card |
| `ai/games/spades/spadesTrickHelpers.test.ts` | helpers unitários |
| `ai/games/spades/SpadesPlayStrategy.metrics.test.ts` | **Opcional** — evaluator offline |

## 10.2 Alterar (mínimo)

| Ficheiro | Alteração |
|----------|-----------|
| [`SpadesPlayStrategy.ts`](../../frontend/src/ai/games/spades/SpadesPlayStrategy.ts) | SP06/SP09/SP08 |
| [`SpadesPlayStrategy.test.ts`](../../frontend/src/ai/games/spades/SpadesPlayStrategy.test.ts) | T1–T10 |

## 10.3 Não alterar

- [`SpadesGame.ts`](../../frontend/src/models/games/SpadesGame.ts)
- [`SpadesBidEstimator.ts`](../../frontend/src/ai/games/spades/SpadesBidEstimator.ts) — v0 default
- `cardIntelligence/**` runtime
- Outros jogos / LLM / UI

---

# 11. Ordem de implementação (D12)

1. `spadesTrickHelpers.ts` + testes helpers
2. **SP09** avoid bags (`avoidBags` gate global follow)
3. **SP08** min winning ♠ (fix medium L106)
4. **SP06** forced minimum winner when partner winning
5. Expandir `SpadesPlayStrategy.test.ts`
6. (Opcional) metrics integration test
7. Relatório **§8** + checkpoint **H14 §9**

---

# 12. CI e grep

```bash
cd frontend
npm test -- --testPathPattern=ai/games/spades --watchAll=false
npm test -- --testPathPattern=cardIntelligence --watchAll=false
CI=true npm run build
```

```bash
rg "evaluateDecision|getMiniLLMAdvice" frontend/src/ai --glob '!**/*.test.*'
rg "cardIntelligence/evaluator" frontend/src/models/games
```

Esperado: **zero** fora testes.

---

# 13. Riscos

| Risco | Mitigação |
|-------|-----------|
| Regressão needTricks | T5/T6 mantêm win quando abaixo bid |
| SP06 vs SP09 ordem | Partner winning check **antes** de avoidBags win logic |
| Duplicar trick logic | Helpers + testes alinhados evaluator (`cardWouldWinTrickStandard`) |
| Lead `pool[0]` vs lowest | Spec SP09: `lowestCard(nonSpadesPool)` — T8 |
| Hard sem ramo trump | T4/T5 medium **e** hard |
| Bid scope creep | Defer SP01 v0 |

---

# 14. Decisões D1–D12

| ID | Decisão |
|----|---------|
| **D1** | Jogo único v0: **Spades** Medium/Hard **play** |
| **D2** | Máx. **3**: **SP09, SP08, SP06 harden** (ordem impl: SP09 → SP08 → SP06) |
| **D3** | **Easy** intocado |
| **D4** | SP06 base **existe** — harden forced win, não rewrite |
| **D5** | **SP01 bid defer** v0 — play-phase only |
| **D6** | **SP14 defer** Spades v2 |
| **D7** | **Nil** fora scope — não alterar `chooseSpadesBid` |
| **D8** | `spadesTrickHelpers.ts` se >25 linhas duplicadas |
| **D9** | Não alterar `SpadesGame.ts` |
| **D10** | Padrão Impl 13 — helpers + testes + relatório |
| **D11** | `avoidBags` alias de `teamTricks >= teamBid` |
| **D12** | Expandir testes existentes, não substituir ficheiro |

---

# 15. Dúvidas Q1–Q10

| ID | Tema | Resolução v1 |
|----|------|--------------|
| **Q1** | SP06 já implementado — Impl 14 faz o quê? | **Endurecer** com `cardWouldWinTrick` + forced min winner (S19); `lowestCard` sozinho não alinha evaluator |
| **Q2** | Incluir SP01 bid v0? | **Defer** — bid separado; nil risk |
| **Q3** | SP14 no smoke H14? | Dev Lab evaluator only; bot v2 |
| **Q4** | Import `trickHelpers` cardIntelligence? | **Não** — duplicar mínimo em `ai/spades/` |
| **Q5** | Medium vs Hard divergência | Unificar helpers; hard mantém extras existentes |
| **Q6** | Forced win under avoidBags | Min winner — aceite 1 bag vs A♠ waste |
| **Q7** | LAB_SP09 replay bot | Opcional teste integração |
| **Q8** | `partnerIsWinning` vs encoder `partnerWinning` | Alinhar comportamento; não importar encoder |
| **Q9** | SpadesBidEstimator regressão | Zero changes v0 — T7 bid suite unchanged |
| **Q10** | H14 vs CI | CI obrigatório; smoke 3 bullets recomendado |

---

# 16. Metadados

## Referências

- [IMPLEMENTATION_PLAN_AI.md](../IMPLEMENTATION_PLAN_AI.md)
- [CARD_INTELLIGENCE_STATUS_REPORT.md](../CARD_INTELLIGENCE_STATUS_REPORT.md)
- [ROADMAP_AI.md](../ROADMAP_AI.md)
- [FASE_1_METRICAS.md](../FASE_1_METRICAS.md) §Spades
- [FASE_2A_PRIORIDADES_METRICAS.md](../FASE_2A_PRIORIDADES_METRICAS.md) §Spades P0
- [IMPLEMENTATION_13_BOT_METRICS_UPGRADE_REPORT.md](../implementation-reports/IMPLEMENTATION_13_BOT_METRICS_UPGRADE_REPORT.md)
- [IMPLEMENTATION_13_BOT_METRICS_UPGRADE_PROMPT.md](./IMPLEMENTATION_13_BOT_METRICS_UPGRADE_PROMPT.md) — modelo

## Histórico

| Versão | Data | Nota |
|--------|------|------|
| 1.0 | 2026-06-06 | Prompt inicial pós-H13; Spades SP09/SP08/SP06; inventário + gaps código |
| 1.1 | 2026-06-06 | Revisão pós-análise: mapa §8 relatório; ordem impl vs métricas; T4/T5/T8 medium+hard; lead lowestCard; gaps medium in-suit / hard trump |

---

**Fim da prompt — não implementar código até aprovação explícita.**
