# Suecão Sync v1 Contract (REL-SYNC-01 / SYNC-01A)

**Status:** SYNC-01A DONE (local contract + metadata).
**Network sync:** not started (SYNC-01B READY FOR IMPLEMENTATION).
**Auth baseline:** REL-AUTH-01 DONE (`AUTH_RELEASE_BASELINE_01F.md`).
**Prefs storage strategy:** **A — adapter layer** — existing keys remain UX source of truth; `sueca-syncable-prefs-v1` stores only `localPrefsRevision` / `localUpdatedAt`; `buildSyncablePrefsDocument()` assembles the future sync payload. Chosen as smallest safe approach (no destructive migration).

## v1 scope (Class A — ACCOUNT SYNC)

| Domain | Strategy |
|--------|----------|
| Match history | Append + dedupe by stable UUID `id`; secondary dedupe by `idempotencyKey` when present |
| Setup prefs (P1, bots, difficulty) | Prefs document; see conflict authority |
| Hand / card / table selected prefs | Same prefs document |
| Active theme | Same prefs document |

**Career aggregate stats are NOT synced directly.**
Visible stats = `legacyStatsSeed + stats derived from synchronized history`.

## Non-sync (v1)

LocalGuest · linkedAccountId · auth tokens · Google identity · **saved/in-progress sessions (local-only v1)** · pinned sessions · finished UI summaries · custom themes · music/SFX prefs · language · diagnostics/replay logs · multiplayer guest/session · music caches · durable quarantine/backups · `sueca-mh-id:*` helpers.

**LocalGuest is never synced** (device identity only).
**Sessions remain local-only in v1** (no mid-game resume sync unless a later slice promotes it).

## Identity ownership

```
LocalGuest (device)  ≠  Suecão Account (cloud sync profile)
linkedAccountId = local pointer only (not a sync payload field)
```

Login does not upload until a future sync engine runs under these guards.
Logout preserves local data + sync binding.
Account delete clears sync binding.
Policy B `pending_delete` rejects re-login; sync must refuse that Account.

## First-link rules

| Case | Behaviour |
|------|-----------|
| A — cloud empty, local rich | Upload local A-domains as initial cloud snapshot |
| B — cloud rich, local empty/trivial | Download cloud onto device A-domains; keep LocalGuest id |
| C — both rich | **History always append+dedupe** (never discard either side). Prefs: single UI choice — `Usar as preferências deste dispositivo` **or** `Usar as preferências da cloud`. No history replace option |
| D — same Account previously on device | Incremental sync |
| E — Account used elsewhere first | As B or C depending on local richness |

## Preference conflict authority

- **Cross-device concurrency:** server **monotonic revision** (PUT with `baseRevision` / `expectedRevision`; stale → **409** → pull + rebase).
- Client `updatedAt` / `localPrefsRevision` are **local-only** (UI, outbox detection) — **not** cross-device authority.
- First-link prefs: **explicit user choice** wins once; then revisions apply.

## History merge rule

- Always merge by append + dedupe.
- Primary key: record `id` (UUID).
- Secondary: `idempotencyKey` when present on both sides.
- Never silently discard valid history.
- Never fabricate match rows from aggregate stats.

### History ID readiness (SYNC-01A audit)

- New completions use `crypto.randomUUID()` — sync-ready.
- Optional `idempotencyKey` supported on write path.
- **Legacy / non-UUID blocker (SYNC-01A keeps as-is):** finished→history migrations use ids like `migrated-finished-{variant}-{finishedAt}`. These are **not** rewritten in SYNC-01A (no fabricated UUID migration).
- `assessMatchHistorySyncReadiness()` reports `readyForSync: false` when any such row exists.
- **SYNC-01B / SYNC-01E** must provide explicit compatibility handling (safe id migration before upload, or product exclusion rule) — **out of scope for 01A**.

## legacyStatsSeed rule

When creating a seed for the current device migration context:

1. Let `S` = current local aggregate stats (`gamesPlayed`, `wins`, `byVariant.*.played/wins`).
2. Let `H` = metrics **derived** from current match-history records (same fields).
3. For each supported metric: `seed = max(0, S − H)`.
4. Persist once (`sueca-legacy-stats-seed-v1`); **immutable** thereafter.
5. Never create fake history rows.
6. Future visible stats = seed + derived-from-(synced)-history.
7. Unsupported / non-subtractable fields (`lastPlayedAt`, `lastPlayedVariant`) are **not** seeded — remain local-display heuristics only.

## Account-switch guard

If `syncBoundAccountId === A` and authenticated Account is `B ≠ A`:
**MUST NOT upload** until first-link / switch resolution.
Local primitives: `assertCanSyncAccount`, `bindSyncToAccount`, `clearSyncBinding`.

## Logout

- Clear auth session (existing).
- **Keep** local gameplay data.
- **Keep** `syncBoundAccountId` and sync metadata (same Account can resume).

## Account delete

- Clear `linkedAccountId` (AUTH-01E).
- **Clear** `syncBoundAccountId` + sync meta + legacy seed + syncable-prefs revision meta.
- Keep-local: gameplay DATA remains.
- Wipe-local: keyed wipe includes sync keys (never `localStorage.clear()`).

## Offline-first

Local writes first; sync queue later (SYNC-01C+). Sync failure never blocks play. Guest: no sync.

## Sync triggers (future engine — not SYNC-01A)

After login · startup/resume if authenticated · after match · after prefs save (debounced) · Conta “Sincronizar agora”. No polling.

## Future / non-v1

Custom themes · music prefs · session sync · realtime · hard-delete retention legal policy · httpOnly cookie for Web refresh.

## SYNC-01A deliverable

Local contract + `sueca-sync-meta-v1` + binding guards + prefs mutation revision + legacyStatsSeed helper + first-link state model.
**Zero** sync HTTP calls.
