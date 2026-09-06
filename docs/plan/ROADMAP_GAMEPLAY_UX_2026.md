# ROADMAP — Gameplay / UX / Arquitectura (não-AI) · 2026

Documento final da fase actual. Escopo: regras, jogabilidade, UX/UI, arquitectura para renderer futuro, Android, POC Phaser.  
**Fora:** AI / Card Intelligence / mini-LLM.

---

## 1. Resumo executivo

Manter **TypeScript + React + Capacitor**. Não migrar para Godot, Unity ou Kotlin nesta fase.

Ordem principal:

| Fase | Conteúdo |
|------|----------|
| **A** | Estabilização funcional + C-lite (adapters / fonte de verdade, só o necessário) |
| **B** | UX funcional baseline |
| **C** | Separação engine / orchestration / React |
| **E** | POC Phaser Sueca (hipótese, não decisão fechada) |
| **F** | Testes web + Android real |
| **G** | Decisão de renderer (Phaser / Pixi / DOM / híbrido) |

**Fase D** (isolamento multiplayer / storage / session): **pós-POC por defeito**. Só sobe de prioridade se o POC exigir, houver bug concreto, ou multiplayer voltar a ser prioridade. **Não bloqueia E1.**

Phaser é **POC futuro / hipótese medida**. PixiJS, DOM melhorado ou híbrido permanecem opções até ao Checkpoint 8. Godot só com evidência de insuficiência em Android real.

**Primeira etapa funcional:** **A1** (capote Sueca).  
A alteração `.gitignore` (`desktop.ini`, `folderico*.ico`) entra no commit deste roadmap — **não** existe etapa A0.

### Contradições código ↔ plano (conhecidas)

| ID | Nota |
|----|------|
| C1 | `pauseGame(clone)` em `BaseGameAdapter` — P0 de pausa **é** C-lite. |
| C2 | `SPADES-P0-02` (`/4`) é UI, mas trata-se em A com scoring Spades. |
| C3 | `HEARTS-P1-01` e `KING-P1-02` exigem fechar regra nos docs antes do código. |
| C4 | Build Android desliga MP — `UI-P1-01` (King joiner) é LATER salvo MP King prioritário. |
| C5 | Extração total do `GameBoard` antes do POC não é necessária; basta boundary + orchestration mínima. |

---

## 2. Princípios arquitecturais

1. TypeScript permanece a linguagem das regras.  
2. Engines em `frontend/src/models/` preservam-se e testam-se.  
3. Não reescrever regras noutra linguagem.  
4. Corrigir bugs funcionais e regras antes de polish visual pesado.  
5. Um problema principal por etapa / commit pequeno e testável.  
6. Não misturar jogos no mesmo commit sem necessidade.  
7. Refactor só quando o bug o exige (C-lite).  
8. Não acrescentar lógica nova ao `GameBoard`.  
9. React → menus, modais, settings, HUD, shell.  
10. Mesa → candidata a renderer substituível após Checkpoint 5.  
11. Capacitor = caminho Android.  
12. Sem Godot/Unity/Kotlin nesta fase.

---

## 3. Roadmap por fases

### FASE A — Estabilização funcional + C-lite

Corrigir P0/P1 de regras, scoring, estado, pausa, fluxos (Sueca, Spades, Hearts, King).  
Em paralelo **só quando o fix o exigir:** contrato dos adapters, fonte de verdade, mover lógica para engine/helper. **Sem refactor generalizado.**

---

#### A1 — MUST · BLOQUEIA POC: SIM (Sueca)
- **Objectivo:** Capote 120 atribui 4 vitórias e pode terminar a partida (`SUECA-P0-01`).  
- **Scope:** `endRound` Sueca; `gameScore` / fim de partida.  
- **Ficheiros:** `frontend/src/models/Game.ts`, `Game.test.ts`  
- **Deps:** nenhuma.  
- **Risco:** médio  
- **Testes:** 120→+4; termina se ≥4; 91→2; 61→1; 60-60 inalterado.  
- **Manual:** mão a 120.  
- **Conclusão:** `docs/rules/sueca.md` §9–10.  
- **Commit:** `fix(sueca): award four game wins on capote`

---

#### A2 — MUST · BLOQUEIA POC: SIM\* (qualidade pause)
- **Objectivo:** Pausa afecta estado interno Spades/Hearts/King (`SHARED-P0-01`).  
- **Scope:** `pauseGame`/`resumeGame` mutam `this.state` (C-lite).  
- **Ficheiros:** `GameAdapter.ts`, adapters Spades/Hearts/King, testes.  
- **Risco:** médio  
- **Testes:** `isPaused` no estado interno; `canPlayCard` false.  
- **Commit:** `fix(adapters): pause and resume mutate engine state`

\*Não bloqueia a existência do canvas; bloqueia validação fiável do POC.

---

#### A3 — MUST · BLOQUEIA POC: NÃO
- **Objectivo:** Bags Spades acumulam entre rondas (`SPADES-P0-01`).  
- **Ficheiros:** `SpadesGame.ts`, testes.  
- **Risco:** médio  
- **Commit:** `fix(spades): carry bags across rounds`

---

#### A4 — MUST · BLOQUEIA POC: NÃO
- **Objectivo:** Round/Game Over Spades sem `/4` (`SPADES-P0-02`).  
- **Ficheiros:** `RoundEndModal.tsx`, `GameOverModal.tsx`  
- **Deps:** A3 ideal.  
- **Risco:** baixo  
- **Commit:** `fix(spades): show race-to-500 scores in end modals`

---

#### A5 — MUST · BLOQUEIA POC: NÃO
- **Objectivo:** Nulos King sem trunfo (`KING-P0-01`).  
- **Ficheiros:** `KingPtGame.ts`, `KingFestaFlowModal.tsx`, testes.  
- **Risco:** alto  
- **Commit:** `fix(king): force no-trump for null festas`

---

#### A6 — MUST · BLOQUEIA POC: NÃO
- **Objectivo:** K♥ na 1.ª oportunidade legal, incluindo lead (`KING-P0-02`).  
- **Ficheiros:** `KingPtGame.ts`, testes.  
- **Risco:** médio  
- **Commit:** `fix(king): require king of hearts on first legal lead`

---

#### A7 — MUST · BLOQUEIA POC: NÃO
- **Objectivo:** 4×3×3 sem histórico duplo / soft-lock (`KING-P0-03`).  
- **Ficheiros:** `KingPtGame.ts`, testes.  
- **Risco:** médio  
- **Commit:** `fix(king): prevent duplicate history on four-by-three`

---

#### A8 — MUST · BLOQUEIA POC: NÃO
- **Objectivo:** «8 ou nulos» — owner não negocia em paralelo (`KING-P1-01`).  
- **Ficheiros:** `KingPtGame.ts`, `KingFestaFlowModal.tsx`  
- **Deps:** A5–A7 preferíveis.  
- **Risco:** médio  
- **Commit:** `fix(king): gate negotiation during eight-or-nulls`

---

#### A9 — MUST · BLOQUEIA POC: NÃO · decisão de regra primeiro
- **Objectivo:** Settlement leilão positivo alinhado (`KING-P1-02`).  
- **Scope:** fechar base (beneficiário vs licitante) em docs; um modelo só.  
- **Ficheiros:** `kingScoring.ts`, `docs/rules/*`, testes.  
- **Risco:** alto  
- **Commit:** `fix(king): align positive auction settlement with rules`

---

#### A10a — SHOULD · BLOQUEIA POC: NÃO
- **Objectivo:** Fallback copy / labels / mensagens King (`KING-P1-03` e copy relacionada).  
- **Scope:** textos UI apenas — **sem** alterar scoring.  
- **Ficheiros:** `KingFestaFlowModal.tsx`, `KingRulesHelper.tsx` (se aplicável)  
- **Deps:** A5–A8 preferíveis.  
- **Risco:** baixo  
- **Commit:** `fix(king): correct festa fallback copy`

---

#### A10b — SHOULD · BLOQUEIA POC: NÃO
- **Objectivo:** Breakdown do contrato e running score de nulos (`KING-P1-04`, `KING-P1-05`).  
- **Scope:** apresentação / acumulação de scoring festa — **sem** misturar com A10a.  
- **Ficheiros:** `kingBreakdownHelpers.ts`, `KingPtGame.ts`, painéis de score  
- **Deps:** A5, A9.  
- **Risco:** médio  
- **Commit:** `fix(king): align festa breakdown and null running scores`

---

#### A11 — MUST · BLOQUEIA POC: NÃO · decisão de regra
- **Objectivo:** Hearts 1ª vaza sem stuck (`HEARTS-P1-01`).  
- **Ficheiros:** `HeartsGame.ts`, `docs/rules/hearts.md`, testes.  
- **Risco:** alto  
- **Commit:** `fix(hearts): allow legal escape on first-trick void`

---

#### A12 — MUST · BLOQUEIA POC: NÃO
- **Objectivo:** Shoot the moon no Round End (`HEARTS-P1-02`).  
- **Ficheiros:** `HeartsGame.ts`, `RoundEndModal.tsx`  
- **Risco:** baixo  
- **Commit:** `fix(hearts): show moon-adjusted round points`

---

#### A13 — SHOULD · BLOQUEIA POC: SIM†
- **Objectivo:** Direcção de distribuição Sueca real ou remover controlo (`SUECA-P1-01`).  
- **Ficheiros:** `Game.ts`, `SuecaDealingModal`, `GameBoard` (mínimo)  
- **Risco:** médio  
- **Commit:** `fix(sueca): apply dealing direction or remove control`

†Só se o POC incluir o modal de distribuição.

---

#### A14 — SHOULD · BLOQUEIA POC: NÃO
- **Objectivo:** Race game-over auto-exit vs Novo Jogo (`SHARED-P1-01`).  
- **Ficheiros:** `GameBoard.tsx` (mínimo)  
- **Risco:** baixo  
- **Commit:** `fix(ui): prevent game-over auto-exit race`

---

#### A15 — LATER · BLOQUEIA POC: NÃO
- Blind nil Spades (`SPADES-P1-02`) — decisão de produto.  
- King MP joiner (`UI-P1-01`) — LATER salvo MP King in-scope (ver C4).

**CHECKPOINT 1:** A1–A7 (+ A2) concluídos.  
**CHECKPOINT 2:** A8–A12 (A9/A11 com regra escrita); A10a/A10b conforme SHOULD.

---

### FASE B — UX funcional baseline

Corrigir UX necessária para jogar e testar. **Sem redesign completo.**

| ID | Pri | Bloq. Phaser | Objectivo | Commit sugerido |
|----|-----|--------------|-----------|-----------------|
| B1 | MUST | SIM | Jogador activo claro | `fix(ui): clarify active player indication` |
| B2 | MUST | SIM | Legais vs ilegais | `fix(ui): strengthen illegal card feedback` |
| B3 | MUST | NÃO | Bags + broken Spades | `feat(spades): show bags and broken status` |
| B4 | SHOULD | NÃO | Hearts broken | `feat(hearts): show hearts-broken status` |
| B5 | SHOULD | SIM | Trunfo Sueca legível | `fix(sueca): clarify trump indicator` |
| B6 | MUST | NÃO | King sem opções inválidas | `fix(king): remove invalid festa actions from ui` |
| B7 | SHOULD | NÃO | Continue idle / saltos layout | `fix(ui): reduce idle continue chrome` |
| B8 | LATER | NÃO | Landscape/responsive deep | TBD |

**CHECKPOINT 3:** B1–B3, B5–B6 (+ B4/B7).

---

### FASE C — Separação engine / orchestration / React

Objectivo:

```
Game Engine TS → State / Orchestration → Renderer → React Shell
```

**Não introduzir Phaser nesta fase.**

| ID | Pri | Bloq. Phaser | Objectivo | Commit sugerido |
|----|-----|--------------|-----------|-----------------|
| C1 | MUST | SIM | Fonte única de verdade no adapter | `refactor(adapters): single source of truth for game state` |
| C2 | MUST | SIM | Orchestrator (turnos/delays/pause) fora do JSX | `refactor: extract game turn orchestration from GameBoard` |
| C3 | SHOULD | NÃO | APIs variante no adapter (sem casts) | `refactor(adapters): expose variant flow methods on adapter` |
| C4 | SHOULD | SIM | Controllers de fluxo vs shell mesa | `refactor(ui): split variant flow controllers from GameBoard` |
| C5 | MUST | SIM | Boundary de mesa (props/eventos) | `refactor(ui): define table renderer boundary props` |

**CHECKPOINT 4:** C2+C4 — `GameBoard` sem orquestração grossa.  
**CHECKPOINT 5:** C1+C5 — engine pronta para renderer alternativo.

---

### FASE D — Multiplayer / storage / session (pós-POC por defeito)

| ID | Pri | Bloq. Phaser | Notas |
|----|-----|--------------|-------|
| D1 | LATER\* | NÃO | Extrair Firebase / host-joiner |
| D2 | LATER\* | NÃO | Session save / continue / lifecycle |
| D3 | LATER | NÃO | Preferences Capacitor; UI-P1-01 se MP King |

\*Sobe para SHOULD/MUST apenas se: POC precisar; bug concreto; ou MP voltar a prioridade.  
**Não bloqueia E1.** Sequência por defeito: após G (ou após E/F se bloqueio concreto).

---

### FASE E — POC Phaser (Sueca)

#### E1 — MUST
- **Objectivo:** POC isolado Sueca (flag/rota/pasta dedicada).  
- **Incluir:** 4 jogadores, mãos, deal, highlight legal, play, animação carta→mesa, win/recolha vaza, turno, trunfo, pause, round-end → React.  
- **Excluir:** AI, MP, King/Hearts/Spades, themes, ads, efeitos complexos.  
- **Deps:** Checkpoint 5 (+ A1, A2; A13 se dealing no POC).  
- **Risco:** alto  
- **Commit:** `feat(poc): add Phaser Sueca table prototype`

Phaser = **hipótese**. Se o POC falhar critérios, G pode escolher Pixi/DOM/híbrido.

**CHECKPOINT 6:** E1 E2E solo.

---

### FASE F — Testes web + Android real

| ID | Pri | Scope |
|----|-----|-------|
| F1 | MUST | Desktop + browser mobile |
| F2 | MUST | Capacitor Android mid-range; portrait/landscape; touch; resize; lifecycle; pause; FPS animação |

**CHECKPOINT 7:** relatório F com métricas.

---

### FASE G — Decisão de renderer

Decidir: Phaser | PixiJS | DOM melhorado | híbrido.  
Godot só com falha documentada em F.

**CHECKPOINT 8:** decisão escrita.

---

## 4. Tabela master

| ID | Pri | Área | Descrição | Risco | Bloq. Phaser | Commit esperado |
|----|-----|------|-----------|-------|--------------|-----------------|
| A1 | MUST | Sueca | Capote +4 | médio | SIM | `fix(sueca): award four game wins on capote` |
| A2 | MUST | Shared | Pause no motor | médio | SIM\* | `fix(adapters): pause and resume mutate engine state` |
| A3 | MUST | Spades | Bags carry | médio | NÃO | `fix(spades): carry bags across rounds` |
| A4 | MUST | Spades | Modais 500 | baixo | NÃO | `fix(spades): show race-to-500 scores in end modals` |
| A5 | MUST | King | Nulos sem trunfo | alto | NÃO | `fix(king): force no-trump for null festas` |
| A6 | MUST | King | K♥ no lead | médio | NÃO | `fix(king): require king of hearts on first legal lead` |
| A7 | MUST | King | 4×3×3 history | médio | NÃO | `fix(king): prevent duplicate history on four-by-three` |
| A8 | MUST | King | 8 ou nulos | médio | NÃO | `fix(king): gate negotiation during eight-or-nulls` |
| A9 | MUST | King | Settlement positivo | alto | NÃO | `fix(king): align positive auction settlement with rules` |
| A10a | SHOULD | King | Fallback copy | baixo | NÃO | `fix(king): correct festa fallback copy` |
| A10b | SHOULD | King | Breakdown / null scores | médio | NÃO | `fix(king): align festa breakdown and null running scores` |
| A11 | MUST | Hearts | 1ª vaza stuck | alto | NÃO | `fix(hearts): allow legal escape on first-trick void` |
| A12 | MUST | Hearts | Moon modal | baixo | NÃO | `fix(hearts): show moon-adjusted round points` |
| A13 | SHOULD | Sueca | Dealing direction | médio | SIM† | `fix(sueca): apply dealing direction or remove control` |
| A14 | SHOULD | Shared | Game-over race | baixo | NÃO | `fix(ui): prevent game-over auto-exit race` |
| A15 | LATER | Spades/MP | Blind nil / King joiner | — | NÃO | TBD |
| B1–B8 | ver §3 | UX | Baseline | baixo–médio | ver §3 | ver §3 |
| C1–C5 | ver §3 | Arch | Separação | médio–alto | ver §3 | ver §3 |
| D1–D3 | LATER\* | MP | Pós-POC | médio | NÃO | `refactor(mp): …` |
| E1 | MUST | POC | Phaser Sueca | alto | — | `feat(poc): add Phaser Sueca table prototype` |
| F1–F2 | MUST | QA | Web+Android | médio | — | notas de teste |
| G1 | MUST | Decisão | Renderer | baixo | — | doc decisão |

---

## 5. Checkpoints

| CP | Critério |
|----|----------|
| **1** | P0 A1–A7 (+A2) verdes |
| **2** | P1 críticos A8–A12; A10a/A10b SHOULD |
| **3** | UX baseline B |
| **4** | GameBoard desacoplado (orchestration) |
| **5** | Engine + boundary pronta para renderer |
| **6** | POC Phaser Sueca funcional |
| **7** | Testes Android/web concluídos |
| **8** | Decisão de renderer |

---

## 6. Dependências críticas

```
A1 ─┬─► Sueca estável ─► A13? ─► B5 ─► C5 ─► E1 ─► F ─► G
A2 ─┴─► C1 (parcialmente)
A3 ─► A4, B3
A5–A7 ─► A8 → A10a; A9 → A10b; B6
A11 ◄── decisão docs hearts
A9  ◄── decisão docs king scoring
C2+C5 ══► E1 (obrigatório)
D* ──► só se bloqueio / MP prioritário / pós-G por defeito
```

---

## 7. Fora de scope (fase actual)

- AI / Card Intelligence / mini-LLM  
- Godot / Unity / Kotlin  
- Rewrite das regras noutra linguagem  
- Redesign visual completo / temas  
- Ads / IAP reais  
- Dual renderer em produção  
- Refactors cosméticos sem bug  
- Tech debt P3 “porque sim”  
- Multiplayer no POC Phaser  
- Fase D como pré-requisito do POC (por defeito)

---

## 8. Sequência exacta recomendada

1. **A1** → **A2** → **A3** → **A4**  
2. **A5** → **A6** → **A7** → **A8** → (decisão) **A9** → **A10a** → **A10b**  
3. (decisão) **A11** → **A12** → **A13** → **A14**  
4. **CP1 / CP2**  
5. **B1** → **B2** → **B3** → **B5** → **B6** → (B4, B7) → **CP3**  
6. **C1** → **C2** → **C5** → (C3, C4) → **CP4 / CP5**  
7. **E1** → **CP6** → **F1/F2** → **CP7** → **G** → **CP8**  
8. **D1+** por defeito **após G** (ou antes só com bloqueio concreto / prioridade MP)

---

## 9. Estratégia de commits

1. Regra/bug (motor).  
2. Testes (mesmo commit ou imediatamente a seguir).  
3. UX relacionada ao mesmo problema.  
4. Refactor mínimo **só** se o fix o exigir.  

Evitar: misturar jogos; misturar copy King (A10a) com scoring (A10b); commits gigantes; Phaser antes do CP5.

O commit que introduziu este documento inclui também `.gitignore` (`desktop.ini`, `folderico*.ico`).

---

## 10. Primeira etapa funcional

**A1** — `fix(sueca): award four game wins on capote`

Não implementar até revisão explícita do estado do repo após este roadmap.

Imediatamente a seguir na execução: **A2** (pause / C-lite).

---

*Documento fechado para a fase não-AI 2026. Actualizar checkpoints conforme commits forem concluídos.*
