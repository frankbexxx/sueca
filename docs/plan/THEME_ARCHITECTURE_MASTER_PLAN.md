# Theme Architecture — Master Plan

**ID:** `THEME-ARCHITECTURE-MASTER-PLAN-01`  
**Tipo:** plano vivo (versionado; actualizar em cada batch)  
**Root:** `E:\SUECAO`  
**Branch:** `v2-main`  
**Criado:** 2026-09-20  
**Last updated:** 2026-09-20  
**Current commit:** *(Stage 14 — see Change Log / git)*  
**Stage 0 baseline:** [`THEME_ARCHITECTURE_STAGE_0_BASELINE.md`](./THEME_ARCHITECTURE_STAGE_0_BASELINE.md)  
**Stage 1 contract:** [`THEME_ARCHITECTURE_STAGE_1_CONTRACT_PROPOSAL.md`](./THEME_ARCHITECTURE_STAGE_1_CONTRACT_PROPOSAL.md) — **DONE / APPROVED**  
**Stage 2 foundation:** [`THEME_ARCHITECTURE_STAGE_2_IMPLEMENTATION.md`](./THEME_ARCHITECTURE_STAGE_2_IMPLEMENTATION.md) — **DONE**  
**Stage 3 built-in themes:** [`THEME_ARCHITECTURE_STAGE_3_BUILTIN_THEMES.md`](./THEME_ARCHITECTURE_STAGE_3_BUILTIN_THEMES.md) — **DONE**  
**Stage 4 custom parity:** [`THEME_ARCHITECTURE_STAGE_4_CUSTOM_PARITY.md`](./THEME_ARCHITECTURE_STAGE_4_CUSTOM_PARITY.md) — **DONE**  
**Stage 5 shell + landing:** [`THEME_ARCHITECTURE_STAGE_5_SHELL_LANDING.md`](./THEME_ARCHITECTURE_STAGE_5_SHELL_LANDING.md) — **DONE**  
**Stage 6 shared components:** [`THEME_ARCHITECTURE_STAGE_6_SHARED_COMPONENTS.md`](./THEME_ARCHITECTURE_STAGE_6_SHARED_COMPONENTS.md) — **DONE**  
**Stage 7 purple cleanup:** [`THEME_ARCHITECTURE_STAGE_7_PURPLE_CLEANUP.md`](./THEME_ARCHITECTURE_STAGE_7_PURPLE_CLEANUP.md) — **DONE**  
**Stage 8 game DOM:** [`THEME_ARCHITECTURE_STAGE_8_GAME_DOM.md`](./THEME_ARCHITECTURE_STAGE_8_GAME_DOM.md) — **DONE**  
**Stage 9 responsive:** [`THEME_ARCHITECTURE_STAGE_9_RESPONSIVE.md`](./THEME_ARCHITECTURE_STAGE_9_RESPONSIVE.md) — **DONE**  
**Stage 11 CSS cleanup:** [`THEME_ARCHITECTURE_STAGE_11_CSS_CLEANUP.md`](./THEME_ARCHITECTURE_STAGE_11_CSS_CLEANUP.md) — **DONE**  
**Stage 12 global validation:** [`THEME_ARCHITECTURE_STAGE_12_GLOBAL_VALIDATION.md`](./THEME_ARCHITECTURE_STAGE_12_GLOBAL_VALIDATION.md) — **DONE**  
**Stage 13 final visual passes:** [`THEME_ARCHITECTURE_STAGE_13_FINAL_VISUAL_PASSES.md`](./THEME_ARCHITECTURE_STAGE_13_FINAL_VISUAL_PASSES.md) — **DONE**  
**Stage 14 release gate:** [`THEME_ARCHITECTURE_STAGE_14_RELEASE_GATE.md`](./THEME_ARCHITECTURE_STAGE_14_RELEASE_GATE.md) — **DONE / PASS**  
**Theme Architecture Foundation:** **COMPLETE**  
**Theme Contract v1:** **16** theme-controlled `--sc-*` tokens  

**Final note:** Architectural workstream **closed**. Future UX (Stage 10, GLOBAL-UI-02/03, GLOBAL-CARDS-01, iconized top bar) is **separate product-design work** — not architecture debt.

**Inputs:**
- pack Repomix: `docs/ai/repo-review/packs/generated/theme-architecture-audit-context.md`
- relatório externo: *SUECÃO — GLOBAL THEME & UI ARCHITECTURE AUDIT*
- `docs/plan/ROADMAP_REBASE_SEPTEMBER_2026.md`
- `docs/plan/SUECA_FINAL_VISUAL_PASS.md`

**Roadmap pointer:** `Theme Architecture Foundation — COMPLETE` (ver rebase § Theme Architecture).

---

## Progress summary

| Campo | Valor |
|-------|--------|
| **Total stages** | 15 (Etapas 0–14) |
| **DONE** | 14 (Etapa 0–9 + 11–14; Etapa 10 deferred) |
| **IN PROGRESS** | 0 |
| **AUDIT** | 0 |
| **BLOCKED** | 0 |
| **NOT STARTED** | 0 |
| **DEFERRED** | 1 (Etapa 10 — Theme ↔ Deck ↔ Music ↔ SFX UX) |
| **PARTIAL / READY / SUPERSEDED** | 0 |
| **Current stage** | — *(Theme Architecture Foundation **COMPLETE**)* |
| **Next stage** | Product UX / polish (Stage 10 design; GLOBAL-UI-02/03; GLOBAL-CARDS-01) — **fora** deste workstream |
| **Blockers** | Nenhum blocker arquitectural; Etapa 10 + P2 UX são product-design |
| **Last updated** | 2026-09-20 |
| **Current commit** | *(Stage 14 — see Change Log / git)* |
| **Theme Contract** | **16** `--sc-*` · **COMPLETE** · Stage 10 deferred |

Actualizar esta tabela em **cada** batch futuro.

---

## 1. Princípio de produto

### Suecão é uma aplicação temática

O **theme activo** deve governar toda a experiência **React/DOM** apropriada:

- Landing Page  
- App Shell  
- Dashboard  
- Navigation  
- Headers  
- Bottom Nav  
- Settings  
- Forms  
- Buttons / Inputs / Selects / Toggles  
- Modals / Dialogs  
- Game setup  
- Intermediate game states  
- HUD / score DOM  
- Pause / resume  
- Round result / Game result  
- Sueca / Hearts / Spades / King **DOM UI**

### Phaser (excepção explícita)

Estética do **canvas Phaser** fica **fora** da migração temática global.

**Preservar:** `Premium Classic Table`.

Apenas a **fronteira React/DOM ↔ Phaser** (host, chrome, containers, theme data bridge) deve permanecer coerente.

**Não** tentar fazer todos os felts Phaser seguirem os themes.

---

## 2. Porquê desta migração

Causa raiz verificada (audit externo + pack):

| ID | Problema | Hoje | Target |
|----|----------|------|--------|
| **A** | Inverted theming | `Theme → component selector overrides` | `Theme → semantic tokens → components` |
| **B** | Legacy purple | `--sueca-color-primary` / `--sueca-rgb-primary` ainda violeta; sobrevivem sem override | defaults neutros/coerentes; purple só se intencional |
| **C** | CSS generations | Dobo / prototype + legacy purple + modern shell / UX-P3 | uma geração semântica dominante |
| **D** | Missing semantic contract | superfícies sem tokens próprios | contrato mínimo aprovado |
| **E** | Duplication | ~30 themes repetem selectors concretos | theme define tokens; componentes consomem |
| **F** | Custom theme divergence | built-in ≠ custom (modelo 5 cores) | mesmo contrato semântico |

---

## 3. Regra de execução

Cada etapa usa **um** destes estados:

`NOT STARTED` · `AUDIT` · `READY` · `IN PROGRESS` · `BLOCKED` · `PARTIAL` · `DONE` · `DEFERRED` · `SUPERSEDED`

**Nunca** marcar `DONE` só porque testes automáticos passaram.

Quando aplicável, exigir:

- code review  
- tests  
- build  
- screenshot / validação manual  
- OPPO smoke  

O plano **pode evoluir**: novas etapas, gaps e decisões entram no Decision Log + Change Log.

---

## 4. Etapa 0 — Baseline / inventário

| Campo | Valor |
|-------|--------|
| **STATUS** | `DONE` |
| **Objectivo** | Confirmar o estado técnico real antes da migração |
| **Deliverable** | [`THEME_ARCHITECTURE_STAGE_0_BASELINE.md`](./THEME_ARCHITECTURE_STAGE_0_BASELINE.md) |

**Tasks:**

- [x] listar todos os theme tokens actuais  
- [x] listar aliases legacy  
- [x] listar selectors repetidos nos 30 themes  
- [x] listar componentes que consomem tokens  
- [x] listar componentes que usam hardcoded colours  
- [x] listar `.dobo-*`  
- [x] listar `.variant-modal-*`  
- [x] listar `.continue-button`  
- [x] listar inline colour styles  
- [x] listar surfaces fora de `.app-shell[data-theme]`  
- [x] confirmar import/cascade CSS real  
- [x] confirmar built-in vs custom divergence  
- [x] criar baseline screenshots representativas (**matriz/plan** em §17 do baseline; captures físicos = follow-up de validação)

**Key findings (resumo):**

- ~**88%** selector-driven vs ~**12%** token-only em `themes.css`  
- **30** built-ins TS; **29** blocos CSS; **`classic` sem bloco**  
- `--sueca-rgb-primary` / primary defaults = **legacy purple**; themes não rebindam a var  
- Custom (5 cores) ≠ contrato built-in (faltam turn/player-box/primary tokens; backs/music fallback)  
- Landing **fora** de `data-theme`  
- Phaser felt = Premium Classic; lê text/accent/turn + card back  

**Exit criteria:** sabíamos exactamente quem será afectado — **cumprido** (ver Impact + Risk maps no baseline).

---

## 5. Etapa 1 — Definir Theme Contract

| Campo | Valor |
|-------|--------|
| **STATUS** | `DONE` |
| **Objectivo** | Definir o contrato semântico mínimo **final** antes de implementar |
| **Contract doc** | [`THEME_ARCHITECTURE_STAGE_1_CONTRACT_PROPOSAL.md`](./THEME_ARCHITECTURE_STAGE_1_CONTRACT_PROPOSAL.md) |
| **Final Theme Contract** | **16** theme-controlled `--sc-*` tokens (**APPROVED** 2026-09-20) |
| **Exit criteria** | Theme Contract aprovado por Francisco — **cumprido** |

**Approved package:**

- **16** theme-controlled `--sc-*` (incl. `--sc-game-bg` REQUIRED)  
- intentional globals (Premium HUD, space/radius/touch, focus, scrim, …)  
- game-semantic fixed: Us / Them / Danger  
- custom: same contract via 5 inputs + derivation (turn from accent)  
- Classic: Option B explicit assignment; `:root` neutral emergency only  
- Phaser felt/rail: Premium Classic, outside contract  
- transitional legacy aliases until Etapas 6–11  

**P1–P5:** ver Decision Log.

---

## 6. Etapa 2 — Token foundation

| Campo | Valor |
|-------|--------|
| **STATUS** | `DONE` |
| **Objectivo** | Implementar semantic tokens no design system **sem** alterar ainda toda a UI |
| **Implementation** | [`THEME_ARCHITECTURE_STAGE_2_IMPLEMENTATION.md`](./THEME_ARCHITECTURE_STAGE_2_IMPLEMENTATION.md) |

**Delivered:**

- 16 `--sc-*` emergency defaults on `:root` (neutral canvas/surfaces; brass/gold accent — **not** Classic identity)  
- Transitional legacy aliases → `--sc-*` where safe (`--sueca-*` / `--color-*` / `--theme-panel-*` / game chrome)  
- Deferred: `--theme-bg-game-alt` / `--theme-bg-game-mid` (literals green-neutral; not forced to contract)  
- Game Us/Them/Danger fixed; optional `--sc-game-*` / `--sc-danger*` aliases  
- Premium HUD untouched  
- `design-tokens.json` aligned as **partial metadata**; CSS = runtime SoT  
- Focused tests: `designTokens.foundation.test.ts`  

**Not in scope (correctly deferred):** `themes.css`, `useCustomThemeCSS`, Landing, components, `.dobo-*` removal, Phaser.

**Exit criteria:** met — componentes **podem** consumir `--sc-*`; themes/components ainda não migrados.

---

## 7. Etapa 3 — Built-in themes migration

| Campo | Valor |
|-------|--------|
| **STATUS** | `DONE` |
| **Objectivo** | Migrar os **30** built-in themes de selector-driven para token-driven |
| **Implementation** | [`THEME_ARCHITECTURE_STAGE_3_BUILTIN_THEMES.md`](./THEME_ARCHITECTURE_STAGE_3_BUILTIN_THEMES.md) |

**Delivered:**

- 30/30 explicit `.app-shell[data-theme]` blocks with identical 16-token shape  
- `classic` explicit (intentional purple accent in-block only; `:root` stays emergency brass)  
- `themes.css` ~100% token-driven (0 component selectors; + alias bridge)  
- Identity preserved via extraction from prior selectors  
- Minimal shell compatibility (`app-shell` / `shell-screens` / dashboard / BottomNav)  
- Alias bridge so Stage 2 legacy vars resolve against theme-scoped `--sc-*`  
- Card-back + music mappings unchanged; Phaser untouched; custom generator unchanged  

**Exit criteria:** met — novo componente semântico não precisa editar 30 theme blocks (consome `--sc-*` / aliases).

---

## 8. Etapa 4 — Custom themes parity

| Campo | Valor |
|-------|--------|
| **STATUS** | `DONE` |
| **Objectivo** | Custom themes obedecem ao **mesmo** Theme Contract |
| **Implementation** | [`THEME_ARCHITECTURE_STAGE_4_CUSTOM_PARITY.md`](./THEME_ARCHITECTURE_STAGE_4_CUSTOM_PARITY.md) |

**Delivered:**

- `useCustomThemeCSS` emits exact 16 `--sc-*` (same names as built-ins)  
- 5 inputs preserved; turn/seat/game-bg/surfaces derived  
- No component selectors in generated CSS  
- Alias bridge + shell compat consume custom tokens  
- Saved schema compatible; Theme Editor UX unchanged  

**Exit criteria:** met — custom e built-in diferem só nos **valores**, não na arquitectura.

---

## 9. Etapa 5 — App Shell + Landing

| Campo | Valor |
|-------|--------|
| **STATUS** | `DONE` |
| **Implementation** | [`THEME_ARCHITECTURE_STAGE_5_SHELL_LANDING.md`](./THEME_ARCHITECTURE_STAGE_5_SHELL_LANDING.md) |

### Decisão de produto (já tomada)

**Landing Page deve seguir o theme activo.** — **implemented**

**Delivered:**

- Landing under `.app-shell[data-theme]` (built-in + custom)  
- Landing palette → `--sc-*`  
- Shell / BottomNav / panels / dashboard / themes cards → direct `--sc-*`  
- Continuity Landing → Dashboard confirmed in smoke  

**Exit criteria:** met — do primeiro ecrã ao dashboard, o theme activo é visualmente contínuo.

---

## 10. Etapa 6 — Shared component system

| Campo | Valor |
|-------|--------|
| **STATUS** | `DONE` |
| **Implementation** | [`THEME_ARCHITECTURE_STAGE_6_SHARED_COMPONENTS.md`](./THEME_ARCHITECTURE_STAGE_6_SHARED_COMPONENTS.md) |

### Delivered

- Single primary-action recipe (`rgba(var(--sc-accent-rgb), α)`) on `.sueca-btn--primary`  
- `.dobo-btn` / `.variant-modal-primary` = Strategy B aliases (not independent design language)  
- `.continue-button` + modal primary/new-game → shared paint  
- Modal shells (`.variant-modal`, `.dobo-panel`, `.modal-container`, RulesSheet, Credits) → `--sc-surface-modal`  
- Forms/controls/toggles/selected → semantic tokens  
- Component CSS legacy primary-token consumers → **0**  

**Exit criteria:** met — uma primary action tem **uma** semântica visual partilhada.

---

## 11. Etapa 7 — Legacy purple cleanup

| Campo | Valor |
|-------|--------|
| **STATUS** | `DONE` |
| **Implementation** | [`THEME_ARCHITECTURE_STAGE_7_PURPLE_CLEANUP.md`](./THEME_ARCHITECTURE_STAGE_7_PURPLE_CLEANUP.md) |
| **Closes** | `GLOBAL-UI-01` |

### Delivered

- Accidental purple/lavender removed (ErrorBoundary, Pente, GameBoard bidding, GameSelector, body canvas, Credits body)  
- Classic intentional purple preserved and scoped  
- Alias bridge does not leak Classic purple outside Classic  
- Stage 7 tests enforce forbidden-literal absence  

**Exit criteria:** met — nenhum componente fica roxo **apenas** porque escapou ao theme. **GLOBAL-UI-01 CLOSED.**

---

## 12. Etapa 8 — Game-specific DOM migration

| Campo | Valor |
|-------|--------|
| **STATUS** | `DONE` |
| **Implementation** | [`THEME_ARCHITECTURE_STAGE_8_GAME_DOM.md`](./THEME_ARCHITECTURE_STAGE_8_GAME_DOM.md) |

### Delivered

- Sueca / Hearts / Spades / King DOM → `--sc-*` (turn, seat, felt/rail, game-bg, selection accent)  
- InGameBar text/surface semantic; Premium HUD status panel retained  
- Us/Them/Danger fixed; Phaser Premium Classic unchanged  
- Behaviour suites (H15 / H16 / Spades HUD / flows) green  

**Exit criteria:** met — DOM de jogo nos quatro títulos usa arquitectura semântica.

---

## 13. Etapa 9 — Responsive theme pass

| Campo | Valor |
|-------|--------|
| **STATUS** | `DONE` |
| **Report** | [`THEME_ARCHITECTURE_STAGE_9_RESPONSIVE.md`](./THEME_ARCHITECTURE_STAGE_9_RESPONSIVE.md) |

**Auditado:** mobile portrait · mobile landscape · tablet-ish · desktop.

**Separado:** layout responsive **de** theme redesign — só hardening (safe-area, `dvh`, inputs ≥16px, overflow).

**Não feito (intencional):** redesign nav / top bar / menus / Theme↔Music / Phaser / Final Visual Pass.

**Exit criteria:** met — breakpoints não reintroduzem aparência legacy/global; Stage 10 permanece DEFERRED.

---

## 14. Etapa 10 — Theme ↔ Deck ↔ Music ↔ SFX UX

| Campo | Valor |
|-------|--------|
| **STATUS** | `DEFERRED` / `DESIGN PENDING` |
| **Implementation** | **NÃO iniciar** até decisão explícita de produto (Francisco) |

Arquitectura runtime actual deve ser **preservada**.

**Problema:** relação Theme ↔ Music existe tecnicamente mas é pouco visível na UX.

**Decisão futura (Francisco):** Theme como experiência completa · Personalização unificada mas independente · Hybrid — **não implementar** até decisão.

**Registar:**

- deck faces continuam desacopladas  
- card backs podem continuar theme-driven  
- music engine continua independente  
- SFX continuam independentes tecnicamente  

**Pointer:** roadmap §13 (Themes + Audio Experience Redesign).

**Nota:** Etapa 11 avançou com Stage 10 **explicitamente skipped** (permanece DESIGN PENDING / DEFERRED — sem implementação).
---

## 15. Etapa 11 — Dead / superseded CSS cleanup

| Campo | Valor |
|-------|--------|
| **STATUS** | `DONE` |
| **Report** | [`THEME_ARCHITECTURE_STAGE_11_CSS_CLEANUP.md`](./THEME_ARCHITECTURE_STAGE_11_CSS_CLEANUP.md) |

Alias bridge removido; Phaser em `--sc-*`; Dobo / continue / variant-modal-primary limpos; 30 themes intactos.

**Exit criteria:** met — cleanup proven safe; Stage 10 permanece DEFERRED.

---

## 16. Etapa 12 — Global visual validation

| Campo | Valor |
|-------|--------|
| **STATUS** | `DONE` |
| **Report** | [`THEME_ARCHITECTURE_STAGE_12_GLOBAL_VALIDATION.md`](./THEME_ARCHITECTURE_STAGE_12_GLOBAL_VALIDATION.md) |

Foundation validada (built-ins · Classic · custom · continuity · games · Phaser · responsive · leakage · dead arch). Sem P0/P1. Stage 10 permanece DEFERRED.

**Exit criteria:** met — Etapa 13 desbloqueada.

---

## 17. Etapa 13 — Retomar Final Visual Passes

| Campo | Valor |
|-------|--------|
| **STATUS** | `DONE` |
| **Report** | [`THEME_ARCHITECTURE_STAGE_13_FINAL_VISUAL_PASSES.md`](./THEME_ARCHITECTURE_STAGE_13_FINAL_VISUAL_PASSES.md) |

Sueca / Hearts / Spades / King revistos. Locais Sueca revalidated. Sem P1. GLOBAL-UI-02/03 + GLOBAL-CARDS-01 permanecem OPEN (futuro UX). Stage 10 DEFERRED.

**Exit criteria:** met — Etapa 14 desbloqueada.

---

## 18. Etapa 14 — Final release gate

| Campo | Valor |
|-------|--------|
| **STATUS** | `DONE` / **PASS** |
| **Report** | [`THEME_ARCHITECTURE_STAGE_14_RELEASE_GATE.md`](./THEME_ARCHITECTURE_STAGE_14_RELEASE_GATE.md) |

Theme Architecture Foundation **COMPLETE**. Stage 10 permanece DESIGN PENDING / DEFERRED.

Checklist arquitectural (gate Stage 14):

- [x] Theme Contract final implementado  
- [x] Landing themed  
- [x] 30 built-ins migrados  
- [x] custom theme parity  
- [x] shared components migrated  
- [x] legacy purple accidental = zero (GLOBAL-UI-01)  
- [x] 4 games DOM migrated  
- [x] responsive pass  
- [x] no major legacy design-system leakage  
- [x] visual passes 4/4 reviewed (Stage 13; P2 globals OPEN OK)  
- [x] automated tests PASS  
- [x] web build PASS  
- [ ] Android PASS — *fora do gate arquitectural*  
- [ ] OPPO smoke PASS — *pending physical; não falha este gate*  
- [x] docs actualizadas  

**Final note:** architectural workstream closed; future UX work is separate product-design work.

---

## 19. Decision log

| Date | Decision | Reason | Impact |
|------|----------|--------|--------|
| 2026-09-20 | **Suecão is a theme-first application.** All appropriate React/DOM surfaces, **including Landing Page**, must follow the active theme. **Phaser table aesthetics remain intentionally Premium Classic.** | Audit externo + princípio de produto | Scope = React/DOM + bridge; Etapa 5 Landing; Phaser canvas fora |
| 2026-09-20 | **P1 — Classic Option B.** Explicit semantic theme assignment. `:root` = neutral emergency fallback only. | Consistency, missing-token detection, avoid classic≡purple defaults | Etapas 2–3 |
| 2026-09-20 | **P2 — `--sc-game-bg` REQUIRED.** Theme-controlled contract = **16** tokens. | Stage 0: game-bg independent of felt | Token foundation + built-in/custom maps |
| 2026-09-20 | **P3 — Premium HUD intentional global** (contract v1). | UX-P3.3 identity ≠ app chrome tint | No `--sc-*` mapping for premium-hud in v1 |
| 2026-09-20 | **P4 — Emergency accent = neutral brass/gold.** Fallback infrastructure only; **not** Classic identity. | Remove purple accident without inventing a fake “classic” | `:root` defaults |
| 2026-09-20 | **P5 — Custom turn derived from accent** (v1). No editor field. | Same contract; keep 5 inputs | `useCustomThemeCSS` derivation in Etapa 4 |
| 2026-09-20 | Custom keeps 5 inputs; derived values must match built-in semantic contract; Us/Them/Danger fixed; Phaser felt/rail out; legacy aliases until scheduled stages | Approval package Stage 1-CLOSE | Etapas 2–11 |

---

## 20. Open gaps / backlog do plano

Gaps confirmados / refinados na Etapa 0:

- Inventário exacto documentado em Stage 0 baseline  
- Superfícies fora de `.app-shell[data-theme]` → ~~Landing~~ → **DONE** Etapa 5  
- Divergência built-in vs custom → ~~NOT SAME CONTRACT~~ → **DONE** Etapa 4 (same CSS shape; content curation still separate)  
- Shared components still partially alias/dobo-driven → ~~Etapa 6~~ → **DONE** (aliases retained; paint unified)  
- ~~`classic` sem bloco CSS~~ → **DONE** Etapa 3  
- ~~Themes não rebindam `--sueca-rgb-primary`~~ → **DONE** (alias bridge Stage 3)  
- Relação com `GLOBAL-UI-01/02/03` e `GLOBAL-CARDS-01` — ~~GLOBAL-UI-01 DONE Etapa 7~~; 02/03 + CARDS-01 remain  
- Matriz de screenshots criada; **captures físicos** ainda por executar  

---

## 21. Change log

| Date | Change | Stage affected | Reason |
|------|--------|----------------|--------|
| 2026-09-20 | Documento canónico criado (`THEME-ARCHITECTURE-MASTER-PLAN-01`) | all (0–14) | Plano vivo da migração temática global; roadmap aponta ACTIVE WORKSTREAM |
| 2026-09-20 | Etapa 0 → `DONE`; baseline `THEME_ARCHITECTURE_STAGE_0_BASELINE.md`; current → Etapa 1 | 0, 1 | Inventário técnico completo antes do Theme Contract |
| 2026-09-20 | Etapa 1 → `AUDIT`; proposal `THEME_ARCHITECTURE_STAGE_1_CONTRACT_PROPOSAL.md` (16 `--sc-*`) | 1 | Contrato semântico proposto; aguarda aprovação Francisco |
| 2026-09-20 | Etapa 1 → `DONE` (P1–P5 approved); current → Etapa 2 Token Foundation | 1, 2 | THEME-ARCHITECTURE-STAGE-1-CLOSE |
| 2026-09-20 | Etapa 2 → `DONE`; 16 `--sc-*` + alias layer in `design-tokens.css`; current → Etapa 3 Built-in themes migration | 2, 3 | THEME-ARCHITECTURE-STAGE-2 |
| 2026-09-20 | Etapa 3 → `DONE`; 30/30 token themes + Classic explicit; current → Etapa 4 Custom themes parity | 3, 4 | THEME-ARCHITECTURE-STAGE-3 |
| 2026-09-20 | Etapa 4 → `DONE`; custom generator token-driven (same 16 `--sc-*`); current → Etapa 5 App Shell + Landing | 4, 5 | THEME-ARCHITECTURE-STAGE-4 |
| 2026-09-20 | Etapa 5 → `DONE`; Landing + App Shell on `--sc-*`; current → Etapa 6 Shared Component System | 5, 6 | THEME-ARCHITECTURE-STAGE-5 |
| 2026-09-20 | Etapa 6 → `DONE`; shared buttons/modals/controls on `--sc-*`; Dobo=alias; current → Etapa 7 Legacy Purple Cleanup | 6, 7 | THEME-ARCHITECTURE-STAGE-6 |
| 2026-09-20 | Etapa 7 → `DONE`; GLOBAL-UI-01 closed; current → Etapa 8 Game-specific DOM Migration | 7, 8 | THEME-ARCHITECTURE-STAGE-7 |
| 2026-09-20 | Etapa 8 → `DONE`; game DOM Sueca/Hearts/Spades/King on `--sc-*`; current → Etapa 9 Responsive Theme Pass | 8, 9 | THEME-ARCHITECTURE-STAGE-8 |
| 2026-09-20 | Etapa 9 → `DONE`; responsive hardening (safe-area, dvh, ≥16px inputs, overflow); current → Etapa 10 **DESIGN PENDING / DEFERRED** | 9, 10 | THEME-ARCHITECTURE-STAGE-9 |
| 2026-09-20 | Etapa 11 → `DONE` (Stage 10 skipped as deferred); dead CSS/aliases/bridge removed; Phaser on `--sc-*`; current → Etapa 12 Global Visual Validation | 10, 11, 12 | THEME-ARCHITECTURE-STAGE-11 |
| 2026-09-20 | Etapa 12 → `DONE`; global theme architecture validated; no P0/P1; current → Etapa 13 Final Visual Passes; Stage 10 still DEFERRED | 12, 13 | THEME-ARCHITECTURE-STAGE-12 |
| 2026-09-20 | Etapa 13 → `DONE`; four games visually reviewed; no P1 fixes; GLOBAL-UI-02/03/CARDS-01 remain OPEN; current → Etapa 14 Final Release Gate | 13, 14 | THEME-ARCHITECTURE-STAGE-13 |
| 2026-09-20 | Etapa 14 → `DONE` / **PASS**; Theme Architecture Foundation **COMPLETE**; Stage 10 remains DEFERRED; residual P2 are product UX | 14 | THEME-ARCHITECTURE-STAGE-14 |

O plano pode evoluir. A versão inicial **não** é imutável — registar todas as alterações futuras nesta tabela.

---

*THEME-ARCHITECTURE-MASTER-PLAN-01 · 2026-09-20 · documentação apenas*
