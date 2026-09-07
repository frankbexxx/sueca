# Phaser default rollout · 2026

**Date:** 2026-09-07  
**Scope:** All four solo variants. DOM remains explicit fallback.

## Policy (final)

| Variant | Default | `?renderer=phaser` | `?renderer=dom` |
|---------|---------|--------------------|-----------------|
| **Sueca** | **Phaser** | Phaser | DOM |
| **Spades** | **Phaser** | Phaser | DOM |
| **Hearts** | **Phaser** | Phaser | DOM |
| **King** | **Phaser** | Phaser | DOM |

Multiplayer still forces DOM (unchanged).

## Precedence

1. URL query `?renderer=`
2. `REACT_APP_TABLE_RENDERER` (`phaser` | `dom`)
3. Variant default (Phaser for all capable variants)

Central helper: `frontend/src/renderers/resolveTableRenderer.ts`

## Fallback

If Phaser fails to init/render:

- `PhaserTableErrorBoundary` + `onInitError` → switch to DOM
- Game / GameSession state preserved
- DEV log: `Phaser renderer failed, falling back to DOM`
- No technical error UI for players
- No Phaser→DOM→Phaser loop

## Debug

- `?renderer=dom` — force DOM on any capable variant
- `?renderer=phaser` — force Phaser (redundant with defaults)
- DEV: `window.__suecaRenderer` = `"phaser" | "dom"`

## Device validation status

| Surface | Status |
|---------|--------|
| Browser PHONE VIEW | Validated (Sueca / Spades / Hearts / King smokes) |
| Android emulator | Validated (4 variants default Phaser; DOM override spot-check) |
| Android real device | Pending (non-blocking) |

## Known UX pendências (non-blocking)

- Hearts pass-phase: visual text overlap between Phaser copy and React bottom-sheet (input still works)
- Follow-up device-real smoke for Spades / Hearts / King
- Broader table UX polish (sizing, themes, assets) deferred

## Rollout commits

1. `feat(renderer): make phaser default for spades`
2. `feat(renderer): make phaser default for hearts`
3. `feat(renderer): make phaser default for king`

## Related

- Decision: `docs/plan/RENDERER_DECISION_2026.md`
- Android validation: `docs/plan/PHASER_ANDROID_VALIDATION_2026.md`
