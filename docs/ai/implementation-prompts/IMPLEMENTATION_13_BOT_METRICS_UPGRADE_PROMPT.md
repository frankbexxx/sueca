# IMPLEMENTATION_13_BOT_METRICS_UPGRADE — Prompt de implementação

**ID:** `IMPLEMENTATION_13_BOT_METRICS_UPGRADE`  
**Plano pai:** [IMPLEMENTATION_PLAN_AI.md](../IMPLEMENTATION_PLAN_AI.md) v1.4+ — próximo bloco pós-Impl 12 + **H12A OK**  
**Design base:** [FASE_1_METRICAS.md](../FASE_1_METRICAS.md) · [FASE_2A_PRIORIDADES_METRICAS.md](../FASE_2A_PRIORIDADES_METRICAS.md) · [FASE_2B_FIXTURES_METRICAS.md](../FASE_2B_FIXTURES_METRICAS.md) · [FASE_5_AVALIADOR_DESIGN.md](../FASE_5_AVALIADOR_DESIGN.md)  
**Status report:** [CARD_INTELLIGENCE_STATUS_REPORT.md](../CARD_INTELLIGENCE_STATUS_REPORT.md) · [ROADMAP_COMPLIANCE_REVIEW.md](../reviews/ROADMAP_COMPLIANCE_REVIEW.md) · [TECHNICAL_INTEGRITY_REVIEW.md](../reviews/TECHNICAL_INTEGRITY_REVIEW.md)  
**Pré-requisitos:** [IMPLEMENTATION_5_EVALUATOR_V0_REPORT.md](../implementation-reports/IMPLEMENTATION_5_EVALUATOR_V0_REPORT.md) · [IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md](../implementation-reports/IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md) · [IMPLEMENTATION_12_LLM_PROVIDER_ADVISORY_REPORT.md](../implementation-reports/IMPLEMENTATION_12_LLM_PROVIDER_ADVISORY_REPORT.md) — **H12A OK** 2026-06-06 recomendado  
**Código base:** [`frontend/src/ai/`](../../frontend/src/ai/) · [`frontend/src/cardIntelligence/`](../../frontend/src/cardIntelligence/) · [`frontend/src/models/games/SuecaGame.ts`](../../frontend/src/models/games/SuecaGame.ts)  
**Data:** 2026-06-06  
**Scope desta prompt:** guia **executável** para melhoria **controlada** do bot Sueca (Medium/Hard) com métricas validadas — **não implementar neste passo documental**.

**Tipo de documento:** prompt de **implementação** (Agent mode) — não é relatório de estado; relatório pós-código em **§14**.

**Mapa de secções:**

| § | Conteúdo |
|---|----------|
| §1 | Inventário bot Sueca actual |
| §2 | Mapeamento métrica → código |
| §3 | Escopo exacto v0 (máx. 3 melhorias) |
| §4 | Testes |
| §5 | Integração Card Intelligence (offline only) |
| §6 | Critérios de sucesso |
| §7 | Gaps |
| §8 | Relatório final esperado (pós-código) |
| §9–§12 | Ficheiros, ordem impl, CI, riscos |
| §13 | Decisões D1–D12 |
| **§14** | Template relatório Impl 13 |
| **§15** | Checkpoint H13 (humano) |
| **§16** | Dúvidas Q1–Q10 |
| **§17** | Metadados |

**Posicionamento no roadmap:**

```
Impl 1–12 (fechados) → Impl 13 Bot Metrics Upgrade (Sueca v0) → Sueca v2 / outros jogos → LLM decision assist (futuro)
```

**Princípio central:** **Melhorar** decisões locais com métricas já validadas — **não** substituir bots, **não** LLM a jogar, **não** alterar regras/motores/UI.

| Camada | Papel | Impl 13 |
|--------|-------|---------|
| Card Intelligence | Juiz offline + fixtures | **Validação** pós-mudança bot |
| `SuecaStrategy` | Heurística gameplay | **Alvo** das melhorias |
| Mini-LLM | Conselheiro debug | **Fora** — zero live |
| Motores `*Game.ts` | Regras | **Intocável** |

**Checkpoint humano H13:** pós-Impl 13 — partida Sueca Medium/Hard + testes verdes + evaluator offline confirma métricas alvo; **zero** LLM live; **zero** alteração regras.

**Gates:**

| Fase | Bloqueio |
|------|----------|
| Redigir/ler esta prompt | **Nenhum** |
| Implementar código Impl 13 | **H12A OK recomendado** |
| Checkpoint H13 | Depois de CI verde + relatório Impl 13 |

**Supersede F1 §Alinhar código:** F1 lista gaps S04/S05/S08 — **Impl 13 v0** implementa subconjunto §3 (máx. 3), não rewrite completo.

**Supersede plano-mãe «melhoria bots»:** primeiro bloco = **Sueca Medium/Hard only**; Spades/Hearts/King = Impl 14+.

---

## Instruções para o agente implementador

1. Confirmar **H12A OK**; ler §1–§3 desta prompt + FASE_1 Sueca + fixtures S08/S16/S19.
2. Implementar **apenas** §3 (máx. 3 melhorias); recusar §7 (fora de scope).
3. **Zero** alteração em `*Game.ts` (motores), scoring, UI, `GameBoard` flow, `playWithLogging`, LLM, memory live, evaluator hot path.
4. Cada mudança **mapeia** a métrica documentada (§2); cada mudança tem **teste** (§4).
5. Mudanças **pequenas e reversíveis** — preferir helpers em `sueca/` a refactor global.
6. Se regra **ambígua** → **não implementar**; documentar gap §7.
7. **Easy** bot: manter comportamento actual (randomness) — **não** regredir §D3.
8. Usar `state.playedCards` + `CARD_HIERARCHY` — **não** duplicar lógica do encoder; alinhar com evaluator quando possível.
9. Testes bot: criar [`SuecaStrategy.test.ts`](../../frontend/src/ai/games/sueca/SuecaStrategy.test.ts) (padrão [`SpadesPlayStrategy.test.ts`](../../frontend/src/ai/games/spades/SpadesPlayStrategy.test.ts)).
10. Validação CI offline: `evaluateDecision` + fixtureId nos testes de integração **opcional** §4.3.
11. CI: §11 + grep §11.3 — **zero** import `cardIntelligence/evaluator` no hot path gameplay.
12. Relatório **§14**; H13 **§15**.

---

# 1. Inventário do bot Sueca actual

## 1.1 Onde está a AI

| Camada | Ficheiro | Função |
|--------|----------|--------|
| Estratégia Sueca | [`frontend/src/ai/games/sueca/SuecaStrategy.ts`](../../frontend/src/ai/games/sueca/SuecaStrategy.ts) | `chooseSuecaCard`, helpers parceiro/probabilidade |
| Adapter jogo | [`frontend/src/models/games/SuecaGame.ts`](../../frontend/src/models/games/SuecaGame.ts) | `chooseAICard` → `getLegalIndices` + `chooseSuecaCard` |
| Motor legado | [`frontend/src/models/Game.ts`](../../frontend/src/models/Game.ts) | `chooseAICard` duplicado (mesma strategy) — **não** alterar motor salvo bugfix |
| Perfil dificuldade | [`frontend/src/ai/core/DifficultyProfile.ts`](../../frontend/src/ai/core/DifficultyProfile.ts) | easy/medium/hard flags |
| Legal moves | [`frontend/src/ai/core/LegalMoveFilter.ts`](../../frontend/src/ai/core/LegalMoveFilter.ts) | `getLegalIndices` |
| Fallback | [`frontend/src/ai/core/FallbackMoveSelector.ts`](../../frontend/src/ai/core/FallbackMoveSelector.ts) | 1.ª legal (GameBoard path) |
| AI externa | [`frontend/src/services/aiClient.ts`](../../frontend/src/services/aiClient.ts) | HTTP Sueca Hard se `USE_LOCAL_AI_ONLY=false` |
| Hot path escolha | [`frontend/src/components/GameBoard.tsx`](../../frontend/src/components/GameBoard.tsx) | `tryExternal()` → `gameAdapter.chooseAICard()` → fallback |

**Nota:** `SuecaStrategy.test.ts` **não existe** hoje — criar na Impl 13.

## 1.2 Easy / Medium / Hard

| Difficulty | Comportamento (`SuecaStrategy.ts`) | Profile |
|------------|-----------------------------------|---------|
| **easy** | 70% entre 3 cartas mais baixas; 30% random | `usesCardTracking: false`, `usesPartnerSignals: false` |
| **medium** | Heurística lead/follow completa | idem |
| **hard** | medium + `calculateWinProbability` + sinais parceiro | `usesCardTracking: true`, `usesPartnerSignals: true` |

**Escopo Impl 13:** melhorias em **medium + hard** only (§D3). Easy intocado.

## 1.3 Fluxo escolha carta

```
GameBoard.chooseAndPlay
  → tryExternal (sueca hard + !USE_LOCAL_AI_ONLY) → aiClient
  → SuecaGame.chooseAICard
      → getLegalIndices (LegalMoveFilter)
      → chooseSuecaCard(state, playerIndex, ctx)
  → playCardAndLogDecision (Card Intelligence logger only)
```

## 1.4 AI externa / fallback

| Path | Condição | Notas |
|------|----------|-------|
| Externa | `!USE_LOCAL_AI_ONLY` + sueca + hard | Subordinada; falha → local |
| Local | `chooseSuecaCard` | **Alvo Impl 13** |
| Fallback | 1.ª legal válida | Inalterado |

**Regra Impl 13:** não alterar ordem externa → local → fallback.

## 1.5 legalMoves

- Runtime: `ctx.getValidCards` filtra índices legais via adapter/`Game.isValidCard`.
- Card Intelligence: `legalMoves` no log event — **não** usar evaluator para filtrar jogada live.

## 1.6 Heurísticas existentes (resumo código)

### Liderança (`trick.length === 0`)

- Score por carta: `rankValue * 2 + suitCount`; **bónus +5** se trunfo longo (`suitCount > 3`) — **gap S05**.
- Hard: bónus extra trunfo longo + K+.
- Sinais parceiro (hard): `need_trump` → lead trunfo.

### Seguimento

- Parceiro a liderar (hard + signals): min/max winner conforme `need_help`.
- Seguir naipe: winner **mínimo** entre candidatos (`reduce` menor rank) — **parcial S08**.
- Cortar: trunfo **mínimo** vencedor — **parcial S12** (linhas 248–256).
- Void sem trunfo no trick: trunfo baixo (< K) — ok.
- Descarte: carta mais baixa off-suit — **parcial S15**.

### Ausente / gap

- **S16:** sem filtro «não abrir 7/manilha antes do Ás».
- **S19/T05:** sem regra global «parceiro a ganhar vaza → não subir» (só ramo signals hard).
- **S25:** sem destrunfar consciente parceiro void.
- **S04:** sem preferência explícita singleton side suit.
- **S05:** código **favorece** puxar trunfo cedo — **não** corrigir v0 salvo D11.

## 1.7 Métricas Fase 1 / evaluator já implementadas (Sueca P0)

Fixtures: [`suecaFixtures.ts`](../../frontend/src/cardIntelligence/fixtures/suecaFixtures.ts) — S08, S16, S19, S12, S25 (+ outros).

Evaluator: [`metricEvaluators.ts`](../../frontend/src/cardIntelligence/evaluator/metricEvaluators.ts) — `evaluateS08`, `S12`, `S16`, `S19`, `S25`, `T04` (alias S08).

Dev Lab: `LAB_S16` em [`presetScenarios.ts`](../../frontend/src/cardIntelligence/devLab/presetScenarios.ts).

---

# 2. Mapeamento métrica → código

| Métrica humana | ID | No bot? | Ficheiro / zona | Risco | Impl 13? |
|----------------|-----|---------|-----------------|-------|----------|
| Não abrir manilha antes do Ás | **S16** | **Não** | Lead scoring L156–186 | Baixo | **Sim (#1)** |
| Ganhar com carta mínima (desejável) | **S08** / T04 | **Parcial** | Follow winners L232–241 | Médio | **Sim (#2)** |
| Pontos ao parceiro / vaza segura | **S19** / T05 | **Parcial** | Partner branch L209–230; follow geral | Médio | **Sim (#3)** |
| Cortar trunfo mínimo | **S12** | **Parcial** | L248–256 | Baixo | **Não v0** — já adequado |
| Não puxar trunfo cedo | **S05** | **Gap (inverso)** | L178 `score += 5` | Alto | **Não v0** — §7 |
| Singleton / criar corte | **S04** | **Parcial** | Lead score suitCount | Médio | **Não v0** — ambíguo |
| Destrunfar sem prejudicar parceiro | **S25** | **Não** | — | Alto | **Não v0** — Tier B partial |
| Seguir baixo | **S11** | **Sim** | L243–245 descarte lead suit | Baixo | Existente |
| Descarte off-suit mínimo | **S15** | **Sim** | L275–278 | Baixo | Existente |
| Memória Áses/7s | **S10** | **Parcial** | `playedCards` disponível; não usado lead | Médio | v2 |
| Sinais parceiro | **S17–S18** | **Hard only** | signals L160–168, 209–230 | Médio | Manter; não expandir v0 |
| AI externa válida | **T02** | Legado | aiClient + GameBoard | — | Fora scope |

---

# 3. Escopo exacto da implementação futura

## 3.1 Dentro do scope (v0)

| # | Entrega |
|---|---------|
| 1 | **S16** — bloquear lead com 7/manilha enquanto Ás do naipe não visto em `playedCards` |
| 2 | **S08** — ao **intencionalmente** ganhar trick, escolher **menor** carta vencedora legal (medium+hard) |
| 3 | **S19/T05** — quando **parceiro já ganha** trick actual, jogar carta que **não rouba** vaza (medium+hard) |
| 4 | Testes unitários `SuecaStrategy.test.ts` por melhoria |
| 5 | (Opcional) teste integração evaluator offline por fixtureId |

## 3.2 Fora do scope (proibido v0)

| Item | Motivo |
|------|--------|
| Spades / Hearts / King bots | Impl 14+ |
| LLM / decision assist / Ollama gameplay | Impl 12 advisory only |
| Rewriting `SuecaStrategy` inteiro | Risco regressão |
| Alterar `SuecaGame.ts`, `Game.ts`, motores scoring | Regra utilizador |
| Alterar UI / GameBoard flow | Fora scope |
| Memory live / ingest automático | Offline only |
| Evaluator no hot path | Proibido F5 |
| S05 anti-trump-lead | Risco alto — Sueca v2 |
| S25 destrunfar | Tier B partial; ambíguo |
| S04 singleton lead | Ambíguo sem encoder parity |
| Easy bot heuristics | Regressão intencional |

## 3.3 Melhoria #1 — S16 (não abrir manilha antes do Ás)

**Spec:**

- Fase: **lead** (`currentTrick.length === 0`).
- Para cada carta legal rank `7` (manilha de naipe):
  - Se **Ás desse naipe** não está em `state.playedCards` → **excluir** do pool de lead (ou penalizar score → −∞).
- **Excepção v0:** **não** implementar inferência parceiro com Ás (F1 média) — gap documentado.
- Alinhar teste com fixture **S16** (`sevenD` + lead `d4` not `7♦`).

**Nota Q1:** evaluator S16 hoje foca **7♦** (manilha fixa Suecão). Bot deve tratar **todos os 7** por naipe OU alinhar explicitamente com regra produto — ver §16 Q1.

**Helper sugerido:** `isSevenLeadBlocked(state, card): boolean`.

## 3.4 Melhoria #2 — S08 (ganhar com carta mínima)

**Spec:**

- Fase: **follow** quando bot **quer ganhar** (pool `winningLeadCards` ou `winningTrumps` não vazio).
- Escolher `min rank` entre cartas que **ganham** trick (já parcialmente feito L239–241).
- **Não** ganhar se parceiro já ganha — delegar a #3.
- **Não** modelar `cutRisk` v0 (evaluator → partial) — gap §7.

**Regressão:** garantir que ainda ganha quando necessário (não descer abaixo winner threshold).

## 3.5 Melhoria #3 — S19 / T05 (não roubar parceiro)

**Spec:**

- Detectar **vencedor actual** do trick (trunfo > naipe led > ordem).
- Se vencedor é **parceiro** (`getPartnerIndex`):
  - Filtrar cartas legais que **não ganhariam** trick.
  - Se existir descarte perdedor → jogar **menor** rank entre essas.
  - Se **só** cartas ganhadoras (ex.: forced win) → jogar **menor** ganhador (medium) ou manter hard signals — ver D6.
- Aplicar **medium + hard** (não depender só de `usesPartnerSignals`).

**Helper sugerido:** `currentTrickWinnerIndex(state)`, `cardWouldWinTrick(...)` — reutilizar lógica de [`evalHelpers.ts`](../../frontend/src/cardIntelligence/evaluator/evalHelpers.ts) **não** importar no runtime bot (duplicar mínimo ou extrair para `ai/core/trickWinner.ts` **só se** >30 linhas — §D8).

## 3.6 O que fica de fora porque já existe

| Métrica | Estado |
|---------|--------|
| **S12** | Trunfo mínimo vencedor já em L248–256 — validar com teste; **não** reimplementar |
| **S11/S15** | Descarte baixo — smoke test only |

---

# 4. Testes

## 4.1 Estrutura

Criar [`frontend/src/ai/games/sueca/SuecaStrategy.test.ts`](../../frontend/src/ai/games/sueca/SuecaStrategy.test.ts):

- Padrão: [`SpadesPlayStrategy.test.ts`](../../frontend/src/ai/games/spades/SpadesPlayStrategy.test.ts).
- Helpers locais: `makeState`, `makeCtx`, `makeCard`.
- **Sempre** assert índice retornado ∈ legal indices.

## 4.2 Casos mínimos (T1–T10)

| ID | Cenário | Métrica | Assert |
|----|---------|---------|--------|
| **T1** | Lead: 7♦ + 4♦ legal; Ás ♦ não saiu | S16 | Não escolhe 7♦ |
| **T2** | Lead: 7♦ legal; Ás ♦ em `playedCards` | S16 | 7♦ permitido |
| **T3** | Follow: pode ganhar com 9 ou K; quer ganhar | S08 | Escolhe 9 |
| **T4** | Follow: parceiro ganha com A; K e 2 legais | S19 | Escolhe 2 (não rouba) |
| **T5** | Follow: cortar 6♣ vs A♣ trunfo; só 6♣ ganha | S12 smoke | 6♣ (regressão) |
| **T6** | Easy: random path | — | Índice legal (sem crash) |
| **T7** | Medium: lead não escolhe illegal index | T01 | `-1` ou legal |
| **T8** | Hard: partner winning → low card | S19 | Não sobe K sobre parceiro |
| **T9** | Empty legal → -1 | — | `-1` |
| **T10** | Regressão: trick vazio lead returns legal | — | index ≥ 0 |

## 4.3 Integração Card Intelligence (offline — opcional recomendado)

Ficheiro: `SuecaStrategy.metrics.test.ts` ou bloco no mesmo test file:

```typescript
import { getFixtureById } from '../../../cardIntelligence/fixtures';
import { encodeDecisionState } from '../../../cardIntelligence/encoder/encodeDecisionState';
import { evaluateDecision } from '../../../cardIntelligence/evaluator';

// Construir GameState a partir fixture → chooseSuecaCard → evaluateDecision offline
// Assert metric S16/S08/S19 classification !== 'bad' para escolha bot
```

**Regra:** import evaluator **só em testes** — nunca em `SuecaStrategy.ts`.

## 4.4 Dev Lab (smoke manual H13)

```javascript
await __ciScenarioReport('LAB_S16')  // evaluator baseline
// Após bot change: replay synthetic — documentar no relatório
```

---

# 5. Integração com Card Intelligence

| Uso | Permitido v0 | Proibido |
|-----|--------------|----------|
| Fixtures S08/S16/S19 como spec | Sim | — |
| `evaluateDecision` em **testes** | Sim | — |
| `evaluateDecision` em `chooseSuecaCard` | — | **Sim** |
| Logger pós-jogada | Inalterado | Bloquear jogada |
| LLM advisory | — | **Sim** live |
| Memory aggregates | — | Live influence |

**Fluxo validação pós-impl:**

```
Fixture / synthetic state → chooseSuecaCard → chosenCard
  → encodeDecisionState (test) → evaluateDecision → metric S16/S08/S19 !== bad
```

---

# 6. Critérios de sucesso

- [ ] Máx. 3 melhorias §3 implementadas com mapeamento §2
- [ ] `SuecaStrategy.test.ts` T1–T10 verdes
- [ ] `npm test` + `CI=true npm run build` verdes
- [ ] Bot joga **sempre** cartas legais
- [ ] **Zero** alteração motores/regras/UI/LLM live
- [ ] Easy behaviour unchanged
- [ ] Grep: zero `cardIntelligence/evaluator` em `ai/` (except tests)
- [ ] Relatório §14 + H13 §15

---

# 7. Gaps (deferidos)

| Gap | Motivo | Próximo passo |
|-----|--------|---------------|
| **S05** anti-puxar trunfo | Lead score favorece trunfo longo; regressão alta | Sueca bot v2 |
| **S04** singleton lead | Ambíguo sem void inference | v2 + encoder |
| **S25** destrunfar | Tier B partial; void parceiro | Hard v2 |
| **S08 cutRisk** | Encoder partial | Quando encoder tiver cutRisk fiável |
| **S16** inferência Ás parceiro | F1 média | Hard v2 |
| **Spades/Hearts/King** | Scope | Impl 14+ |
| **AI externa** | Legado T02 | Manter subordinada |
| **Memory / LLM live** | Roadmap | Offline only |
| **Evaluator runtime** | F5 | Proibido |

---

# 8. Relatório final esperado (pós-código)

Criar [`docs/ai/implementation-reports/IMPLEMENTATION_13_BOT_METRICS_UPGRADE_REPORT.md`](../implementation-reports/IMPLEMENTATION_13_BOT_METRICS_UPGRADE_REPORT.md):

```markdown
# IMPLEMENTATION_13_BOT_METRICS_UPGRADE — Relatório final

## Ficheiros alterados
## Métricas implementadas (S16, S08, S19)
## Métricas já existentes confirmadas (S12, S11, S15)
## Testes criados + contagens
## Antes/depois (por métrica)
## Validação evaluator offline (fixtures)
## Confirmação zero regras / zero LLM live / zero evaluator hot path
## Gaps §7
## Checkpoints — H13: OK | Pendente
## Próximos passos (Sueca v2 / Spades)
```

---

# 9. Ficheiros

## 9.1 Criar

| Ficheiro | Função |
|----------|--------|
| `ai/games/sueca/SuecaStrategy.test.ts` | T1–T10 |
| `ai/games/sueca/suecaTrickHelpers.ts` | **Opcional** — winner detection partilhado (D8) |

## 9.2 Alterar (mínimo)

| Ficheiro | Alteração |
|----------|-----------|
| [`SuecaStrategy.ts`](../../frontend/src/ai/games/sueca/SuecaStrategy.ts) | S16, S08, S19/T05 |

## 9.3 Não alterar

- `models/games/SuecaGame.ts` (salvo bugfix documentado)
- `models/Game.ts`, `GameBoard.tsx`, `playWithLogging.ts`
- `cardIntelligence/**` (salvo testes opcionais)
- `*PlayStrategy` outros jogos
- `aiClient.ts`, motores scoring

---

# 10. Ordem de implementação (D12)

1. Helpers winner / ace-seen (se necessário)
2. **S16** lead filter + T1–T2
3. **S19** partner-not-steal + T4, T8
4. **S08** tighten min winner + T3
5. Regressão T5–T10 + smoke S12
6. (Opcional) evaluator integration tests
7. Relatório §14 + H13

---

# 11. CI e grep

```bash
cd frontend
npm test -- --testPathPattern=ai/games/sueca --watchAll=false
npm test -- --testPathPattern=cardIntelligence --watchAll=false
CI=true npm run build
```

**Grep hot path:**

```bash
rg "evaluateDecision|getMiniLLMAdvice" frontend/src/ai --glob '!**/*.test.*'
rg "cardIntelligence/evaluator" frontend/src/models frontend/src/components
```

Esperado: **zero** (evaluator só em tests).

---

# 12. Riscos

| Risco | Mitigação |
|-------|-----------|
| Regressão lead strength | S16 só filtra 7; resto scoring intacto |
| Parceiro steal edge cases | T4/T8; forced win → min winner |
| Duplicar trick logic | Helper partilhado ou copy mínima documentada |
| S16 vs manilha fixa 7♦ | Fechar Q1 antes de codar |
| Scope creep outros jogos | §3.2 + review |

---

# 13. Decisões D1–D12

| ID | Decisão |
|----|---------|
| **D1** | Jogo único v0: **Sueca** Medium/Hard |
| **D2** | Máx. **3** melhorias: **S16, S19, S08** (ordem impl: S16 → S19 → S08) |
| **D3** | **Easy** intocado |
| **D4** | **S12** confirmar teste; não reimplementar |
| **D5** | **S05/S25/S04** fora v0 |
| **D6** | S19 medium+hard **sem** depender signals; hard signals mantidos |
| **D7** | Evaluator **offline/tests only** |
| **D8** | Helper `suecaTrickHelpers.ts` se winner logic > ~25 linhas |
| **D9** | Não alterar `SuecaGame.ts` v0 |
| **D10** | AI externa path inalterado |
| **D11** | Não inverter bónus trunfo lead (S05) nesta impl |
| **D12** | Ordem: helpers → S16 → S19 → S08 → tests → relatório |

---

# 14. Template relatório (referência §8)

Ver §8 — entregar após código.

---

# 15. Checkpoint H13 (humano)

**Pré-requisito:** H12A OK — não re-validar LLM aqui.

## 15.1 Arranque

Jogo normal Sueca Medium ou Hard (local AI). **Sem** flags Card Intelligence obrigatórias.

## 15.2 Checklist

- [ ] Partida completa sem erros / cartas ilegais
- [ ] Bot não abre 7 com Ás do naipe ainda por sair (observação mesa)
- [ ] Bot descarta baixo quando parceiro leva vaza
- [ ] Bot não usa carta alta desnecessária para ganhar trick barato
- [ ] `npm test -- --testPathPattern=SuecaStrategy` verde
- [ ] Prod build OK
- [ ] Zero LLM / evaluator no gameplay

## 15.3 Assinatura

`**H13:** OK — YYYY-MM-DD` no relatório Impl 13.

---

# 16. Dúvidas documentadas

| ID | Tema | Resolução v1 |
|----|------|--------------|
| **Q1** | S16: 7♦ fixo vs 7 por naipe | **Abrir na impl** — alinhar evaluator (`sevenD`) + F1; preferir **7 por naipe + Ás por naipe** se produto acordar |
| **Q2** | Extrair trick winner para `ai/core/` | **D8** — só se duplicação >25 linhas |
| **Q3** | Teste integração evaluator no bot test | **Recomendado** §4.3; não obrigatório fecho |
| **Q4** | Hard signals vs S19 global | **D6** — S19 base medium; signals hard mantêm ramos existentes |
| **Q5** | `Game.ts` vs `SuecaGame.ts` duplicate | **Não** unificar v0 — mesma strategy function |
| **Q6** | LAB_S16 replay bot | Smoke manual H13 |
| **Q7** | S08 quando cutRisk partial | Não modelar v0 |
| **Q8** | Commit Easy regression | T6 only |
| **Q9** | Spades next | Impl 14 prompt separada |
| **Q10** | H13 vs CI | CI obrigatório; H13 observação mesa recomendada |
| **Q11** | S23 «putos à escola» — Rei por defeito | **Fechado pós-H13** — preferir carta intermédia/alta controlada; Sueca v2 (relatório Impl 13) |

---

# 17. Metadados

## Referências

- [IMPLEMENTATION_PLAN_AI.md](../IMPLEMENTATION_PLAN_AI.md)
- [CARD_INTELLIGENCE_STATUS_REPORT.md](../CARD_INTELLIGENCE_STATUS_REPORT.md)
- [ROADMAP_AI.md](../ROADMAP_AI.md)
- [FASE_1_METRICAS.md](../FASE_1_METRICAS.md) §Sueca
- [FASE_2A_PRIORIDADES_METRICAS.md](../FASE_2A_PRIORIDADES_METRICAS.md) §Sueca P0
- [IMPLEMENTATION_5_EVALUATOR_V0_REPORT.md](../implementation-reports/IMPLEMENTATION_5_EVALUATOR_V0_REPORT.md)
- [IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md](../implementation-reports/IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md)
- [IMPLEMENTATION_12_LLM_PROVIDER_ADVISORY_REPORT.md](../implementation-reports/IMPLEMENTATION_12_LLM_PROVIDER_ADVISORY_REPORT.md)

## Histórico

| Versão | Data | Nota |
|--------|------|------|
| 1.0 | 2026-06-06 | Prompt inicial pós-H12A; Sueca v0; S16/S08/S19; inventário + mapeamento |
| — | 2026-06-06 | **H13 OK** — SuecaStrategy 10/10; smoke Medium/Hard; nota S23/Rei → Sueca v2 (relatório Impl 13) |

---

**Fim da prompt — implementação e H13 concluídos (2026-06-06).**
