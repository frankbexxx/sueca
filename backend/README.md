# SUECÂO Backend v1

Guest auth + WebSocket rooms for multiplayer.

## Run

```bash
cd backend
npm install
JWT_SECRET=change-me npm start
```

Default: `http://127.0.0.1:8787`, WebSocket `ws://127.0.0.1:8787/ws?token=...`

## Frontend env

```
REACT_APP_API_URL=http://127.0.0.1:8787
REACT_APP_MULTIPLAYER_URL=ws://127.0.0.1:8787/ws
REACT_APP_MULTIPLAYER_ENABLED=true
```

## Endpoints

- `GET /health`
- `POST /auth/guest` — `{ displayName }` → `{ token, userId }`
- `DELETE /auth/account` — Bearer token (GDPR stub)
- `WS /ws?token=` — `create_session`, `join_session`, `state_sync`, `play_card`

## Production

Deploy with HTTPS + `wss://`. Set `ALLOWED_ORIGINS` to Vercel + `capacitor://localhost`.
