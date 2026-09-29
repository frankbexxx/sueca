/**
 * Sueca rules architecture (ARCH-SUECA-03 … ARCH-SUECA-08)
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
**Phase 6 (ARCH-SUECA-08):** persisted schema v2 + central migrator (this doc § Persistence).

### Consumer wiring (Phase 5)

| Consumer | Source of direction |
|----------|---------------------|
| AI (`suecaTrickHelpers` / `SuecaStrategy`) | `state.playDirection` |
| CI encoder / eval / trickEvents | log `SuecaLogFields.playDirection` + state |
| `buildTableRenderModel` / TrickArea | `gameState.playDirection` |
| Phaser | inherits seats from table model (no local arithmetic) |

Partners remain geometric: `partnerOf` → 0↔2, 1↔3 (not direction-dependent).

---

## Persistence schema v2 (ARCH-SUECA-08 / Phase 6)

**Constant:** `SUECA_STATE_SCHEMA_VERSION = 2`

**Entry point:** `migrateSuecaPersistedState(raw)` in
`frontend/src/models/games/migrateSuecaPersistedState.ts`

All Sueca restore paths must use it:

- local session resume (`gameSessionStorage.loadGameSession`)
- pinned resume (`gameHistoryStorage.loadPinnedSession`)
- `Game.loadState` / `SuecaGame.restoreState`
- MP / sync normalize (`normalizeGameState` → same migrator)

### Canonical persisted fields

| Field | Values | Role |
|-------|--------|------|
| `schemaVersion` | `2` | Sueca GameState schema |
| `playDirection` | `'right'` \| `'left'` | session SoT |
| `dealAlignment` | `'same'` \| `'opposite'` | current/last hand packaging |

### Compatibility-only fields (bridge — Phase 7 deletion candidates)

| Field | Role |
|-------|------|
| `dealingMethod` | `'A'` \| `'B'` — derived via `legacyFieldsForAlignment` |
| `dealingDirection` | absolute deal sense — derived; not SoT |

v2 readers must not require Method/Direction to understand semantics.

### Migration rules

| Input | Action |
|-------|--------|
| v2 + valid play/alignment + seats + `waitingForRoundStart` | **exact** — no seat/trick mutation |
| legacy missing `playDirection` | assign **`right`** (legacy fixed ACW play) |
| A + right | RIGHT + **same** |
| B + left | RIGHT + **opposite** |
| A + left / B + right between hands | **reset-hand** — `dealAlignment='same'`, `waitingForRoundStart=true`, clear hands/trick/trump/playedCards; recompute `currentPlayerIndex`/`trickLeader` from `firstLeader(dealer, playDirection)`; preserve dealer/scores/round |
| A + left / B + right mid-hand | **rejected** / quarantine |
| invalid seat (not 0..3) | **rejected** — never `?? 0` |
| missing `waitingForRoundStart` (legacy, safe boundary) | prefer **`true`** + reset-hand boundary — never blindly `false` |
| pre-a014217 / undistinguished old CW semantics | prefer quarantine over guessing (no git-history runtime detection) |

Diagnostics (tests/logs only): `migratedFrom`, `action`, `reason`.

### Setup preference vs session

| Concern | Key / field | Wins on |
|---------|-------------|---------|
| Setup preference | `localStorage` `sueca-play-direction` | **new** matches only |
| Session rule | `state.playDirection` | **resume** (must not overwrite LEFT with setup RIGHT) |

New hand product default for deal packaging remains **SAME** (modal), independent of prior hand’s `dealAlignment`.

### Dangerous normalize fallbacks

| Pattern | Status |
|---------|--------|
| Sueca path → migrator | **required** |
| `playDirection ?? 'right'` on v2 normalize | **removed** from Sueca success path (RIGHT only in new-game + legacy migrate) |
| `waitingForRoundStart ?? false` on Sueca | **removed** — migrator handles intentionally |
| Non-Sueca variants | still use generic defaults (unchanged) |
| Live `Game.playDir()` / deal bridge `dealingDirection ?? 'right'` | retained for post-load runtime / legacy deal path — Phase 7 |

### Sync (parked — no redesign)

- Publish/subscribe goes through `normalizeGameState` → same migrator.
- Synced v2 carries `playDirection` / `dealAlignment` / `schemaVersion`.
- Pref key `sueca-dealing-method` still in `syncablePrefs` for compatibility — Phase 7 deletion.

### Multiplayer (soft-hidden)

- Wire: `startRound.dealAlignment?` preferred; `startRound.dealingMethod` TEMPORARY bridge.
- State wire: full `GameState` via normalize/migrator — no separate MP migration semantics.
- Unsupported Method×Direction combos must not be invented on the Sueca success path.

### Replay / history

- Pinned sessions stamp v2 on pin; load through migrator (quarantine on reject).
- Finished summaries do **not** store full GameState — no direction migration needed.
- Do not rewrite old history to fake canonical semantics.

---

## Legacy bridge (temporary — Phase 7)

Still present until cleanup:

- `DealingMethod` / `DealingDirection` on `GameState` (derived bridge)
- `legacyFieldsForAlignment` / `resolveLegacyDealAlignment` / `dealSuecaLegacyAbsolute`
- `suecaSeatAtTrickOffset` / `suecaInferTrickLeader` / `suecaNextAntiClockwise`
  (RIGHT-only wrappers; tests/legacy)
- MP `startRound.dealingMethod` wire field
- Method A/B i18n keys (`dealingMethodA` / `dealingMethodB`)
- Storage / sync pref `sueca-dealing-method`
- `GameConfig.dealingMethod` (bridge into initialize)

## Deferred (Phase 7)

Remove deprecated fixed-ACW helpers + ghost cleanup — see Phase 7 deletion inventory below.

### Phase 7 deletion inventory (do not delete in Phase 6)

| Item | Location / notes |
|------|------------------|
| `DealingMethod` / `DealingDirection` types + GameState fields | `types/game.ts` — after all writers stamp only play/align |
| `legacyFieldsForAlignment` / `resolveLegacyDealAlignment` | `suecaDeal.ts` |
| `dealSuecaLegacyAbsolute` / `dealSueca` absolute wrapper | `suecaDeal.ts` / `Game.dealCards` fallback |
| `suecaSeatAtTrickOffset` / `suecaInferTrickLeader` / `suecaNextAntiClockwise` | `suecaDeal.ts` + tests still importing |
| `STORAGE_KEYS.DEALING_METHOD` / `sueca-dealing-method` | `gameConstants`, `syncablePrefs`, `syncMeaningfulData`, `clearLocalUserData` |
| `GameConfig.dealingMethod` | `gameConfig.ts` / setup / session last-config |
| MP `startRound.dealingMethod` (+ applyHostAction bridge) | `multiplayerActions.ts`, `applyHostAction.ts` |
| Method A/B i18n | `translations.ts` `dealingMethodA/B`, modal labels |
| Live `dealingDirection ?? 'right'` in deal/syncLegacy | `Game.ts` |
| Non-product Method×Direction paths | once product never emits them |
| Stale comments/docs referring to Method as SoT | scattered |
| Tests asserting Method/Direction as primary SoT | migrate assertions to play/align |
