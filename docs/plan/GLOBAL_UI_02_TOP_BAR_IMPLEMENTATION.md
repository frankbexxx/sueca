# GLOBAL-UI-02 — In-Game Top Bar Implementation (Batch 1)

**ID:** `GLOBAL-UI-02-TOP-BAR-IMPLEMENTATION`  
**Root:** `E:\SUECAO`  
**Branch:** `v2-main`  
**Date:** 2026-09-20  
**Canonical UX:** [`POST_ARCHITECTURE_UX_DIRECTION.md`](./POST_ARCHITECTURE_UX_DIRECTION.md)  
**Audit:** [`GLOBAL_UI_02_TOP_BAR_AUDIT_PLAN.md`](./GLOBAL_UI_02_TOP_BAR_AUDIT_PLAN.md)  
**STATUS:** **IMPLEMENTED / VISUAL VALIDATION PENDING** (browser portrait smoke PASS; OPPO physical pending)

---

## 1. Summary

Replaced the text-heavy in-game top bar with a portrait-first icon command bar:

`⏸/▶ | 📌 | ⋯`

Secondary actions moved into an anchored overflow menu. Rules and Definições open as in-game overlays so `GameBoard` stays mounted. Pause / Pin / Novo / Sair handlers unchanged.

---

## 2. Final component architecture

| Piece | Path |
|-------|------|
| Command bar | `frontend/src/components/navigation/InGameBar.tsx` (+ `.css`) |
| Overflow menu | `frontend/src/components/navigation/InGameOverflowMenu.tsx` (+ `.css`) |
| Settings overlay | `frontend/src/components/navigation/InGameSettingsOverlay.tsx` (+ `.css`) |
| Rules overlay | existing `RulesSheet` (wired from `GameBoard`) |
| Orchestration | `GameBoard.tsx` — `rulesOpen` / `settingsOpen` state |

Shared path only — Sueca / Hearts / Spades / King.

---

## 3. Top bar

- Permanent controls only: Pause/Resume, Pin, More  
- **Removed:** `gameLabel`, `playerName`, `metaLabel`, permanent Novo/Sair  
- Hit targets: **44×44px** (42×42 under 360px width)  
- Quiet chrome + Premium HUD panel paint retained  
- `z-index: 1100`  

---

## 4. Overflow menu

Anchored top-right mini-sheet (`z-index: 1400`):

1. 📖 Regras  
2. ⚙ Definições  
3. separator  
4. Novo jogo  
5. Sair do jogo (danger)

Closes on outside pointerdown (propagation stopped), Escape, and after row activation. Subtle fade/scale (~120ms). No auto-pause.

---

## 5. Rules wiring

`⋯ → Regras` → `RulesSheet` with current `gameVariant` + `rulesPresetId`.  
Hardcoded `"Close"` → `t.credits.close` (`Fechar` / `Close`).  
Game remains mounted.

---

## 6. Settings overlay

**In-game only** — no shell navigation.

**Included:**

- Som (`isSoundEnabled` / `setSoundEnabled`)  
- `MusicSettingsControls`  
- Pausa auto entre vazas  
- Language PT/EN  
- Hand sort / suit order / trump position  

**Excluded:**

- Profile / name edit  
- Credits / feedback  
- Exit app  
- Themes / Stage 10 personalisation  
- Full shell settings hub navigation  

`z-index: 1600`; Escape + outside tap + Fechar.

---

## 7. Pause / Resume

Unchanged: `onPause` / `onResume` / `isPaused`.  
Icon ⏸ ↔ ▶; aria/tooltip Pausar ↔ Retomar.

---

## 8. Pin

Unchanged one-shot + GameBoard confirm → `pinGameSession`.  
No toggle / pinned selected state.

---

## 9. New game

Overflow only; same confirm + `handleNewGame` (incl. multiplayer solo restart).

---

## 10. Exit

Overflow only; danger row; same confirm + solo save + `exitGame`.

---

## 11. Desktop tooltip

BottomNav-style `data-tooltip` + `:hover` / `:focus-visible` on icon buttons.  
Plus `aria-label` / `title`.

---

## 12. Mobile press-label

Pause / Pin: pointerdown → pressed + label → pointerup → activate once (click suppressed).  
`pointercancel` aborts.  
More: immediate click/tap.  

**Timing constant:** `IN_GAME_BAR_TOUCH_LABEL_MS = 320` (conservative; OPEN for tuning).

---

## 13. Accessibility

- Dynamic aria-label on Pause/Resume  
- `aria-expanded` / `aria-controls` on More  
- Menu role + menuitems  
- Escape closes overflow + overlays + confirms  
- Focus returns to More after menu close when practical  
- Danger styling on exit row  

---

## 14. Phaser stacking

Bar 1100 · overflow 1400 · Rules 1500 · Settings 1600 · ConfirmDialog ~2000.  
Outside menu close stops propagation to reduce canvas click-through.

---

## 15. i18n

| Key | PT | EN |
|-----|----|----|
| `inGame.more` | Mais | More |
| `inGame.exitGame` | Sair do jogo | Exit game |

Reused: `gameMenu.pause/resume`, `inGame.pinGame/newGame/exit`, `nav.rules`, `moreScreen.settings`, `credits.close`.

---

## 16. Tests

- `InGameBar.test.tsx` — permanent 3 controls, overflow, confirms, pointer cancel/double-fire  
- `InGameSettingsOverlay.test.tsx` — subset + Escape  
- Stage 8 / 9 style guards still green  
- Nav + styles suite: **99/99**  

---

## 17. Build

- `npx tsc --noEmit` — PASS  
- `npm run build` — PASS  

---

## 18. Visual validation (browser portrait)

| Check | Result |
|-------|--------|
| Sueca icon bar | PASS |
| Hearts icon bar | PASS |
| Spades icon bar (3 controls, no title) | PASS |
| King icon bar | PASS |
| Overflow order | PASS |
| Rules overlay + Fechar | PASS |
| Settings overlay (game mounted) | PASS |
| Pause ↔ Retomar | PASS |
| Exit confirm | PASS |
| Identity removed from bar | PASS |

Classic + live theme paint observed via Premium HUD / semantic tokens. Custom theme not separately exercised this batch (OPEN fine-tune).

---

## 19. OPPO

Physical OPPO validation **pending**. Not claimed PASS.

---

## 20. Remaining tuning / open decisions

- Tooltip delay  
- Touch-label duration (`320ms` provisional)  
- Exact spacing / icon size polish  
- Overflow width / animation timing  
- Settings subset expansion  
- Eventual icon glyph refinement  
- Contrasting / custom theme sweep on OPPO  

---

## 21. GLOBAL-UI-02 status

**IMPLEMENTED / VISUAL VALIDATION PENDING**

Do not mark DONE until OPPO (or equivalent device) portrait smoke confirms.  
GLOBAL-UI-03 / GLOBAL-CARDS-01 unchanged.

---

## 22. Batch 2 — Vertical command rail (2026-09-20)

### Decision

Separate empty top command strip removed. Commands integrate as a **vertical rail** to the right of the HUD/info boxes.

### Before → After

| Before (Batch 1) | After (Batch 2) |
|------------------|-----------------|
| Full-width top row with ⏸ 📌 ⋯ right-aligned | No separate command row |
| ScoreStrip below, wasted empty band | Single HUD chrome row: scores + rail |

### Layout

```
.in-game-hud-chrome  (grid: 1fr | auto)
  ├── .in-game-hud-chrome__scores → ScoreStrip / UnifiedGameStatusPanel
  └── .in-game-bar--rail (vertical toolbar)
```

### Dimensions

| Token | Value |
|-------|--------|
| Rail width | 46px (44px ≤360px) |
| Icon hit target | **42×42** (40×40 ≤360px) |
| Rail/actions | `flex-direction: column`; `space-evenly` |
| Center info min | `minmax(72px, 0.95fr)` inside chrome (was 84px) |
| Safe-area | `padding-top: max(4px, env(safe-area-inset-top))` on chrome |

### Overflow / labels

- Menu anchored to **rail top**, opens **left** (`right: calc(100% + 6px)`)
- Tooltips + touch-labels open **left** of icons (avoid right-edge clip)
- Touch timing unchanged: `IN_GAME_BAR_TOUCH_LABEL_MS = 320`

### Viewport checks (browser)

| Viewport | Result |
|----------|--------|
| 360×800 | no overflow; menu in viewport |
| 390×844 | Spades 3 boxes + rail PASS; menu in viewport |
| 420×900 | no overflow |

### Visual findings

- Vertical space recovered; rail feels attached to HUD  
- Spades NÓS / Vaza / ELES remain readable at ~72px each on 390  
- Menu no longer clips above viewport (Batch 2 fix)  
- Contrasting theme + OPPO still pending for DONE  

### Status after Batch 2

GLOBAL-UI-02 remains **IMPLEMENTED / VISUAL VALIDATION PENDING**.

---

*GLOBAL-UI-02-TOP-BAR-IMPLEMENTATION · Batch 1 + Batch 2 · 2026-09-20*
