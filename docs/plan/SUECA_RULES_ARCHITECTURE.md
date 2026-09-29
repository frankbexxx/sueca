# Sueca rules architecture (ARCH-SUECA-03 Phase 1)

## Canonical module

`frontend/src/models/games/suecaRules.ts`

| Type | Meaning |
|------|---------|
| `Seat` | `0\|1\|2\|3` — South, West, North, East |
| `PlayDirection` | `'right'` (+3 ACW) \| `'left'` (+1 CW) — session-scoped |
| `DealAlignment` | `'same'` \| `'opposite'` — per-hand deal packaging vs play |
| `SuecaSessionRules` | `{ playDirection }` |
| `SuecaHandDealPolicy` | `{ alignment }` |
| `SuecaTrumpPlacement` | `'dealer-last-card'` (same) \| `'dealer-first-card'` (opposite) |

Geometry: `nextSeat`, `seatAtOffset`, `firstLeader`, `nextDealer`, `partnerOf`,
`physicalRightOf`, `physicalLeftOf`, `oppositeDirection`, `dealDirectionFor`,
`dealSeatOrder`, `trumpPlacementFor`, `shufflerForDealer`, `cutterForDealer`.

Shuffler = physical right of dealer; cutter = partner of shuffler. **Independent**
of PlayDirection / DealAlignment.

## Legacy bridge (unchanged runtime)

`suecaDeal.ts` pure ACW helpers now **delegate** to `suecaRules` with `'right'`:

- `suecaPhysicalRightOf` → `physicalRightOf`
- `suecaNextAntiClockwise` → `nextSeat(..., 'right')`
- `suecaSeatAtTrickOffset` → `seatAtOffset(..., 'right')`
- `suecaInferTrickLeader` → `inferTrickLeader(..., 'right')`
- `suecaDealSeatOrder(dir)` → `dealSeatOrder(dealer, dir, 'same')`
- `clockwiseSeatAtTrickOffset` → `seatAtOffset(..., 'left')` (other games)

Still present (scheduled removal after later phases):

- `DealingDirection` / `DealingMethod` A\|B on `GameState` and UI
- Hard-coded ACW in `Game.playCard` / `evaluateTrick` / dealer rotation (via legacy helpers)
- Setup/modal “Direcção” + Method A/B copy

## Runtime status

**Phase 1 does not change behaviour.** Production Sueca remains RIGHT/ACW play;
deal still Method A/B × absolute left/right. Docs describe the target product
contract; engine migration is Phase 2+.

## Deferred

- Persist `playDirection` / `dealAlignment` + schema migration
- Wire engine, AI, CI, render to `PlayDirection`
- Replace user-facing Method A/B with same/opposite
- Remove overloaded `DealingDirection` after bridge drain
