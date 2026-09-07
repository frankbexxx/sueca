# Phaser Hearts (H2) · 2026

**Date:** 2026-09-07  
**Scope:** Hearts solo Phaser table behind `?renderer=phaser`. Default remains DOM.

## Audit summary (DOM vs Phaser)

| Area | DOM / React | Phaser H2 |
|------|-------------|-----------|
| Pass panel / confirm | `HeartsPassModal` | React (unchanged) |
| Pass card selection | DOM hand | Phaser hand tap → shell toggle |
| Early end / moon / Round End | React modals | React (unchanged) |
| Score strip | React HUD | React (unchanged) |
| Seats / hand / trick | DOM table | Phaser table |
| Hearts broken | `SuitBrokenBadge` | Mesa banner `♥ Fechadas/Quebradas` |
| Legal play / first-trick / Q♠ | engine via shell | same `isLocalCardPlayable` |

## TableRenderModel additions

- `status.waitingForEarlyEnd` (generic; Hearts + King)
- `variantUi.hearts`: `heartsBroken`, `waitingForPass`, `passDirection`, `queenSpadesTaken`
- Pass indices remain `variantUi.heartsPassIndices`

## Selector policy

| Variant | Default | `?renderer=phaser` | `?renderer=dom` |
|---------|---------|--------------------|-----------------|
| Sueca | Phaser | Phaser | DOM |
| Spades | DOM | Phaser | DOM |
| **Hearts** | **DOM** | **Phaser** | DOM |
| King | DOM | ignored | DOM |

## Activation

Hearts Phaser: `?renderer=phaser` (or `REACT_APP_TABLE_RENDERER=phaser`).  
Not default until a later promotion step.
