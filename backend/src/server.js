/**
 * SUECÂO multiplayer v1 — guest auth + authoritative rooms (Sueca relay MVP).
 */
import http from 'http';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const PORT = Number(process.env.PORT || 8787);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-change-in-production';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,capacitor://localhost,https://localhost')
  .split(',')
  .map((s) => s.trim());

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

const rooms = new Map();

app.get('/health', (_req, res) => res.json({ ok: true }));

/** Guest auth — upgrade to Google later */
app.post('/auth/guest', (req, res) => {
  const displayName = String(req.body?.displayName || 'Guest').slice(0, 32);
  const userId = uuidv4();
  const token = jwt.sign({ sub: userId, name: displayName, guest: true }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, userId, displayName });
});

app.delete('/auth/account', (req, res) => {
  const auth = req.headers.authorization?.replace('Bearer ', '');
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(auth, JWT_SECRET);
    res.json({ deleted: true });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
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
    user = verifyToken(token);
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

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => console.log(`suecao-backend listening on ${PORT}`));
}

export { app, server, rooms };
