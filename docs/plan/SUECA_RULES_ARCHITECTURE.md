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

- `DealingMethod` / `DealingDirection` on `GameState` and dealing modal (bridge)
- Hard-coded ACW in AI / CI / render (Phase 5 consumers)
- Setup copy still claims one-by-one dealing (Phase 4)

## Runtime status

**Phase 1:** vocabulary + pure helpers.
**Phase 2:** `Game` uses `playDirection` (default `'right'`) for leader / play / winners / dealer rotation.
**Phase 3:** canonical deal via `dealSuecaCanonical(playDirection, dealAlignment)`;
legacy Method A/B × absolute `dealingDirection` remains a **TEMPORARY UI bridge**.
Unambiguous maps: A+dir(play)→same, B+opposite(play)→opposite.
Unsupported UI combos (A+left / B+right under RIGHT play, and mirrors) keep absolute legacy deal —
**no invented product semantics** (Phase 4 must fix modal).
AI/CI/render still assume RIGHT/ACW. Persistence schema still legacy (Phase 6).

### Production modal mapping (RIGHT play)

| Modal | Canonical |
|-------|-----------|
| Standard (A) + Direita (right) | RIGHT + **same** |
| Dealer First (B) + Esquerda (left) | RIGHT + **opposite** |
| A + Esquerda / B + Direita | **unsupported** (legacy absolute fallback) |

## Deferred

- Persist `playDirection` / `dealAlignment` + schema migration
- Wire engine, AI, CI, render to `PlayDirection`
- Replace user-facing Method A/B with same/opposite
- Remove overloaded `DealingDirection` after bridge drain
