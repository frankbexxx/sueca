# Theme Architecture — Stage 8 Game-specific DOM Migration

**ID:** `THEME-ARCHITECTURE-STAGE-8`  
**Branch:** `v2-main`  
**Date:** 2026-09-20  
**STATUS:** `DONE`  
**Commit message:** `refactor: migrate game dom to semantic themes`

---

## 1. Summary

Sueca / Hearts / Spades / King DOM chrome now paints from Theme Contract `--sc-*` (turn, seat, felt/rail, game-bg, text, accent selection). Legacy `--theme-turn/player/table` and InGameBar `--sueca-color-text` removed from game CSS. Us/Them/Danger stay fixed game-semantics. Premium HUD status panel and Phaser Premium Classic unchanged. No gameplay / rules / layout redesign.

---

## 2. DOM / Phaser boundary

| Layer | Stage 8 |
|-------|---------|
| React/DOM seats, docks, modals, bid/pass sheets, InGameBar, status panel chrome | Migrated |
| DOM `.table-surface` / King KOH mini-table | `--sc-felt*` / `--sc-rail` |
| Phaser canvas / PREMIUM_TABLE / card renderer / animations | **Unchanged** |
| Game rules / AI / flow controllers | **Unchanged** |

---

## 3. Game component matrix

| Game | Component | CSS | Role | Before | After |
|------|-----------|-----|------|--------|-------|
| All | GameBoard | GameBoard.css | Board wash | `--theme-bg-game*` | `--sc-game-bg` + alt/mid companions |
| All | seats / dock | GameBoard.css | Turn cue | `--theme-turn-indicator` | `--sc-turn` |
| All | `.player-info` / hand-back | GameBoard.css | Seat chip | `--theme-player-box` | `--sc-seat` |
| All | `.table-surface` | GameBoard.css | DOM table | `--theme-table-*` | `--sc-felt*` / `--sc-rail` |
| All | team labels/badges | GameBoard.css | Us/Them | hex / rgb | `--sc-game-us/them` + rgb washes |
| All | InGameBar | InGameBar.css | Top bar text/bg | `--sueca-color-text` | `--sc-text*` + premium panel |
| Sueca | dealing / round-end / continue | VariantModals + GameBoard | Sheets | Stage 6/7 | polish `--sc-text*` |
| Hearts | pass select / card select | VariantModals + GameBoard | Selection | green hex | `--sc-accent*` |
| Spades | bid dock select | VariantModals | Bid UI | `#f5f5f5` slate | `--sc-surface` / `--sc-text` |
| King | auction toolbar / KOH table | VariantModals | Auction + KOH | `#f5f5f5` / theme-table | `--sc-*` |
| All | status panel | GameBoard.css | HUD | Premium globals | **D keep** (intentional) |

---

## 4. Sueca migration

- Board wash / turn / seat / modal titles/dealer text → `--sc-*`
- Score Us/Them boxes remain game-semantic RGB
- Continue / modal-container already Stage 6
- Dealing modal already Stage 6 radios/accent

---

## 5. Hearts migration

- Pass card selected + hand pass-selected → accent-rgb (selection semantic)
- Hearts pass overlay transparent intentional (Stage 6)
- Round/game-over share modal shell

---

## 6. Spades migration

- `.spades-bid-select` → surface/text/border tokens
- Bid dock uses shared `sueca-btn` / shell-panel (prior)
- HUD `NÓS x/y · ELES x/y` behaviour untouched (tests green)

---

## 7. King migration

- Auction toolbar select/amount → semantic controls
- KOH reveal mini-table → `--sc-felt*` / `--sc-rail`
- Festa selected already Stage 6/7 accent
- Multi-round auction / PASS / bid logic **not touched** (H16 / multi-round tests green)

---

## 8. Modal strategy

Shared Stage 6 shells (`.variant-modal`, `.dobo-panel`, `.modal-container`) + local geometry. Removed remaining local theme-table / slate control paint.

---

## 9. Game semantics

| Token | Use |
|-------|-----|
| `--sc-game-us` / `--sueca-rgb-us` | Team Us seats, badges, score boxes |
| `--sc-game-them` / `--sueca-rgb-them` | Team Them |
| `--sc-danger` | Danger actions (unchanged) |
| Premium HUD | Status panel intentional global |

---

## 10. Legacy token cleanup

Removed from game CSS:

- `--theme-turn-indicator` → `--sc-turn`
- `--theme-player-box` → `--sc-seat`
- `--theme-table-felt*` / `--theme-table-rail` → `--sc-felt*` / `--sc-rail`
- `--theme-bg-game` → `--sc-game-bg`
- `--sueca-color-text` / `--sueca-rgb-text` (InGameBar) → `--sc-text*`

**Retained companions:** `--theme-bg-game-alt` / `--theme-bg-game-mid` (per-theme wash stops; not contract tokens; documented).

---

## 11. Hardcoded colour classification (sample)

| Value | Class | Action |
|-------|-------|--------|
| `#b3d9ff` / `#ffcccc` team names | B game-semantic | → `--sc-game-us/them` |
| `#4caf50` / `#6fcf97` selection | A theme selection | → accent |
| `#cfdffc` / `#9aa5b5` modal chrome | A | → `--sc-text*` |
| `#2a3a52` card-back small | C art | retain |
| Suit trump reds/blacks | C art | retain |
| Premium HUD literals (fallbacks) | D intentional | retain |
| `--theme-bg-game-alt/mid` | D companions | retain |

---

## 12. Metrics before / after

| Metric | Before | After |
|--------|--------|-------|
| Game CSS legacy chrome tokens (`theme-turn/player/table`, sueca-text, primary) | ~20 | **0** |
| Direct `--sc-*` refs in game CSS set | ~64 | **110** |
| `[data-theme]` game selectors | 0 | **0** |
| Companion `--theme-bg-game-alt/mid` | 2 | **2** (documented) |

---

## 13. Tests

`frontend/src/styles/gameDom.stage8.test.ts` — 11 cases.

---

## 14. Behaviour regression

| Suite | Result |
|-------|--------|
| Sueca flow | pass |
| Hearts flow + H15 smoke | pass |
| Spades flow + status display + UnifiedGameStatusPanel | pass |
| King flow + H16 smoke + multi-round auction | pass |
| InGameBar | pass |
| Stage 6/7 theme tests | pass |

**76/76** in focused run.

---

## 15. Build

- `tsc --noEmit` — pass  
- `npm run build` — pass  

---

## 16. Visual smoke

Themes: Classic, Forest/Thebes, (custom path unchanged).

States covered via browser + prior Stage 6/7 continuity:

- Landing → Dashboard → enter game shell tokens cascade  
- Game board wash uses `--sc-game-bg`  
- Non-Classic: no Classic purple leak (Stage 7 still holds)

---

## 17. Responsive smoke

Portrait/desktop: no Stage 9 redesign; modal/bid/pass/InGameBar geometry unchanged — CSS-only paint swaps.

---

## 18. OPPO

Unavailable — browser smoke accepted.

---

## 19. Known gaps

- `--theme-bg-game-alt/mid` companions remain (optional future derive from `--sc-game-bg`)
- GLOBAL-UI-02 top bar density — not closed  
- GLOBAL-UI-03 active-player redesign — not closed  
- GLOBAL-CARDS-01 — not closed  
- Final Visual Pass per-game polish — later  
- Phaser bridge still may read legacy aliases (intentional)

---

## 20. Exit criteria

- [x] Sueca / Hearts / Spades / King DOM migrated  
- [x] Modals shared semantic paint  
- [x] Theme vs game semantics separated  
- [x] No `[data-theme]` game overrides  
- [x] No accidental purple  
- [x] No legacy primary/theme-chrome in migrated game DOM  
- [x] Phaser unchanged  
- [x] Logic unchanged (behaviour suites)  
- [x] tsc + build  
- [x] smoke / responsive smoke  
- [x] OPPO justified  

---

*THEME-ARCHITECTURE-STAGE-8 · 2026-09-20*
