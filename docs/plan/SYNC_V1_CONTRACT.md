# Suecão Sync v1 Contract (REL-SYNC-01 / SYNC-01A)

**Status:** SYNC-01A–**01D DONE** · **SYNC-01E MINIMALLY VALIDATED** (OPPO Case A + force-stop/reopen) · multi-device / full A–E device matrix **NOT** completed · Auth/Sync work parked.
**First-link UX:** **SYNC-01D DONE** (Conta setup · cases A–E · account snapshots).
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
**Zero** client sync HTTP calls (01A).

## SYNC-01B — backend storage + API

**Client remains network-silent for sync** until SYNC-01C. No login/startup/outbox upload in the app.

### Tables (Postgres)

| Table | Role |
|-------|------|
| `sync_account_state` | Per-Account `global_revision`, `history_revision`, `prefs_revision`, `updated_at` |
| `sync_match_history` | Per-Account match rows; `match_id TEXT` PK with account; optional `idempotency_key`; `payload JSONB`; `server_revision`; soft `deleted_at` reserved |
| `sync_prefs` | Per-Account prefs document + `server_revision` |
| `sync_legacy_stats_seed` | Per-Account immutable seed (create-once) |

FK → `accounts(id) ON DELETE CASCADE`. Soft-delete (`pending_delete`) does **not** wipe sync rows in 01B.

### Revision model

- Server monotonic revisions are authoritative (not client wall-clock).
- Successful history insert increments `history_revision` (+ `global_revision`).
- Successful prefs write increments `prefs_revision` (+ `global_revision`).
- Prefs PUT requires `baseRevision === current prefs_revision` (initial create: `0` or `null`→0); mismatch → **409** `stale_revision`.
- History append is idempotent (same id + same payload → dedupe; no destructive overwrite).

### Legacy match id policy

- `match_id` is **TEXT** (not UUID-typed).
- Legacy `migrated-finished-*` ids are **accepted**.
- New client records should remain UUID-style.
- No server-side rewrite of legacy ids.

### HTTP API (Suecão Account Bearer only)

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/sync/status` | `eligible`, revisions, `hasLegacyStatsSeed`, `updatedAt` |
| `GET` | `/sync/snapshot` | Full snapshot; optional `sinceHistoryRevision` / `sincePrefsRevision` |
| `POST` | `/sync/history` | `{ records: [{ id, idempotencyKey?, schemaVersion, payload }] }` → accepted / deduped / conflicts + `historyRevision` |
| `PUT` | `/sync/prefs` | `{ schemaVersion, baseRevision, payload }` |
| `PUT` | `/sync/legacy-stats-seed` | Create-once; same payload → idempotent; different → **409** `immutable_seed_conflict` |

Auth: Account JWT only. MP guest rejected. `pending_delete` → **401** (same as `/me`). Account id never taken from body.

### Limits (v1)

| Limit | Value |
|-------|-------|
| History retained / Account | newest **2000** (see retention below) |
| History batch max | **100** |
| History payload / record | **8 KiB** |
| Prefs payload | **16 KiB** |
| Legacy seed payload | **4 KiB** |
| Tombstones | column reserved; user-delete tombstones = future |

### Retention semantics (history)

- After a successful batch that inserts new rows, prune each Account to the **newest 2000** rows (`ORDER BY created_at DESC, match_id DESC`, drop the rest).
- Prune is **per-Account only** — never touches another Account’s rows.
- `history_revision` / `global_revision` are **monotonic** and **never decrease** when rows are pruned (gaps are OK).
- Pruned `match_id`s are gone from the server; a later client re-upload of the same id+payload is treated as a **new accept** (or idempotent if somehow still present) — not a silent cross-account leak.
- Incremental clients should treat `sinceHistoryRevision` as “rows still present with `server_revision > N`”; pruned older revisions simply do not appear.

### Snapshot semantics

- Default: full history (≤2000), current prefs, legacy seed if any, current revisions.
- `sinceHistoryRevision=N`: only rows with `server_revision > N`.
- `sincePrefsRevision=N`: omit prefs body when unchanged (`prefsUnchanged: true`).

### Error codes

`invalid_payload` (400) · `Unauthorized` (401) · `stale_revision` (409) · `immutable_seed_conflict` (409) · `history_record_conflict` (409) · `batch_too_large` / `payload_too_large` (413) · `db_unavailable` (503).

## SYNC-01C — client sync engine + outbox

**First-link chooser UI is SYNC-01D.** Engine never silently first-link merges or replaces history.

### Outbox

| Key | `sueca-sync-outbox-v1` (durable envelope) |
|-----|------------------------------------------|
| Domains | `APPEND_MATCH` · `PUT_PREFS` (coalesced) · `PUT_LEGACY_STATS_SEED` |
| Binding | Every item has `boundAccountId`; never send if ≠ current Account |
| Truth | Local history/prefs remain source of truth; outbox is reliability |

### Engine states

`IDLE` · `SYNCING` · `OFFLINE` · `AUTH_REQUIRED` · `FIRST_LINK_REQUIRED` · `ACCOUNT_MISMATCH` · `ERROR`

### Network policy

| Condition | Reads | Mutations |
|-----------|-------|-----------|
| Guest | none | none |
| First-link unresolved / account mismatch | **none** (01C) | **none** |
| `READY_INCREMENTAL` | status + snapshot | history / prefs / seed |

### Push order

1. legacy seed (if needed)
2. history batches (≤100)
3. prefs (`baseRevision` = known server prefs revision)

### Pull apply order

Validate response → merge history (append+dedupe) → apply prefs only if READY → update local server revisions **last**.

### Retry

Backoff: 1m → 2m → 5m → 15m → 30m cap. No polling loop. 401 → `AUTH_REQUIRED`. 409 not blind-retried. Network/503 → `OFFLINE` + keep outbox.

### Triggers

Authenticated startup/resume **only if** READY_INCREMENTAL · match complete enqueue · prefs coalesce+debounce · `syncNow()`.

### Logout / delete / wipe

- Logout: stop engine; **keep** binding + outbox for same Account.
- Account delete: clear binding + outbox + sync meta.
- Local wipe: clear outbox + sync keys (keyed wipe).

### Crash safety

History backend idempotency · prefs CAS · seed create-once. Resend after kill is safe.

## SYNC-01D — first-link + account-switch UX

**Status: DONE** (service + Conta UI + focused tests; no OPPO required for this slice).

### Meaningful Class A data

**Local meaningful when any of:**
- match history count > 0
- `legacyStatsSeed` metrics non-zero
- syncable prefs differ from product defaults (setup / hand / theme / dealing / auto-pause)

**Not meaningful:** LocalGuest id alone · auth/session metadata · default prefs.

**Cloud meaningful when any of:**
- history rows > 0
- `prefsRevision > 0` or prefs document present
- `hasLegacyStatsSeed` / non-zero cloud seed

Account existence alone ≠ cloud DATA.

### Cases (deterministic resolver)

| Case | Condition | Behaviour |
|------|-----------|-----------|
| **A** `CLOUD_EMPTY_LOCAL_HAS_DATA` | local meaningful · cloud empty | no chooser · informational Conta copy · bind · upload history/prefs/seed · mark first-link complete |
| **B** `CLOUD_HAS_DATA_LOCAL_EMPTY` | cloud meaningful · local trivial | no chooser · download/apply cloud · bind · complete (preserve LocalGuest) |
| **C** `BOTH_HAVE_DATA` | both meaningful | history **always** merge+dedupe · **one** prefs question (device vs cloud) · no replace-history · no third option |
| **D** `SAME_ACCOUNT_RESUME` | bound == auth · first-link done | no chooser · incremental SYNC-01C |
| **E** `ACCOUNT_SWITCH` | bound ≠ auth | block A outbox upload to B · explicit Conta resolution · **no** A→B merge |

### Case C prefs

- **Device:** keep local prefs · PUT with server `baseRevision` · stale → refetch + retry once keeping intent
- **Cloud:** apply cloud prefs · do not upload superseded local prefs
- Pending `prefsChoice` persisted in `sueca-sync-first-link-v1` until COMPLETE

### Account-switch (E) — HARD GATE

Class A keys are still **device-global**. Before applying B’s cloud view:

1. Snapshot A under `sueca-sync-account-snapshot-v1:<accountId>` (history · prefs doc · seed · revisions)
2. Prefer restore of prior B snapshot if present; else clear visible Class A to defaults then apply B cloud
3. Rebind only after explicit “Usar os dados desta conta”
4. A-bound outbox retained locally; never sent while bound to B
5. Option “Continuar sem sincronizar” leaves sync unresolved (no mutation)
6. A’s snapshot remains on device so a future return to A can restore that Class A view

No cross-account merge in v1.

### Account Class A snapshot store

| Key | `sueca-sync-account-snapshot-v1:<accountId>` |
|-----|-----------------------------------------------|
| Contents | history (≤2000) · syncable prefs document · `legacyStatsSeed` · `historyRevision` / `prefsRevision` · `savedAt` |
| **Never** stored | auth/access/refresh tokens · Google tokens · email · LocalGuest id · MP credentials · diagnostics · music/cache · non–Class-A keys |
| Retention | one snapshot per Account id; `saveAccountClassASnapshot` **overwrites** that Account’s prior snapshot |
| Delete Account | `clearAllSyncLocalState` removes **all** `sueca-sync-account-snapshot-v1:*` keys + first-link session (keep-local gameplay Class A keys untouched unless wipe) |
| Full local wipe | same snapshot/session keys removed via keyed wipe (no `localStorage.clear()`) |

### First-link session state machine

Key: `sueca-sync-first-link-v1`

Phases: `PENDING` → `SNAPSHOT_FETCHED` → `HISTORY_MERGED` → `PREFS_RESOLVED` → `BOUND` → `COMPLETE`
(+ `BLOCKED_SEED_MISMATCH` · `ERROR`)

Never mark first-link complete before local apply + binding succeed. Crash resume re-fetches cloud; preserves prefs choice; does not upload to wrong Account.

### Legacy seed

Local-only → PUT · Cloud-only → adopt · Same → continue · **Different → block finalisation** (`seed_mismatch`). **v1 explicit conflict** — no COMPLETE / no upload until future recovery UX or support path; never silently combine.

### History merge helper

`mergeMatchHistoryForFirstLink`: primary dedupe by `id` · secondary `idempotencyKey` · same id + differing payload → conflict · stable legacy ids kept · newest 2000 retention · non-mutating sources.

### Conta UX

- Status copy: por configurar · Sincronizado · A sincronizar… · Sem ligação · Erro · Conta diferente
- CTA `Configurar sincronização` when unresolved (does **not** interrupt gameplay on login)
- `Sincronizar agora` only when authenticated + same-account bound + first-link complete
- Guest: no sync button

### Offline / pending_delete

- Network fail: soft error · preserve choice · gameplay available · retry
- Account pending_delete / 401 during first-link: abort · clear first-link session + sync binding · preserve local gameplay data (auth Guest path)

## SYNC-01E (status)

**Minimally validated (OPPO Reno13):**
- Case A (cloud empty → bind + upload prefs/seed; history empty on this device run) · Conta “Sincronizado”
- Force-stop / reopen: session restore · sync binding persists · no duplicate history · local DATA preserved
- Optional idempotent `Sincronizar agora` on same state

**Not completed (deferred):**
- Multi-device conflict polish
- Full real-device Cases B / C / E matrix
- Account-switch device scenarios beyond unit coverage
- Remaining outbox UX polish

**Dev transport note:** 1-device Android Account API smoke uses `adb reverse` → `http://127.0.0.1:8787` (`npm run android:dev:prepare`). LAN IP is for multi-device/staging only.