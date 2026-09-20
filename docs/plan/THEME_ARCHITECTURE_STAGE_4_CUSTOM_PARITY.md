# Theme Architecture — Stage 4 Custom Themes Parity

**ID:** `THEME-ARCHITECTURE-STAGE-4`  
**Branch:** `v2-main`  
**Date:** 2026-09-20  
**STATUS:** `DONE`  
**Commit message:** `refactor: align custom themes with semantic contract`

---

## Summary

Custom themes now emit the **same Theme Contract v1** (16 `--sc-*` tokens) as built-ins. `useCustomThemeCSS.ts` is token-driven only — no component selectors. The 5 user inputs are unchanged; derived values fill the rest. Built-in themes, Phaser, Landing, card/music curation, and Theme Editor UX are untouched.

**Architectural parity:** custom and built-in differ only in **values**, not structure.

---

## Existing 5-field model (preserved)

| Field | Maps to |
|-------|---------|
| `bgTop` | `--sc-canvas-from` |
| `bgBottom` | `--sc-canvas-to` |
| `accent` | `--sc-accent` + `--sc-accent-rgb` |
| `textTitle` | `--sc-text-title` (+ `--sc-text`) |
| `felt` | `--sc-felt` |

Schema / storage / Theme Editor unchanged. Save still requires accent contrast ≥ 3.0 vs blended canvas.

---

## Final mapping to 16 tokens

| Token | Source |
|-------|--------|
| `--sc-canvas-from` | `bgTop` |
| `--sc-canvas-to` | `bgBottom` |
| `--sc-surface` | `accent` @ 0.06 alpha |
| `--sc-surface-border` | `accent` @ 0.15 alpha |
| `--sc-surface-modal` | `darken(bgTop, 0.2)` |
| `--sc-text` | `textTitle` |
| `--sc-text-muted` | `textTitle` @ 0.65 alpha |
| `--sc-text-title` | `textTitle` |
| `--sc-accent` | `accent` |
| `--sc-accent-rgb` | parsed RGB channels |
| `--sc-turn` | `lighten(accent, 0.35)` |
| `--sc-seat` | `darken(felt, 0.4)` @ 0.45 alpha |
| `--sc-felt` | `felt` |
| `--sc-felt-dark` | `darken(felt, 0.3)` |
| `--sc-rail` | `lighten(felt, 0.2)` |
| `--sc-game-bg` | `darken(felt, 0.1)` |

**Companions (same as built-ins, not contract):**

- `--theme-bg-game-alt` = `darken(felt, 0.05)`
- `--theme-bg-game-mid` = `darken(felt, 0.15)`
- `--sueca-color-primary-dark` = `darken(accent, 0.18)`

---

## Derivation rules

Reuse existing helpers: `hexToRgb`, `hexToRgba`, `darken`, `lighten`.

- **Turn (P5):** deterministic lighten of accent — no editor field.  
- **Seat:** darkened felt with alpha — no longer missing.  
- **Game-bg:** darkened felt (not identical to felt) — preserves prior custom visual separation.  
- **Modal:** same formula as old `--theme-panel-modal`.  
- **Surface:** same alpha tint as old `.shell-panel` overrides.

No new arbitrary palette system.

---

## Generator refactor

`frontend/src/hooks/useCustomThemeCSS.ts`:

- `deriveCustomThemeTokens()` → full token map  
- `generateCSS()` → single `.app-shell[data-theme="custom_…"] { --sc-*; … }`  
- `isSafeCustomThemeId()` → `/^custom_[A-Za-z0-9_-]+$/`  
- Removed all `.shell-panel`, button, nav, title, `.game-board` selectors  
- Removed `background: linear-gradient(...)` (shell uses `--sc-canvas-*`)

---

## Legacy compatibility

Stage 3 `.app-shell[data-theme]` alias bridge applies to custom ids too:

`--sueca-color/rgb-primary`, `--theme-panel-*`, `--theme-table-*`, `--theme-bg-game`, turn/seat → `var(--sc-*)`.

No duplicate legacy vars in generated CSS except companions (alt/mid/primary-dark) required for GameBoard / continue CTA — same as built-ins.

---

## Saved-theme compatibility

Existing localStorage shape `{ id, name, lore, colors: { bgTop, bgBottom, accent, textTitle, felt }, createdAt }` loads without migration. Unsafe ids are rejected (style cleared) rather than injected.

---

## Accessibility

Theme Editor contrast checks unchanged (accent vs canvas mid ≥ 3.0 gate). Derived muted/title/turn use title/accent inputs already validated by those checks. No new a11y policy.

---

## Card / deck / music (non-CSS parity)

Unchanged and verified by tests:

- Custom → default card back (`suecao-navy`)  
- Custom → default deck (`casino`)  
- Custom → fallback music track  

Content curation remains Stage 10 / separate workstream.

---

## Tests

`frontend/src/hooks/useCustomThemeCSS.test.ts` — 10 tests:

- safe id / reject unsafe  
- exact 16 tokens; key set == built-in classic  
- field mapping; accent↔rgb  
- turn/seat/felt-dark/rail/game-bg derived  
- token-only CSS (no selectors)  
- saved 5-field schema  
- card/music fallbacks  
- no brass/purple as custom defaults  

Also green: `themes.contract.test.ts`.

---

## Build

- `tsc --noEmit` PASS  
- `npm run build` PASS  

---

## Visual smoke

Three customs injected:

| ID | Role |
|----|------|
| `custom_cool_dark` | dark/cool |
| `custom_warm_high` | warm/high accent |
| `custom_edge_ok` | edge contrast still saveable |

Surfaces: Dashboard, Themes, Settings path available; token sampling on active custom.

Confirmed: no brass emergency; primary tracks accent via bridge; turn/seat present; style tag has `--sc-*` and no component selectors.

---

## Built-in regression

`classic` / `thebes` / `midnight` token values unchanged after Stage 4; custom style tag clears when leaving custom.

---

## Known gaps

1. Landing still ignores theme (Stage 5) — expected.  
2. Shared components still consume via aliases/compat, not all direct `--sc-*` (Stage 6).  
3. Custom card/music/deck content not curated.  
4. Phaser felt remains Premium Classic.

---

## Exit criteria

- [x] same 16-token shape  
- [x] 5 inputs preserved  
- [x] generator token-driven  
- [x] no component selectors  
- [x] turn/seat/game-bg derived  
- [x] saved themes compatible  
- [x] no emergency/purple leakage on customs  
- [x] built-ins unaffected  
- [x] card/deck/music paths OK  
- [x] Phaser unchanged  
- [x] tests / build / smoke pass  

---

*THEME-ARCHITECTURE-STAGE-4 · 2026-09-20*
