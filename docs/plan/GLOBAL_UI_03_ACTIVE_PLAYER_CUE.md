# GLOBAL-UI-03 — Active player turn cue

**Status:** IMPLEMENTED / VISUAL VALIDATION PENDING  
**Date:** 2026-09-21  
**Commit intent:** `feat: add active player turn cue`

## Cue

- Token: `--sc-turn` (Phaser `theme.active` / `activeHex`)
- Dot: 6px (DOM) / ~6px radius 3 (Phaser)
- Label: `A JOGAR` (PT) / `PLAYING` (EN) via `t.gameBoard.nowPlaying`
- Outline: subtle 1px `--sc-turn` (no pulse, no glow loop)

## Shared path

| Layer | Mechanism |
|-------|-----------|
| State | `isActiveTurnSeat` → `TableRenderModel.seats[].isActive` |
| DOM | `PlayerInfoBox` + `ActiveTurnCue` |
| Phaser | `turnCueLabel` on seat + `redrawSeatChrome` |

## Suppressed

Hearts pass, King Festa sheet, game/round/trick waits — no `A JOGAR` without an active-turn concept.

Spades bid: cue on current bidder only.
