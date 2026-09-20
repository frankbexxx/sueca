# Theme Architecture — Stage 3 Built-in Themes Migration

**ID:** `THEME-ARCHITECTURE-STAGE-3`  
**Branch:** `v2-main`  
**Date:** 2026-09-20  
**STATUS:** `DONE`  
**Commit message:** `refactor: migrate built-in themes to semantic contract`

---

## Summary

Migrated all **30** built-in themes to Theme Contract v1 (**16** `--sc-*` tokens each). `classic` is now an **explicit** theme block (Option B). `themes.css` is token-driven; per-theme component selectors were removed. Minimal shell compatibility + an alias bridge ensure Stage 2 legacy consumers still resolve theme colours. Custom themes, Landing, shared component migration, and Phaser remain out of scope.

---

## Theme IDs (30/30)

`classic`, `forest`, `midnight`, `thebes`, `tikal`, `thule`, `knossos`, `xanadu`, `yamatai`, `shambhala`, `rapanui`, `babylon`, `ur`, `nanmadol`, `hyperborea`, `skara-brae`, `avalon`, `cartago`, `atlantida`, `petra`, `persepolis`, `axum`, `meroe`, `great-zimbabwe`, `mohenjo-daro`, `angkor`, `teotihuacan`, `tiwanaku`, `caral`, `el-dorado`

Source of truth: `BuiltInThemeId` in `billingService.ts` — matches CSS blocks 1:1.

---

## Final semantic token shape

Each `.app-shell[data-theme="…"]` defines:

| Token | Role |
|-------|------|
| `--sc-canvas-from` / `--sc-canvas-to` | Shell gradient |
| `--sc-surface` / `--sc-surface-border` / `--sc-surface-modal` | Panels / modal |
| `--sc-text` / `--sc-text-muted` / `--sc-text-title` | Typography |
| `--sc-accent` / `--sc-accent-rgb` | Primary accent (+ RGB for `rgba()`) |
| `--sc-turn` / `--sc-seat` | DOM turn cue / seat |
| `--sc-felt` / `--sc-felt-dark` / `--sc-rail` / `--sc-game-bg` | DOM table chrome |

**Companions (not contract):** `--theme-bg-game-alt`, `--theme-bg-game-mid`, `--sueca-color-primary-dark`

---

## Classic implementation

Explicit block with historical Classic identity:

- Accent **intentional purple** `#6c5ce7` / `108, 92, 231` — **only** inside `classic`, not on `:root`
- Canvas `#1a2332` → `#0f1419` (former app-shell defaults)
- Modal `#2a3a52`; Premium Classic felt/rail/game-bg greens/brass
- Turn `#ffd700`

`:root` remains brass emergency fallback (`#c5a45b`).

---

## Identity preservation method

Palettes extracted from prior selector-driven `themes.css`:

- Canvas from `linear-gradient(160deg, …)`
- Accent RGB from `.sueca-btn--primary` backgrounds
- Surface/border from `.shell-panel`
- Title from title-cluster colour
- Modal from `--theme-panel-modal`
- Game tokens from `.game-board` blocks
- Missing turn/seat/mid on compact themes → derived (documented; not artistic redesign)

---

## Selector migration

**Removed** from `themes.css` (safe via tokens + compatibility):

- `.shell-panel`
- title clusters
- `.bottom-nav-item.active`
- `.sueca-btn--primary` (+ hover)
- `.themes-card--active` / `.dashboard-game-row--active`
- `.game-board` token blocks

**Compatibility (not Stage 6 migration):**

| File | Change |
|------|--------|
| `app-shell.css` | canvas `var(--sc-canvas-*)`; titles/subtitle → `--sc-text-*` |
| `shell-screens.css` | `.shell-panel` → `--sc-surface*`; titles/hub → `--sc-text-title` |
| `HomeDashboard.css` | title/section → `--sc-text-title` / muted |
| `BottomNav.css` | active colour → `--sc-text-title` (bg already used rgb-primary) |

---

## Alias behaviour

Stage 2 aliases on `:root` alone **compute against emergency** then inherit as absolute colours — theme `--sc-*` would not flow.

**Fix:** `.app-shell[data-theme]` bridge in `themes.css` rebinds:

`--sueca-color/rgb-primary`, `--color-*`, `--theme-panel-*`, `--theme-turn/seat/table-*/bg-game` → `var(--sc-*)`

Custom themes still set legacy vars/selectors via `useCustomThemeCSS` (higher cascade wins for their literals).

---

## Transitional selectors remaining

**In `themes.css`:** none (0 component selectors).

**Outside themes.css (acceptable until Stage 5–6):**

- Custom generator still emits selector overrides
- Landing still isolated
- Some screens still use hardcoded neutrals (not theme chrome)

---

## Before / after metrics (`themes.css`)

| Metric | Stage 0 baseline | Stage 3 |
|--------|------------------|---------|
| Theme CSS blocks | 29 (+ classic missing) | **30** explicit |
| Token-only rules | ~29 (12.3%) | **31** (30 themes + 1 alias bridge) |
| Component selector rules | ~206 (87.7%) | **0** |
| % token-driven | ~12% | **100%** (within themes.css) |

Stability preferred over forcing unsafe removals — removals were only done where aliases + compatibility preserve visuals.

---

## Tests

`frontend/src/styles/themes.contract.test.ts` — 10 tests:

- 30 IDs / 30 blocks / 16 tokens each / shape equality
- Classic explicit; `:root` ≠ Classic
- accent ↔ accent-rgb consistency
- no emergency brass on built-ins
- token-driven metrics + alias bridge present
- card + music mappings intact
- no component selector regressions in themes.css

Also green: foundation, cardDeckRegistry, musicResolver.

---

## Build

- `tsc --noEmit` PASS  
- `npm run build` PASS (CSS bundle ~112→~98 kB)

---

## Visual smoke

Preview smoke (`classic`, `midnight`, `thebes`, `thule`, `el-dorado`, `forest`):

- Dashboard / Themes / Settings / Sueca in-game OK
- Alias bridge: `--sueca-color-primary` tracks theme accent (not brass)
- No built-in on emergency brass
- Classic purple present only under `classic`
- Game DOM felt/rail/turn differ per theme

---

## Custom theme compatibility

`useCustomThemeCSS` unchanged — still selector-driven + legacy vars. Built-in path is token-driven. Documented divergence → Stage 4.

---

## Known gaps

1. Custom ≠ built-in contract (Stage 4)
2. Landing still unthemed (Stage 5)
3. Shared components not fully on `--sc-*` direct consumption (Stage 6) — compatibility bridges only
4. `--theme-bg-game-alt/mid` still companions, not contract
5. Compact themes’ missing turn/seat were derived; visual delta vs prior omit is small
6. Nav active text now uses `--sc-text-title` (was often `#fff` in base) — closer to prior theme overrides

---

## Exit criteria

- [x] 30/30 explicit definitions  
- [x] 16/16 tokens each  
- [x] Classic explicit  
- [x] Emergency `:root` not used by built-ins  
- [x] accent/RGB valid  
- [x] Identity broadly preserved  
- [x] Selector duplication substantially reduced  
- [x] Remaining overrides documented (none in themes.css; compat elsewhere)  
- [x] Custom still functional  
- [x] Card/music mappings unchanged  
- [x] Phaser untouched  
- [x] Tests + build + smoke pass  

---

*THEME-ARCHITECTURE-STAGE-3 · 2026-09-20*
