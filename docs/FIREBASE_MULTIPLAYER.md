# Firebase Multiplayer (RTDB)

Online Sueca uses **Firebase Realtime Database** — not the legacy WebSocket backend (`docs/plan/prompts/P5-backend-mp.md`).

## Architecture (Model B)

- **Host** runs the game engine, validates intents, publishes canonical `sessions/{code}/state`.
- **Joiners** push intents to `sessions/{code}/actions/{pushId}`; they never write `state`.
- Lobby meta lives at `sessions/{code}` (`variant`, `slots`, `status`).

## Vercel environment variables

Set these on the frontend project (Preview + Production):

| Variable | Example | Notes |
|----------|---------|--------|
| `REACT_APP_MULTIPLAYER_ENABLED` | `true` | Must be literal `true` to show Online |
| `REACT_APP_FIREBASE_API_KEY` | `AIza…` | Firebase web app |
| `REACT_APP_FIREBASE_DATABASE_URL` | `https://PROJECT-default-rtdb.REGION.firebasedatabase.app` | RTDB URL |
| `REACT_APP_FIREBASE_PROJECT_ID` | `suecao` | Project id |
| `REACT_APP_FIREBASE_APP_ID` | `1:…:web:…` | Web app id |

Optional debug logging:

| Variable | Value |
|----------|--------|
| `REACT_APP_DEBUG_MP` | `true` | Enables `[MP]` console logs in production builds |

See `frontend/.env.example` for a template.

## Security rules

Rules live in [`database.rules.json`](../database.rules.json) at the repo root.

Deploy to Firebase:

```bash
firebase deploy --only database
```

**Note:** Current rules allow open read/write on session paths (no Firebase Auth yet). Before scaling, add Anonymous Auth or custom tokens and restrict `state` writes to the host client.

## Session lifecycle

1. Host **Create** → `createSession()` writes lobby meta.
2. Joiner **Join** → `joinSession()` uses `runTransaction` on the first free human slot.
3. Host **Start** → `startSession()` sets `status: playing`; host publishes initial `state`.
4. Host **Leave** → `endSession()` sets `status: ended` and clears `state` / `actions`.

Stale rooms: ended sessions should be deleted periodically (manual cleanup or a scheduled Cloud Function). Host exit already clears runtime nodes.

## Local development

1. Copy Firebase vars into `frontend/.env.development`.
2. Set `REACT_APP_MULTIPLAYER_ENABLED=true`.
3. `npm start` in `frontend/`.
4. Test with two browser profiles or devices using the 5-letter room code.

## Acceptance checklist

- [ ] Host + 1 remote human + bots — deal, play, trick sync
- [ ] Joiner cannot mutate `state` directly (rules simulator)
- [ ] After MP, solo **Jogar** has no residual bot/remote seats
- [ ] `sueca-last-config` in DevTools has no `multiplayerSessionId`
