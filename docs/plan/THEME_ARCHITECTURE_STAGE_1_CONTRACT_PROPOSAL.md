# Theme Architecture — Stage 1 Contract Proposal

**ID:** `THEME-ARCHITECTURE-STAGE-1-A`  
**Date:** 2026-09-20  
**Status:** `AUDIT` — awaiting Francisco approval  
**Branch:** `v2-main`  
**Inputs:** [`THEME_ARCHITECTURE_STAGE_0_BASELINE.md`](./THEME_ARCHITECTURE_STAGE_0_BASELINE.md) · código real · master plan  
**Mode:** architecture / documentation only — **não implementado**

---

## 1. Executive Summary

Proposta de **Minimum Semantic Theme Contract** derivada dos consumidores reais (Etapa 0), **não** copiada dos “14 tokens” do audit externo.

| Contagem | N |
|----------|---|
| **Proposed semantic tokens (theme-controlled)** | **15** |
| **Intentional globals** (design-system / layout / Premium HUD) | **11** |
| **Game-semantic globals** | **3** (`us`, `them`, `danger`) |
| **Explicitly component/local (fora do contract)** | **layout vars, card faces, Phaser PREMIUM_TABLE felt** |
| **Total named contract surface** | **15 + 11 + 3 = 29** slots (só **15** variam por theme) |

**Recomendação arquitectónica (Cursor):** `classic` deve ter **bloco semântico explícito** (Option B).  
**Product decisions** ficam na §16 — não decididas aqui.

**Compatibilidade:** custom themes com os **5 inputs actuais** conseguem satisfazer o mesmo contrato via mapeamento + derivação (sem redesenhar o editor).

---

## 2. Design Principles

1. **Theme-first:** React/DOM apropriado, **incluindo Landing**, segue o theme activo.  
2. **Semantic tokens → components** (não `Theme → selector de componente`).  
3. **Nomes sem papel de componente** (`--sc-accent`, não `--theme-bottom-nav-bg`).  
4. **Um semantic role = um token** (evitar duplicados primary / color-primary / accent).  
5. **RGB companion** só onde `rgba(var(--*), α)` é o padrão real de consumo.  
6. **Phaser canvas** permanece Premium Classic; o contract só garante a **bridge** (text / accent / turn / theme id → card back).  
7. **Legibilidade de jogo** (Us/Them/Danger) não depende da paleta do theme.  
8. **Mínimo que cobre UI real** — sem explosion de tokens.

Prefixo proposto: `--sc-*` (*Suecão Contract*). Aliases legacy `--sueca-*` / `--theme-*` / `--color-*` ficam na camada transitória (§13).

---

## 3. Semantic Classification

### 3.1 Taxonomy → classification

| Concept | Class | Rationale (evidence) |
|---------|-------|----------------------|
| App / landing canvas (gradient ends) | **A THEME-CONTROLLED** | Todos os 29 themes + custom `bgTop`/`bgBottom` |
| Panel / shell surface + border | **A** | `.shell-panel` ×29; custom accent-alpha |
| Modal surface | **A** | `--theme-panel-modal` universal |
| Raised / selected fill | **A** (via accent+alpha nos componentes; sem token extra obrigatório) | `.themes-card--active`, dashboard rows |
| Overlay/dim scrim | **B INTENTIONAL GLOBAL** | `rgba(0,0,0,*)` estável em modals; não varia por theme hoje |
| Control surface (inputs) | **A** parcial → usa `surface` + `border` + accent | radios usam accent-color |
| Text primary / muted / title | **A** | titles ×29; body text `:root`; custom `textTitle` |
| Accent + RGB | **A** | primary CTA / toggle / nav; custom `accent` |
| Primary action hover | **A** (derivado: accent + alpha no CSS do componente) | não precisa token separado |
| Secondary / ghost actions | **B** (neutros branco-alpha) | `sueca-btn--secondary/ghost` |
| Selected / active | **A** (accent + alpha) | bottom-nav, cards |
| Focus ring | **B** | `outline` branco-alpha em buttons; legibilidade cross-theme |
| Danger | **C GAME-SEMANTIC GLOBAL** | `--sueca-color-danger` / rgb; CTAs destrutivos |
| Success / warning | **D / sparse** | sem sistema consistente de consumers → **fora** do contract mínimo; locais se aparecerem |
| Us / Them | **C** | `--sueca-color-us/them`; scoreboard readability |
| Player box / turn | **A** | themes set; Phaser lê turn; custom **não** seta hoje → gap a fechar por derivação |
| HUD Premium ivory/brass | **B** (recomendada) | UX-P3.3; só `GameBoard.css`; não rebounded por theme |
| DOM table felt/rail/bg | **A** | `.game-board` ×29 + custom `felt` |
| Phaser felt/rail | **D / out of theme contract** | `PREMIUM_TABLE` constants |
| Spacing / radius / touch | **B** | `--sueca-space/radius/touch-min` |
| Font family | **B** | shell + `--premium-font` |
| Card face ink | **D** | assets |
| Card back | **fora do CSS contract** | `THEME_CARD_VISUALS` / registry |

### 3.2 Counts

| Class | Count of roles in this proposal |
|-------|----------------------------------|
| A Theme-controlled tokens | **15** |
| B Intentional global | **11** (scrim, focus, secondary neutrals pattern, space×3, radius×2, touch, font, premium-hud set as one bundle counted in globals table) |
| C Game-semantic | **3** |
| D Component/local / out | layout CSS vars, card faces, Phaser felt |

---

## 4. Current → Target Mapping

| Current token / literal / selector | Current role | Target semantic token | Classification | Migration stage | Notes |
|------------------------------------|--------------|----------------------|----------------|-----------------|-------|
| `--sueca-color-primary` | accent / CTA fallback | `--sc-accent` | A | 2–7 | deixar de ser purple default |
| `--sueca-color-primary-dark` | hover darken | *(derivado)* accent darken **ou** alpha no componente | A/local | 6–7 | preferir alpha; evitar 2º token |
| `--sueca-rgb-primary` | rgba helper | `--sc-accent-rgb` | A | 2–7 | |
| `--color-primary` | alias Phaser | alias → `--sc-accent` | transitional | 2–12 | |
| `--sueca-color-text` | body text | `--sc-text` | A | 2–5 | |
| `--color-text` | alias | → `--sc-text` | transitional | 2–12 | |
| `--color-surface` | modal-ish | → `--sc-surface-modal` ou `--sc-surface` | transitional | 2–6 | |
| `--theme-panel-modal` | modal panel | `--sc-surface-modal` | A | 2–3 | |
| `--theme-panel-shell` | shell panel (subusado) | `--sc-surface` | A | 2–5 | unificar |
| shell-panel hardcoded rgba | panel fill/border | `--sc-surface` / `--sc-surface-border` | A | 3–5 | fim dos selectors ×29 |
| title color literals | titles | `--sc-text-title` | A | 3–5 | |
| `--theme-table-felt` | DOM felt | `--sc-felt` | A | 2–8 | Phaser **não** consome |
| `--theme-table-felt-dark` | DOM felt dark | `--sc-felt-dark` | A | 2–8 | |
| `--theme-table-rail` | DOM rail | `--sc-rail` | A | 2–8 | |
| `--theme-bg-game*` | game chrome bg | `--sc-game-bg` (+ opcional alt derivado) | A | 2–8 | `mid/alt` = derive |
| `--theme-player-box` | seat DOM | `--sc-seat` | A | 2–8 | |
| `--theme-turn-indicator` | turn + Phaser active | `--sc-turn` | A | 2–8 | |
| `--premium-hud-*` | in-game HUD | **keep as globals** (ver §9) | B | — | não theme-tint na v1 contract |
| `--sueca-color-us/them` | teams | keep names ou `--sc-game-us/them` | C | 2 | |
| `--sueca-color-danger` + rgb | danger | `--sc-danger` + `--sc-danger-rgb` | C | 2 | |
| Landing gradients | isolated canvas | `--sc-canvas-from/to` | A | 5 | |
| `#6c5ce7` literals | legacy | remove via consumers | C→cleanup | 7 | |
| `.sueca-btn--primary` theme selectors | CTA paint | consume `--sc-accent-rgb` | A | 3–6 | |
| focus outline white | a11y | `--sc-focus-ring` global | B | 2 | |

---

## 5. Proposed Minimum Theme Contract

### 5.1 Theme-controlled — **15 tokens**

| Proposed token | Meaning | Default (neutral, non-purple) | Theme varies? | Built-in source today | Custom derivation | Consumers |
|----------------|---------|-------------------------------|---------------|----------------------|-------------------|-----------|
| `--sc-canvas-from` | canvas gradient start | `#1a2438` | YES | theme `background` stop 0% | `bgTop` | Landing, app-shell |
| `--sc-canvas-to` | canvas gradient end | `#121820` | YES | theme `background` stop 100% | `bgBottom` | idem |
| `--sc-surface` | panel / chrome fill | `rgba(255,255,255,0.06)` | YES | `.shell-panel` bg | `accent @ 0.06` | shell panels, cards |
| `--sc-surface-border` | panel border | `rgba(255,255,255,0.15)` | YES | `.shell-panel` border | `accent @ 0.15` | panels, inputs |
| `--sc-surface-modal` | modal / sheet surface | `#243044` | YES | `--theme-panel-modal` | `darken(bgTop, ~0.2)` | dobo-panel, variant modals, confirm |
| `--sc-text` | primary readable text | `#e9eef7` | YES | `--sueca-color-text` | `textTitle` or lighten | body, InGameBar, Phaser text |
| `--sc-text-muted` | secondary text | `rgba(233,238,247,0.65)` | YES | literals / player muted | `textTitle @ 0.65` | meta, hints |
| `--sc-text-title` | accent titles | `#e8e0d0` | YES | title selectors ×29 | `textTitle` | section titles, hub |
| `--sc-accent` | brand/interaction accent | `#c5a45b` (neutral brass — **not** purple) | YES | implied by button rgba | `accent` | links, accents, Phaser accent |
| `--sc-accent-rgb` | RGB channels for alpha | `197, 164, 91` | YES | missing today (purple rgb) | from `accent` | primary btn, toggle, nav, radios |
| `--sc-turn` | active turn cue | `#e8c56a` | YES | `--theme-turn-indicator` | `lighten(accent)` or accent | GameBoard, Phaser `active` |
| `--sc-seat` | player box fill | `rgba(0,0,0,0.25)` | YES | `--theme-player-box` | `felt @ dark + alpha` | seats DOM |
| `--sc-felt` | DOM table felt | `#173C3B` | YES | `--theme-table-felt` | `felt` | GameBoard DOM / host |
| `--sc-felt-dark` | DOM felt dark / exterior chrome | `#10191B` | YES | `--theme-table-felt-dark` | `darken(felt)` | GameBoard, phaser host css |
| `--sc-rail` | DOM rail accent | `#C5A45B` | YES | `--theme-table-rail` | `lighten(felt)` | GameBoard DOM |

**Explicitly not separate tokens (derive in components):**

- primary hover/pressed → `rgba(var(--sc-accent-rgb), 0.58/0.8)` (padrão actual)  
- selected row/card → accent alpha (0.12/0.55)  
- `--theme-bg-game*` → `--sc-game-bg` **opcional**: se necessário na implementação, alias de `--sc-felt` / darken; **não** no mínimo 15 se `felt` bastar — ver coverage §6.

**Revision after coverage test:** in-game `GameBoard` still references `--theme-bg-game`. Add as **16th** only if felt≠game-bg in practice (Stage 0 shows they often differ).  

**Amended minimum:** keep **15** + document `--sc-game-bg` as **optional extension token** (recommended include → **16** if we refuse silent aliasing).

#### Final proposed count for approval

| Package | Count |
|---------|-------|
| **Core theme-controlled (required)** | **15** |
| **Optional theme-controlled** `--sc-game-bg` | **+1** (recommended YES — Stage 0 shows independent values) |
| **Approval target** | **16 theme-controlled** |

Including optional:

| `--sc-game-bg` | in-game board/chrome backdrop | darken(felt) | YES | `--theme-bg-game` | `darken(felt, 0.05–0.1)` | GameBoard |

**Proposed semantic token count (theme-controlled): 16.**

### 5.2 Intentional globals — **11**

| Token / bundle | Meaning | Default |
|----------------|---------|---------|
| `--sc-overlay-scrim` | modal dim | `rgba(0,0,0,0.55)` |
| `--sc-focus-ring` | focus-visible | `rgba(255,255,255,0.5)` |
| `--sc-action-secondary-bg` / border pattern | secondary buttons | white-alpha (can stay hardcoded pattern or 2 globals) |
| `--sueca-radius-md/lg` | shape | keep |
| `--sueca-space-sm/md/lg` | spacing | keep |
| `--sueca-touch-min` | a11y touch | keep |
| `--premium-font` | HUD type | keep |
| `--premium-hud-panel` | HUD fill | keep |
| `--premium-hud-panel-strong` | HUD strong | keep |
| `--premium-hud-border` | HUD border | keep |
| `--premium-hud-text` | HUD text | keep |

*(Secondary button: classed as intentional global pattern; need not explode into many tokens.)*

### 5.3 Game-semantic globals — **3**

| Token | Meaning | Default |
|-------|---------|---------|
| `--sc-game-us` (alias `--sueca-color-us`) | Nós | `#3484ea` |
| `--sc-game-them` | Eles | `#e25c5c` |
| `--sc-danger` + `--sc-danger-rgb` | destructive | `#dc3545` / `220,53,69` |

Success/warning: **not in minimum contract** (no consistent consumer system).

---

## 6. Contract Coverage Validation

| Surface | Fully representable? | Game-semantic? | Component-local? | Missing? |
|---------|----------------------|----------------|------------------|----------|
| Landing | YES com canvas + text + accent | — | hero art optional | was: no theme scope |
| App shell | YES | — | — | — |
| Dashboard | YES surface/selected/title | — | — | — |
| BottomNav | YES accent-rgb | — | — | — |
| InGameBar | YES text/surface | — | — | — |
| Standard primary button | YES accent-rgb | — | — | — |
| Toggle on | YES accent-rgb | — | — | — |
| Select / radio | YES accent (+ accent-color) | — | — | — |
| Modal / ConfirmDialog | YES surface-modal + text + danger | danger | — | — |
| Round / game result | YES modal + us/them | us/them | modal layout | — |
| Sueca dealing | YES | — | — | — |
| Hearts passing | YES | — | pass UI layout | — |
| Spades bidding | YES | — | — | — |
| King auction / negotiation / result | YES | — | timeline chrome local OK | — |
| Custom theme | YES via §8 derivation | — | — | turn/seat must be derived |
| Phaser bridge | YES text/accent/turn | — | felt ignored | aliases §12 |

**Revision applied:** added recommended `--sc-game-bg` after GameBoard check.

---

## 7. Classic Theme Analysis

**Fact:** `classic` is a built-in ID; **no** `themes.css` block; appearance = `:root` defaults (today purple-primary).

### Option A — Classic = canonical `:root` defaults

| Pros | Cons |
|------|------|
| Zero duplication for classic | Missing-token bugs silenciosos (parece “OK” por fallback) |
| Custom/unmapped fall into same pool | Confunde “default system” com “theme classic” |
| | Purple legacy vive no mesmo sítio que defaults neutros futuros |

### Option B — Classic gets explicit semantic block (like others)

| Pros | Cons |
|------|------|
| 30/30 themes same shape | +1 block to maintain |
| Missing tokens detectable (theme without `--sc-accent` fails checklist) | Slightly more CSS until token-driven |
| Clear migration target; classic can be non-purple without poisoning `:root` neutrals | |
| Aligns built-in vs custom (both assign full contract) | |

### Comparison criteria

| Criterion | A | B |
|-----------|---|---|
| Consistency | weaker | **stronger** |
| Fallback safety | mixes system default + theme | system defaults = emergency only |
| Custom architecture | custom looks “special” | same assignment model |
| Migration complexity | classic special-cased forever | uniform Stage 3 |
| Maintenance | hidden coupling | explicit |
| Detect missing tokens | hard | **easy** |
| Accidental legacy fallback | **high** | lower |

### RECOMMENDATION (architectural — Francisco approval)

**Option B — explicit `classic` semantic theme block** (or equivalent token map entry), with `:root` holding **neutral emergency defaults** only (non-purple).

---

## 8. Custom Theme Derivation

Inputs unchanged: `bgTop`, `bgBottom`, `accent`, `textTitle`, `felt`.

| Semantic token | Mapping |
|----------------|---------|
| `--sc-canvas-from` | **A** direct `bgTop` |
| `--sc-canvas-to` | **A** direct `bgBottom` |
| `--sc-accent` | **A** direct `accent` |
| `--sc-accent-rgb` | **B** parse hex → channels |
| `--sc-text-title` | **A** direct `textTitle` |
| `--sc-text` | **B** `textTitle` (or slight lighten) |
| `--sc-text-muted` | **B** `textTitle` @ α 0.65 |
| `--sc-surface` | **B** `accent` @ 0.06 |
| `--sc-surface-border` | **B** `accent` @ 0.15 |
| `--sc-surface-modal` | **B** darken(`bgTop`, ~0.2) *(já no generator)* |
| `--sc-felt` | **A** `felt` |
| `--sc-felt-dark` | **B** darken(`felt`) *(já)* |
| `--sc-rail` | **B** lighten(`felt`) *(já)* |
| `--sc-game-bg` | **B** darken(`felt`, small) |
| `--sc-turn` | **B** lighten(`accent`) or `accent` |
| `--sc-seat` | **B** `felt` dark + alpha |

| Result | |
|--------|---|
| **Custom parity achievable with current 5 inputs?** | **YES** (A+B only; no new editor fields required for contract v1) |
| **C intentional global** | overlay, focus, premium-hud, space/radius |
| **D future input** | only if Francisco wants user-controlled turn/HUD later |

---

## 9. Premium HUD Analysis

| Question | Finding |
|----------|---------|
| Consumers | `GameBoard.css` only (`--premium-hud-panel|strong|border|text`, `--premium-font`) |
| Theme rebound? | **No** (Stage 0) |
| Classification | **A intentional global Premium Classic in-game identity** with **C mixed risk** if future tints collide with app theme |

**Recommendation:** keep `--premium-hud-*` as **intentional globals** in contract v1.  
Do **not** force them onto `--sc-surface*` (different job: app chrome vs premium table HUD).  
Optional later product: mild accent tint — **product decision**, not required for migration.

---

## 10. Game / State Semantic Colours

| Colour | Recommendation | Why |
|--------|----------------|-----|
| Us | **C fixed game-semantic** | scoreboard readability across 30 palettes |
| Them | **C fixed** | idem |
| Danger | **C fixed design-system** | destructive confirm must not wash out on gold/green themes |
| Success | **omit from minimum** | no systematic consumer |
| Warning | **omit from minimum** | no systematic consumer |

Priority respected: game readability ≠ theme fashion.

---

## 11. Accessibility / Contrast Contract

### Current ThemeEditor checks (evidence)

- Relative luminance + contrast ratio helpers in `ThemeEditorScreen.tsx`  
- Gates save on **accent vs blended canvas mid ≥ 3.0**  
- Labels: ≥4.5 AA · ≥3.0 “Grande” · else Baixo  
- Also displays title vs mid contrast (informational)

### Contract-level requirements (policy)

| Requirement | Bar |
|-------------|-----|
| Title/text vs canvas | ThemeEditor-equivalent: warn &lt;3; prefer ≥4.5 for body |
| Accent vs canvas | **≥ 3.0** to save custom (current policy) |
| Primary action | accent-rgb on surface must remain distinguishable (selected/hover states) |
| Selected state | border+fill accent alpha visible on surface |
| Focus | global `--sc-focus-ring` always visible on dark UI |
| Danger | fixed red; contrast vs modal surface must remain obvious |
| Custom derivation | after derive, re-run same accent/title checks conceptually |

No new WCAG product invention beyond existing editor policy.

---

## 12. Phaser Bridge Compatibility

| Phaser reads today | Proposed token | Alias needed? |
|--------------------|----------------|---------------|
| `--sueca-color-text` / `--color-text` | `--sc-text` | YES transitional |
| `--sueca-color-primary` / `--color-primary` | `--sc-accent` | YES |
| `--theme-turn-indicator` | `--sc-turn` | YES |
| theme id → card back | unchanged registry | NO CSS |
| felt/exterior | PREMIUM_TABLE | **do not alias to `--sc-felt`** |

Polling/`themesEqual` unchanged conceptually.

---

## 13. Transitional Compatibility Layer

```
Theme defines --sc-* 
  → :root also sets legacy aliases 
    → existing consumers keep working
```

| Legacy | Maps to | Keep until | Never alias? |
|--------|---------|------------|--------------|
| `--sueca-color-primary` | `--sc-accent` | Etapa 7–8 done | — |
| `--sueca-rgb-primary` | `--sc-accent-rgb` | Etapa 6–7 | — |
| `--color-*` | sc-* | Etapa 11 | — |
| `--theme-panel-modal` | `--sc-surface-modal` | Etapa 6 | — |
| `--theme-table-*` | `--sc-felt*` | Etapa 8 | — |
| `--theme-turn-indicator` | `--sc-turn` | Phaser alias drop Etapa 11 | — |
| `.dobo-btn` / `.variant-modal-primary` | classes → sc-accent-rgb | Etapa 6 then 11 | — |
| Purple hex defaults | removed from `:root` | Etapa 2 | must not remain as “classic” |
| `--premium-hud-*` | self | permanent global | **do not alias to sc-surface** |
| Phaser PREMIUM_TABLE | self | permanent | **never alias felt** |

---

## 14. Contract Validation Matrix

| Semantic role | Token | Landing | Shell | Shared | Sueca | Hearts | Spades | King | Custom | Phaser |
|---------------|-------|---------|-------|--------|-------|--------|--------|------|--------|--------|
| Canvas | `--sc-canvas-*` | ● | ● | ● | ● | ● | ● | ● | ● | — |
| Surface / border | `--sc-surface*` | ● | ● | ● | ● | ● | ● | ● | ● | — |
| Modal | `--sc-surface-modal` | — | ● | ● | ● | ● | ● | ● | ● | — |
| Text / title / muted | `--sc-text*` | ● | ● | ● | ● | ● | ● | ● | ● | text |
| Accent + rgb | `--sc-accent*` | ● | ● | ● | ● | ● | ● | ● | ● | accent |
| Turn | `--sc-turn` | — | — | — | ● | ● | ● | ● | ● der. | active |
| Seat | `--sc-seat` | — | — | — | ● | ● | ● | ● | ● der. | — |
| Felt / rail / game-bg | `--sc-felt*` / game-bg | — | — | — | ● DOM | ● | ● | ● | ● | **ignore felt** |
| Us/Them/Danger | game globals | — | — | ● | ● | ● | ● | ● | n/a | — |
| Premium HUD | globals | — | — | — | ● | ● | ● | ● | n/a | — |

---

## 15. Architectural Recommendations (Cursor)

1. Adopt **16 theme-controlled `--sc-*` tokens** (+ globals/game as above).  
2. **Classic = Option B** (explicit theme assignment).  
3. **`:root` defaults = neutral emergency**, not purple, not “the classic look”.  
4. **Custom parity via derivation** from existing 5 fields — no editor redesign in Etapa 1–4.  
5. **Premium HUD stays intentional global**.  
6. **Us/Them/Danger stay game-semantic fixed**.  
7. **Phaser felt never bound to `--sc-felt`**.  
8. Kill selector×29 model in Etapa 3 by assigning only `--sc-*` per theme.

---

## 16. Product Decisions Required (Francisco)

| # | Decision | Options | Notes |
|---|----------|---------|-------|
| P1 | Classic architecture | **A** `:root`=classic · **B** explicit classic block | Cursor recommends **B** |
| P2 | Include `--sc-game-bg` in required 16 vs derive-from-felt only | Required · Derive | Cursor recommends **Required** (Stage 0 independence) |
| P3 | Premium HUD | Keep global · Allow theme tint later | Cursor recommends **Keep global** for v1 |
| P4 | Default emergency accent (non-purple) | Brass/gold · Teal · Other | Affects unloaded/`classic` fallback aesthetics |
| P5 | Custom turn cue | Always derive from accent · Later user control | v1 = derive |

**Not listed:** Landing themed (already decided). Phaser Premium Classic (already decided).

---

## 17. Risks

| Risk | Level |
|------|-------|
| Under-tokenizing game-bg → GameBoard mismatch | MED (mitigated by `--sc-game-bg`) |
| Over-deriving muted text → poor contrast on some customs | MED — editor checks |
| Teams confuse Premium HUD with app theme | LOW if docs clear |
| Alias layer lives too long → dual system | MED — Etapa 11 deadline |
| Francisco delays P1/P4 → Stage 2 blocked | — process |

---

## 18. Approval Checklist

Before Etapa 1 → `DONE` / Etapa 2 starts:

- [ ] Francisco approves **16** theme-controlled tokens (or annotated cut)  
- [ ] Francisco decides **P1 Classic A/B**  
- [ ] Francisco decides **P3 Premium HUD**  
- [ ] Francisco decides **P4 emergency accent**  
- [ ] Confirm custom 5-field derivation accepted  
- [ ] Confirm Phaser felt exclusion  
- [ ] Confirm Us/Them/Danger fixed  
- [ ] No CSS/TS implementation until approval  

---

*THEME-ARCHITECTURE-STAGE-1-A · 2026-09-20 · documentation only · NOT DONE*
