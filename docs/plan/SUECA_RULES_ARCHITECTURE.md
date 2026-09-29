/**
 * Sueca rules architecture (ARCH-SUECA-03 … ARCH-SUECA-07)
 */

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
`dealSeatOrder`, `trumpPlacementFor`, `shufflerForDealer`, `cutterForDealer`,
`inferTrickLeader`.

Shuffler = physical right of dealer; cutter = partner of shuffler. **Independent**
of PlayDirection / DealAlignment.

Physical seat compass is fixed (0S/1W/2N/3E). PlayDirection changes logical
progression only — renderers must not rotate the table.

## Runtime status

**Phase 1:** vocabulary + pure helpers.
**Phase 2:** `Game` uses `playDirection` for leader / play / winners / dealer rotation.
**Phase 3:** canonical deal via `dealSuecaCanonical(playDirection, dealAlignment)`.
**Phase 4:** Setup owns session `PlayDirection`; dealing modal owns per-hand `DealAlignment`.
**Phase 5 (ARCH-SUECA-07):** AI, Card Intelligence, table model, Phaser (via model), and
DOM TrickArea consume `state.playDirection` + canonical `seatAtOffset` /
`inferTrickLeader`. Fixed-ACW helpers remain as deprecated bridges for tests/legacy.

### Consumer wiring (Phase 5)

| Consumer | Source of direction |
|----------|---------------------|
| AI (`suecaTrickHelpers` / `SuecaStrategy`) | `state.playDirection` |
| CI encoder / eval / trickEvents | log `SuecaLogFields.playDirection` + state |
| `buildTableRenderModel` / TrickArea | `gameState.playDirection` |
| Phaser | inherits seats from table model (no local arithmetic) |

Partners remain geometric: `partnerOf` → 0↔2, 1↔3 (not direction-dependent).

## Legacy bridge (temporary — Phase 6/7)

Still present until persistence/cleanup:

- `DealingMethod` / `DealingDirection` on `GameState` (derived bridge)
- `suecaSeatAtTrickOffset` / `suecaInferTrickLeader` / `suecaNextAntiClockwise`
  (RIGHT-only wrappers; no active AI/CI/render callers after Phase 5)
- MP `startRound.dealingMethod` wire field
- Unused Method A/B i18n keys
- Persistence schema still legacy fields (Phase 6)

## Deferred

- Persist `playDirection` / `dealAlignment` + formal schema migration (Phase 6)
- Remove deprecated fixed-ACW helpers + ghost cleanup (Phase 7)
