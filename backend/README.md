# SUECÂO Backend

Multiplayer guest auth + WebSocket rooms, plus **Account auth** (AUTH-01B) on Postgres.

## Isolation

| Concern | Mechanism |
|---------|-----------|
| MP guest | `POST /auth/guest`, `WS /ws` — `JWT_SECRET`, claim `guest: true` |
| Account | `/auth/google/id-token`, `/auth/session/refresh`, `/auth/logout`, `GET /me` — `JWT_SIGNING_KEY` + Postgres |

Do **not** reuse guest JWT as Account session.

**SYNC-01B** adds Account-scoped `/sync/*` storage API (history · prefs · legacyStatsSeed).
The **client does not call these yet** (SYNC-01C).

## Local Postgres

```bash
cd backend
cp .env.example .env   # fill GOOGLE_* when testing real tokens
npm run db:up          # docker compose postgres:16
# set DATABASE_URL=postgres://suecao:suecao@127.0.0.1:5433/suecao_auth
npm run migrate
npm start
```

> Note: compose maps host **5433** → container 5432 to avoid clashing with other local Postgres instances.
## Account endpoints

- `POST /auth/google/id-token` — `{ idToken, nonce?, localGuestId? }` → Suecão session  
  (`localGuestId` is advisory only; never grants ownership)
- `POST /auth/session/refresh` — `{ refreshToken }` → rotated refresh + new access
- `POST /auth/logout` — `{ refreshToken }` → revoke refresh
- `GET /me` — Bearer Suecão access JWT
- `DELETE /auth/account` — Account soft-delete (`pending_delete`) **or** MP guest stub if guest JWT

## Sync endpoints (SYNC-01B — Account Bearer only)

- `GET /sync/status` — revisions + seed presence
- `GET /sync/snapshot` — prefs · seed · history (optional `sinceHistoryRevision` / `sincePrefsRevision`)
- `POST /sync/history` — append/dedupe batch (max 100; retain newest 2000)
- `PUT /sync/prefs` — CAS via `baseRevision` (0/null = create)
- `PUT /sync/legacy-stats-seed` — immutable create-once

MP guest JWT and `pending_delete` Accounts are rejected. See `docs/plan/SYNC_V1_CONTRACT.md`.

## Multiplayer endpoints (unchanged)

- `POST /auth/guest` — `{ displayName }` → `{ token, userId }`
- `WS /ws?token=` — guest JWT only

## Env (placeholders)

See `.env.example`: `DATABASE_URL`, `JWT_SIGNING_KEY`, `JWT_SECRET`, `ACCESS_TOKEN_TTL`,
`REFRESH_TOKEN_TTL_DAYS`, `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`, `CORS_ORIGINS`.

## Tests

```bash
npm run db:up
# export DATABASE_URL=...
npm test
npm run test:sync   # SYNC-01B only
```

Auth/sync tests mock Google verification; they need Postgres. MP tests do not require DB.
