# Phaser default rollout (Sueca) · 2026

**Date:** 2026-09-07  
**Scope:** Sueca solo only. Spades / Hearts / King remain DOM.

## Policy

| Variant | Default | `?renderer=phaser` | `?renderer=dom` |
|---------|---------|--------------------|-----------------|
| **Sueca** | **Phaser** | Phaser | DOM |
| Spades | DOM | DOM (ignored) | DOM |
| Hearts | DOM | DOM (ignored) | DOM |
| King | DOM | DOM (ignored) | DOM |

Multiplayer Sueca forces DOM (unchanged).

## Precedence

1. URL query `?renderer=`
2. `REACT_APP_TABLE_RENDERER` (`phaser` | `dom`)
3. Variant default

Central helper: `frontend/src/renderers/resolveTableRenderer.ts`

## Fallback

If Phaser fails to init/render:

- `PhaserTableErrorBoundary` + `onInitError` → switch to DOM
- Game / GameSession state preserved
- DEV log: `Phaser renderer failed, falling back to DOM`
- No technical error UI for players

## Debug

- `?renderer=dom` — force Sueca DOM
- `?renderer=phaser` — force Sueca Phaser
- DEV: `window.__suecaRenderer` = `"phaser" | "dom"`

## Related

- Decision: `docs/plan/RENDERER_DECISION_2026.md`
- Android validation: `docs/plan/PHASER_ANDROID_VALIDATION_2026.md`
