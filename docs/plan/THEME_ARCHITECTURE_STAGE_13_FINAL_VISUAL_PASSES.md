# Theme Architecture — Stage 13 Final Visual Passes

**ID:** `THEME-ARCHITECTURE-STAGE-13`  
**Branch:** `v2-main`  
**Date:** 2026-09-20  
**STATUS:** `DONE`  
**Commit message:** `docs: resume final visual passes review`

---

## 1. Summary

Resumed Final Visual Passes over the validated Theme Contract (Stages 0–12). Reviewed Sueca, Hearts, Spades, and King in browser (mobile portrait + desktop shell). Prior Sueca local fixes (S1/S2/S4–S7/S9) still hold. **No P1 visual regressions requiring code.** Remaining work is P2 global design (top bar, active cue, card separation) deferred to future UX — not implemented here.

---

## 2. Method

- Reconcile `SUECA_FINAL_VISUAL_PASS.md` vs current CSS/runtime  
- Preview `http://127.0.0.1:4192/` · Emulation 390×844 + desktop  
- Themes: Classic (default in smoke); architecture already validated Stage 12  
- Phaser scene probe for Sueca hand sprites (WebGL)  
- No gameplay / Theme↔Sound / iconized top-bar work  

---

## 3. Sueca audit

| ID | Area | Issue | Severity | Local/Global | Recommendation | Status |
|----|------|-------|----------|--------------|----------------|--------|
| S1 | HUD/Phaser | Overlap strip vs table | — | Local | Keep stretch + overflow | **DONE** (reverified; stripBottom &lt; zoneTop) |
| S2 | InGameBar | AI Local meta | — | Local | Dev-only metaLabel | **DONE** (absent in prod) |
| S3 | Purple | Legacy purple | — | Global | Theme Architecture Etapa 7 | **SUPERSEDED** → GLOBAL-UI-01 DONE |
| S4 | Distribuição | Modal clutter | — | Local | Compact form | **DONE** (verified) |
| S5 | Pausa auto | Competes with Continuar | — | Local | ghost+compact | **DONE** (classes present) |
| S6 | Hand density | Fan spacing | — | Local | Selection polish only | **DONE** |
| S7 | Trick spacing | Anchors | — | Local | Batch-02 offsets | **DONE** (no regression) |
| S8 | Top bar | Density / labels | P2 | **GLOBAL-UI-02** | Future icon bar | **OPEN** |
| S9 | Card edges | Overlap artefacts | — | Local+Global | Hand mats | **DONE** local; GLOBAL-CARDS-01 PARTIAL |
| S10 | Active cue | Subtle | P2 | **GLOBAL-UI-03** | Future cue system | **OPEN** |
| S13-01 | Top bar touch | Buttons ~40px H; pin ~33px W | P2 | GLOBAL-UI-02 | Do not enlarge now (worsens density; pending icons) | **OPEN** / documented |

---

## 4. Sueca fixes

**None** — no objective P1; no safe local polish beyond deferred globals.

---

## 5. Hearts audit

| Area | Observation | Sev | Class |
|------|-------------|-----|-------|
| Pass phase | Bottom sheet + direction copy clear; CTA disabled until 3 selected | — | OK |
| Hand | 13-card fan; ranks/suits readable at left edge; Q♥ lift visible | P2 | GLOBAL-CARDS-01 |
| Top bar | Same density pattern as Sueca | P2 | GLOBAL-UI-02 |
| Score/status | Pontos + Estado legible | — | OK |
| Active cue | Subtle (Dealer -D / selection lift) | P2 | GLOBAL-UI-03 |

---

## 6. Hearts fixes

None.

---

## 7. Spades audit

| Area | Observation | Sev | Class |
|------|-------------|-----|-------|
| HUD | NÓS/ELES · bid/tricks · Score · bags preserved | — | OK |
| Bidding | Select 0–13 + Confirmar; ≥16px path from Stage 9 | — | OK |
| Active cue | Gold border on `Player 1 - D` visible during bid | P2 | GLOBAL-UI-03 (present but inconsistent across games) |
| Cards | Opponent backs dense | P2 | GLOBAL-CARDS-01 |
| Top bar | Same density | P2 | GLOBAL-UI-02 |

---

## 8. Spades fixes

None.

---

## 9. King audit

| Area | Observation | Sev | Class |
|------|-------------|-----|-------|
| KOH / Viragem | Modal + mini-table + primary CTA coherent | — | OK |
| Density | High info (expected); not simplified | P2 | Local King UX later |
| Top bar | Same density | P2 | GLOBAL-UI-02 |
| Theme | Classic purple CTA intentional | — | OK |

---

## 10. King fixes

None.

---

## 11. GLOBAL-UI-02

**OPEN.** Dense text buttons (Pausar / pin / Novo / Sair). Touch heights ~40px intentional under current chrome. **Future:** icon-oriented bar (desktop hover tooltip; mobile label behaviour **UNDECIDED**). No Stage 13 redesign.

---

## 12. GLOBAL-UI-03

**OPEN.** Cue often subtle; Spades bid seat shows clearer gold border. Needs consistent Premium Classic–aligned cue across games — design later.

---

## 13. GLOBAL-CARDS-01

**PARTIAL / OPEN.** Sueca mats + fan unchanged; Hearts 13-card ranks readable; dense overlap remains product intent pending broader renderer polish. Do not increase fan spacing here.

---

## 14. Theme observations

Classic chrome + Premium Classic Phaser felt coexist correctly. No emergency brass / Material blue / Dobo resurrection. Accent CTAs follow active theme.

---

## 15. Responsive observations

Portrait 390×844: dealing/pass/bid/KOH modals usable; no strip↔table overlap regression; no horizontal overflow noted. Landscape not re-full-audited (Stage 9 guards retained).

---

## 16. OPPO

Unavailable — browser Emulation + preview. Physical pending.

---

## 17. Tests / build

- Theme architecture suites re-run at close  
- `tsc --noEmit`  
- `npm run build` (preview build)

---

## 18. Remaining P1

None.

---

## 19. Remaining P2

GLOBAL-UI-02, GLOBAL-UI-03, GLOBAL-CARDS-01, King information density.

---

## 20. Deferred future UX

- Theme + Deck + Music + SFX integrated personalisation (Stage 10)  
- Iconized in-game top bar + tooltip/touch-label models  
- Final menu architecture  

---

## 21. Exit criteria

- [x] Four games reviewed  
- [x] No unresolved P1  
- [x] P2 / globals documented  
- [x] No gameplay / Theme Contract breakage  
- [x] Stage 10 deferred  
- [x] Stage 14 ready  

---

*THEME-ARCHITECTURE-STAGE-13 · 2026-09-20*
