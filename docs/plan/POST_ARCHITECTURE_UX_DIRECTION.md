# Post-Architecture UX Direction

**ID:** `POST-ARCHITECTURE-UX-DIRECTION-01`  
**Root:** `E:\SUECAO`  
**Branch:** `v2-main`  
**Created:** 2026-09-20  
**Mode:** PRODUCT / UX documentation (no implementation in this revision)

---

## 1. STATUS

**STATUS:** PRODUCT / UX DIRECTION — APPROVED FOR FUTURE IMPLEMENTATION

**IMPORTANT:** Theme Architecture Foundation is already **COMPLETE**.

This document does **not** reopen theme architecture.

**Stage 10** remains: `DESIGN PENDING` / `DEFERRED`

Canonical architecture close: [`THEME_ARCHITECTURE_STAGE_14_RELEASE_GATE.md`](./THEME_ARCHITECTURE_STAGE_14_RELEASE_GATE.md)  
Master plan: [`THEME_ARCHITECTURE_MASTER_PLAN.md`](./THEME_ARCHITECTURE_MASTER_PLAN.md)

---

## 2. Princípio geral

Suecão is **game-first**.

The primary focus of the application must remain **playing**.

Personalisation is important, but must not compete with the game as the main destination.

Direction:

- jogo primeiro  
- chrome reduzido  
- informação contextual  
- menos elementos permanentemente visíveis  
- portrait-first  

---

## 3. Orientation policy

**Approved decision:** Portrait-first.

Do **not** design or optimise landscape in this next phase.

Assume Suecão can be played entirely in portrait.

Landscape may be reconsidered later, but does **not** condition UX decisions now.

---

## 4. In-game top bar

**Current:** `Pausar | Pin | Novo | Sair`

**Approved future direction:** `⏸ | 📌 | ⋯`

**Visible permanent actions:**

- ⏸ Pausar / Retomar  
- 📌 Fixar / Pin  
- ⋯ Mais  

**Remove from permanent bar:**

- Novo jogo  
- Sair do jogo  
- Regras  
- Definições  

**Reason:** reduce chrome density and give more visual priority to the table/game.

**Top bar responsibility:** COMMANDS ONLY.

Do **not** place game-state information in the top bar.

---

## 5. Overflow menu `⋯`

**Approved pattern:** Compact anchored mini-sheet / popover attached to the top-right `⋯`.

**Preferred over:**

- full bottom-sheet  
- large modal  
- permanent extra buttons  

**Structure:**

```
Regras
Definições
────────────
Novo jogo
Sair do jogo
```

**Requirements:**

- icon + text per row  
- compact width  
- closes on outside tap  
- closes after selection  
- subtle fade/scale only  
- `Novo jogo` + `Sair do jogo` visually separated from normal options  
- `Sair do jogo` danger treatment  
- `Sair do jogo` confirmation when abandoning game/context  
- `Novo jogo` confirmation when appropriate during active game  

Bottom-sheet may exist **only** as fallback if viewport constraints genuinely require it.

---

## 6. Desktop top-bar interaction

**Approved:** icon + hover/focus tooltip.

Example: hover/focus over pause icon → `Pausar`

No permanent labels required.

---

## 7. Mobile touch interaction

Do **not** use long-press as the primary discovery mechanism.

**Approved direction:**

1. `pointerdown`  
2. → pressed visual state  
3. → show short label  
4. → `pointerup`  
5. → execute action  

Example: touch pause icon → temporarily show `Pausar` → release → pause.

For `⋯`: tap opens textual menu directly.

**No final timing values decided yet.**

---

## 8. GLOBAL-UI-02

**GLOBAL-UI-02** = current in-game top-bar density.

**Status:** **IMPLEMENTED / VISUAL VALIDATION PENDING** (Batch 1).

**Structural direction:** icon-oriented top bar + overflow menu.

**Audit / plan:** [`GLOBAL_UI_02_TOP_BAR_AUDIT_PLAN.md`](./GLOBAL_UI_02_TOP_BAR_AUDIT_PLAN.md)  
**Implementation:** [`GLOBAL_UI_02_TOP_BAR_IMPLEMENTATION.md`](./GLOBAL_UI_02_TOP_BAR_IMPLEMENTATION.md)

Do **not** mark final visual implementation DONE until OPPO / device visual validation completes.

---

## 9. Active player — GLOBAL-UI-03

**Status:** `IMPLEMENTED / VISUAL VALIDATION PENDING`

**Approved direction:** Active player cue lives in HUD / table / player seat.

**NOT** in the top bar.

Active player gets:

- border or underline using `--sc-turn`  
- small dot  
- label `A JOGAR`  

**Label behaviour:**

- `A JOGAR` appears **only** on the player whose turn is active  
- remains visible for the duration of that turn  
- when turn changes: old label disappears; new active player gets the cue  

**Constraints:**

- no continuous pulsing animation  
- no strong glow  
- same semantic pattern across Sueca / Hearts / Spades / King  
- game/team semantics must remain distinct from theme decoration  

**Implementation (shipped):**

- Shared state: `isActiveTurnSeat` → DOM `PlayerInfoBox` / Phaser `showActiveHighlight` + `turnCueLabel`
- DOM: `.turn-now-dot` + `.turn-now-label` (`t.gameBoard.nowPlaying` = `A JOGAR` / `PLAYING`), outline via `--sc-turn`
- Phaser: seat panel stroke/fill uses `theme.active` (`--sc-turn`); cue row under name
- Suppressed: Hearts pass, King Festa sheet, trick-end / round waits (no active-turn concept)
- Spades bid: cue on current bidder (same semantic; bidding outline only when not active)

**GLOBAL-UI-03** visual device validation still required before final DONE.

---

## 10. Card presentation — GLOBAL-CARDS-01

**Approved direction for HUMAN hand:**

- keep compact fan  
- guarantee rank + suit readable on every card  
- adaptive overlap according to number of cards  
- more cards = tighter overlap  
- fewer cards = progressively more breathing room  
- selected card gets clear vertical lift  
- subtle shadow/outline allowed  
- no theatrical semicircle  
- no exaggerated rotation  
- no automatic zoom on hover  
- no artwork/renderer redesign  

**Important:** minimum visible area per card must preserve useful top-left information.

**Opponent hands:**

- may remain significantly more compact  
- goal is quantity representation, not individual card readability  

Same principle across all four games.

**GLOBAL-CARDS-01** remains **PARTIAL / OPEN** until implemented + visually validated.

---

## 11. King density

**Approved direction:** Do **not** simplify King by removing necessary information.

**Goal:** same information, less visual competition.

**Structural hierarchy:**

| Zone | Role |
|------|------|
| TOP | main state / context |
| CENTER | table / gameplay |
| BOTTOM | current contextual decision/action |

**Principles:**

- only one area should visually dominate at a time  
- secondary explanatory text quieter  
- unavailable controls should disappear rather than remain visually present  
- history/details can use progressive disclosure  
- do not turn everything into accordions  
- primary actions remain directly visible  

**Example auction hierarchy:**

```
Beneficiário
Maior oferta
────────────
available bid/actions
────────────
Passar
```

- Historical auction details: collapsed / on-demand  
- Score during gameplay: compact summary  
- Full King score table: on-demand / when contextually relevant  
- Festa: context first, choices dominant, secondary summary below  

**King density** remains **P2** until implemented and visually reviewed.

**Mandatory:** visual validation after implementation. Adjust if information becomes too hidden or still too dense.

---

## 12. Personalisation — future direction

Personalisation is approved as a **future integrated concept**, but **not** as the main navigation focus.

**Future concept:**

Theme + Deck + Card Back + Music + SFX

**Potential model:** Theme provides suggested defaults:

- suggested deck  
- suggested back  
- suggested music  
- suggested SFX profile  

User overrides remain possible.

**Potential behaviour — `Follow theme` per subsystem:**

- Music: follow theme / manual override  
- Deck: follow theme / manual override  
- SFX: follow theme / manual override  

**Important:** Theme **suggests**. Theme does **not** hard-lock other choices.

**Valid example:** Knossos theme + CardMeister + Shambhala music.

---

## 13. Personalisation navigation status

Do **not** make Personalisation a primary app destination automatically.

**Current product direction:** game remains primary.

Personalisation may live under `Mais` or another future menu architecture.

**Final menu architecture:** UNDECIDED.

Do **not** implement navigation restructuring yet.

---

## 14. Stage 10

Stage 10 remains: **DESIGN PENDING / DEFERRED**

Future Stage 10 scope may include:

- Themes + Deck + Music + SFX integrated UX  
- follow-theme model  
- personalisation screen architecture  
- possible menu restructuring  
- content preview  
- theme/music relationship  

Do **not** mark Stage 10 DONE.

---

## 15. Explicitly undecided

**OPEN PRODUCT DECISIONS** (do not invent answers):

- final visual design of top bar  
- exact icon set  
- exact spacing/sizing  
- tooltip timing  
- touch-label timing  
- animation timing  
- final menu architecture  
- exact Personalisation placement  
- final Stage 10 screen composition  
- landscape behaviour  
- exact King disclosure UI  
- exact active-player geometry  
- exact card overlap formula  

---

## 16. Validation policy

All approved directions are subject to **visual validation after implementation**.

**Workflow:**

1. decision  
2. → implementation  
3. → browser / OPPO visual review  
4. → adjust  
5. → final acceptance  

No future item should be considered visually DONE solely because tests pass.

---

## 17. Relation to existing open items

| Item | Status |
|------|--------|
| GLOBAL-UI-02 | IMPLEMENTED / VISUAL VALIDATION PENDING — Batch 2B HUD column + board width fix |
| GLOBAL-UI-03 | IMPLEMENTED / VISUAL VALIDATION PENDING |
| GLOBAL-CARDS-01 | PARTIAL / OPEN — direction approved |
| King density | P2 — direction approved |
| Stage 10 | DESIGN PENDING / DEFERRED |
| Theme Architecture Foundation | COMPLETE |

---

## 18. Pointers

- Roadmap: [`ROADMAP_REBASE_SEPTEMBER_2026.md`](./ROADMAP_REBASE_SEPTEMBER_2026.md)  
- Theme Architecture master plan: [`THEME_ARCHITECTURE_MASTER_PLAN.md`](./THEME_ARCHITECTURE_MASTER_PLAN.md)  

---

*POST-ARCHITECTURE-UX-DIRECTION-01 · 2026-09-20 · APPROVED FOR FUTURE IMPLEMENTATION*
