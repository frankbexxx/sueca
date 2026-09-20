# GLOBAL-UI-02 — In-Game Top Bar Audit & Implementation Plan

**ID:** `GLOBAL-UI-02-TOP-BAR-AUDIT-PLAN`  
**Root:** `E:\SUECAO`  
**Branch:** `v2-main`  
**Date:** 2026-09-20  
**Mode:** READ / AUDIT / PLAN ONLY — no implementation in this revision  
**Canonical UX:** [`POST_ARCHITECTURE_UX_DIRECTION.md`](./POST_ARCHITECTURE_UX_DIRECTION.md)  
**STATUS:** AUDIT COMPLETE · **Implementation readiness: READY**

---

## 1. Executive summary

The in-game top bar is a **single shared component** — `InGameBar` — mounted once from `GameBoard` for **Sueca, Hearts, Spades, and King**. There is **no per-game fork** at the bar layer.

| Today | Target |
|-------|--------|
| Text + emoji: Pausar/Retomar · 📌 · Novo · Sair | Icons: ⏸ · 📌 · ⋯ |
| Novo / Sair permanent | Overflow only |
| Regras / Definições absent | Overflow rows |
| Left: gameLabel + playerName | Identity chrome — **OPEN** whether to keep/shrink |

**Handlers for Pause / Resume / Pin / Novo / Sair are fully identified.** Regras and Definições need **new wiring**. Overflow menu has **no existing popover primitive** (build new; reuse confirms + RulesSheet pattern). Settings via shell navigation would **unmount** the live game — architectural choice required before coding Definições (behaviour understood; presentation OPEN).

---

## 2. Current architecture

### Components

| Role | Path |
|------|------|
| Bar | `frontend/src/components/navigation/InGameBar.tsx` |
| Bar CSS | `frontend/src/components/navigation/InGameBar.css` |
| Unit tests | `frontend/src/components/navigation/InGameBar.test.tsx` |
| Sole consumer | `frontend/src/components/GameBoard.tsx` (~1437–1453) |
| App game screen | `frontend/src/App.tsx` (~223–235) — GameBoard only; **no BottomNav** |
| Confirm (Novo/Sair) | `ConfirmDialog` inside InGameBar |
| Confirm (Pin) | `ConfirmDialog` in GameBoard (~1789+) |
| Orphan rules overlay | `frontend/src/components/RulesSheet.tsx` — **zero importers** |

### Props interface (current)

```ts
interface InGameBarProps {
  playerName: string;
  gameLabel: string;
  metaLabel?: string;      // dev-only AI source from GameBoard
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onNewGame: () => void;
  onPinGame?: () => void;
  onExit: () => void;
}
```

**Absent today:** Regras, Definições, overflow, tooltip hooks, pointer-label handlers.

### Local UI state

- `pending: 'newGame' | 'exit' | null` — confirm gates inside InGameBar  
- Pin confirm: `pinConfirmOpen` in GameBoard  

### CSS notes

- Semantic tokens: `--sc-text`, `--sc-text-muted`, `--sc-surface-border`; HUD paint via `--premium-hud-panel-strong` (intentional Premium HUD global — contract v1)  
- `safe-area-inset-top` present (Stage 9)  
- `@media (max-width: 360px)` density only — **no landscape-specific InGameBar rules**  
- `z-index: 100`  

---

## 3. Control usage map

| Control | Current UI | Handler | State dependency | Used in games | Confirmation | Notes |
|---------|------------|---------|------------------|---------------|--------------|-------|
| **Pause** | `⏸ ${pause}` text button | `onPause` → `GameBoard.handlePause` → `gameAdapter.pauseGame` | `gameState.isPaused === false` | All 4 (shared) | No | Immediate |
| **Resume** | Same button → `▶ ${resume}` | `onResume` → `handleResume` → `resumeGame` | `isPaused === true` | All 4 | No | Label toggle already exists |
| **Pin** | `📌` icon only + `title`/`aria-label` | `onPinGame` → `handlePinGame` → parent confirm → `pinGameSession` | Blocked if `isGameOver` | All 4 | Yes (parent) | One-shot persist; not a toggle; no selected visual |
| **Novo** | Text `Novo jogo` | `setPending('newGame')` → confirm → `onNewGame` → `handleNewGame` | — | All 4 | Yes (InGameBar, destructive) | MP → `onRestartAsSolo`; else `restartFreshGame` |
| **Sair** | Text `Sair` (danger btn) | `setPending('exit')` → confirm → `onExit` → `handleLeaveScreen` → App `exitGame` | — | All 4 | Yes (InGameBar, destructive) | Solo saves session first |
| **Regras** | — | **Not wired** | — | — | — | Shell Home/Rules hub; `RulesSheet` orphaned |
| **Definições** | — | **Not wired** | — | — | — | Shell `tab: 'settings'` only; game screen has no shell |

**Already exist (keep semantics):** Pause, Resume, Pin, Novo, Sair + confirms.  
**Need wiring:** Regras, Definições, overflow `⋯`, icon-only chrome, desktop tooltip, mobile press-label.

---

## 4. Game coverage

| Concern | Sueca | Hearts | Spades | King |
|---------|-------|--------|--------|------|
| Component | Shared `InGameBar` | same | same | same |
| Mount path | `App` → `GameBoard` → `InGameBar` | same | same | same |
| Pause SoT | `GameAdapter` `isPaused` | same | same | same |
| Pin / Novo / Sair | Shared handlers | same | same | same |
| Variant UI | Below bar (ScoreStrip, sheets) | same | same | same |

**Difference that matters (side effects, not bar UI):**

- **Multiplayer Novo:** remounts solo via `onRestartAsSolo(gameVariant)`  
- **Multiplayer Sair:** skips `saveGameSession`  
- **`gameLabel` / `metaLabel`:** variant name + optional dev AI meta — still shared component  

**Conclusion:** one implementation path covers all four games.

---

## 5. Pause / Resume

**Representation:** `gameState.isPaused` via `GameAdapter.pauseGame` / `resumeGame` (mutates engine/`isPaused`).

**Current UI:** single button; label flips Pause ↔ Resume with emoji.

**Effects when paused (GameBoard):**

- AI auto-play gated  
- Human card play blocked  
- No modal on pause itself  

**Callbacks:** synchronous; `setGameState` after adapter call.

**Future UX plan:**

- Single icon button  
- Glyph: ⏸ when playing · ▶ when paused (existing convention)  
- `aria-label` / tooltip / touch-label: `Pausar` ↔ `Retomar` from `t.gameMenu.pause` / `t.gameMenu.resume`  
- No behaviour change  

---

## 6. Pin / Fixar

**What it pins:** current config + state into `localStorage` (`sueca-pinned-sessions-v1`), **one slot per `gameVariant`**.

**Toggle?** No — one-shot write after confirm. Overwrites previous pin for that variant.

**Visual selected state:** none today. No “already pinned” indicator. `t.inGame.pinnedToast` exists in i18n but is **unused**.

**Persisted:** yes (`pinGameSession`). Transient UI: confirm dialog only.

**Future UX plan:**

- Keep as visible icon button  
- Keep confirm + `pinGameSession` semantics unchanged  
- Pressed/active: semantic token feedback only  
- Optional “already pinned for this variant” affordance = **OPEN** (not required by current behaviour)  

---

## 7. New game

**Callback chain:** InGameBar confirm → `onNewGame` → `handleNewGame`:

1. Cancel game-over auto-exit timer  
2. If multiplayer + `onRestartAsSolo` → restart as solo for variant  
3. Else `restartFreshGame`: `clearGameSession` → bump `gameInitKey` → remount adapter  

**Immediate reset?** After confirm, yes (fresh init). Not before confirm.

**Confirmation:** already exists — `t.inGame.newGameConfirm`, destructive.

**Active vs finished:** same path; game-over timer cancelled. No separate finished-only branch in the bar.

**Target:** remove from permanent bar → overflow row; **keep confirmation + handler unchanged**.

**When confirmation required:** keep current rule — always confirm before Novo from the bar/overflow (do not invent softer rules for finished games unless product opens that later).

---

## 8. Exit

**Navigation:** `handleLeaveScreen` → App `exitGame` → clears `gameConfig` / resume pointers → `setScreen('shell')` → **unmounts GameBoard**.

**Confirmation:** yes — `t.inGame.leaveConfirm` (“Voltar ao início? A partida fica guardada.”), destructive styling.

**State discard:**

- Solo: `saveGameSession` before exit (Continue)  
- Multiplayer: no session save on leave  

**Per-game:** same handler.

**Target:** overflow only; danger treatment; keep confirm + save semantics.

---

## 9. Rules

| Entry | Status |
|-------|--------|
| In-game bar | **None** |
| Shell Home / Rules hub | `onViewRules` → Rules detail screens |
| Overlay | `RulesSheet` — ready-shaped overlay; **not imported anywhere** |

`RulesSheet` already:

- Accepts `variant` + optional `presetId`  
- Resolves preset / King PT sections  
- Overlay click-outside to close  
- Hard-coded English `"Close"` button (i18n debt)  

**Target:** overflow → open in-game overlay (prefer wiring/adapting `RulesSheet`) so game **stays mounted**. Do **not** invent a new rules content system.

---

## 10. Settings

**Current path:** shell only (`ShellRouter` when `tab === 'settings'` / More screen). Game mode renders **GameBoard alone** — no BottomNav, no shell stack.

**Direct navigation to Settings today would:**

1. Call something equivalent to leaving game / changing `screen`  
2. **Unmount** live `GameBoard`  
3. Solo progress depends on autosave / Continue — **not** seamless return to the same live instance  

**In-game settings path:** **does not exist**.

**Architectural flag (HIGH):** Definições must not silently navigate to shell settings without an explicit product decision.

**Safer options (do not invent final choice here):**

| Option | Pros | Cons |
|--------|------|------|
| A. In-game settings overlay/sheet | Keeps game mounted; matches “close after selection” | Needs scoped settings surface |
| B. Pause + navigate to shell settings | Reuses full Settings UI | Live instance lost; Continue required |
| C. Save + exit to settings tab | Explicit leave | Same unmount issue |

**OPEN PRODUCT DECISION:** which option. Behaviour risk is **understood**; do not implement until chosen.

---

## 11. Overflow primitive

**Approved UX:** compact anchored mini-sheet / popover on top-right `⋯`.

### Inventory

| Primitive | Fit |
|-----------|-----|
| `ConfirmDialog` | Reuse for Novo/Sair (and Pin already) |
| `RulesSheet` overlay | Pattern for Regras |
| Variant modal chrome (`VariantModals.css`) | Visual kinship |
| BottomNav `data-tooltip` CSS | Desktop labels — not a menu |
| Popover / DropdownMenu / OverflowMenu / floating-ui / Radix | **None in deps** |

### Verdict

**C — no suitable overflow primitive** for the `⋯` menu itself.  
**A — reuse** ConfirmDialog + RulesSheet pattern + confirm gates.  
**B — extend** BottomNav tooltip CSS into a shared helper for icon tooltips.

**Plan:** new small anchored menu component (e.g. `InGameOverflowMenu`) owned by InGameBar; outside click + Escape; portal optional if z-index/Phaser stacking requires it.

---

## 12. Desktop interaction

**Approved:** icon + hover/focus tooltip.

**Existing pattern:** `BottomNav.css` `[data-tooltip]:hover::after` / `:focus-visible::after` using `--sc-surface-modal` / `--sc-text`.

**Also:** native `title` + `aria-label` on Pin today.

**No** React Tooltip package.

**Recommend:** reuse/adapt BottomNav CSS tooltip pattern (or shared utility class); pair with `aria-label`. Timing delay = **OPEN**.

---

## 13. Mobile touch feasibility

**Current:** `onClick` only on bar buttons. No pointerdown label. Escape only inside ConfirmDialog.

**Approved:** pointerdown → pressed → short label → pointerup → action; `⋯` opens menu on tap.

**Feasibility:** **HIGH** for structure.

**Risks to design for:**

| Risk | Mitigation direction |
|------|----------------------|
| Double fire (pointerup + click) | Prefer pointer events **or** click — not both without guard |
| Scroll / cancel outside button | Cancel action if pointer leaves / `pointercancel` |
| Phaser canvas stealing events | Menu/overlay above board (`z-index`); bar already `z-index: 100` |
| Label before action | Do **not** execute on pointerdown — only on pointerup/click |

**Timing values:** OPEN (per UX direction). Phase E can ship after icon bar + overflow if needed.

---

## 14. Accessibility

| Concern | Plan |
|---------|------|
| `aria-label` | Required on icon-only controls; Pause/Resume must update with state |
| `aria-expanded` / `aria-controls` | On `⋯` when menu open |
| Focus-visible | Keep sueca-btn focus; tooltip on focus-visible |
| Keyboard | Enter/Space activate; Escape closes overflow + confirms (ConfirmDialog already) |
| Menu nav | Arrow keys nice-to-have; Tab through rows minimum |
| Outside tap | Close overflow |
| Danger | `Sair` uses danger styling + existing destructive confirm |
| Focus trap | Soft trap inside overflow when open (match ConfirmDialog rigor only if needed) |

Do not over-engineer beyond ConfirmDialog / RulesSheet patterns unless a11y review requires it.

---

## 15. Theme / token plan

Quiet chrome; Theme Contract only:

- `--sc-surface` / `--sc-surface-border` / `--sc-text` / `--sc-text-muted`  
- `--sc-accent` / `--sc-accent-rgb` for pressed/focus accents if needed  
- `--sc-danger` for Sair row / danger confirm  
- Existing Premium HUD panel paint may remain (documented intentional global)  

**Avoid:** theme-specific selectors, hardcoded purple, Material blue, new Dobo classes.

Pressed/active: semantic tokens only.

---

## 16. Icons

**Library:** none installed (no lucide / heroicons / react-icons / Radix).

**Existing convention:** Unicode / emoji (InGameBar + BottomNav).

| Action | Candidate (existing style) | Notes |
|--------|----------------------------|-------|
| Pause | ⏸ | Already used |
| Resume | ▶ | Already used |
| Pin | 📌 | Already used |
| More | ⋯ | UX-specified |
| Rules | 📖 | BottomNav |
| Settings | ⚙ | BottomNav |
| New game | OPEN | Text row may be enough with optional glyph |
| Exit | OPEN | Danger text row; optional glyph |

**Do not add an icon library** for this work. Exact glyphs beyond Pause/Pin/More remain **OPEN** if product wants alternatives.

---

## 17. File impact plan

### Required

| File | Intended change | Risk |
|------|-----------------|------|
| `InGameBar.tsx` | Icon controls + overflow wiring; move Novo/Sair | MEDIUM |
| `InGameBar.css` | Compact icon layout; menu; tooltip/press styles | LOW |
| `GameBoard.tsx` | Wire Regras (+ Definições once decided); keep handlers | MEDIUM–HIGH (Settings) |

### Probable

| File | Intended change | Risk |
|------|-----------------|------|
| New `InGameOverflowMenu.tsx` (+ css) | Anchored mini-sheet | MEDIUM |
| `RulesSheet.tsx` / `.css` | Wire in-game; i18n Close | LOW |
| `translations.ts` | aria / overflow labels if missing | LOW |
| Shared tooltip helper or BottomNav CSS extract | Desktop tooltips | LOW |
| Settings overlay component **or** documented navigate path | Definições | HIGH until decided |

### Tests

| File | Intended change | Risk |
|------|-----------------|------|
| `InGameBar.test.tsx` | Overflow, icon labels, Pause↔Resume aria, confirms from menu | LOW |
| Optional GameBoard integration smoke | Rules overlay doesn’t exit | LOW |
| Stage 8/9 CSS guards | Keep semantic / safe-area expectations | LOW |

### Docs

| File | Intended change | Risk |
|------|-----------------|------|
| `POST_ARCHITECTURE_UX_DIRECTION.md` | Optional pointer after ship | — |
| Roadmap GLOBAL-UI-02 status | Update when implemented + visually validated | — |
| This audit | Plan only (this commit) | — |

---

## 18. Risks

| Rank | Risk |
|------|------|
| **HIGH** | Definições via shell navigation unmounts live GameBoard |
| **HIGH** | Implementing Settings without choosing overlay vs navigate |
| **MEDIUM** | New overflow menu a11y (Escape, outside click, focus) |
| **MEDIUM** | Overflow / Phaser stacking or click-through to canvas |
| **MEDIUM** | pointerdown+click double execution if touch model naive |
| **MEDIUM** | RulesSheet orphan polish (i18n Close) |
| **LOW** | Pause state while overflow open (usually fine; optional auto-pause OPEN) |
| **LOW** | Safe-area / compact icon collision on narrow phones |
| **LOW** | Multiplayer Novo/Sair side-effect divergence (already exists) |
| **LOW** | Left identity cluster vs “commands only” product interpretation |

---

## 19. Test plan (future — do not write yet)

1. Pause ↔ Resume toggles `isPaused`; aria/tooltip text updates  
2. Pin opens parent confirm; still calls `pinGameSession`  
3. Overflow open/close; outside tap closes; Escape closes  
4. Row order: Regras → Definições → separator → Novo → Sair  
5. Rules action opens overlay; does **not** call `onExit` / clear session  
6. Settings action follows **chosen** architecture (assert `screen==='game'` if overlay)  
7. Novo / Sair confirms unchanged from overflow  
8. Keyboard: activate icons; Tab into menu; Escape  
9. Mobile pointer semantics smoke (when timing fixed)  
10. Shared path: one InGameBar wiring for all four variants (no fork)  
11. Regression: existing confirm + Escape tests  

---

## 20. Implementation sequence

### Phase A — Component / state preparation

- Extend InGameBar props for `onOpenRules` / `onOpenSettings` (or internal overlay state)  
- Keep Pause/Pin/Novo/Sair handlers intact  
- **Gate:** Settings presentation decision recorded  

### Phase B — Icon controls

- Permanent: Pause/Resume icon, Pin icon, `⋯`  
- Remove permanent Novo/Sair text buttons  
- Preserve left identity cluster **or** apply OPEN decision  

### Phase C — Overflow mini-sheet

- New anchored menu  
- Wire Regras → RulesSheet  
- Wire Definições per decision  
- Move Novo/Sair (+ existing confirms)  

### Phase D — Desktop tooltip

- Reuse BottomNav-style `data-tooltip` / shared CSS  
- aria-label parity  

### Phase E — Mobile touch label

- pointer press → short label → release → action  
- Guard against double fire  
- Timings remain OPEN until tuned  

### Phase F — Tests

- Expand `InGameBar.test.tsx` + any thin integration coverage  

### Phase G — Visual validation

- Browser + OPPO review per [`POST_ARCHITECTURE_UX_DIRECTION.md`](./POST_ARCHITECTURE_UX_DIRECTION.md) §16  
- Do **not** mark GLOBAL-UI-02 DONE on tests alone  

---

## 21. Open decisions

Do **not** invent answers:

- Exact icon glyphs beyond ⏸ / 📌 / ⋯  
- Tooltip delay  
- Touch-label duration  
- Mini-sheet exact width  
- Animation duration  
- Exact spacing / hit-target sizing  
- Exact destructive confirmation wording (keep i18n unless product changes)  
- **Definições presentation:** overlay vs navigate-to-shell  
- Whether left `gameLabel` / `playerName` stays, shrinks, or moves  
- Whether Pin shows “already pinned” state  
- Whether opening overflow should auto-pause  

---

## 22. Implementation readiness

# **READY**

**Criteria met:**

- [x] All current handlers identified (Pause/Resume/Pin/Novo/Sair)  
- [x] Settings behaviour understood (shell-only; navigate = unmount — HIGH risk flagged)  
- [x] Rules behaviour understood (`RulesSheet` reusable; currently unwired)  
- [x] Overflow architecture identified (**C** new + **A** reuse confirms/RulesSheet)  
- [x] No unknown game-specific bar divergence  

**Not blockers:** missing icon library; touch timing OPEN; Settings **presentation** OPEN (must be decided in Phase A before coding Definições).

---

*GLOBAL-UI-02-TOP-BAR-AUDIT-PLAN · 2026-09-20 · AUDIT ONLY*
