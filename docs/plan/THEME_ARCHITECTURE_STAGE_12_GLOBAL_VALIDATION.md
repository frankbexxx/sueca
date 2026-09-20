# Theme Architecture — Stage 12 Global Visual Validation

**ID:** `THEME-ARCHITECTURE-STAGE-12`  
**Branch:** `v2-main`  
**Date:** 2026-09-20  
**STATUS:** `DONE`  
**Commit message:** `docs: validate global theme architecture`

---

## 1. Executive summary

Theme Architecture foundation (Stages 0–9 + 11) is **validated** for Final Visual Passes. Representative built-ins, Classic scope, custom generator, Landing→Shell continuity, shared UI, game DOM (structural + Sueca browser smoke), Phaser `--sc-*` boundary, responsive Stage 9 guards, colour-leakage and dead-architecture checks all pass. **No P0/P1 architecture regressions.** No product redesign. Stage 10 remains **DESIGN PENDING / DEFERRED**. GLOBAL-UI-02 / 03 / CARDS-01 remain **OPEN**.

---

## 2. Validation matrix

| Surface | Classic | Midnight | Thebes | Forest | Custom | Mobile | Desktop |
|---------|---------|----------|--------|--------|--------|--------|---------|
| Landing | ✓ runtime | structural | structural | ✓ switch | generator | Stage 9 | ✓ smoke |
| Dashboard | ✓ smoke | structural | structural | ✓ continuity | generator | Stage 9 | ✓ smoke |
| Themes | ✓ | card listed | card listed | ✓ active | create path | Stage 9 | ✓ |
| Settings / More | — | — | — | ✓ | — | Stage 9 | ✓ |
| Shared modal / Rules | — | — | — | ✓ Sueca rules | — | Stage 9 | ✓ |
| Sueca | — | — | — | ✓ dealing + Phaser | — | portrait smoke | ✓ |
| Hearts / Spades / King | Stage 8 structural | Stage 8 | Stage 8 | Stage 8 | Stage 8 | Stage 9 | Stage 8 |
| Round-end / game-over | Stage 8 CSS | Stage 8 | Stage 8 | Stage 8 | Stage 8 | Stage 9 | Stage 8 |

Legend: ✓ = browser or focused runtime check this stage; structural = Stage 3/8/12 tests + token blocks.

---

## 3. Theme contract

All 16 `--sc-*` present on `:root` (emergency brass) and on representative built-ins (non-emergency accents). Active themes do not resolve to emergency `#c5a45b` during normal use (verified Classic Landing + Forest shell/game).

---

## 4. Built-ins

Representatives **classic / midnight / thebes / thule / forest / el-dorado**: full contract tokens; accents ≠ emergency brass; identities distinct in CSS. Runtime: Classic Landing (`#6c5ce7`), Forest shell/game (`#50a050`).

---

## 5. Classic

- Explicit `data-theme="classic"` block with intentional purple  
- No Classic purple in other representative blocks (Stage 12 + Stage 7 tests)  
- Landing → Dashboard continuity under Classic confirmed in browser  

---

## 6. Custom

Generator emits 16 `--sc-*` + bg companions; turn derived from accent; no primary-dark; no Classic purple fallback (unit tests). Browser custom editor path available (`+ Criar`); full visual custom paint covered by Stage 4 suite + generator integrity.

---

## 7. Landing / Shell continuity

Classic: Landing tokens → Dashboard purple primary buttons / active nav.  
Forest: Themes → Settings → Dashboard → Sueca rules → Sueca dealing; accent stayed `#50a050`; no palette jump.

---

## 8. Shared components

Primary / secondary / modal / radios on dealing modal themed under Forest. No Material blue, no Dobo classes in DOM. Focus/disabled recipes retained in `sueca-buttons.css` (Stage 6 tests).

---

## 9–12. Games

| Game | Result |
|------|--------|
| Sueca | Browser: Forest dealing modal + Phaser host + Us/Them pods; Stage 8 CSS |
| Hearts | Stage 8 structural (pass/selection/chrome) — no regression signals |
| Spades | Stage 8 structural (bid HUD) — no regression signals |
| King | Stage 8 structural (auction/festa/KOH) — no regression signals |

---

## 13. Game semantics

Us `#3484ea` / Them `#e25c5c` / Danger `#dc3545` fixed on `:root`. Sueca score pods visible as Us/Them under Forest (accent did not replace semantics).

---

## 14. Phaser boundary

- `phaserTheme.ts` reads `--sc-text` / `--sc-turn` / `--sc-accent`  
- Host CSS uses `--sc-felt-dark`  
- Premium Classic table intent preserved in code comments / `PREMIUM_TABLE` defaults  
- Sueca smoke: `.sueca-phaser-root` present; DOM chrome themed around canvas  

---

## 15. Responsive

Stage 9 guards re-asserted (touch-min, safe-area, `dvh`, Landing max-height). Browser desktop viewport: `scrollWidth === clientWidth` (no horizontal overflow). Portrait Sueca dealing modal usable. Full Stage 9 MQ matrix not re-run; no regressions found.

---

## 16. Colour leakage

- Forbidden Classic purple only inside Classic block  
- No emergency brass on active Forest/Classic paths  
- No Material `#2196F3` on modal primaries  
- No Dobo gradients  

---

## 17. Dead architecture check

| Artifact | Status |
|----------|--------|
| `dobo-ui.css` | absent |
| `.dobo-btn` / `.dobo-panel` / `.variant-modal-primary` / `.continue-button` | zero runtime DOM / CSS |
| `.app-shell[data-theme]` bridge | absent |
| Removed legacy paint vars | absent from consumer CSS |

---

## 18. Accessibility

Touch-min 48px retained; focus-visible recipes present; selected radio/active theme states visible under Forest. Top-bar remains dense / text-heavy — **future concern only**.

---

## 19–21. GLOBAL / Stage 10

| Item | Status |
|------|--------|
| GLOBAL-UI-02 top game bar | **OPEN** (functional; not iconized) |
| GLOBAL-UI-03 active player cue | **OPEN** |
| GLOBAL-CARDS-01 card separation | **OPEN** |
| Stage 10 Theme↔Music UX | **DESIGN PENDING / DEFERRED** |

Future UX note (no design): integrated Theme+Deck+Music+SFX personalisation; iconized in-game top bar; desktop tooltip / mobile touch-label TBD; final menu architecture TBD.

---

## 22–24. Findings

| Sev | Finding |
|-----|---------|
| P0 | none |
| P1 | none |
| P2 | Top bar density (GLOBAL-UI-02); cue polish (GLOBAL-UI-03); card fan separation (CARDS-01); King auction density (known) |
| DEFERRED | Stage 10 product UX; OPPO physical device |

**Fixes applied:** none (no objective regressions).

---

## 25. Tests / build

- Theme architecture suites: **92/92** (includes new Stage 12 structural file)  
- `tsc --noEmit`: pass  
- `npm run build`: pass (pre-smoke build)  

---

## 26. OPPO

Unavailable — browser responsive / preview smoke used. Physical-device glance remains pending.

---

## 27. Exit criteria

- [x] Built-ins / Classic / custom / continuity / shared / games / Us-Them / Phaser / responsive / leakage / dead arch  
- [x] No P0/P1  
- [x] Tests + tsc + build  
- [x] Stage 10 deferred  
- [x] Stage 13 ready  

---

*THEME-ARCHITECTURE-STAGE-12 · 2026-09-20*
