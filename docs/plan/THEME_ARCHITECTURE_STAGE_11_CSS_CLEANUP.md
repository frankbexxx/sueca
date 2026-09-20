# Theme Architecture — Stage 11 Dead / Superseded CSS Cleanup

**ID:** `THEME-ARCHITECTURE-STAGE-11`  
**Branch:** `v2-main`  
**Date:** 2026-09-20  
**STATUS:** `DONE`  
**Commit message:** `refactor: remove superseded theme css`

---

## 1. Summary

Stage 11 removed proven-dead CSS class aliases and transitional paint variables after Stages 0–9, without redesign. Phaser now reads `--sc-*` directly; the Stage 3 `.app-shell[data-theme]` alias bridge is gone. Dobo / `variant-modal-primary` consumers migrated to `.sueca-btn` / local surface paint. Dead `.continue-button` CSS removed. Stage 10 remains **DESIGN PENDING / DEFERRED**.

---

## 2. Audit methodology

For each candidate: declarations → `var()` / `getPropertyValue` / TSX className consumers → tests → classify A–E. Delete only with zero required consumers (or after migrating consumers).

---

## 3. Legacy aliases

| Item | Class | Action |
|------|-------|--------|
| `--sueca-color-primary` / `--color-primary` | A after Phaser migrate | **Removed** |
| `--sueca-rgb-primary` | A | **Removed** |
| `--sueca-color-primary-dark` | A | **Removed** (themes + custom + tokens) |
| `--sueca-color-text` / `--color-text` | A after Phaser migrate | **Removed** |
| `--color-surface` / `--sueca-color-surface` | A | **Removed** |
| `--theme-panel-*` | A | **Removed** |
| `--theme-turn-indicator` | A after Phaser migrate | **Removed** |
| `--theme-player-box` | A | **Removed** |
| `--theme-table-felt` / `--theme-table-rail` | A | **Removed** |
| `--theme-table-felt-dark` | A after Phaser CSS migrate | **Removed** |
| `--theme-bg-game` | A | **Removed** |
| `--theme-bg-game-alt` / `--theme-bg-game-mid` | B | **Retained** (GameBoard) |
| Us/Them/Danger / Premium HUD / focus / overlay | B | **Retained** |

---

## 4. Compatibility bridge before/after

| | Before | After |
|--|--------|-------|
| `.app-shell[data-theme]` bridge | 1 rule rebinding ~15 aliases | **Deleted** |
| themes.css rule count | 31 (bridge + 30) | **30** (token blocks only) |
| Phaser | legacy `getPropertyValue` | `--sc-text` / `--sc-turn` / `--sc-accent` |
| Phaser host CSS | `--theme-table-felt-dark` | `--sc-felt-dark` |

---

## 5. Dobo cleanup

| Metric | Before | After |
|--------|--------|-------|
| `.dobo-btn` TSX consumers | ~12 files | **0** |
| `.dobo-panel` TSX consumers | ~14 files | **0** |
| `dobo-ui.css` | present | **Deleted** |

Migrated to `.sueca-btn` / `.sueca-btn--primary`. Surfaces that lacked paint (`.more-section`, `.king-koh-controls`) gained `--sc-surface-modal` locally.

---

## 6. Variant modal cleanup

| Metric | Before | After |
|--------|--------|-------|
| `.variant-modal-primary` TSX | several | **0** |
| Paint CSS | aliased in dobo-ui | **Gone** (use sueca-btn--primary) |
| Geometry classes | kept | kept |

---

## 7. Continue cleanup

`.continue-button` — CSS-only dead path (runtime Continue = `GameActions` → `sueca-btn sueca-btn--primary`). **Removed** from `GameBoard.css` (+ MQ overrides).

---

## 8. themes.css cleanup

- Removed alias bridge  
- Removed `--sueca-color-primary-dark` from all 30 themes  
- Kept curated `--sc-*` + bg companions  
- No component selectors  

---

## 9. design token cleanup

- Removed transitional paint alias block from `:root`  
- Kept 16 `--sc-*`, Us/Them/Danger, Premium HUD, focus/overlay, spacing, `--theme-bg-game-alt/mid`  
- JSON: `primaryDark` marked historical metadata only  

---

## 10. Dead files/rules

- **Deleted:** `frontend/src/styles/dobo-ui.css`  
- **Removed import:** `index.tsx`  
- Dead continue-button rules; dead variant-modal-primary:disabled; dobo festa selectors → sueca-btn  

No other CSS files were orphan (all still imported).

---

## 11. Responsive cleanup

Stage 9 `vh`/`dvh` / safe-area fixes **preserved**. Stage 9 test updated only to drop dobo-ui dependency.

---

## 12. Metrics

| Class / alias | Before consumers | After |
|---------------|------------------|-------|
| `.dobo-btn` | many | 0 |
| `.dobo-panel` | many | 0 |
| `.variant-modal-primary` | several | 0 |
| `.continue-button` | 0 TSX / CSS dead | 0 |
| Bridge aliases | ~15 | 0 |
| GameBoard companions | 2 | 2 retained |

---

## 13. Tests

- New: `cssCleanup.stage11.test.ts`  
- Updated: Stages 2/6/7/8/9, themes.contract, custom theme  
- Focused suite: **84/84** pass  

---

## 14. Build

- `tsc --noEmit` — pass  
- `npm run build` — pass  

---

## 15. Visual smoke

Expected delta: **NONE** (paint recipes unchanged; class rename only). Browser structural validation via tests; no intentional visual redesign.

---

## 16. Phaser dependencies retained

None of the legacy alias bridge remaining. Phaser uses Theme Contract `--sc-*` on `.app-shell`. Premium Classic table identity unchanged.

---

## 17. Deferred items

- Stage 10 Theme ↔ Deck ↔ Music ↔ SFX UX — **DESIGN PENDING**  
- GLOBAL-UI-02 / 03 / CARDS-01  
- Iconized top bar / tooltip model  
- Final Visual Passes (Etapa 13)  

---

## 18. Exit criteria

- [x] Dead/superseded CSS audited  
- [x] Bridge removed (safe)  
- [x] Obsolete aliases removed  
- [x] Dobo migrated to zero  
- [x] variant-modal-primary removed  
- [x] continue path removed  
- [x] dobo-ui deleted  
- [x] Stage 9 preserved  
- [x] 30 themes + custom intact  
- [x] Phaser on `--sc-*`  
- [x] Tests + tsc + build  
- [x] Stage 10 remains deferred  

---

*THEME-ARCHITECTURE-STAGE-11 · 2026-09-20*
