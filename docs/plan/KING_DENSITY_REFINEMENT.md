# KING DENSITY REFINEMENT

**ID:** `KING-DENSITY-01`  
**Root:** `E:\SUECAO`  
**Branch:** `v2-main`  
**Status:** `IMPLEMENTED / VISUAL VALIDATION PENDING`

---

## Objective

Reduce visual competition in King while preserving all information and controls via progressive disclosure and contextual visibility. UX composition only — no rules, scoring, auction, AI, table geometry, or GLOBAL-UI-02/03 / Stage 10 changes.

---

## Before / after composition

| Zone | Before | After |
|------|--------|-------|
| TOP | Compact score + contract (HUD SoT) | Same compact HUD + **Ver tabela** on demand |
| CENTER | Table | Unchanged (no GameBoard / Phaser geometry edits) |
| BOTTOM (Festa sheet) | Auction timeline always expanded; disabled action groups visible; duplicated result copy | Context → actionable choices → collapsed **Histórico do leilão**; hide unavailable actions |

---

## What moved to disclosure

1. **Auction history** — chips no longer permanently expand; toggle `Histórico do leilão (N)`, collapsed by default.
2. **Full King score sheet** — during play, compact score strip only; `Ver tabela` opens existing `KingScoreSheetModal` overlay (game stays mounted).
3. **Disabled Festa actions** — not rendered (prefer hide over large disabled groups). Reasons remain in availability helpers for tests/engine consistency.

---

## Auction history behaviour

- Component: `KingAuctionTimeline`
- Default: collapsed (`defaultOpen = false`)
- Open: compact chip row (same formatting as before)
- Placed **after** primary context/actions so controls stay dominant
- Shown only for phases already gated by `shouldShowKingAuctionTimeline`

---

## Score / table behaviour

- Gameplay HUD: per-player compact scores + contract context (unchanged SoT)
- Control: `Ver tabela` in contract column (`data-testid="king-ver-tabela"`)
- Open: `KingScoreSheetModal` dismissible with OK; no new navigation screen
- Engine `score_popup` overlay path unchanged

---

## Festa hierarchy

1. **Context** — title (`king-festa-sheet-title`) + quieter hint (`king-festa-context-hint`)
2. **Choices** — `king-festa-actions--dominant` (primary actions only when enabled)
3. **Secondary** — collapsed auction history / setup preview, not competing with choices

Auction result: removed duplicate bid line under winner box.

---

## Responsive findings

Portrait-first targets (360×800 / 390×844 / 420×900):

- Collapsed history reduces vertical pile-up on auction turns after many bids/passes
- Dominant action row stays in the bottom sheet viewport
- Score sheet overlay reuses existing modal styles (max-height / scroll already present)
- No landscape work

### Final vertical-spacing tune

**Root cause:** compact King festa sheets used `align-items: flex-end` on a full-viewport overlay while the table sat mid-screen (and hand clearance reserved ~28dvh), leaving a large empty felt band between table and panel.

**Change:** `.variant-modal-overlay--king-festa` places the sheet under a flex spacer sized to the festa table slot, with ~20px margin-top; reduced festa phaser/hand clearance spacers. Table/HUD/Phaser internal geometry unchanged.

**Visual smoke:** pending re-check after spacing tune.

---

## Explicit non-changes

- King rules / scoring / auction order / Festa rules / AI / persistence
- GameBoard width
- Phaser / canvas table geometry
- GLOBAL-UI-02 / GLOBAL-UI-03 / GLOBAL-CARDS-01 / Stage 10

---

## Tests

- `KingAuctionTimeline.test.tsx` — collapsed by default; open/close
- `KingFestaFlowModal.test.tsx` — hide unavailable fallback; choices actionable; history collapsed during auction
- `UnifiedGameStatusPanel.test.tsx` — Ver tabela opens/closes score sheet while HUD mounts
