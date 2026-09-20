# Theme Architecture — Stage 0 Baseline

**ID:** `THEME-ARCHITECTURE-STAGE-0`  
**Date:** 2026-09-20  
**Branch:** `v2-main` @ `3feef0f` (pré-commit deste doc)  
**Mode:** READ-ONLY audit + documentation  
**Canonical plan:** [`THEME_ARCHITECTURE_MASTER_PLAN.md`](./THEME_ARCHITECTURE_MASTER_PLAN.md)  
**Evidence scripts (gitignored):** `E:\SUECAO\_temp\theme-architecture-audit\stage0_*.json`

---

## 1. Executive Summary

O sistema de themes do Suecão é **maioritariamente selector-driven**, não token-driven.

| Facto | Valor medido |
|-------|----------------|
| Built-in theme IDs (TS) | **30** (`BuiltInThemeId`, inclui `classic`) |
| Themes com bloco em `themes.css` | **29** (`classic` **não** tem bloco) |
| `themes.css` | **1262** linhas · **~48 KB** |
| Regras em `themes.css` | **~12%** só tokens · **~88%** selectors de componente |
| Tokens `:root` em `design-tokens.css` | **36** |
| Tokens em `design-tokens.json` | **subset pequeno** (ainda com purple `#6c5ce7`) |
| Custom theme fields | **5** (`bgTop`, `bgBottom`, `accent`, `textTitle`, `felt`) |
| Ocorrências literal cor/gradiente (scan) | **~1057** (muitas em `themes.css` + `GameBoard.css`) |
| Landing | **fora** de `.app-shell[data-theme]` |

**Implicação para Etapa 1:** o Theme Contract tem de cobrir surfaces/actions/text **antes** de migrar os 29 blocos duplicados; `classic` hoje = defaults `:root` (purple legacy).

---

## 2. Token Inventory

### 2.1 `design-tokens.css` (`:root`) — 36 vars

| Token | Defined in | Default value | Rebound by built-in themes? | Rebound by custom themes? | Consumers (evidência) | Legacy? | Notes |
|-------|------------|---------------|----------------------------|---------------------------|------------------------|---------|-------|
| `--sueca-color-primary` | design-tokens.css | `#6c5ce7` | **NÃO** (themes override selectors, não esta var) | **NÃO** | GameBoard.css, VariantModals.css, MoreScreen.css, Phaser bridge | YES (purple) | Fallback accidental GLOBAL-UI-01 |
| `--sueca-color-primary-dark` | design-tokens.css | `#5a4fd6` | NÃO | NÃO | GameBoard.css | YES | |
| `--sueca-color-us` | design-tokens.css | `#3484ea` | NÃO observado em themes.css | NÃO | GameBoard / team UI | NO (game semantic) | |
| `--sueca-color-them` | design-tokens.css | `#e25c5c` | NÃO | NÃO | GameBoard / team UI | NO | |
| `--sueca-color-danger` | design-tokens.css | `#dc3545` | NÃO | NÃO | buttons/danger paths | NO | |
| `--sueca-color-surface` | design-tokens.css | `rgba(255,255,255,0.08)` | NÃO tipicamente | NÃO | sparse | PARTIAL | |
| `--sueca-color-text` | design-tokens.css | `#e9eef7` | NÃO via var; titles usam selectors | NÃO gera text token | Phaser `phaserTheme.ts`, CSS | PARTIAL | |
| `--sueca-rgb-primary` | design-tokens.css | `108, 92, 231` | NÃO | NÃO | sueca-buttons, dobo-ui, BottomNav, ThemesScreen, HomeDashboard, VariantModals, GameBoard | YES | RGB helper do purple |
| `--sueca-rgb-us` / `--them` / `--danger` / `--text` | design-tokens.css | (ver ficheiro) | NÃO | NÃO | rgba(...) helpers | mixed | |
| `--color-surface` | design-tokens.css | `rgba(255,255,255,0.06)` | NÃO | NÃO | VariantModals / RulesSheet era | YES alias | |
| `--color-text` | design-tokens.css | `#e9eef7` | NÃO | NÃO | Phaser fallback | YES alias | |
| `--color-primary` | design-tokens.css | `#6c5ce7` | NÃO | NÃO | Phaser fallback | YES alias | |
| `--theme-panel-modal` | design-tokens.css | `#2a3a52` | **SIM** (29 themes + custom) | **SIM** | dobo-panel, modals | NO | Mais usado token de surface |
| `--theme-panel-shell` | design-tokens.css | `rgba(255,255,255,0.06)` | **Raro/ausente** nos blocos auditados | NÃO explícito | shell panels via selectors | PARTIAL | Contract gap |
| `--theme-table-felt` (+ dark/rail) | design-tokens.css | Premium Classic greens/brass | **SIM** em `.game-board` por theme | **SIM** (felt + derived) | GameBoard.css, VariantModals, Phaser CSS host | NO | DOM table tokens; Phaser felt **ignora** |
| `--theme-bg-game` (+ alt/mid) | design-tokens.css | purple-ish blues | **SIM** (29) | **SIM** (derived) | GameBoard.css | PARTIAL | Defaults ainda “violeta mesa” |
| `--theme-player-box` | design-tokens.css | `rgba(0,0,0,0.25)` | **SIM** (subset + early themes) | NÃO | GameBoard seats DOM | NO | |
| `--theme-turn-indicator` | design-tokens.css | `#ffd700` | **SIM** (muitos themes) | NÃO | GameBoard.css; Phaser `active` | NO | |
| `--premium-hud-*` / `--premium-font` | design-tokens.css | Premium HUD | NÃO por theme | NÃO | GameBoard.css | NO | UX-P3.3; quasi-global |
| `--sueca-radius-*` / `--sueca-space-*` / `--sueca-touch-min` | design-tokens.css | 10/12/6/12/16/48 | NÃO | NÃO | shell + buttons + many screens | NO | spacing/shape |

### 2.2 `design-tokens.json`

Subset DTCG: `color.primary=#6c5ce7`, `primaryDark`, `us`, `them`, `surface`, `text`, radius, space, touchMin.  
**Nota:** JSON ainda ancora purple; não é o contrato runtime completo (CSS tem mais vars).

### 2.3 Tokens locais / layout (não theme-system)

`--table-size`, `--card-w`, `--trick-size`, `--status-penalty-card-*`, `--button-min-w` em `GameBoard.css` — layout/responsive, não identidade temática.

---

## 3. Legacy Alias Inventory

| Alias | Origem | Destino real | Consumers (aprox.) | Ainda usado? | Transitional? | Required? |
|-------|--------|--------------|--------------------|--------------|---------------|-----------|
| `--color-primary` | design-tokens.css | espelha `--sueca-color-primary` | Phaser + possíveis CSS | SIM | SIM | até Phaser/bridge limpo |
| `--color-text` | idem | `--sueca-color-text` | Phaser | SIM | SIM | idem |
| `--color-surface` | idem | surface modal legacy | VariantModals era | SIM | SIM | enquanto VariantModals depender |
| `.dobo-btn` | dobo-ui.css | alias visual → primary button | vários TSX + CSS | SIM runtime | SIM | até Etapa 6 |
| `.variant-modal-primary` | dobo-ui.css | mesmo que dobo-btn | King/Hearts/Sueca modals | SIM | SIM | até Etapa 6 |
| `.dobo-panel` | dobo-ui.css | `background: var(--theme-panel-modal)` | Round/Game over, Confirm, Rules | SIM | SIM | útil (já tokenizado parcialmente) |
| Fallback `#7c5cbf` em VariantModals `accent-color` | VariantModals.css | se primary var falhar | radios | SIM | YES legacy | |

**Não classificado como dead:** todas as classes acima têm referências TSX/CSS activas.

---

## 4. Built-in Theme Structure

| Métrica | Valor |
|---------|-------|
| Built-in IDs (TS) | 30 |
| Blocos CSS | 29 |
| Ausente em `themes.css` | **`classic`** (usa `:root` + App shell default) |
| Linhas `themes.css` | 1262 |
| Padrão por theme (quase todos) | bg gradient + `--theme-panel-modal` + `.shell-panel` + titles + `.bottom-nav-item.active` + `.sueca-btn--primary`(+hover) + `.themes-card--active` / `.dashboard-game-row--active` + `.game-board` felt/rail/bg tokens (+ player-box/turn em muitos) |

### Token-driven vs selector-driven (quantificado)

| Tipo de regra em `themes.css` | Count | % |
|-------------------------------|-------|---|
| Corpo só com `--*` (token defs) | 29 | **12.3%** |
| Selectors de componente / propriedades concretas | 206 | **87.7%** |

**Conclusão objectiva:** o system é **~88% selector-driven**.

---

## 5. Selector Duplication / Drift

| Selector / Token | Themes containing it | Missing | Drift? | Purpose |
|------------------|---------------------|---------|--------|---------|
| `(root)` bg + `--theme-panel-modal` | 29/29 CSS themes | `classic` | values drift per palette | shell canvas + modal surface |
| `.shell-panel` | 29 | classic | yes (accent rgba) | panels |
| title cluster (`.shell-section-title`, `.screen-title`, …) | 29 | classic | yes | typography accent |
| `.bottom-nav-item.active` | 29 | classic | yes | nav selected |
| `.sueca-btn--primary` (+ hover) | 29 | classic | yes | primary CTA |
| `.themes-card--active` / `.dashboard-game-row--active` | 29 (muitos partilham regra) | classic | yes | selection chrome |
| `.game-board` felt/rail/bg vars | 29 | classic | yes | DOM table tokens |
| `--theme-turn-indicator` / `--theme-player-box` | maioria (não 100% compact themes iguais) | classic + possível compact omit | yes | HUD DOM / Phaser active |

**Hover/focus:** primary hover espelhado por theme; `focus-visible` global em buttons/continue — **não** re-temado por theme block (inconsistência potencial).

**Drift:** esperado (paletas diferentes); **problema** = duplicação estrutural idêntica ×29.

---

## 6. Component Consumption Map

| Component / CSS | Consumed tokens | Hardcoded styling | Theme-aware | Notes |
|-----------------|-----------------|-------------------|-------------|-------|
| LandingPage.css | touch-min only | **heavy** gradients/purple | **NO** | fora app-shell |
| App.tsx shell | data-theme attr | — | YES | shell + game roots |
| themes.css | defines overrides | all literals | YES | selector model |
| design-tokens.css | defines defaults | purple defaults | YES | |
| app-shell / shell-screens | panels/titles | some | PARTIAL | dependem de theme selectors |
| BottomNav.css | `--sueca-rgb-primary` | — | PARTIAL | active também themed via themes.css |
| sueca-buttons.css | rgb-primary | — | PARTIAL | themed só se `.sueca-btn--primary` override |
| dobo-ui.css | panel-modal + rgb-primary | #fff text | PARTIAL | |
| ThemesScreen / HomeDashboard | rgb-primary | — | PARTIAL | active cards themed in themes.css |
| VariantModals.css | primary, table felt, color-* | `#7c5cbf` fallback | PARTIAL | game sheets |
| GameBoard.css | table/HUD/premium/primary | large local palette | PARTIAL | DOM chrome + continue CTA |
| ConfirmDialog | VariantModals + dobo-panel | — | PARTIAL | in-tree, herda shell |
| RoundEnd/GameOver | modal-container + dobo-panel | GameBoard modal CSS | PARTIAL | |
| King/Hearts/Spades modals | variant-modal* | — | PARTIAL | |
| ErrorBoundary | — | `#6c5ce7` inline | **NO** | |
| PenteVisualization | — | `#6c5ce7` / `#ff6b6b` inline | **NO** | |
| Phaser host CSS | felt-dark token | — | bridge | |
| phaserTheme.ts | text/primary/turn | Premium felt constants | PARTIAL bridge | felt ignored |

---

## 7. Hardcoded Visual Inventory

Scan: **~1057** literais cor/gradiente em `frontend/src` (css/ts/tsx).

### Distribuição (top)

- `styles/themes.css` — maioria (paletas ×29) → class **D** (component-specific theme literals; esperado hoje)
- `components/GameBoard.css` — HUD/continue/modals → **C/D** mixed
- `LandingPage.css` — **C** legacy isolation
- `design-tokens.css` — **C** purple defaults
- Inline ErrorBoundary / Pente — **C**

### Exemplos classificados

| File | Selector/component | Literal | Role | Class | Theme bypass |
|------|-------------------|---------|------|-------|--------------|
| design-tokens.css | `:root` primary | `#6c5ce7` | accent default | C legacy | fallback when no override |
| LandingPage.css | `.landing-root` | purple gradient | landing canvas | C | no data-theme |
| VariantModals.css | radio accent | `#7c5cbf` fallback | form accent | C | var fallback |
| ErrorBoundary.tsx | button style | `#6c5ce7` | recovery CTA | C | inline |
| PenteVisualization.tsx | labels | `#6c5ce7` | team color | B/C ambiguous | inline |
| themes.css | per-theme buttons | rgba accents | themed CTA | D | intentional today |
| premium-hud tokens | ivory/brass | Premium HUD | A intentional global | product choice UX-P3 |

---

## 8. Legacy Class Inventory

| Class family | Declaration | Usage files (sample) | Refs | Active runtime? | Fallback-only? | Migration candidate? |
|--------------|-------------|----------------------|------|-----------------|----------------|----------------------|
| `.dobo-panel` | dobo-ui.css | RoundEnd, GameOver, Confirm, Rules, King*, Credits | muitos | YES | NO | Etapa 6/11 |
| `.dobo-btn` | dobo-ui.css | Landing, King*, SuecaDealing, RulesSheet, GameBoard | muitos | YES | NO | Etapa 6 |
| `.variant-modal*` | VariantModals.css | Hearts/King/Sueca/Confirm/EarlyEnd | muitos | YES | NO | Etapa 6/8 |
| `.variant-modal-primary` | dobo-ui.css | same as primary CTA | sim | YES | alias | Etapa 6 |
| `.continue-button` | GameBoard.css | GameActions flow | sim | YES | NO | Etapa 6/7 |
| `.modal-container*` | GameBoard.css | RoundEnd/GameOver | sim | YES | NO | Etapa 6 |

---

## 9. Inline Style Inventory

| Kind | Count (scan) | Notes |
|------|--------------|-------|
| Theme-relevant inline | **14** | ErrorBoundary purple; Pente colors; GameBoard **dev** festa badge (dev-only) |
| Layout-only inline | presente | positioning; fora do contrato de cor |

**Distinção:** só os theme-relevant entram no cleanup futuro; layout-only OK.

---

## 10. Theme Scope Audit

| Surface | DOM root | Inside app-shell? | Has data-theme? | Inherits vars? | Risk |
|---------|----------|-------------------|-----------------|----------------|------|
| Landing | `.App.App--full` → `.landing-root` | **NÃO** | **NÃO** | `:root` only | **HIGH** (produto: deve seguir theme) |
| Shell tabs | `.App.app-shell` | SIM | SIM | SIM | LOW |
| In-game | `.App.app-shell.app-shell--game` | SIM | SIM | SIM | LOW |
| ConfirmDialog / variant modals | in-tree sob shell/game | SIM (quando shell/game) | herda | SIM | LOW–MED |
| Round/Game over overlays | in-tree GameBoard | SIM | herda | SIM | MED (modal CSS próprio) |
| ErrorBoundary | onde montado | depende | pode falhar | PARTIAL | MED |
| Custom CSS injection | `#suecao-custom-theme-css` in `document.head` | n/a | targets `.app-shell[data-theme=custom_*]` | SIM se shell | MED se landing |
| Portals | **nenhum `createPortal`** encontrado | — | — | — | N/A |

---

## 11. CSS Cascade Map

### Source order (imports)

```
LOWEST (earliest)
→ index.tsx: index.css
→ design-tokens.css          (:root tokens)
→ sueca-buttons.css
→ dobo-ui.css
→ App.tsx: App.css
→ app-shell.css
→ shell-screens.css
→ themes.css                 (built-in selector overrides)
→ component CSS (co-located; load with components)
→ GameBoard.css / VariantModals.css / LandingPage.css / …
→ RUNTIME: <style id="suecao-custom-theme-css"> (head append)
HIGHEST among equal specificity for custom when active
```

### Specificity arms race

- `.app-shell[data-theme=X] .sueca-btn--primary` **vence** `.sueca-btn--primary` (rgb-primary purple).
- Componentes que usam só `rgba(var(--sueca-rgb-primary))` **sem** override de selector → **ficam purple** (BottomNav default, ThemesScreen base, etc., excepto estados também cobertos por themes.css).
- `!important`: presente em CSS (ver `stage0_important.json`); arms race local, não sistemático em themes.

### Runtime injection

`useCustomThemeCSS` limpa ou escreve CSS gerado; **não** redefine `--sueca-rgb-primary`.

---

## 12. Built-in vs Custom Parity

Custom fields (`CustomThemeColors`): `bgTop`, `bgBottom`, `accent`, `textTitle`, `felt`.

Generated (same selector set as built-ins, subset): shell bg, `--theme-panel-modal`, `.shell-panel`, titles, bottom-nav active, primary btn(+hover), themes-card/dashboard active, `.game-board` felt/rail/bg derived.

| Capability | Built-in | Custom | Same contract? | Gap |
|------------|----------|--------|----------------|-----|
| Shell gradient | YES | YES | approx | YES |
| Panel modal token | YES | YES | YES | |
| Primary button selectors | YES | YES | YES | |
| Title colors | YES | YES | YES | |
| Table felt DOM tokens | YES | YES | YES | |
| `--theme-turn-indicator` / player-box | YES (many) | **NO** | **NO** | custom gap |
| `--sueca-color/rgb-primary` | defaults only | **NO** | **NO** | purple leakage on non-overridden controls |
| Card back map | THEME_CARD_VISUALS 30 | fallback navy | **NO** | custom unmapped |
| Music family/track | musicThemeMap 30 | fallback core | **NO** | custom uses fallback |
| `classic` CSS block | **missing** | n/a | — | classic = :root |

**Parity status:** **NOT SAME CONTRACT** — structural similarity on shell selectors; tokens/HUD/music/backs divergem.

---

## 13. Theme / Card / Music Boundary

| Link | Mechanism | Impact on Theme Contract |
|------|-----------|--------------------------|
| theme → `backId` | `THEME_CARD_VISUALS` | fora do CSS contract; manter API |
| theme → `deckId` | omit → casino | curation OPEN; não bloquear tokens |
| theme → music family/preferred/core | `musicThemeMap` | Etapa 10 DEFERRED; não misturar no Contract visual |
| custom | sem entradas map | fallback back/music |
| user music overrides | audioService modes | independente |

---

## 14. Phaser Boundary

| Item | Fact |
|------|------|
| Reads from DOM | `--sueca-color-text`, `--color-text`, `--theme-turn-indicator`, `--sueca-color-primary` / `--color-primary`, card back via theme id |
| Intentionally ignored | **felt / exterior / brass** → `PREMIUM_TABLE` constants |
| Refresh | `SuecaPhaserRenderer` `setInterval` poll + `themesEqual` |
| In scope for migration | host chrome CSS (`.sueca-phaser-root`), not canvas aesthetics |
| Out of scope | Premium Classic felt visuals |

---

## 15. Impact Map

### Foundation
| File | Why | Stage | Risk |
|------|-----|-------|------|
| `styles/design-tokens.css` | contract defaults | 1–2 | HIGH |
| `styles/design-tokens.json` | token source | 2 | MED |
| `styles/themes.css` | 29 blocks | 3 | HIGH |
| `hooks/useCustomThemeCSS.ts` | custom generation | 4 | HIGH |
| `types/theme.ts` / `customThemeStorage.ts` | custom model | 4 | MED |

### Shared / Landing / Shell
| File | Why | Stage | Risk |
|------|-----|-------|------|
| `LandingPage.css` / `LandingPage.tsx` | enter theme scope | 5 | HIGH |
| `App.tsx` | landing root / data-theme | 5 | MED |
| `sueca-buttons.css`, `dobo-ui.css`, `BottomNav.css` | primary semantics | 6–7 | HIGH |
| `shell-screens.css`, `app-shell.css` | chrome | 5–6 | MED |

### Game-specific
| File | Why | Stage | Risk |
|------|-----|-------|------|
| `GameBoard.css` / Actions / ScoreStrip | continue, HUD, modals | 7–8 | HIGH |
| `VariantModals.css` + King/Hearts/Spades/Sueca modals | sheets | 8 | HIGH |
| RoundEnd/GameOver | results | 8 | MED |

### Bridge / docs / tests
| File | Why | Stage | Risk |
|------|-----|-------|------|
| `phaserTheme.ts` | token names consumed | 2–7 | MED |
| theme/card/music tests | expectations | 3–4 | MED |
| this baseline + master plan | living docs | 0 | LOW |

**Impact files (prováveis, não exaustivo):** **~45–70** ficheiros tocados ao longo das etapas 1–8.

---

## 16. Regression Risk Map

| Risk | Level | Notes |
|------|-------|-------|
| Missing token fallback → purple flash / unstyled | **HIGH** | `--sueca-rgb-primary` still purple |
| Specificity regression (component CSS after themes) | **HIGH** | inverted model hoje mascara gaps |
| Custom theme breakage | **HIGH** | 5-color generator must gain contract |
| Landing contrast after theming | **HIGH** | currently isolated |
| Modal/radio accent fallbacks | **MEDIUM** | `#7c5cbf` |
| Hover/focus drift across 30 themes | **MEDIUM** | |
| Responsive overrides reintroduce purple | **MEDIUM** | GameBoard media queries |
| Phaser bridge side effects (text/accent only) | **LOW–MED** | felt safe |
| Android/Web CSS var differences | **MEDIUM** | Cap WebView |
| Tests asserting exact classes/colors | **MEDIUM** | |
| Screenshot/snapshot suite | **LOW** | não há suite formal; matriz manual abaixo |

---

## 17. Baseline Screenshot Matrix

### Themes representativos (cobertura técnica, não gosto)

| Theme | Why |
|-------|-----|
| `classic` | default / purple `:root` / sem bloco CSS |
| `midnight` | dark cool |
| `thebes` | warm high-gold |
| `thule` | cool arctic |
| `el-dorado` | high-chroma accent |
| `forest` | green organic |
| `custom_*` | parity |

### Surfaces × capture

| # | Surface | classic | midnight | thebes | thule | el-dorado | forest | custom |
|---|---------|---------|----------|--------|-------|-----------|--------|--------|
| 1 | Landing | ☐ | ☐ | ☐ | — | — | — | ☐ |
| 2 | Dashboard | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 | Themes screen | ☐ | ☐ | ☐ | — | — | — | ☐ |
| 4 | Settings / music controls | ☐ | ☐ | — | — | — | — | ☐ |
| 5 | One modal (Confirm or dealing) | ☐ | ☐ | ☐ | — | — | — | ☐ |
| 6 | Form controls (setup/radios) | ☐ | ☐ | — | — | — | — | ☐ |
| 7 | In-game chrome (Sueca) | ☐ | ☐ | ☐ | ☐ | — | — | ☐ |
| 8 | Sueca intermediate | ☐ | ☐ | — | — | — | — | — |
| 9 | Hearts pass/intermediate | ☐ | ☐ | — | — | — | — | — |
| 10 | Spades bidding | ☐ | ☐ | — | — | — | — | — |
| 11 | King auction/negotiation | ☐ | ☐ | — | — | — | — | — |
| 12 | Round result | ☐ | ☐ | — | — | — | — | — |
| 13 | Game result | ☐ | ☐ | — | — | — | — | — |

Pastas sugeridas: `E:\SUECAO\_temp\theme-architecture-stage-0\`.

---

## 18. Confirmed Facts

1. Themes são **selector-driven (~88%)**, não semantic-token-driven.  
2. **`classic` não tem bloco** em `themes.css`.  
3. Defaults `--sueca-color-primary` / `--sueca-rgb-primary` = **legacy purple**.  
4. Built-ins **não** rebindam `--sueca-rgb-primary`; themam botões via selectors.  
5. Custom themes **não** partilham contrato completo (faltam turn/player-box/primary tokens; backs/music fallback).  
6. Landing **fora** de `data-theme`.  
7. Phaser felt = Premium Classic; lê text/accent/turn + card back.  
8. Sem React portals; modals in-tree.  
9. Três gerações CSS coexistentes: Dobo aliases, purple tokens, modern shell/UX-P3 premium HUD.  
10. `design-tokens.json` ≠ superfície completa do runtime CSS.

---

## 19. Open Questions (para Etapa 1 — Contract)

1. Quantos tokens semânticos mínimos (não aceitar “14” sem audit)?  
2. `classic` passa a bloco explícito ou continua `:root`?  
3. Premium HUD tokens — globais intencionais ou theme-tintáveis?  
4. Custom: derivar turn/player-box/primary RGB automaticamente dos 5 campos?  
5. Landing: herdar `data-theme` no mesmo `App` root ou wrapper dedicado?  
6. Us/Them/Danger — tokens de jogo fixos vs theme-aware?  
7. Relação com GLOBAL-UI-01 (purple) — absorvido na Etapa 7 confirmado.

---

## 20. Exit Criteria Assessment

| Etapa 0 checkbox | Covered? | Evidence |
|------------------|----------|----------|
| listar theme tokens | YES | §2 |
| aliases legacy | YES | §3 |
| selectors repetidos 30 themes | YES | §4–5 (29 CSS + classic) |
| componentes que consomem tokens | YES | §6 |
| hardcoded colours | YES | §7 |
| `.dobo-*` / variant-modal / continue | YES | §8 |
| inline colour styles | YES | §9 |
| surfaces fora app-shell | YES | §10 |
| import/cascade real | YES | §11 |
| built-in vs custom divergence | YES | §12 |
| baseline screenshot **plan** | YES | §17 (matriz; captures manuais pendentes) |
| impacto exacto | YES | §15–16 |

**Stage 0 status:** **DONE** (baseline documental completo; screenshots físicos = plano, não blocker do inventário técnico).

---

*THEME-ARCHITECTURE-STAGE-0 · 2026-09-20 · documentation only*
