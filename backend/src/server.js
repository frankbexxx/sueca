/**
 * SUECÂO backend — multiplayer guest auth/WS + Account auth (AUTH-01B).
 *
 * Isolation:
 * - POST /auth/guest + WS JWT → JWT_SECRET (guest claims)
 * - Account /auth/* + GET /me → JWT_SIGNING_KEY + Postgres
 */
import http from 'http';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { loadConfig } from './config.js';
import { initDb, closeDb, isDbConfigured, getPool } from './db/pool.js';
import { runMigrations } from './db/migrate.js';
import { createAccountAuthRouter, trySoftDeleteAccount } from './auth/routes.js';
import { setGoogleVerifierForTests } from './auth/deps.js';

const config = loadConfig();
const PORT = config.port;

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '32kb' }));

const rooms = new Map();

/** Account auth routes always mounted; DB required for handlers to succeed. */
app.use(createAccountAuthRouter(config));

app.get('/health', (_req, res) =>
  res.json({
    ok: true,
    accountAuthDb: Boolean(getPool())
  })
);

/** Guest auth — multiplayer only; unchanged semantics. */
app.post('/auth/guest', (req, res) => {
  const displayName = String(req.body?.displayName || 'Guest').slice(0, 32);
  const userId = uuidv4();
  const token = jwt.sign(
    { sub: userId, name: displayName, guest: true },
    config.mpJwtSecret,
    { expiresIn: '7d' }
  );
  res.json({ token, userId, displayName });
});

/**
 * DELETE /auth/account
 * - Suecão Account access JWT → soft-delete (AUTH-01B)
 * - MP guest JWT → legacy stub `{ deleted: true }` (unchanged)
 */
app.delete('/auth/account', async (req, res) => {
  const handled = await trySoftDeleteAccount(req, res, config);
  if (handled) return;

  const auth = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(auth, config.mpJwtSecret);
    res.json({ deleted: true });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function verifyMpToken(token) {
  return jwt.verify(token, config.mpJwtSecret);
}

function broadcast(room, msg, except) {
  for (const client of room.clients) {
    if (client !== except && client.readyState === 1) {
      client.send(JSON.stringify(msg));
    }
  }
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  let user;
  try {
    user = verifyMpToken(token);
  } catch {
    ws.close(4001, 'Unauthorized');
    return;
  }

  ws.user = user;
  ws.roomId = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === 'create_session') {
      const sessionId = uuidv4().slice(0, 8);
      const room = { id: sessionId, state: msg.payload?.gameState || null, clients: new Set([ws]) };
      rooms.set(sessionId, room);
      ws.roomId = sessionId;
      ws.send(
        JSON.stringify({
          type: 'session_created',
          payload: {
            sessionId,
            players: [{ index: 0, name: user.name, type: 'human', status: 'connected' }],
            localPlayerIndex: 0
          }
        })
      );
      return;
    }

    if (msg.type === 'join_session') {
      const sessionId = msg.payload?.sessionId;
      const room = rooms.get(sessionId);
      if (!room || room.clients.size >= 4) {
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Room full or not found' } }));
        return;
      }
      room.clients.add(ws);
      ws.roomId = sessionId;
      const players = [...room.clients].map((c, i) => ({
        index: i,
        name: c.user?.name || `Player ${i + 1}`,
        type: c === ws ? 'human' : 'remote',
        status: 'connected'
      }));
      ws.send(
        JSON.stringify({
          type: 'session_joined',
          payload: { sessionId, players, localPlayerIndex: players.length - 1 }
        })
      );
      broadcast(room, { type: 'player_list', payload: { players } }, ws);
      return;
    }

    if (msg.type === 'state_sync') {
      const room = rooms.get(ws.roomId);
      if (!room) return;
      room.state = msg.payload?.gameState;
      broadcast(room, { type: 'state_update', payload: { gameState: room.state, sessionId: ws.roomId, players: [] } }, ws);
      return;
    }

    if (msg.type === 'play_card') {
      const room = rooms.get(ws.roomId);
      if (!room) return;
      broadcast(
        room,
        {
          type: 'player_action',
          payload: {
            playerIndex: msg.payload?.playerIndex,
            card: msg.payload?.card,
            action: 'play_card'
          }
        },
        ws
      );
    }
  });

  ws.on('close', () => {
    const room = rooms.get(ws.roomId);
    if (!room) return;
    room.clients.delete(ws);
    if (room.clients.size === 0) rooms.delete(ws.roomId);
  });
});

export async function bootstrapAccountAuth() {
  if (!isDbConfigured(config.databaseUrl)) {
    console.warn('[auth] DATABASE_URL not set — Account auth DB unavailable (503 on account routes)');
    return false;
  }
  await initDb(config.databaseUrl);
  await runMigrations(config.databaseUrl);
  return true;
}

export async function shutdownAccountAuth() {
  await closeDb();
}

/** Test helper — inject Google verifier mock. */
export { setGoogleVerifierForTests };

if (process.env.NODE_ENV !== 'test') {
  bootstrapAccountAuth()
    .catch((err) => {
      console.error('[auth] bootstrap failed', err);
    })
    .finally(() => {
      server.listen(PORT, () => console.log(`suecao-backend listening on ${PORT}`));
    });
}

export { app, server, rooms, config, verifyMpToken };
