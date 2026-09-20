# Theme Architecture — Stage 5 App Shell + Landing

**ID:** `THEME-ARCHITECTURE-STAGE-5`  
**Branch:** `v2-main`  
**Date:** 2026-09-20  
**STATUS:** `DONE`  
**Commit message:** `refactor: theme landing and app shell`

---

## 1. Summary

Landing now renders under the same `.app-shell[data-theme]` scope as the rest of the app. Landing and shell chrome consume `--sc-*` directly. Continuity Landing → Dashboard → Settings works for built-ins and custom themes. No game-modal / dobo mass migration / Phaser changes.

---

## 2. Theme scope change

**Before:** Landing in `App--full` without `data-theme` → isolated purple/navy palette.  
**After:**

```tsx
<div className="App app-shell app-shell--landing" data-theme={activeTheme}>
  <LandingPage />
</div>
```

`.app-shell--landing` zeros shell padding (Landing owns safe-areas) while keeping theme token cascade + custom generator target.

---

## 3. Landing migration

`LandingPage.css` mapped to:

| Role | Token |
|------|--------|
| Canvas | `--sc-canvas-from` / `--sc-canvas-to` |
| Card surface | `--sc-surface-modal` + `--sc-surface-border` |
| Title | `--sc-text-title` (+ accent-rgb shadow) |
| Intro | `--sc-accent` |
| Body / footer | `--sc-text` / `--sc-text-muted` |
| Media frame accent wash | `--sc-accent-rgb` |

Removed fixed `#1b2143` / `#29235c` / `#4b2b73` / `#d4a574` / `#e2e6ff` / `rgba(10,10,30,…)` palette system.

**Preserved:** layout, hero media, CTA structure, responsive grid, safe-area padding, `dobo-btn` CTA (accent via bridge until Stage 6).

**Remaining non-theme literals (intentional):** white decorative radial washes; `#fff` on CTA label; black shadow opacities.

---

## 4. Shell migration

Direct `--sc-*` on:

- `app-shell.css` — canvas, text, titles  
- `shell-screens.css` — panels, hubs, list/empty  
- `HomeDashboard.css` — titles, rows, stats, avatar  
- `ThemesScreen.css` — card borders / active  
- `BottomNav.css` — bar / border / inactive / active  

No new `[data-theme="…"]` component selectors.

---

## 5. Header / Nav

- **ShellHeader:** titles via shared `.screen-title` / `.screen-subtitle` → `--sc-text-title` / `--sc-text-muted`  
- **BottomNav:** surface from `--sc-surface-modal`; active `rgba(var(--sc-accent-rgb), 0.2)`; inactive `--sc-text-muted`; removed fixed `rgba(20,28,40,…)` slate  

Layout/height/safe-area/touch targets unchanged.

---

## 6. Panels / Dashboard

`.shell-panel`, hub items, game rows, stats panels, themes cards → `--sc-surface` / `--sc-surface-border` / accent active states.

---

## 7. Direct `--sc-*` consumers (Stage 5)

Landing, app-shell, shell-screens, BottomNav, HomeDashboard, ThemesScreen (shell-level).

---

## 8. Compatibility bridge still remaining

Stage 3 `.app-shell[data-theme]` alias bridge still required for:

- `.dobo-btn` / `.sueca-btn` (until Stage 6)  
- GameBoard / VariantModals / other game chrome  
- Any remaining `--sueca-rgb-primary` / `--theme-*` consumers  

Shell principal path now prefers direct `--sc-*`.

---

## 9. Hardcoded Landing visuals remaining

| Kind | Examples |
|------|----------|
| A layout/art | white radial washes; blur; radii |
| B intentional global | `#fff` CTA text; black shadows |
| C should-be-semantic | **none remaining** for theme-relevant colours |

---

## 10. Built-in / custom validation

Browser smoke:

- Landing tokens change for classic / midnight / thebes / thule / el-dorado / forest  
- Custom `custom_s5_cool` applies on Landing (`accent #5a9fd4`, canvas `#0a1628`)  
- Enter → Dashboard preserves same tokens; BottomNav active uses accent rgba  
- Settings shell continuous  

---

## 11. Responsive check

- Mobile portrait (420×900): Landing + nav OK  
- Desktop width (1100): no layout break observed  
- Safe-area / touch-min preserved  

Not a Stage 9 deep pass.

---

## 12. Tests / build

- `shellLanding.stage5.test.ts` — 6 pass  
- Related theme tests pass  
- `tsc --noEmit` PASS  
- `npm run build` PASS  

---

## 13. OPPO smoke

**Not run on device.** No OPPO/Capacitor device in this agent environment.  
**Justification:** Stage 5 is CSS/DOM theme-scope; validated via Vite preview browser smoke (Landing, Dashboard, BottomNav, custom theme, settings). Recommend Francisco OPPO glance when convenient; not blocking DONE for this foundation stage given web evidence.

---

## 14. Known gaps

1. `.dobo-btn` / buttons still alias-driven (Stage 6)  
2. Game modals / GameBoard not migrated  
3. Landing CTA still uses `dobo-btn` class  
4. Physical OPPO glance pending  

---

## 15. Exit criteria

- [x] Landing follows built-in theme  
- [x] Landing follows custom theme  
- [x] separate Landing palette removed  
- [x] App Shell semantic  
- [x] Header / BottomNav / panels themed  
- [x] no new theme component selectors  
- [x] safe areas / touch preserved  
- [x] no emergency brass leakage in smoke  
- [x] Classic + custom continuity  
- [x] tests / build / visual smoke pass  
- [x] OPPO justified (not available)  

---

*THEME-ARCHITECTURE-STAGE-5 · 2026-09-20*
