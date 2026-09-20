# Theme Architecture — Stage 2 Implementation Note

**ID:** `THEME-ARCHITECTURE-STAGE-2`  
**Branch:** `v2-main`  
**Date:** 2026-09-20  
**STATUS:** `DONE`  
**Commit message:** `refactor: add semantic theme token foundation`

---

## Summary

Implemented Theme Contract v1 foundation: **16** `--sc-*` emergency defaults on `:root`, transitional legacy aliases into the semantic layer, JSON metadata alignment, and focused static tests. **No** built-in theme migration, custom theme migration, Landing/component migration, `.dobo-*` removal, Phaser changes, or Premium HUD changes.

---

## Files changed

| File | Role |
|------|------|
| `frontend/src/styles/design-tokens.css` | Runtime SoT — 16 `--sc-*`, aliases, game globals, Premium HUD preserved |
| `frontend/src/styles/design-tokens.json` | Partial metadata aligned with CSS (not codegen input) |
| `frontend/src/styles/designTokens.foundation.test.ts` | Focused static contract tests |
| `docs/plan/THEME_ARCHITECTURE_MASTER_PLAN.md` | Etapa 2 → DONE; current → Etapa 3 |
| `docs/plan/ROADMAP_REBASE_SEPTEMBER_2026.md` | §12.8 pointer: Token Foundation DONE |
| `docs/plan/THEME_ARCHITECTURE_STAGE_2_IMPLEMENTATION.md` | This note |

---

## 16 tokens added (`:root` emergency defaults)

| Token | Emergency value |
|-------|-----------------|
| `--sc-canvas-from` | `#1a2438` |
| `--sc-canvas-to` | `#121820` |
| `--sc-surface` | `rgba(255, 255, 255, 0.06)` |
| `--sc-surface-border` | `rgba(255, 255, 255, 0.15)` |
| `--sc-surface-modal` | `#243044` |
| `--sc-text` | `#e9eef7` |
| `--sc-text-muted` | `rgba(233, 238, 247, 0.65)` |
| `--sc-text-title` | `#e8e0d0` |
| `--sc-accent` | `#c5a45b` (brass/gold) |
| `--sc-accent-rgb` | `197, 164, 91` |
| `--sc-turn` | `#e8c56a` |
| `--sc-seat` | `rgba(0, 0, 0, 0.25)` |
| `--sc-felt` | `#173c3b` |
| `--sc-felt-dark` | `#10191b` |
| `--sc-rail` | `#c5a45b` |
| `--sc-game-bg` | `#152820` |

These are **not** Classic identity. Classic gets an explicit block in Stage 3 (Option B).

---

## Legacy aliases mapped (safe)

| Legacy | → Semantic |
|--------|------------|
| `--sueca-color-primary` | `var(--sc-accent)` |
| `--sueca-rgb-primary` | `var(--sc-accent-rgb)` |
| `--color-primary` | `var(--sc-accent)` |
| `--sueca-color-text` | `var(--sc-text)` |
| `--color-text` | `var(--sc-text)` |
| `--color-surface` | `var(--sc-surface)` |
| `--sueca-color-surface` | `var(--sc-surface)` |
| `--theme-panel-modal` | `var(--sc-surface-modal)` |
| `--theme-panel-shell` | `var(--sc-surface)` |
| `--theme-turn-indicator` | `var(--sc-turn)` |
| `--theme-player-box` | `var(--sc-seat)` |
| `--theme-table-felt` | `var(--sc-felt)` |
| `--theme-table-felt-dark` | `var(--sc-felt-dark)` |
| `--theme-table-rail` | `var(--sc-rail)` |
| `--theme-bg-game` | `var(--sc-game-bg)` |

Companion (not contract): `--sueca-color-primary-dark` → brass-dark `#9a7d32` (not purple).

---

## Aliases deferred

| Variable | Why deferred |
|----------|--------------|
| `--theme-bg-game-alt` | Not a contract token; GameBoard gradient companion. Left as **literal** green-neutral (`#1c3428`) instead of aliasing to `--sc-*`. Force-aliasing would couple mid/alt derivation early. |
| `--theme-bg-game-mid` | Same — literal `#182c24`. Purple-era literals (`#6f5f98` / `#58679d`) removed so unthemed fallback is not purple wash. |

Themes that set these on `.game-board` still override. Full derive/migration → Stage 3/8.

---

## Game-semantic globals preserved

Fixed (not theme-varying):

- `--sueca-color-us` / `--sueca-rgb-us`
- `--sueca-color-them` / `--sueca-rgb-them`
- `--sueca-color-danger` / `--sueca-rgb-danger`

Optional aliases: `--sc-game-us`, `--sc-game-them`, `--sc-danger`, `--sc-danger-rgb`.

No success/warning tokens introduced.

---

## Premium HUD unchanged

`--premium-hud-*` and `--premium-font` kept as intentional globals with prior values. Not mapped into theme-controlled `--sc-*`.

---

## design-tokens.json relationship

- **Runtime SoT:** `design-tokens.css` (`:root`)
- **JSON:** partial metadata / documentation alignment (`semantic`, `gameSemantic`, legacy `color` keys)
- **Not** a DTCG codegen pipeline input today
- Purple removed from `color.primary` fallback (`#c5a45b`)

---

## Tests

`frontend/src/styles/designTokens.foundation.test.ts` — **8 passed**

Validates: 16 tokens once each; brass accent (no purple); required aliases; RGB channel form; game semantics; Premium HUD values; JSON alignment; deferred alt/mid not purple.

`npx tsc --noEmit` — pass.

---

## Build

`npm run build` (Vite) — pass.

---

## Visual smoke

Minimal browser smoke against `vite preview` (`http://127.0.0.1:4173/`):

| Surface | Result |
|---------|--------|
| Landing | OK — loads; brand + Entrar |
| Dashboard | OK — after Entrar; games list + bottom nav |
| In-game | OK — Sueca setup (“Distribuição”) / start path reachable; HUD chrome present |

Runtime CSS vars on `:root` (computed sample): `--sc-accent=#c5a45b`, `--sc-accent-rgb=197, 164, 91`, `--theme-bg-game=#152820`, `--sueca-color-us=#3484ea`, `--premium-hud-panel` unchanged.

**Intentional difference:** unthemed / missing-theme paths that previously resolved legacy purple primary now resolve brass/gold via alias → `--sc-accent`. Built-in theme selector overrides still apply for themed surfaces (themes not migrated yet). No catastrophic regression observed.

---

## OPPO required?

**No** for Stage 2. Pure CSS foundation + aliases; no Capacitor/native chrome change; no Phaser/theme block migration. OPPO smoke belongs to later visual/migration stages.

---

## Known risks

1. **Classic / unthemed purple → brass:** any UI still consuming `--sueca-color-primary` without a theme override now shows brass. Expected for emergency fallback; Classic explicit block is Stage 3.
2. **`--theme-bg-game-alt/mid`:** purple wash removed on `:root`; themed boards that set their own values unchanged.
3. **Double cascade until Stage 3:** themes still override components via selectors; `--sc-*` sit underneath unused by most components until later stages.

---

## Exit criteria checklist

- [x] all 16 `--sc-*` tokens exist
- [x] root defaults neutral/non-purple
- [x] emergency accent brass/gold
- [x] transitional aliases where safe
- [x] game semantics fixed
- [x] Premium HUD untouched
- [x] JSON/CSS relationship documented
- [x] tests pass
- [x] build passes
- [x] no unintended broad visual regression detected (intentional brass + green-neutral game-bg companions only)
- [x] no themes/components migrated prematurely

---

*THEME-ARCHITECTURE-STAGE-2 · 2026-09-20*
