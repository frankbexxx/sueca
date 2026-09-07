# Phaser King (H3) · 2026

**Date:** 2026-09-07  
**Scope:** King solo Phaser table behind `?renderer=phaser`. Default remains DOM.

## Audit summary (DOM vs Phaser)

| Area | React / DOM | Phaser H3 |
|------|-------------|-----------|
| Festa sheets (auction, negotiation, 8/nulos, 4×3×3, fallback, setup) | `KingFestaFlowModal` | React (unchanged) |
| KOH reveal | `KingKohRevealModal` | React |
| Score popup / Round End / Game Over | React modals | React |
| Negativas / positivas play | engine + hand | Phaser table |
| Auction badges | `PlayerInfoBox` | Seat `bidLabel` |
| Contract / trump chrome | HUD | Mesa banner |
| Beneficiary / bidder | HUD / festa | Seat Lic/Ben badges |
| K♥ first legal opportunity | engine `mustPlayKingOfHearts` | `isLocalCardPlayable` only |

## TableRenderModel additions

`variantUi.king`:

- `phase`, `gameIndex`, `contract`, `festaMode`, `festaPhase`
- `festaOwnerIndex`, `benefitOwnerIndex`, `bidderIndex`, `beneficiaryIndex`
- `noTrump`, `eightOrNullsPending`, `waitingForChoice`

Also: suppress active seat while `festaSheetActive`.

## Selector policy

| Variant | Default | `?renderer=phaser` | `?renderer=dom` |
|---------|---------|--------------------|-----------------|
| Sueca | Phaser | Phaser | DOM |
| Spades | DOM | Phaser | DOM |
| Hearts | DOM | Phaser | DOM |
| **King** | **DOM** | **Phaser** | DOM |

## Activation

King Phaser: `?renderer=phaser` (or `REACT_APP_TABLE_RENDERER=phaser`).  
Not default until a later promotion step.
