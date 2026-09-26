import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-mp-guest-secret';
process.env.JWT_SIGNING_KEY = process.env.JWT_SIGNING_KEY || 'test-account-signing-key';

test('health endpoint returns ok', async () => {
  const { app } = await import('./server.js');
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  server.close();
});

test('MP guest auth issues guest JWT (separate from Account)', async () => {
  const { app } = await import('./server.js');
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/auth/guest`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ displayName: 'MP Guest' })
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.token);
  assert.ok(body.userId);
  const payload = jwt.verify(body.token, process.env.JWT_SECRET);
  assert.equal(payload.guest, true);
  assert.equal(payload.name, 'MP Guest');

  // Guest JWT must not verify as Account access token
  const { verifyAccessToken } = await import('./auth/accessToken.js');
  assert.throws(() => verifyAccessToken(body.token, process.env.JWT_SIGNING_KEY));

  // Legacy guest DELETE stub
  const del = await fetch(`http://127.0.0.1:${port}/auth/account`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${body.token}` }
  });
  assert.equal(del.status, 200);
  const delBody = await del.json();
  assert.equal(delBody.deleted, true);

  server.close();
});
