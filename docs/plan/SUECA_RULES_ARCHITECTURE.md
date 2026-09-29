/**
 * Sueca rules architecture (ARCH-SUECA-03 … ARCH-SUECA-06)
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
`dealSeatOrder`, `trumpPlacementFor`, `shufflerForDealer`, `cutterForDealer`.

Shuffler = physical right of dealer; cutter = partner of shuffler. **Independent**
of PlayDirection / DealAlignment.

## Legacy bridge (temporary)

`suecaDeal.ts` pure ACW helpers still **delegate** to `suecaRules` with `'right'`
for AI/CI/render consumers (Phase 5):

- `suecaPhysicalRightOf` → `physicalRightOf`
- `suecaNextAntiClockwise` → `nextSeat(..., 'right')`
- etc.

Engine bridge still present until Phase 6+ cleanup:

- `DealingMethod` / `DealingDirection` on `GameState` (derived from canonical via
  `legacyFieldsForAlignment` when UI sets `dealAlignment`)
- Hard-coded ACW in AI / CI / render
- Persistence schema still carries legacy fields (Phase 6)

## Runtime status

**Phase 1:** vocabulary + pure helpers.
**Phase 2:** `Game` uses `playDirection` (default `'right'`) for leader / play / winners / dealer rotation.
**Phase 3:** canonical deal via `dealSuecaCanonical(playDirection, dealAlignment)`.
**Phase 4 (ARCH-SUECA-06):** UI/config migrated:

- **Setup** owns session `PlayDirection` (`Sentido do jogo` — Pela direita / Pela esquerda).
  Stored in `sueca-play-direction`. Fixed for the match-to-4; not editable in the dealing modal.
- **Dealing modal** owns per-hand `DealAlignment` (`Sentido da distribuição` —
  Mesmo sentido / Sentido oposto). Default each hand: `same`.
- Invalid legacy Method×Direction free combinations are **no longer UI-reachable**.
- Legacy engine/persistence bridges remain temporarily; UI truth is canonical only.

### Canonical product (post Phase 4 UI)

| Setup | Modal | Engine |
|-------|-------|--------|
| RIGHT | same | RIGHT + same |
| RIGHT | opposite | RIGHT + opposite |
| LEFT | same | LEFT + same |
| LEFT | opposite | LEFT + opposite |

Derived bridge (outputs only, not user-driven):

| Canonical | Legacy fields |
|-----------|---------------|
| RIGHT + same | A + right |
| RIGHT + opposite | B + left |
| LEFT + same | A + left |
| LEFT + opposite | B + right |

## Deferred

- Persist `playDirection` / `dealAlignment` + formal schema migration (Phase 6)
- Wire AI, CI, render to `PlayDirection` (Phase 5)
- Remove overloaded `DealingMethod` / `DealingDirection` after bridge drain
- Ghost/dead cleanup of unused Method A/B i18n keys
