import test from 'node:test';
import assert from 'node:assert/strict';

test('health endpoint returns ok', async () => {
  process.env.NODE_ENV = 'test';
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
