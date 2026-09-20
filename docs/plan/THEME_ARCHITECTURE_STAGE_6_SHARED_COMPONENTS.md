# Theme Architecture — Stage 6 Shared Component System

**ID:** `THEME-ARCHITECTURE-STAGE-6`  
**Branch:** `v2-main`  
**Date:** 2026-09-20  
**STATUS:** `DONE`  
**Commit message:** `refactor: consolidate shared themed components`

---

## 1. Summary

Shared UI (buttons, modal shells, form controls, selected/active, continue CTA) now paints from Theme Contract `--sc-*` directly. Parallel mini-design systems (Dobo primary gradients, Material-blue new-game, purple lang/active literals, `#2196F3`) are consolidated into one primary-action recipe. Class names like `.dobo-btn` / `.variant-modal-primary` remain as **Strategy B aliases** — not an independent visual language. Game-semantic Us/Them/Danger and intentional overlays preserved. Phaser / game-flow redesign / GLOBAL-UI-01 full audit deferred.

---

## 2. Button usage map

| Class | Declaration | Runtime consumers | Semantic role | Keep / alias / migrate |
|-------|-------------|-------------------|---------------|------------------------|
| `.sueca-btn` | `sueca-buttons.css` | Shell, settings, game actions, setup | Base control | **Keep** — contract consumer |
| `.sueca-btn--primary` | `sueca-buttons.css` | Landing flows via shared CTAs, GameActions Continue, dialogs | Primary action | **Keep** — canonical recipe |
| `.sueca-btn--secondary` | `sueca-buttons.css` | Secondary actions | Secondary surface | **Keep** |
| `.sueca-btn--ghost` | `sueca-buttons.css` | Ghost actions | Ghost | **Keep** |
| `.sueca-btn--toggle-on` | `sueca-buttons.css` | Toggle selected | Selected/active | **Keep** — accent-rgb |
| `.dobo-btn` | `dobo-ui.css` | Landing CTA, King/Sueca modals, RulesSheet, GameBoard | Primary action (alias) | **B — alias** to primary recipe |
| `.variant-modal-primary` | `dobo-ui.css` | ConfirmDialog stack, King/Sueca modals | Primary action (alias) | **B — alias** (same rule as `.dobo-btn`) |
| `.continue-button` | `GameBoard.css` | CSS path for continue CTA geometry | Primary paint + local layout | **Migrate paint** — geometry local |
| `.modal-button-primary` | `GameBoard.css` | RoundEnd / GameOver (often + `.sueca-btn--primary`) | Primary fallback paint | **Alias paint** to recipe |
| `.modal-button-new-game` | `GameBoard.css` | GameOver new game | Was Material blue | **Migrate** → shared primary paint |
| `.lang-btn.active` | `MoreScreen.css` | Language selector | Selected | **Migrate** → accent-rgb |

---

## 3. Final shared button model

Canonical primary recipe (`.sueca-btn--primary` and aliases):

```css
background: rgba(var(--sc-accent-rgb), 0.45);
border-color: rgba(var(--sc-accent-rgb), 0.65);
color: #fff;
/* hover 0.58 / 0.8; disabled opacity 0.45; focus-visible --sc-focus-ring */
```

Base `.sueca-btn` uses `--sc-surface` / `--sc-surface-border` / `--sc-text`.  
Danger uses fixed `--sc-danger-rgb` (game-semantic).

---

## 4. Dobo strategy

**Strategy B — retain names as aliases.**

| Token / class | Decision |
|---------------|----------|
| `.dobo-btn` | Alias to shared primary recipe |
| `.variant-modal-primary` | Same shared rule as `.dobo-btn` |
| `.dobo-panel` | Modal surface → `--sc-surface-modal` + `--sc-text` |
| Physical class deletion | **Stage 11** |

Dobo is no longer an independent gradient/purple visual system.

---

## 5. Modal shell model

| Concern | Token / policy |
|---------|----------------|
| Surface | `--sc-surface-modal` |
| Border | `--sc-surface-border` |
| Text | `--sc-text` / `--sc-text-title` / `--sc-text-muted` |
| Accent chrome | `--sc-accent` / `--sc-accent-rgb` |
| Overlay / scrim | Intentional global `--sc-overlay-scrim` (not theme-tinted) |
| Layout / geometry | Stays local (variant widths, bottom sheets, dealing compact) |

Consumers covered: `.variant-modal`, `.dobo-panel`, `.modal-container`, RulesSheet, Credits card, multiplayer host-wait panel. ConfirmDialog / EarlyRoundEnd / RoundEnd / GameOver inherit via those classes.

---

## 6. Forms / controls

Migrated to semantic tokens:

- PlaySetup `.form-input` / `.form-select` / radio+checkbox `accent-color`
- MoreScreen inputs/selects + checkbox accent
- VariantModals selects/inputs/radios (already Stage 6 mid-pass)
- Focus: `--sc-focus-ring`; disabled opacity preserved

No form layout redesign.

---

## 7. Selected / active model

Consistent accent recipe:

- `.sueca-btn--toggle-on`
- `.themes-card--active` / lore / info-open
- `.lang-btn.active`
- `.king-festa-choice-btn--selected`
- Hearts/Spades primary hints → `--sc-accent` (removed `#c4b5fd`)

---

## 8. Continue-button strategy

- **Semantically:** primary action  
- **Shared:** accent-rgb paint, hover, disabled, focus-visible  
- **Local:** padding, radius, min-width/height, placement in GameBoard responsive rules  
- Runtime Continue in GameActions already uses `.sueca-btn--primary`; CSS `.continue-button` path aligned so any remaining consumers match.

---

## 9. Compatibility bridge impact

| Legacy token | Component CSS consumers before* | After (component CSS excl. bridge) |
|--------------|----------------------------------|-------------------------------------|
| `--sueca-rgb-primary` | ~9 files / ~24 hits (Stage 5 baseline) | **0** |
| `--sueca-color-primary` | ~10 files / ~49 hits | **0** in component CSS |
| `--color-primary` | scattered | **0** in component CSS |
| `--theme-panel-*` | RulesSheet + host-wait etc. | **0** in component CSS |

\*Baseline from Stage 5 / Stage 6 kickoff audit.

Bridge **still required** for: `themes.css` / `design-tokens.css` aliases, Phaser `phaserTheme.ts`, custom generator `--sueca-color-primary-dark`, Stage 11 cleanup.

---

## 10. Purple removed / remaining

**Removed by Stage 6 shared migration:**

- MoreScreen `#6c5ce7` fallback on `.lang-btn.active`
- VariantModals `#c4b5fd` bid/pass primary hints + auction bid colour
- GameBoard spinner `#7c4dff` fallback
- Credits `rgba(10,10,30,…)` card surface
- Material `#2196F3` new-game button
- Continue / Dobo / modal-primary legacy gradients

**Remaining (Stage 7 GLOBAL-UI-01):**

- Classic theme intentional purple (`themes.css` Classic block)
- `ErrorBoundary.tsx` `#6c5ce7`
- `PenteVisualization.tsx` team label `#6c5ce7`
- Any game-HUD leftovers not in shared chrome

**GLOBAL-UI-01 not closed.**

---

## 11. Tests

`frontend/src/styles/sharedComponents.stage6.test.ts` — 11 cases:

- primary / Dobo / variant-modal-primary equivalence  
- continue shared paint  
- toggle-on / selected accent  
- modal surfaces  
- forms/controls  
- no purple literals in shared CSS  
- no `[data-theme="…"]` component selectors  
- Us/Them game semantics  
- no Material blue  

Also green: Stage 5 shell, Stage 3 themes contract, Stage 2 foundation, custom theme CSS tests (45 total in focused run).

---

## 12. Build

- `npx tsc --noEmit` — pass  
- `npm run build` — pass  

---

## 13. Visual smoke

Browser preview (`vite preview`) — themes classic / midnight / thebes / forest + one custom:

| Check | Result |
|-------|--------|
| Landing CTA | Shared primary alias (dobo-btn) follows accent |
| Dashboard / shell buttons | `--sc-*` |
| Settings / More toggles+lang | Accent selected |
| ConfirmDialog / variant-modal | Semantic surface + primary |
| Continue / modal primary | Shared paint |
| No emergency brass on themed UI | Pass (theme scope) |
| Classic purple only when Classic | Pass |
| Focus / disabled present | Pass (CSS + tests) |

---

## 14. OPPO smoke

**Unavailable** this session — no OPPO device attached.  
Browser smoke accepted for Stage 6 close: no touch-specific regressions introduced (touch mins / focus-visible retained). Recommend OPPO spot-check with Stage 7 if device available.

---

## 15. Metrics before / after

| Metric | Before (kickoff) | After |
|--------|------------------|-------|
| `.dobo-btn` runtime TSX files | ~9–11 | **9** (names retained; paint aliased) |
| `.variant-modal-primary` TSX files | ~6–8 | **6** (aliased) |
| `.continue-button` TSX | 0 (CSS-only path) | **0** TSX / CSS paint shared |
| Component CSS `--sueca-rgb-primary` | ~9 / ~24 | **0 / 0** |
| Component CSS `--sueca-color-primary` | ~10 / ~49 | **0 / 0** |
| Shared hardcoded purple (target CSS set) | several | **0** |

Class-name consumer counts intentionally stable (Strategy B). Paint dependence on legacy primary tokens in component CSS dropped to zero.

---

## 16. Known gaps

- Physical removal of `.dobo-*` / `.variant-modal-primary` class names → Stage 11  
- Game-specific DOM deep migration (Hearts pass layout, King auction chrome density, etc.) → Stage 8  
- Full purple audit (ErrorBoundary, Pente, stray HUD) → Stage 7  
- OPPO device smoke pending  
- Phaser still reads legacy primary aliases (intentional until Stage 11 / Phaser policy)

---

## 17. Exit criteria

- [x] primary action has one semantic system  
- [x] `.dobo-btn` no longer separate visual language  
- [x] `.variant-modal-primary` uses Theme Contract  
- [x] `.continue-button` shared semantic paint  
- [x] shared modal shells semantic  
- [x] forms/controls semantic  
- [x] selected/toggle accent semantics  
- [x] intentional globals preserved (overlay, focus, Premium HUD)  
- [x] game-semantic Us/Them/Danger preserved  
- [x] compatibility bridge consumers reduced (component CSS)  
- [x] no new theme-specific selectors  
- [x] tests pass  
- [x] build passes  
- [x] visual smoke passes  
- [x] OPPO justified (unavailable)

---

*THEME-ARCHITECTURE-STAGE-6 · 2026-09-20*
