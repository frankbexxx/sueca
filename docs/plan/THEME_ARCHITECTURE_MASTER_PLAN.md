# Theme Architecture — Master Plan

**ID:** `THEME-ARCHITECTURE-MASTER-PLAN-01`  
**Tipo:** plano vivo (versionado; actualizar em cada batch)  
**Root:** `E:\SUECAO`  
**Branch:** `v2-main`  
**Criado:** 2026-09-20  
**Last updated:** 2026-09-20  
**Current commit:** `ed85e15`

**Inputs:**
- pack Repomix: `docs/ai/repo-review/packs/generated/theme-architecture-audit-context.md`
- relatório externo: *SUECÃO — GLOBAL THEME & UI ARCHITECTURE AUDIT*
- `docs/plan/ROADMAP_REBASE_SEPTEMBER_2026.md`
- `docs/plan/SUECA_FINAL_VISUAL_PASS.md`

**Roadmap pointer:** `Theme Architecture Foundation — ACTIVE WORKSTREAM` (ver rebase § Theme Architecture).

---

## Progress summary

| Campo | Valor |
|-------|--------|
| **Total stages** | 15 (Etapas 0–14) |
| **DONE** | 0 |
| **IN PROGRESS** | 0 |
| **BLOCKED** | 1 (Etapa 13 — Final Visual Passes, até foundation) |
| **NOT STARTED** | 13 |
| **DEFERRED** | 1 (Etapa 10 — Theme ↔ Deck ↔ Music ↔ SFX UX) |
| **PARTIAL / AUDIT / READY / SUPERSEDED** | 0 |
| **Current stage** | Etapa 0 — Baseline / inventário |
| **Next stage** | Etapa 1 — Theme Contract (após Exit Criteria da 0) |
| **Blockers** | nenhum técnico imediato; Etapa 13 bloqueada por foundation |
| **Last updated** | 2026-09-20 |
| **Current commit** | `ed85e15` |

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
| **STATUS** | `NOT STARTED` |
| **Objectivo** | Confirmar o estado técnico real antes da migração |

**Tasks:**

- [ ] listar todos os theme tokens actuais  
- [ ] listar aliases legacy  
- [ ] listar selectors repetidos nos 30 themes  
- [ ] listar componentes que consomem tokens  
- [ ] listar componentes que usam hardcoded colours  
- [ ] listar `.dobo-*`  
- [ ] listar `.variant-modal-*`  
- [ ] listar `.continue-button`  
- [ ] listar inline colour styles  
- [ ] listar surfaces fora de `.app-shell[data-theme]`  
- [ ] confirmar import/cascade CSS real  
- [ ] confirmar built-in vs custom divergence  
- [ ] criar baseline screenshots representativas  

**Deliverable:** audit de impacto exacto **antes** de código.  
**Exit criteria:** sabemos exactamente quem será afectado pela mudança de contrato.

---

## 5. Etapa 1 — Definir Theme Contract

| Campo | Valor |
|-------|--------|
| **STATUS** | `NOT STARTED` |
| **Objectivo** | Definir o contrato semântico mínimo **final** antes de implementar |

**Não** aceitar automaticamente os “14 tokens” sugeridos pelo audit externo — auditar necessidade real.

**Categorias a avaliar:**

### Surfaces
canvas/background · panel · panel border · raised · modal · chrome · overlay  

### Typography
primary · secondary/muted · inverse  

### Accent / actions
accent · accent RGB · primary action · secondary action · selected · focus  

### State
danger · success · warning  

### Game DOM
player box · active player · HUD · status surface  

### Table-related bridge
apenas o que fizer sentido **fora** da estética Phaser.

**Decisões a fechar:** nomes finais · defaults · intentional globals.

**Exit criteria:** Theme Contract **aprovado** antes de migrar componentes.

---

## 6. Etapa 2 — Token foundation

| Campo | Valor |
|-------|--------|
| **STATUS** | `NOT STARTED` |
| **Objectivo** | Implementar semantic tokens no design system **sem** alterar ainda toda a UI |

**Scope possível:** `design-tokens.json` · `design-tokens.css`

**Regras:**

- defaults neutros/coerentes  
- eliminar dependência **conceptual** do antigo purple como fallback  
- preservar compatibilidade temporária quando necessário  
- aliases legacy podem continuar **transitoriamente**  

**Tests:** token generation · CSS validity · sem mudança comportamental inesperada.

**Exit criteria:** componentes podem consumir semantic tokens independentemente do theme concreto.

---

## 7. Etapa 3 — Built-in themes migration

| Campo | Valor |
|-------|--------|
| **STATUS** | `NOT STARTED` |
| **Objectivo** | Migrar os **30** built-in themes de selector-driven para token-driven |

| Antes | Depois |
|-------|--------|
| cada theme estiliza componentes específicos | cada theme define o contrato semântico |

**Tasks:**

- [ ] definir tokens por theme  
- [ ] manter identidade visual dos 30 themes  
- [ ] reduzir selector duplication  
- [ ] verificar missing tokens  
- [ ] verificar drift entre themes  
- [ ] preservar card-back mappings  
- [ ] preservar music mappings  

**Exit criteria:** um novo componente semanticamente correcto **não** exige editar 30 theme blocks.

---

## 8. Etapa 4 — Custom themes parity

| Campo | Valor |
|-------|--------|
| **STATUS** | `NOT STARTED` |
| **Objectivo** | Custom themes obedecem ao **mesmo** Theme Contract |

**Auditar modelo actual de 5 cores:** `bgTop` · `bgBottom` · `accent` · `textTitle` · `felt`

**Decidir:** tokens derivados automaticamente · input do utilizador · globais.

**Não** redesenhar Theme Editor antes desta decisão.

**Exit criteria:** built-in e custom produzem a mesma estrutura semântica de tokens.

---

## 9. Etapa 5 — App Shell + Landing

| Campo | Valor |
|-------|--------|
| **STATUS** | `NOT STARTED` |

### Decisão de produto (já tomada)

**Landing Page deve seguir o theme activo.**

**Tasks:**

- [ ] incluir Landing no theme scope  
- [ ] remover isolamento visual antigo  
- [ ] migrar Shell Header  
- [ ] migrar Bottom Nav  
- [ ] migrar panels / chrome  
- [ ] migrar active/selected states  

**Preservar:** estrutura funcional · navegação · safe areas · touch targets.

**Exit criteria:** do primeiro ecrã ao dashboard, o theme activo é visualmente contínuo.

---

## 10. Etapa 6 — Shared component system

| Campo | Valor |
|-------|--------|
| **STATUS** | `NOT STARTED` |
| **Objectivo** | Eliminar mini-design systems paralelos |

### Buttons
`.sueca-btn` · `.dobo-btn` · `.variant-modal-primary` · `.continue-button`

### Modal shells
`.shell-panel` · `.variant-modal` · `.modal-container` · `.dobo-panel`

### Controls
radio · select · toggle · input · focus state

### Shared status
pills · badges · action bars · overlays

**Não** apagar legacy classes antes de confirmar referências.

**Exit criteria:** uma primary action tem **uma** semântica visual independentemente do componente/jogo.

---

## 11. Etapa 7 — Legacy purple cleanup

| Campo | Valor |
|-------|--------|
| **STATUS** | `NOT STARTED` |
| **Objectivo** | Remover o antigo roxo enquanto fallback **acidental** |

**Auditar / migrar (exemplos):** `#6c5ce7` · `#5a4fd6` · `#7c5cbf` · `108,92,231` · lavender · gradients · borders · radios · toggle-on · continue CTA · highlights de round/game result.

**Distinguir:** legacy accidental vs intentional visual choice.

**Exit criteria:** nenhum componente fica roxo **apenas** porque escapou ao theme.

**Nota:** alinha e absorve o cleanup transversal `GLOBAL-UI-01` / S3 quando executado nesta etapa.

---

## 12. Etapa 8 — Game-specific DOM migration

| Campo | Valor |
|-------|--------|
| **STATUS** | `NOT STARTED` |

**Ordem:**

### 8.1 Sueca
dealing/setup · HUD DOM · actions · round/game states  

### 8.2 Hearts
passing · broken/status · moon/results · action sheets  

### 8.3 Spades
bidding · nil · bags/status · selects  

### 8.4 King
negatives setup · festa auction · timeline · negotiation · counter-offer · 8-or-nulls · 4×3×3 · contract setup · score modals  

**IMPORTANTE:** estética Phaser continua **fora**.

**Exit criteria:** todos os estados React/DOM de cada jogo obedecem ao Theme Contract.

---

## 13. Etapa 9 — Responsive theme pass

| Campo | Valor |
|-------|--------|
| **STATUS** | `NOT STARTED` |

**Auditar:** mobile portrait · narrow mobile · landscape · desktop.

**Separar:** layout responsive **de** theme responsive.

Eliminar apenas hardcoded visual styling que quebre o contract.

**Exit criteria:** breakpoints **não** reintroduzem aparência legacy/global por acidente.

---

## 14. Etapa 10 — Theme ↔ Deck ↔ Music ↔ SFX UX

| Campo | Valor |
|-------|--------|
| **STATUS** | `DEFERRED` / `DESIGN PENDING` |

Arquitectura runtime actual deve ser **preservada**.

**Problema:** relação Theme ↔ Music existe tecnicamente mas é pouco visível na UX.

**Decisão futura (Francisco):** Theme como experiência completa · Personalização unificada mas independente · Hybrid — **não implementar** até decisão.

**Registar:**

- deck faces continuam desacopladas  
- card backs podem continuar theme-driven  
- music engine continua independente  
- SFX continuam independentes tecnicamente  

**Pointer:** roadmap §13 (Themes + Audio Experience Redesign).

---

## 15. Etapa 11 — Dead / superseded CSS cleanup

| Campo | Valor |
|-------|--------|
| **STATUS** | `NOT STARTED` |

Só **depois** das migrações.

Auditar/remover quando comprovadamente sem uso: aliases CRA · `.dobo-*` · old modal classes · unused CSS · duplicated selectors · dead variables.

**Nunca** apagar antes de migration completa.

---

## 16. Etapa 12 — Global visual validation

| Campo | Valor |
|-------|--------|
| **STATUS** | `NOT STARTED` |

Validar themes **representativos** (não é obrigatório 30 × todos os ecrãs).

Criar matriz por contraste/família.

**Cobrir:** landing · dashboard · settings · themes · modal · in-game chrome · intermediate · result · **custom theme** separado.

---

## 17. Etapa 13 — Retomar Final Visual Passes

| Campo | Valor |
|-------|--------|
| **STATUS** | `BLOCKED` (by Theme Foundation) |

Só depois da arquitectura temática estabilizar:

1. Sueca — revalidation  
2. Hearts — full visual pass  
3. Spades — full visual pass  
4. King — full visual pass  

**Sueca actual:** `LOCAL PASS — GLOBAL CLEANUP PENDING` (`docs/plan/SUECA_FINAL_VISUAL_PASS.md`).

**Não** repetir trabalho local já fechado salvo regressão.

---

## 18. Etapa 14 — Final release gate

| Campo | Valor |
|-------|--------|
| **STATUS** | `NOT STARTED` |

Theme architecture pode fechar quando:

- [ ] Theme Contract final implementado  
- [ ] Landing themed  
- [ ] 30 built-ins migrados  
- [ ] custom theme parity  
- [ ] shared components migrated  
- [ ] legacy purple accidental = zero  
- [ ] 4 games DOM migrated  
- [ ] responsive pass  
- [ ] no major legacy design-system leakage  
- [ ] visual passes 4/4 PASS  
- [ ] automated tests PASS  
- [ ] web build PASS  
- [ ] Android PASS  
- [ ] OPPO smoke PASS  
- [ ] docs actualizadas  

---

## 19. Decision log

| Date | Decision | Reason | Impact |
|------|----------|--------|--------|
| 2026-09-20 | **Suecão is a theme-first application.** All appropriate React/DOM surfaces, **including Landing Page**, must follow the active theme. **Phaser table aesthetics remain intentionally Premium Classic.** | Audit externo + princípio de produto; evita migração felt Phaser e fecha isolamento da Landing | Scope = React/DOM + bridge; Etapa 5 inclui Landing; Etapa 13/Phaser canvas fora |

---

## 20. Open gaps / backlog do plano

Gaps iniciais a validar na Etapa 0 (expandir conforme factos):

- Inventário exacto de tokens / aliases / hardcoded  
- Superfícies fora de `.app-shell[data-theme]`  
- Divergência built-in vs custom  
- Relação com `GLOBAL-UI-01/02/03` e `GLOBAL-CARDS-01` (PARTIAL)  
- Matriz representativa de themes para validação (Etapa 12)  

---

## 21. Change log

| Date | Change | Stage affected | Reason |
|------|--------|----------------|--------|
| 2026-09-20 | Documento canónico criado (`THEME-ARCHITECTURE-MASTER-PLAN-01`) | all (0–14) | Plano vivo da migração temática global; roadmap aponta ACTIVE WORKSTREAM |

O plano pode evoluir. A versão inicial **não** é imutável — registar todas as alterações futuras nesta tabela.

---

*THEME-ARCHITECTURE-MASTER-PLAN-01 · 2026-09-20 · documentação apenas*
