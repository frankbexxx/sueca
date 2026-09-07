# Phaser Spades (H1) · 2026

**Date:** 2026-09-07  
**Scope:** Spades solo Phaser table behind `?renderer=phaser`. Default remains DOM.

## Audit summary (DOM vs Phaser)

| Area | DOM | Phaser H1 |
|------|-----|-----------|
| Bidding controls | React `SpadesBidMinibox` | React (unchanged) |
| Bags / score strip | React HUD | React (unchanged) |
| Round End / race-to-500 | React modals | React (unchanged) |
| Seats / hand / trick | DOM table | Phaser table |
| Broken spades | `SuitBrokenBadge` | Mesa banner `♠ Fechadas/Quebradas` |
| Bid badges on seats | `PlayerInfoBox` | Seat chrome `bidLabel` |
| Legal play | shell callback | same callback |

## TableRenderModel additions

`variantUi.spades` extended with serializable fields:

- `spadesBroken`
- `playerBids` / `playerBidTypes`
- `team1Bid` / `team2Bid`

Bags intentionally omitted (React HUD).

## Selector policy

| Variant | Default | `?renderer=phaser` | `?renderer=dom` |
|---------|---------|--------------------|-----------------|
| Sueca | Phaser | Phaser | DOM |
| **Spades** | **DOM** | **Phaser** | DOM |
| Hearts / King | DOM | DOM (ignored) | DOM |

## Activation

Spades Phaser: `?renderer=phaser` (or `REACT_APP_TABLE_RENDERER=phaser`).  
Not default until a later promotion step.
