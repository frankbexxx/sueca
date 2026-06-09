# IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE — Prompt de implementação

**ID:** `IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE`  
**Plano pai:** [IMPLEMENTATION_PLAN_AI.md](../IMPLEMENTATION_PLAN_AI.md) v1.4+ — próximo bloco pós-Impl 14 + **H14 OK**  
**Design base:** [FASE_1_METRICAS.md](../FASE_1_METRICAS.md) · [FASE_2A_PRIORIDADES_METRICAS.md](../FASE_2A_PRIORIDADES_METRICAS.md) · [FASE_2B_FIXTURES_METRICAS.md](../FASE_2B_FIXTURES_METRICAS.md) · [FASE_5_AVALIADOR_DESIGN.md](../FASE_5_AVALIADOR_DESIGN.md)  
**Status report:** [CARD_INTELLIGENCE_STATUS_REPORT.md](../CARD_INTELLIGENCE_STATUS_REPORT.md) · [ROADMAP_COMPLIANCE_REVIEW.md](../reviews/ROADMAP_COMPLIANCE_REVIEW.md) · [TECHNICAL_INTEGRITY_REVIEW.md](../reviews/TECHNICAL_INTEGRITY_REVIEW.md)  
**Pré-requisitos:** [IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md](../implementation-reports/IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md) · [IMPLEMENTATION_13_BOT_METRICS_UPGRADE_REPORT.md](../implementation-reports/IMPLEMENTATION_13_BOT_METRICS_UPGRADE_REPORT.md) · [IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE_REPORT.md](../implementation-reports/IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE_REPORT.md) — **H14 OK** 2026-06-06 recomendado  
**Código base:** [`frontend/src/ai/games/hearts/`](../../frontend/src/ai/games/hearts/) · [`frontend/src/cardIntelligence/`](../../frontend/src/cardIntelligence/) · [`frontend/src/models/games/HeartsGame.ts`](../../frontend/src/models/games/HeartsGame.ts)  
**Data:** 2026-06-06  
**Scope desta prompt:** guia **executável** para melhoria **controlada** do bot Hearts (Medium/Hard) — **v1.1 aprovada para implementação** após review.

**Tipo de documento:** prompt de **implementação** (Agent mode) — relatório pós-código em **§8**.

**Naming checkpoints vs métricas:** checkpoint humano **H15** (Impl 15) ≠ métrica **H15** (moon sacrifice) ≠ métrica **H14** Hearts (forçar Q♠) ≠ checkpoint **H14** Spades (Impl 14).

**Mapa de secções:**

| § | Conteúdo |
|---|----------|
| §1 | Inventário bot Hearts actual |
| §2 | Mapeamento métrica → código |
| §3 | Escopo exacto v0 (máx. 3 melhorias) |
| §4 | Testes |
| §5 | Integração Card Intelligence (offline only) |
| §6 | Critérios de sucesso |
| §7 | Gaps |
| **§8** | Relatório final esperado (pós-código) — template |
| §9 | Checkpoint **H15** (humano) |
| §10–§13 | Ficheiros, ordem impl, CI, riscos |
| **§14** | Decisões D1–D12 |
| **§15** | Dúvidas Q1–Q10 |
| **§16** | Metadados |

**Posicionamento no roadmap:**

```
Impl 1–14 (fechados) → Impl 15 Hearts Bot Metrics → Hearts v2 / King → LLM decision assist (futuro)
```

**Princípio central:** Repetir o modelo **Impl 13 / Impl 14** — melhorar decisões locais com métricas já validadas; **não** substituir bots, **não** LLM live, **não** alterar regras/motores/UI.

| Camada | Papel | Impl 15 |
|--------|-------|---------|
| Card Intelligence | Juiz offline + fixtures H01/H11/H13/H10 | **Validação** pós-mudança |
| `HeartsPlayStrategy` + `HeartsPassStrategy` | Heurística gameplay | **Alvo play** (pass defer v0) |
| Mini-LLM | Conselheiro debug | **Fora** |
| `HeartsGame.ts` | Motor + scoring + pass phase | **Intocável** |

**Nota Hearts vs Sueca/Spades:** objectivo invertido — **evitar pontos**, não ganhar tricks. **H13** é excepção crítica: numa vaza **sem pontos** e **nossa**, a boa jogada pode ser **limpar perigo** (Q♠/♥), **não** «jogar baixo» (cf. FASE_1 §Hearts).

**Checkpoint humano H15:** pós-Impl 15 — testes Hearts verdes + smoke partida Medium/Hard; observação qualitativa pontos/Q♠/limpeza.

**Gates:**

| Fase | Bloqueio |
|------|----------|
| Redigir/ler esta prompt | **Nenhum** |
| Implementar código Impl 15 | **H14 OK** + **aprovação explícita prompt v1.1** |
| Checkpoint humano Impl 15 | Depois de CI verde + relatório Impl 15 — assinar **§9 H15-OK** |

**Modelo Impl 14:** mesma disciplina — máx. 3 métricas play-phase, helpers extraídos se >25 linhas, Easy intocado, evaluator só em testes.

---

## Instruções para o agente implementador

1. Confirmar **H14 OK**; ler §1–§3 + fixtures H01/H11/H13 + [`HeartsPlayStrategy.ts`](../../frontend/src/ai/games/hearts/HeartsPlayStrategy.ts).
2. Implementar **apenas** §3 (máx. 3 melhorias **play-phase**); recusar §7.
3. **Zero** alteração em `HeartsGame.ts` (motor/scoring/pass rules), UI, `HeartsPassModal`, LLM, memory live, evaluator hot path.
4. Cada mudança **mapeia** métrica §2; cada mudança tem **teste** §4.
5. **Easy** intocado (`shouldPlayRandom` + pass random) — §D3.
6. **Pass phase (`HeartsPassStrategy`)** — **defer v0** salvo hotfix documentado (§D5); H05 já parcialmente OK.
7. Preferir extrair [`heartsTrickHelpers.ts`](../../frontend/src/ai/games/hearts/heartsTrickHelpers.ts) + **`playFollow(...)` partilhado** medium/hard — §3.7 / §D13.
8. Evaluator offline em testes **opcional recomendado** §4.3; **proibido** em runtime bot.
9. CI §12 + grep hot path §12.3.
10. Relatório **§8**; checkpoint humano **§9 (H15-OK)**.
11. Ordem de impl **§11 / D2** (H11 → H13 → H07) — **D12** = expandir testes only.

---

# 1. Inventário do bot Hearts actual

## 1.1 Onde está a AI

| Camada | Ficheiro | Função |
|--------|----------|--------|
| Play strategy | [`HeartsPlayStrategy.ts`](../../frontend/src/ai/games/hearts/HeartsPlayStrategy.ts) | `chooseHeartsCard`, `playEasy/Medium/Hard`, `penaltyScore` |
| Pass strategy | [`HeartsPassStrategy.ts`](../../frontend/src/ai/games/hearts/HeartsPassStrategy.ts) | `pickAIPassCards`, `pickPassEasy/Medium/Hard` |
| Motor | [`HeartsGame.ts`](../../frontend/src/models/games/HeartsGame.ts) | `chooseAICard` → `chooseHeartsCard`; pass via `pickAIPassCards` |
| Legal moves | [`LegalMoveFilter.ts`](../../frontend/src/ai/core/LegalMoveFilter.ts) | `getLegalIndices(adapter, state, playerIndex)` |
| Difficulty | [`DifficultyProfile.ts`](../../frontend/src/ai/core/DifficultyProfile.ts) | Easy randomness |
| Testes play | [`HeartsPlayStrategy.test.ts`](../../frontend/src/ai/games/hearts/HeartsPlayStrategy.test.ts) | 4 casos (easy, lead, follow dump, -1) |
| Testes pass | [`HeartsPassStrategy.test.ts`](../../frontend/src/ai/games/hearts/HeartsPassStrategy.test.ts) | 7 casos (easy count, Q♠ pass, void ♠ hard) |

**Nota:** Hearts **já tem** testes play e pass — expandir play §4; pass **não** expandir v0 salvo §D5.

## 1.2 Easy / Medium / Hard

| Difficulty | Play | Pass |
|------------|------|------|
| **easy** | `playEasy` — carta legal random | 3 cartas random |
| **medium** | Lead: **menor** penalização; follow: **maior** penalização (dump) | 3 cartas maior `penaltyScore` (Q♠ > ♥ > resto) |
| **hard** | Lead: menor penalização **non-♥** se possível; follow in-suit: maior penalização in-suit; off-suit: dump global | Pass void ♠ se ≤3 ♠ sem Q♠ (**H06**) |

**Escopo Impl 15:** **Medium + Hard play only** (§D2). Pass **defer v0** (§D5).

## 1.3 Fluxo escolha carta

```
GameBoard → HeartsGame.chooseAICard
  → getLegalIndices (adapter.canPlayCard — regras Hearts no motor)
  → chooseHeartsCard(adapter, state, playerIndex, difficulty)
```

Sem AI externa Hearts (local only).

## 1.4 Fluxo pass (fora v0)

```
HeartsPassModal / HeartsGame → pickAIPassCards(hand, difficulty)
```

Evaluator **H05** é proxy play-phase v0 — pass real já existe no bot; **não** alterar pass v0 salvo Q2.

## 1.5 legalMoves

Runtime: `getLegalIndices` via `adapter.canPlayCard` — respeita ♥ broken, 2♣ first trick, follow suit, etc. **Não** duplicar regras no bot.

## 1.6 Heurísticas existentes (resumo código)

### `penaltyScore` (play + pass)

```typescript
(c.suit === 'hearts' ? 10 : 0) + (c.rank === 'Q' && c.suit === 'spades' ? 20 : 0)
```

### Liderança (`currentTrick.length === 0`)

- **Medium:** sort valid by penalty asc → joga **último** = **menor** penalização — alinhado **H03** parcial.
- **Hard:** pool non-♥ se possível → **menor** penalização — alinhado **H04/H08** parcial.

### Seguimento — dump global (**gap H11 / H07**)

- **Medium L26–27:** follow → `sorted[0]` = **maior** penalização entre **todas** as legais — OK **H02** quando trick **perdido**; **má** quando led ♠ e legais são Q♠ + 2♠ (**H11 gap**).
- **Hard L50–56:** in-suit → maior penalização in-suit — mesma **H11 gap** em ♠ led.

### Seguimento — sem lógica «evitar ganhar vaza com pontos» (**H07 / H01 gap**)

- Não existe `cardWouldWinTrick` nem gate «trick tem pontos → preferir perder».
- Bot pode **ganhar** vaza com ♥/Q♠ quando existia descarte seguro.

### Limpar perigo em vaza nossa (**H13 gap**)

- **Não implementado.** Follow dump trata **sempre** «perder trick → slough alto».
- **Falta** ramo inverso: vaza **sem pontos** e **inevitavelmente nossa** → jogar **carta perigosa** (Q♠/♥), não a mais baixa.
- Evaluator + fixture **H13** já definem spec; encoder usa `trickIsSafeAndPointless` + `canCleanDangerousCard`.

### Pass (**H05 / H06 — existente, fora v0 play**)

- Medium passa Q♠ + piores — **OK** parcial.
- Hard void ♠ — **H06** OK.

### Shoot the moon (**H09 / H10 — gap**)

- [`heartsMoonThreat.ts`](../../frontend/src/cardIntelligence/encoder/heartsMoonThreat.ts) + encoder `moonThreatLevel` — **offline only**.
- Bot **não** usa moon threat — **fora v0** excepto nota §7.

## 1.7 Métricas / evaluator / fixtures (Hearts P0)

| ID | Fixture | Dev Lab | Evaluator |
|----|---------|---------|-----------|
| **H01** | [`H01_FIXTURE`](../../frontend/src/cardIntelligence/fixtures/heartsFixtures.ts) | — | `evaluateH01` |
| **H11** | H11_FIXTURE | — | `evaluateH11` |
| **H13** | H13_FIXTURE | `LAB_H13` | `evaluateH13` |
| **H05** | H05_FIXTURE | — | proxy pass |
| **H10** | H10_FIXTURE | — | `evaluateH10` Tier B |

---

# 2. Mapeamento métrica → código

| Métrica humana | ID | No bot? | Ficheiro / zona | Risco | Impl 15? |
|----------------|-----|---------|-----------------|-------|----------|
| Q♠ perigo máximo — seguir ♠ baixo | **H11** | **Parcial** | Medium follow global dump L27; Hard in-suit L53–55 | Baixo | **Sim** — prioridade impl #1 |
| Limpar perigo vaza nossa sem pontos | **H13** | **Não** | — | Médio | **Sim** — prioridade impl #2 |
| Evitar ganhar vaza com pontos | **H07** / **H01** | **Parcial** | Dump sem «would win» gate | Médio | **Sim** — prioridade impl #3 |
| Evitar pontos (objectivo geral) | **H01** | **Parcial** | Covered by H07 gate + H02 dump | — | Via H07 v0 |
| Descartar penalização trick perdido | **H02** | **Sim** | Medium/Hard follow dump | Baixo | Regressão only |
| Liderar baixa penalização | **H03** | **Sim** | Medium/Hard lead | Baixo | Regressão only |
| Pass cartas perigosas | **H05** | **Sim** | `HeartsPassStrategy` medium/hard | Baixo | **Defer v0** |
| Pass void espadas | **H06** | **Sim** | `pickPassHard` | Baixo | Defer v0 |
| Evitar liderar copas cedo | **H08** | **Parcial** | Hard lead non-♥ | Baixo | Smoke only |
| Não liderar copas alternativa | **H04** | **Parcial** | Hard lead | Baixo | Smoke only |
| Evitar «meninos» | **H12** | **Não** | — | Alto | **Fora v0** |
| Detectar shoot the moon | **H09** | **Não** | Encoder only | Médio | **Fora v0** (alerta simples v2) |
| Bloquear shoot the moon | **H10** | **Não** | Evaluator Tier B | Alto | **Hearts v2** |
| Forçar saída Q♠ | **H14** (métrica) | **Não** | — | Alto | Hearts v2 — ≠ checkpoint Spades **H14** |
| Moon sacrifice score | **H15** (métrica) | **Não** | — | Alto | Fora scope — ≠ checkpoint **H15-OK** §9 |

---

# 3. Escopo exacto da implementação futura

## 3.1 Dentro do scope (v0)

**Máx. 3 melhorias de métrica** (play-phase only):

| Métrica | Entrega |
|---------|---------|
| **H11** | Seguir **♠ led** com **espada baixa** (não Q♠ se existir alternativa in-suit); off-suit slough Q♠/♥ mantém H02 |
| **H13** | Vaza **sem pontos** e **inevitavelmente nossa** → jogar **carta perigosa** (max `penaltyScore` entre legais perigosas) |
| **H07** (+ **H01**) | Trick **com pontos** → se carta **ganharia** vaza, preferir legal que **não ganha**; se forced win, minimizar pontos tomados |

**Ordem de implementação** (§11 / **D2**): **H11 → H13 → H07** — corrigir ♠ follow antes do ramo inverso H13.

**Entregas de suporte** (não contam como «4.ª métrica»):

| Entrega | Nota |
|---------|------|
| `heartsTrickHelpers.ts` | `penaltyScore`, `isDangerousCard`, `heartsTrickPoints`, `wouldWinTrick`, `playFollowSpades` — §D8 |
| `HeartsPlayStrategy.test.ts` T1–T10 | Obrigatório por métrica |
| Teste evaluator offline H13/H11 | Opcional §4.3 |

## 3.2 Fora do scope (proibido v0)

| Item | Motivo |
|------|--------|
| **H10** bloquear moon / score sacrifice | User + ambíguo |
| **H09** moon avançado | v2 — encoder já existe |
| **H12** meninos | Ambíguo |
| **H14** forçar Q♠ | Timing voids — v2 |
| Pass phase refactor | H05/H06 já OK; risco isolado |
| Alterar `HeartsGame.ts`, scoring, UI | Regra user |
| LLM / decision assist / memory live | Roadmap |
| Rewrite `HeartsPlayStrategy` | Risco regressão |
| King bot | Impl 16+ |

## 3.3 Melhoria — H11 (Q♠ perigo máximo) — impl **#1**

**Estado actual:** follow medium usa **maior** penalização global → com ♠ led joga **Q♠** antes de 2♠ — **viola H11** (fixture + evaluator).

**Gap confirmado:**

```typescript
// HeartsPlayStrategy.ts — medium follow
return sorted[0]; // maior penalty → Q♠ mesmo com 2♠ legal in-suit
```

**Spec:**

- Se `ledSuit === 'spades'` e existem legais in-suit ♠:
  - Jogar **menor** ♠ in-suit (não Q♠ se houver alternativa).
- Off-suit (void ♠): manter dump H02 — slough Q♠/♥ se legal.
- **Hard** L50–56: alinhar — in-suit ♠ → **menor** rank in-suit, **não** maior penalização.

**Não confundir com H13:** H11 aplica quando trick **não é nosso** ou **tem pontos**; H13 é ramo separado §3.4.

## 3.4 Melhoria — H13 (limpar carta perigosa) — impl **#2**

**Spec v0 (conservadora — evitar ambiguidade):**

- **Gatilho:** `trick.length === 3` (último a jogar) **AND** `heartsTrickPoints(currentTrick) === 0` **AND** qualquer legal move **ganha** o trick (somos últimos).
- **Acção:** entre legais, se existir carta **perigosa** (`♥` ou Q♠), jogar a de **maior** `penaltyScore` (limpar bomba).
- Se nenhuma perigosa legal → comportamento H02/H11 normal.

**Duplicar** lógica mínima (não importar encoder):

```typescript
function isDangerousCard(c: Card): boolean {
  return c.suit === 'hearts' || (c.rank === 'Q' && c.suit === 'spades');
}
function heartsTrickPoints(trick: Card[]): number { /* ♥ + Q♠ */ }
```

**Alinhar** fixture H13 + `evaluateH13` (good = slough Q♠ em vaza ♣ nossa sem pontos).

**Nota fixture vs bot v0:** [`H13_FIXTURE`](../../frontend/src/cardIntelligence/fixtures/heartsFixtures.ts) usa `trickBefore` com **2** cartas (`playerIndex: 2`, 3.º jogador) — encoder infere `trickIsSafeAndPointless` via winner. **Bot v0** usa gatilho **§D11** (`currentTrick.length === 3` = **4.º** jogador). Testes **T2** seguem **§D11**, não o fixture literal; teste integração §4.3 pode usar fixture encoder offline.

**Defer v0.1:** «vaza nossa» antes do 4.º jogador (winner já definido com 2–3 cartas) — ambíguo; documentar gap §7.

## 3.5 Melhoria — H07 (+ H01) (evitar ganhar vaza penalizante) — impl **#3**

**Spec:**

- `trickPoints = heartsTrickPoints(currentTrick) > 0` **OR** led ♥ (quando ♥ broken).
- Se `wouldWinTrick(card)` para alguma legal:
  - Preferir legal que **não ganha** trick (`cardWouldWinTrickHearts` — sem trump, espelho `trickWinnerIndex` com trump `null`).
  - Entre non-winners, preferir **menor** penalização (não descartar Q♠ gratuitamente se trick ainda perdido).
- Se **só** winners disponíveis → jogar winner de **menor** penalização (min damage).

**Ordem de checks em follow:** **H13** (clean) → **H07** (avoid win) → **H11** (♠ in-suit) → **H02** (dump default).

**Invariante:** H13 e H07 **mutuamente exclusivos** (H13 exige trick sem pontos; H07 exige pontos ou risco ♥).

**Evaluator:** não existe `evaluateH07` — validação offline via **H01** + testes T1/T6; mencionar no relatório §8.

## 3.7 Pipeline follow unificado (`playFollow`) — medium + hard

**Decisão Q5:** extrair **uma** função partilhada; medium e hard diferem só em **lead** (hard non-♥).

```typescript
function playFollow(
  valid: number[],
  hand: Card[],
  state: GameState,
  playerIndex: number
): number {
  const trick = state.currentTrick;
  const leader = state.trickLeader ?? 0;
  const ledSuit = trick[0].suit;

  // 1) H13 — clean danger (4th player, 0 points)
  if (trick.length === 3 && heartsTrickPoints(trick) === 0) {
    const dangerous = valid.filter((i) => isDangerousCard(hand[i]));
    if (dangerous.length > 0) {
      return pickHighestPenaltyIndex(dangerous, hand);
    }
  }

  // 2) H07 — avoid winning penalizing trick
  if (heartsTrickPoints(trick) > 0 || (ledSuit === 'hearts' /* + heartsBroken if state available */)) {
    const nonWinners = valid.filter(
      (i) => !cardWouldWinTrickHearts(hand[i], trick, leader, playerIndex)
    );
    if (nonWinners.length > 0) return pickLowestPenaltyIndex(nonWinners, hand);
    return pickLowestPenaltyAmongWinners(valid, hand, trick, leader, playerIndex);
  }

  // 3) H11 — spades led in-suit: lowest spade, not Q♠ if alternative
  if (ledSuit === 'spades') {
    const inSuitSpades = valid.filter((i) => hand[i].suit === 'spades');
    if (inSuitSpades.length > 0) {
      return pickLowestRankIndex(inSuitSpades, hand); // not max penalty
    }
  }

  // 4) H02 — default dump highest penalty
  return pickHighestPenaltyIndex(valid, hand);
}
```

`playMedium` / `playHard` chamam `playFollow` no follow; **lead** mantém lógica actual (H03/H04).

## 3.8 O que já existe — não reimplementar

| Métrica | Acção |
|---------|-------|
| **H02** dump trick perdido | Manter off-suit / default após gates |
| **H03/H04/H08** lead baixo / non-♥ | Manter; testes T8 smoke |
| **H05/H06** pass | Inalterado v0 |

---

# 4. Testes

## 4.1 Expandir [`HeartsPlayStrategy.test.ts`](../../frontend/src/ai/games/hearts/HeartsPlayStrategy.test.ts)

| ID | Cenário | Métrica | Assert |
|----|---------|---------|--------|
| **T1** | Trick com ♥; 2♣ e A♥ legais; perder possível | H07/H01 | Joga 2♣ — **medium + hard** |
| **T2** | **4.º jogador:** `currentTrick.length === 3`, trick ♣ **sem pontos** (ex. A♣+4♣); Q♠ e 2♦ legais; qualquer carta ganha | H13 / **§D11** | Joga Q♠ — **medium + hard** |
| **T3** | ♠ led; Q♠ e 2♠ in-suit | H11 | Joga 2♠ — **medium + hard** |
| **T4** | ♣ led; void; Q♠ e 2♦ legais; trick perdido | H02 | Slough Q♠ (regressão dump) |
| **T5** | Lead; 2♣ e K♥; ♥ not forced | H03 | Lead 2♣ — **medium + hard** |
| **T6** | Trick ♥+♥; K♥ e 2♠ legais off-suit | H07 | Não ganhar com K♥ se 2♠ perde |
| **T7** | Easy — índice legal | — | regressão |
| **T8** | Hard lead — non-♥ se disponível | H04 smoke | regressão existente pattern |
| **T9** | Sem legais → -1 | — | regressão |
| **T10** | Medium/Hard sempre índice ∈ legal | T01 | loop hand sizes |

**Corrigir teste existente** «medium follow dumps Q♠ on ♣ lead» — **manter** como T4 (H02); **não** aplicar a ♠ led.

## 4.2 Pass (defer v0)

[`HeartsPassStrategy.test.ts`](../../frontend/src/ai/games/hearts/HeartsPassStrategy.test.ts) — **7 testes inalterados** v0.

## 4.3 Integração Card Intelligence (opcional **recomendado**)

```typescript
// HeartsPlayStrategy.metrics.test.ts — import evaluator só aqui
// H13 + H11 fixtures — bot state alinhado §D11 para H13
const h13 = getFixtureById('H13')!;
const h11 = getFixtureById('H11')!;
// synthetic state → chooseHeartsCard → evaluateDecision offline
```

**Regra:** zero import `cardIntelligence/evaluator` em `HeartsPlayStrategy.ts`.

## 4.4 Dev Lab smoke (LAB_H13 — evaluator baseline)

```javascript
await __ciScenarioReport('LAB_H13')
// H10 fixture — evaluator only; bot não implementa H10 v0
```

*Não confundir com checkpoint humano **§9 H15-OK**.*

---

# 5. Integração com Card Intelligence

| Uso | Permitido | Proibido |
|-----|-----------|----------|
| Fixtures H01/H11/H13 como spec | Sim | — |
| `LAB_H13` smoke manual | Sim | — |
| `evaluateDecision` em testes bot | Sim | — |
| Evaluator / `deriveMoonThreatLevel` no `chooseHeartsCard` | — | **Sim** |
| Logger / LLM live | Inalterado | Alterar jogada |

---

# 6. Critérios de sucesso

- [ ] Máx. 3 melhorias §3 (**H11, H13, H07** — ordem impl **§11 / D2**)
- [ ] `HeartsPlayStrategy.test.ts` T1–T10 verdes (+ regressões); T1–T3 em **medium e hard**
- [ ] `HeartsPassStrategy` **inalterado** v0
- [ ] **Não-goal v0:** H12 meninos; H09 moon no bot; «vaza nossa» antes do 4.º jogador
- [ ] `npm test` + `CI=true npm run build` verdes
- [ ] Bot joga sempre cartas legais
- [ ] Zero alteração motor/regras/UI/LLM live
- [ ] Easy intocado
- [ ] Grep: zero evaluator em `ai/` except `*.test.*`
- [ ] Relatório **§8** + checkpoint **§9 H15-OK**

---

# 7. Gaps (deferidos)

| Gap | Próximo passo |
|-----|---------------|
| **H10** bloquear shoot the moon | Hearts bot v2 (Tier B evaluator já existe) |
| **H09** detecção moon no bot | v2 — usar `deriveMoonThreatLevel` offline first |
| **H12** evitar meninos | Hearts v2 — ambíguo |
| **H14** forçar saída Q♠ | Hearts v2 |
| **H15** moon sacrifice score | Fora scope |
| **H07** sem `evaluateH07` | Validar via H01 + testes unitários; documentar relatório §8 |
| H13 fixture 2 cartas vs bot 4.º jogador | Encoder offline ≠ hot path; T2 usa §D11 |
| H13 «vaza nossa» com 2–3 cartas (não 4.º jogador) | v0.1 |
| Pass phase (H05 fino) | Impl separada se necessário |
| Memory / LLM live | Offline only |
| **King** bot | Impl 16+ |
| Sueca v2 **S23** / Spades v2 **escola** | Impl 13/14 relatórios |
| **Cartas altas guardadas** (desfazer perigo cedo) | **H15-OK** smoke — Hearts v2; conflito H11 vs slough agressivo |

---

# 8. Relatório final esperado (pós-código)

Criar [`docs/ai/implementation-reports/IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE_REPORT.md`](../implementation-reports/IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE_REPORT.md):

```markdown
# IMPLEMENTATION_15_HEARTS_BOT_METRICS_UPGRADE — Relatório final

## Ficheiros criados / alterados
## Métricas implementadas (H11, H13, H07)
## Métricas já existentes confirmadas (H02, H03, H04, H05 pass)
## Testes executados + contagens
## Antes/depois por métrica
## Validação evaluator offline (se aplicável)
## Nota: sem evaluateH07 — H07 validado via H01 + testes T1/T6
## Confirmação zero regras / zero LLM live / zero evaluator hot path
## Gaps §7
## Checkpoints — H15-OK: OK | Pendente
## Próximos passos (Hearts v2 H10 / King)
```

---

# 9. Checkpoint H15 (humano)

**Pré-requisito:** H14 OK — não re-validar Spades aqui.

## 9.1 CI (obrigatório)

```bash
cd frontend
npm test -- --testPathPattern=HeartsPlayStrategy --watchAll=false
npm test -- --testPathPattern=HeartsPassStrategy --watchAll=false
CI=true npm run build
```

## 9.2 Smoke manual (recomendado — não exaustivo)

Partida Hearts **Medium ou Hard**:

- [ ] **Não** apanha pontos sem necessidade (H07/H01)
- [ ] **Q♠** tratada como perigo — não jogada à toa em ♠ led (H11)
- [ ] Limpa carta perigosa quando vaza **sem pontos** é claramente nossa (H13)
- [ ] Jogo normal sem erros / cartas ilegais

**Não** exigir validar moon block (H10), meninos (H12), ou pass strategy manualmente.

## 9.3 Assinatura

Relatório Impl 15: `**H15-OK:** OK — YYYY-MM-DD` *(checkpoint humano Impl 15 — não métrica H15 moon)*

---

# 10. Ficheiros

## 10.1 Criar (provável)

| Ficheiro | Função |
|----------|--------|
| `ai/games/hearts/heartsTrickHelpers.ts` | penalty, dangerous, trick points, wouldWin, H11/H13/H07 helpers |
| `ai/games/hearts/heartsTrickHelpers.test.ts` | helpers unitários |
| `ai/games/hearts/HeartsPlayStrategy.metrics.test.ts` | **Opcional** — evaluator offline |

## 10.2 Alterar (mínimo)

| Ficheiro | Alteração |
|----------|-----------|
| [`HeartsPlayStrategy.ts`](../../frontend/src/ai/games/hearts/HeartsPlayStrategy.ts) | H11, H13, H07 |
| [`HeartsPlayStrategy.test.ts`](../../frontend/src/ai/games/hearts/HeartsPlayStrategy.test.ts) | T1–T10 |

## 10.3 Não alterar

- [`HeartsGame.ts`](../../frontend/src/models/games/HeartsGame.ts)
- [`HeartsPassStrategy.ts`](../../frontend/src/ai/games/hearts/HeartsPassStrategy.ts) — v0 default
- `cardIntelligence/**` runtime
- Outros jogos / LLM / UI

---

# 11. Ordem de implementação (**D2**)

1. `heartsTrickHelpers.ts` + testes helpers
2. **`playFollow(...)`** partilhado medium/hard — §3.7
3. **H11** ♠ led in-suit low (dentro playFollow)
4. **H13** clean dangerous (`trick.length === 3`) — §D11
5. **H07** avoid winning penalizing tricks
6. Expandir `HeartsPlayStrategy.test.ts` T1–T10
7. (Recomendado) `HeartsPlayStrategy.metrics.test.ts` — H11/H13 fixtures
8. Relatório **§8** + checkpoint **§9 H15-OK**

---

# 12. CI e grep

```bash
cd frontend
npm test -- --testPathPattern=ai/games/hearts --watchAll=false
npm test -- --testPathPattern=cardIntelligence --watchAll=false
CI=true npm run build
```

```bash
rg "evaluateDecision|getMiniLLMAdvice|deriveMoonThreatLevel" frontend/src/ai --glob '!**/*.test.*'
rg "cardIntelligence/evaluator" frontend/src/models/games
```

Esperado: **zero** fora testes.

---

# 13. Riscos

| Risco | Mitigação |
|-------|-----------|
| H13 vs H07 ordem | H13 primeiro (0 points); H07 só se points > 0 |
| H11 vs H02 off-suit | H11 só in-suit ♠; off-suit mantém dump Q♠ |
| H13 «inevitavelmente nossa» ambíguo | v0: só `trick.length === 3`; gap §7 |
| Duplicar trick logic | Helpers alinhados `standardTrickWinnerIndex` (trump null) |
| Regressão lead | T5/T8 smoke H03/H04 |
| Medium/hard follow divergem | **`playFollow` único** §3.7 / D13 |
| Pass scope creep | Defer H05 v0 |

---

# 14. Decisões D1–D12

| ID | Decisão |
|----|---------|
| **D1** | Jogo único v0: **Hearts** Medium/Hard **play** |
| **D2** | Máx. **3**: **H11, H13, H07** (ordem impl: H11 → H13 → H07) |
| **D3** | **Easy** intocado |
| **D4** | H02/H03 base **existe** — gates antes do dump default |
| **D5** | **Pass defer** v0 — H05/H06 já OK |
| **D6** | **H10/H09 moon defer** Hearts v2 |
| **D7** | **H12 meninos** fora scope |
| **D8** | `heartsTrickHelpers.ts` se >25 linhas duplicadas |
| **D9** | Não alterar `HeartsGame.ts` |
| **D10** | Padrão Impl 14 — helpers + testes + relatório |
| **D11** | H13 gatilho v0: `trick.length === 3` + 0 points |
| **D12** | Expandir testes play; pass suite inalterada |
| **D13** | **`playFollow` partilhado** medium/hard — §3.7 |

---

# 15. Dúvidas Q1–Q10

| ID | Tema | Resolução v1 |
|----|------|--------------|
| **Q1** | H13 «vaza nossa» sem ser último jogador | **Defer v0.1** — só 4.º jogador; encoder usa winner+partner (bot não importa encoder) |
| **Q2** | Alterar pass H05? | **Defer** — 7 testes pass verdes; risco isolado |
| **Q3** | H09 moon alert simples no bot? | **Fora v0** — encoder offline; Hearts v2 |
| **Q4** | Import `heartsEncoder` / `historySelectors`? | **Não** — duplicar mínimo em `ai/hearts/` |
| **Q5** | Medium vs Hard divergência | **`playFollow` único** §3.7; lead hard non-♥ separado |
| **Q6** | Teste actual «dump Q♠ on ♣ follow» | **Manter** como T4 H02 — corrigir só ♠ led |
| **Q7** | H07 quando led ♥ first trick | Respeitar motor `canPlayCard`; testes com adapter mock |
| **Q8** | `penaltyScore` duplicado play/pass | OK duplicar em helpers play; pass intocado |
| **Q9** | LAB_H13 replay bot | Opcional teste integração |
| **Q10** | Colisão IDs H15 / H14 | **H15-OK** = checkpoint Impl 15 §9; **H15** = métrica moon; **H14** Spades = checkpoint Impl 14; **H14** Hearts = métrica forçar Q♠ |

---

# 16. Metadados

## Referências

- [IMPLEMENTATION_PLAN_AI.md](../IMPLEMENTATION_PLAN_AI.md)
- [CARD_INTELLIGENCE_STATUS_REPORT.md](../CARD_INTELLIGENCE_STATUS_REPORT.md)
- [ROADMAP_AI.md](../ROADMAP_AI.md)
- [FASE_1_METRICAS.md](../FASE_1_METRICAS.md) §Hearts
- [FASE_2A_PRIORIDADES_METRICAS.md](../FASE_2A_PRIORIDADES_METRICAS.md) §Hearts P0
- [IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE_REPORT.md](../implementation-reports/IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE_REPORT.md) — modelo + H14 OK
- [IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE_PROMPT.md](./IMPLEMENTATION_14_SPADES_BOT_METRICS_UPGRADE_PROMPT.md) — estrutura

## Histórico

| Versão | Data | Nota |
|--------|------|------|
| 1.0 | 2026-06-06 | Prompt inicial pós-H14; Hearts H11/H13/H07; inventário + gaps código |
| 1.1 | 2026-06-06 | Review: §3.7 playFollow; §D11/T2; H15-OK naming; aprovada para impl |
| — | 2026-06-06 | **H15-OK parcial** — smoke; gap cartas altas guardadas → Hearts v2 (relatório Impl 15) |

---

**Fim da prompt v1.1 — pronta para Agent mode (Impl 15).**
