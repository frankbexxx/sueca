# Theme Architecture — Stage 7 Legacy Purple Cleanup

**ID:** `THEME-ARCHITECTURE-STAGE-7`  
**Branch:** `v2-main`  
**Date:** 2026-09-20  
**STATUS:** `DONE`  
**Closes:** `GLOBAL-UI-01 — Legacy purple remnants`  
**Commit message:** `refactor: remove legacy purple remnants`

---

## 1. Summary

Stage 7 audited and removed accidental purple/lavender leftovers outside the Classic theme. ErrorBoundary, PenteVisualization, GameBoard bidding/auction chrome, GameSelector, body canvas (`index.css`), and Credits lavender body text now use Theme Contract / game-semantic tokens. Classic intentional purple remains scoped to `.app-shell[data-theme="classic"]`. `:root` emergency stays brass/gold. **GLOBAL-UI-01 closed.**

---

## 2. Search methodology

1. Literal grep for Stage 7 forbidden set: `#6c5ce7`, `#5a4fd6`, `#7c5cbf`, `#7c4dff`, `#c4b5fd`, `#e9d5ff`, `#e2e6ff`, `#e0e3ff`, `#667eea`, `#764ba2`, `108, 92, 231`, `196, 181, 253`
2. Broader purple/violet/lavender keyword scan
3. Inline `style={{ color: … }}` / TSX colour props
4. Alias trace: `--sueca-color-primary`, `--sueca-rgb-primary`, `--color-primary`, `--sueca-color-primary-dark`
5. Vitest owned-source walk excluding Classic block + `*.test.*`

---

## 3. Occurrence classification table

| File | Selector/component | Value/source | Classification | Action |
|------|--------------------|--------------|----------------|--------|
| `themes.css` | `[data-theme="classic"]` | `#6c5ce7` / `108,92,231` / `#5a4fd6` | **A CLASSIC INTENTIONAL** | Keep |
| `themes.css` | `[data-theme="shambhala"]` | `#a064dc` family | **D ART/THEME INTENTIONAL** | Keep (theme identity) |
| `themes.css` | `[data-theme="cartago"]` | `#c864a0` family | **D ART/THEME INTENTIONAL** | Keep |
| `design-tokens.css` | `:root` emergency | brass `#c5a45b` | (not purple) | Keep |
| `ErrorBoundary.tsx` | reload CTA | `#6c5ce7` inline | **B LEGACY ACCIDENTAL** | → semantic CSS |
| `PenteVisualization.tsx` | team1 colour | `#6c5ce7` inline | **B→C** was legacy; meaning = Us | → `--sc-game-us` |
| `PenteVisualization.tsx` | team2 colour | `#ff6b6b` inline | **C GAME SEMANTIC** | → `--sc-game-them` |
| `GameBoard.css` | bidding outline / name | `#e9d5ff` / `rgba(196,181,253,…)` | **B LEGACY ACCIDENTAL** | → `--sc-accent*` |
| `GameBoard.css` | `.player-auction-badge` | lavender | **B LEGACY ACCIDENTAL** | → `--sc-accent*` |
| `GameSelector.css` | panel / active | `#667eea` / `#764ba2` | **B LEGACY ACCIDENTAL** | → `--sc-*` |
| `index.css` | `body` background | indigo→purple gradient | **B LEGACY ACCIDENTAL** | → `--sc-canvas-*` |
| `CreditsModal.css` | body/subtitle/ack | `#e2e6ff` / `#e0e3ff` / `#f5f7ff` | **B LEGACY ACCIDENTAL** | → `--sc-text*` |
| `CreditsModal.css` | title / intro copper | `#d4a574` | **D ART/DECORATIVE** | Keep |
| Stage 2–6 tests | assert not purple | hex in expects | (test) | Keep |
| `themes.contract.test.ts` | Classic assert | `#6c5ce7` | (test) | Keep |

---

## 4. Classic intentional palette

Scoped exclusively in:

```css
.app-shell[data-theme="classic"] {
  --sc-accent: #6c5ce7;
  --sc-accent-rgb: 108, 92, 231;
  --sueca-color-primary-dark: #5a4fd6;
  /* surface washes also use 108,92,231 */
}
```

Tests prove Classic retains these values and non-Classic `themes.css` (Classic block stripped) has no `#6c5ce7` / `#5a4fd6` / `108, 92, 231`.

---

## 5. ErrorBoundary cleanup

- Moved recovery UI to `ErrorBoundary.css`
- CTA uses `rgba(var(--sc-accent-rgb, 197, 164, 91), …)` — works with `:root` emergency brass when outside themed shell (tokens load before boundary in `index.tsx`)
- Behaviour unchanged (reload)

---

## 6. Pente classification / fix

**Meaning:** team1 / team2 score colours encode **Us vs Them**, not theme accent.

**Fix:** CSS classes `.pente-team--us` / `.pente-team--them` → `--sc-game-us` / `--sc-game-them`. Inline colours removed.

---

## 7. Game / HUD leftovers

| Item | Fix |
|------|-----|
| Bidding seat/dock outline + name colour | `--sc-accent-rgb` / `--sc-accent` |
| Auction badge | accent wash + accent text |
| No deep layout redesign | — |

Us/Them seat badge pala blues/pinks (`#b3d9ff` / `#ffcccc`) left as **game-semantic** pale companions (not Classic legacy purple).

---

## 8. Inline styles

| Before | After |
|--------|-------|
| ErrorBoundary `background: '#6c5ce7'` | CSS class |
| Pente ×4 `#6c5ce7` / `#ff6b6b` | CSS game-semantic classes |

No remaining forbidden purple inline styles in owned `src`.

---

## 9. Alias audit

| Alias | Outside Classic |
|-------|-----------------|
| `--sueca-color-primary` | `var(--sc-accent)` |
| `--sueca-rgb-primary` | `var(--sc-accent-rgb)` |
| `--color-primary` | `var(--sc-accent)` |
| `--sueca-color-primary-dark` | per-theme companion (Classic `#5a4fd6` only in Classic); custom via `darken(accent)` |

No purple literal leak through aliases on non-Classic themes.

---

## 10. Tests

`frontend/src/styles/purpleCleanup.stage7.test.ts` — 11 cases.

Focused run with Stages 2–6 theme tests: **56/56 pass**.

---

## 11. Build

- `tsc --noEmit` — pass  
- `npm run build` — pass  

---

## 12. Visual smoke

Themes: classic, midnight, thebes, forest (+ body canvas emergency).

| Surface | Result |
|---------|--------|
| Landing / Dashboard | No accidental purple on non-Classic |
| Settings / lang | Accent from theme |
| GameSelector (setup) | Surface + accent active |
| Classic | Intentional purple accent preserved |
| Credits copper title | Retained decorative |

---

## 13. OPPO

Unavailable — browser smoke only. No touch-specific purple regression expected.

---

## 14. Remaining ambiguous items

None blocking GLOBAL-UI-01.

**Out of scope / retained intentionally:**

- Shambhala / Cartago purple-magenta theme identities  
- Credits copper `#d4a574` decorative  
- Pale Us/Them badge tints (game-semantic)  
- Phaser canvas aesthetics  

---

## 15. GLOBAL-UI-01 closure

**CLOSED.** No accidental legacy purple remains in active owned UI paths; Classic purple scoped; aliases do not leak Classic purple; ErrorBoundary + Pente + HUD bidding leftovers fixed.

`GLOBAL-UI-02` / `03` / `GLOBAL-CARDS-01` unchanged.

---

## 16. Exit criteria

- [x] global purple search completed  
- [x] all occurrences classified  
- [x] accidental purple removed  
- [x] Classic intentional purple preserved  
- [x] ErrorBoundary fixed  
- [x] Pente resolved/classified  
- [x] game/HUD leftovers fixed if legacy  
- [x] inline purple cleaned  
- [x] aliases no longer leak purple  
- [x] custom unaffected (still derives primary-dark)  
- [x] tests pass  
- [x] build passes  
- [x] smoke passes  
- [x] GLOBAL-UI-01 closed  

---

*THEME-ARCHITECTURE-STAGE-7 · 2026-09-20*
