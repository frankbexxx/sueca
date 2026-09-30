/**
 * Sueca rules architecture (current — ARCH-SUECA-03…09)
 */

## Canonical product rules

| Concept | Values | Scope |
|---------|--------|-------|
| `PlayDirection` | `'right'` (+3 ACW) \| `'left'` (+1 CW) | Session / match-to-4 |
| `DealAlignment` | `'same'` \| `'opposite'` | Per hand (dealing modal) |
| `Seat` | `0\|1\|2\|3` — South, West, North, East | Fixed physical compass |

Geometry helpers live in `frontend/src/models/games/suecaRules.ts`:
`nextSeat`, `seatAtOffset`, `firstLeader`, `nextDealer`, `partnerOf`,
`physicalRightOf`, `physicalLeftOf`, `dealSeatOrder`, `trumpPlacementFor`,
`shufflerForDealer`, `cutterForDealer`, `inferTrickLeader`.

Shuffler = physical right of dealer; cutter = partner of shuffler —
**independent** of PlayDirection / DealAlignment.

Renderers must not rotate the table; PlayDirection changes logical progression only.

## Source-of-truth ownership

| Concern | Owner |
|---------|-------|
| Session play | Setup preference seeds **new** matches; `state.playDirection` wins on resume |
| Hand deal packaging | Dealing modal → `state.dealAlignment` (default SAME each new hand) |
| Seat geometry | `suecaRules.ts` |
| Deal engine | `dealSuecaCanonical(playDirection, dealAlignment)` |
| Progression (lead / play / winners / dealer rotate) | `Game` via canonical helpers |
| AI / CI / table / Phaser | Consumers of `state.playDirection` only |
| Persistence migration | `migrateSuecaPersistedState` |

No second Sueca rule engine is allowed.

## Schema v2

Persisted Sueca GameState is understood from:

- `schemaVersion: 2`
- `playDirection`
- `dealAlignment`
- normal game fields (seats, trick, scores, waiting flags, …)

New Sueca writes do **not** include `dealingMethod` / `dealingDirection`.

## Migration boundary

Entry: `migrateSuecaPersistedState(raw)`.

Used by: session resume, pinned history, `Game.loadState`, `SuecaGame.restoreState`,
`normalizeGameState` (sync + MP).

### Historical Method A/B (read-only)

Old saves may still carry Method × absolute direction. Migrator maps only unambiguous cases:

| Legacy | Result |
|--------|--------|
| A + right | RIGHT + SAME |
| B + left | RIGHT + OPPOSITE |
| A + left / B + right between hands | reset-hand (SAME, waiting, leader recomputed) |
| A + left / B + right mid-hand | reject / quarantine |
| missing `playDirection` | assign RIGHT |
| invalid seats / missing v2 waiting | reject |

`resolveLegacyDealAlignment` lives in the migrator module — migration INPUT only.

Incoming MP `startRound.dealingMethod` is accepted at the host compatibility boundary and
mapped to `dealAlignment`; outgoing intents use `dealAlignment`.

## Legacy support still retained

| Item | Why | Write? | Read? | Future deletion |
|------|-----|--------|-------|-----------------|
| `GameState.dealingMethod?` / `dealingDirection?` | Optional; non-Sueca fillers; Sueca migrator reads old saves | Sueca: no | migrator + old payloads | when no old saves matter |
| `GameConfig.dealingMethod?` | Optional ignored | Sueca setup: no | old last-config | when configs aged out |
| `STORAGE_KEYS.DEALING_METHOD` | clearLocalUserData may remove orphan key | no | no (active) | remove constant after wipe period |
| MP `startRound.dealingMethod?` | Soft-hidden peers | outgoing: no | host boundary | when no legacy peers |
| Types `DealingMethod` / `DealingDirection` | Migrator + optional fields | — | migrator | with field removal |

## No known duplicate rule engines

Canonical path only: `suecaRules` + `dealSuecaCanonical` + `Game` + migrator.
Fixed-ACW wrappers (`suecaNextAntiClockwise`, `suecaSeatAtTrickOffset`,
`suecaInferTrickLeader`) and `dealSuecaLegacyAbsolute` are **removed**.

## Migration history (short)

1. Vocabulary + helpers
2. Engine playDirection
3. Canonical deal
4. Setup / modal
5. AI / CI / render consumers
6. Schema v2 + central migrator
7. Legacy runtime removal (this doc)
