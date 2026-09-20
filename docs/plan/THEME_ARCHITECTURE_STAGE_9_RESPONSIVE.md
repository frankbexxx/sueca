# Theme Architecture — Stage 9 Responsive Theme Pass

**ID:** `THEME-ARCHITECTURE-STAGE-9`  
**Branch:** `v2-main`  
**Date:** 2026-09-20  
**STATUS:** `DONE`  
**Commit message:** `refactor: harden responsive theme system`

---

## 1. Summary

Stage 9 validated Theme Contract surfaces across mobile portrait, short landscape, tablet-ish, and desktop. Applied **minimal hardening only**: safe-area double-count fixes, iOS input zoom guards (`font-size: 1rem`), `dvh` fallbacks on modal max-heights, Credits/Rules safe-area, GameBoard `100vw` → `100%`. No redesign of nav, top bar, menus, Theme↔Music, Phaser, or Final Visual Pass items.

---

## 2. Breakpoint inventory

| Area | File | Breakpoints | Risk | Action |
|------|------|-------------|------|--------|
| Landing | LandingPage.css | 769 / 430 | Double safe-area on card max-height | **Fixed** |
| Shell | app-shell.css | — | Bottom nav reserve + safe-area | Validated OK |
| BottomNav | BottomNav.css | 360 | Compact 44px + inset | Validated OK |
| InGameBar | InGameBar.css | 360 | Top safe-area | Validated OK |
| Variant modals | VariantModals.css | — | Bottom-sheet double inset; compact inputs &lt;16px | **Fixed** |
| GameBoard | GameBoard.css | 1024/768/480/430 + landscape≤500 | Round-end `vh`; `100vw` | **Fixed** (dvh + 100%) |
| Credits | CreditsModal.css | 768 / 480 | No safe-area; `vh` only | **Fixed** |
| RulesSheet | RulesSheet.css | — | `70vh` only | **Fixed** |
| MoreScreen | MoreScreen.css | — | Inputs inherit 0.85rem | **Fixed** |
| PlaySetup | PlaySetup.css | — | Already 1rem | None |
| Buttons | sueca-buttons / dobo-ui | — | touch-min 48 | Validated OK |

`--sueca-touch-min: 48px` in `design-tokens.css`.

---

## 3. Viewports tested

Representative (browser + structural tests):

| Class | Sizes |
|-------|--------|
| Mobile portrait | 360×800, 390×844, 420×900 |
| Mobile landscape | ~800×360, short ≤500px height (existing MQ) |
| Tablet-ish | ~768×1024 |
| Desktop | ~1100×800, ~1440×900 |

---

## 4. Landing

- Card `max-height: 100%` (parent owns safe-area padding)  
- Desktop padding keeps `max(24px, env(safe-area-*))`  
- CTA touch-min preserved  

---

## 5. Shell / Nav

- Content `padding-bottom: nav-height + safe-area + 8`  
- BottomNav compact + own bottom inset — pairing OK  
- Architecture unchanged  

---

## 6. Shared controls

- Primary / dobo / continue keep `--sueca-touch-min`  
- More + Spades bid + King auction/festa selects → `font-size: 1rem`  

---

## 7. Modals

- Bottom-sheet: overlay `padding-bottom: 0`; sheet keeps safe-area  
- Credits overlay safe-area + `90/95dvh`  
- RulesSheet `70dvh` + sheet bottom inset  
- Round/game-over sheets `82dvh` + bottom inset  
- Compact game sheets `16dvh` / KOH `26dvh`  

---

## 8–11. Games (responsive regression)

| Game | Notes |
|------|--------|
| Sueca | Board `max-width: 100%`; round-end scroll/dvh |
| Hearts | Pass sheet `16dvh`; selection chrome unchanged Stage 8 |
| Spades | Bid select ≥16px / taller min-height |
| King | Auction/festa selects ≥16px; KOH `26dvh` |

Logic untouched.

---

## 12. Landscape

Existing `orientation: landscape and (max-height: 500px)` retained. Modal `dvh` helps short height. No redesign.

---

## 13. Safe areas

| Surface | Status |
|---------|--------|
| Shell / BottomNav / InGameBar | OK |
| Landing | Double-count **fixed** |
| Variant bottom-sheet | Double **fixed** |
| Credits / Rules | Added / reinforced |

---

## 14. vh / dvh audit

| Change | Rationale |
|--------|-----------|
| Credits / Rules / round-end / rules-sheet-scroll / pass / bid / KOH | Add `dvh` after `vh` fallback |
| Root / shell / landing | Already `dvh` — keep |

No blind mass replace of Phaser-related `70vh` board heights.

---

## 15. Overflow audit

- GameBoard `100vw` → `100%`  
- No new broad `overflow-x: hidden` hacks  

---

## 16. Theme validation

Themes Classic / Midnight / Thebes / Forest remain coherent (Stage 5–8). Stage 9 did not reintroduce purple or `[data-theme]` component overrides.

---

## 17. Tests

`frontend/src/styles/responsive.stage9.test.ts` — 10 cases.  
Focused theme suite: **49/49** pass.

---

## 18. Build

- `tsc --noEmit` — pass  
- `npm run build` — pass  

---

## 19. OPPO

Unavailable — browser responsive mode accepted. Physical-device glance remains pending.

---

## 20. Deferred UX architecture note

**`FUTURE UX / POST-ARCHITECTURE`** (do not implement in Stage 9–10 without product decision):

- Theme + Audio integrated personalisation (Stage 10 DESIGN PENDING)  
- Iconized in-game top bar (GLOBAL-UI-02)  
- Desktop tooltip / mobile touch-label model  
- Active-player cue redesign (GLOBAL-UI-03)  
- Card separation polish (GLOBAL-CARDS-01)  

---

## 21. Known gaps

- GLOBAL-UI-02 / 03 / CARDS-01 remain OPEN  
- Stage 10 DESIGN PENDING / DEFERRED  
- OPPO physical smoke pending  
- Some compact King auction density still tight by design (rules UI)  

---

## 22. Exit criteria

- [x] Portrait / landscape / tablet / desktop validated  
- [x] Landing / shell / nav / modals / controls hardened where needed  
- [x] Game responsive smoke (structural + prior Stage 8)  
- [x] Safe areas / dvh / overflow fixes  
- [x] Themes coherent; logic unchanged  
- [x] Tests + build  
- [x] OPPO justified  
- [x] Stage 10 remains deferred  

---

*THEME-ARCHITECTURE-STAGE-9 · 2026-09-20*
