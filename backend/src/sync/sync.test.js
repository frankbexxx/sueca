/**
 * SYNC-01B — sync API integration tests (Postgres + mocked Google verifier).
 *
 * Requires DATABASE_URL. Skips suite if Postgres is unreachable.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.JWT_SIGNING_KEY = process.env.JWT_SIGNING_KEY || 'test-account-signing-key';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-mp-guest-secret';
process.env.GOOGLE_WEB_CLIENT_ID =
  process.env.GOOGLE_WEB_CLIENT_ID || 'test-web-client.apps.googleusercontent.com';
process.env.GOOGLE_ANDROID_CLIENT_ID =
  process.env.GOOGLE_ANDROID_CLIENT_ID || 'test-android-client.apps.googleusercontent.com';
process.env.ACCESS_TOKEN_TTL = '15m';
process.env.REFRESH_TOKEN_TTL_DAYS = '30';
process.env.AUTH_REQUIRE_EMAIL_VERIFIED = 'true';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://suecao:suecao@127.0.0.1:5433/suecao_auth';

const WEB_AUD = process.env.GOOGLE_WEB_CLIENT_ID;

function mockPayload(overrides = {}) {
  return {
    iss: 'https://accounts.google.com',
    aud: WEB_AUD,
    sub: overrides.sub || `google-sub-${crypto.randomBytes(8).toString('hex')}`,
    email: overrides.email ?? 'sync@example.com',
    email_verified: overrides.email_verified ?? true,
    name: overrides.name ?? 'Sync Tester',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    ...overrides
  };
}

let baseUrl;
let server;
let dbReady = false;

async function boot() {
  const { app, bootstrapAccountAuth, setGoogleVerifierForTests } = await import('../server.js');
  const { createGoogleIdTokenVerifier } = await import('../auth/googleVerify.js');
  const { loadConfig } = await import('../config.js');

  setGoogleVerifierForTests(
    createGoogleIdTokenVerifier(loadConfig(), {
      verifyIdToken: async (idToken) => {
        if (!idToken || idToken === 'invalid') {
          throw Object.assign(new Error('bad'), { code: 'invalid_token' });
        }
        return typeof idToken === 'string' ? JSON.parse(idToken) : idToken;
      }
    })
  );

  await bootstrapAccountAuth();
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  dbReady = true;
}

async function shutdown() {
  if (server) await new Promise((r) => server.close(r));
  const { shutdownAccountAuth } = await import('../server.js');
  const { clearGoogleVerifierForTests } = await import('../auth/deps.js');
  clearGoogleVerifierForTests();
  await shutdownAccountAuth();
}

async function json(method, path, body, headers = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

function asToken(payload) {
  return JSON.stringify(payload);
}

async function loginAs(sub) {
  const res = await json('POST', '/auth/google/id-token', {
    idToken: asToken(mockPayload({ sub }))
  });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  return res.data;
}

function auth(accessToken) {
  return { Authorization: `Bearer ${accessToken}` };
}

function historyRecord(id, overrides = {}) {
  return {
    id,
    schemaVersion: 1,
    ...(overrides.idempotencyKey != null
      ? { idempotencyKey: overrides.idempotencyKey }
      : {}),
    payload: {
      completedAt: '2026-03-01T00:00:00.000Z',
      gameVariant: 'sueca',
      summary: 'test',
      ...(overrides.payload || {})
    }
  };
}

function prefsPayload() {
  return {
    setup: { p1Name: 'Alice' },
    hand: { sortEnabled: true },
    dealingMethod: 'A',
    autoPauseTrick: false,
    activeTheme: 'classic'
  };
}

test('SYNC-01B sync API', async (t) => {
  try {
    await boot();
  } catch (err) {
    t.skip(`Postgres unavailable: ${err.message}`);
    return;
  }
  assert.equal(dbReady, true);
  t.after(async () => {
    await shutdown();
  });

  await t.test('auth: no token → 401', async () => {
    const res = await json('GET', '/sync/status');
    assert.equal(res.status, 401);
  });

  await t.test('auth: MP guest JWT rejected', async () => {
    const guest = await json('POST', '/auth/guest', { displayName: 'G' });
    assert.equal(guest.status, 200);
    const res = await json('GET', '/sync/status', undefined, auth(guest.data.token));
    assert.equal(res.status, 401);
  });

  await t.test('auth: active account accepted; pending_delete rejected', async () => {
    const session = await loginAs(`sync-pd-${crypto.randomBytes(4).toString('hex')}`);
    const ok = await json('GET', '/sync/status', undefined, auth(session.accessToken));
    assert.equal(ok.status, 200);
    assert.equal(ok.data.eligible, true);
    assert.equal(ok.data.historyRevision, 0);

    const del = await json('DELETE', '/auth/account', undefined, auth(session.accessToken));
    assert.equal(del.status, 200);
    const denied = await json('GET', '/sync/status', undefined, auth(session.accessToken));
    assert.equal(denied.status, 401);
  });

  await t.test('history: append, idempotent retry, idempotencyKey dedupe, conflict', async () => {
    const session = await loginAs(`sync-hist-${crypto.randomBytes(4).toString('hex')}`);
    const h = auth(session.accessToken);
    const id1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const id2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

    const first = await json(
      'POST',
      '/sync/history',
      { records: [historyRecord(id1, { idempotencyKey: 'k1' })] },
      h
    );
    assert.equal(first.status, 200);
    assert.deepEqual(first.data.accepted, [id1]);
    assert.equal(first.data.historyRevision, 1);

    const retry = await json(
      'POST',
      '/sync/history',
      { records: [historyRecord(id1, { idempotencyKey: 'k1' })] },
      h
    );
    assert.equal(retry.status, 200);
    assert.deepEqual(retry.data.deduped, [id1]);
    assert.equal(retry.data.historyRevision, 1);

    const idemDedupe = await json(
      'POST',
      '/sync/history',
      {
        records: [
          historyRecord(id2, {
            idempotencyKey: 'k1',
            payload: { summary: 'test' }
          })
        ]
      },
      h
    );
    assert.equal(idemDedupe.status, 200);
    assert.ok(idemDedupe.data.deduped.includes(id2) || idemDedupe.data.conflicts.length > 0);

    const conflict = await json(
      'POST',
      '/sync/history',
      {
        records: [
          historyRecord(id1, {
            payload: { summary: 'DIFFERENT' }
          })
        ]
      },
      h
    );
    assert.equal(conflict.status, 409);
    assert.equal(conflict.data.conflicts[0].code, 'history_record_conflict');
  });

  await t.test('history: legacy migrated-finished-* id accepted', async () => {
    const session = await loginAs(`sync-legacy-id-${crypto.randomBytes(4).toString('hex')}`);
    const legacyId = 'migrated-finished-sueca-1710000000000';
    const res = await json(
      'POST',
      '/sync/history',
      { records: [historyRecord(legacyId)] },
      auth(session.accessToken)
    );
    assert.equal(res.status, 200);
    assert.deepEqual(res.data.accepted, [legacyId]);
  });

  await t.test('history: batch too large → 413', async () => {
    const session = await loginAs(`sync-batch-${crypto.randomBytes(4).toString('hex')}`);
    const records = Array.from({ length: 101 }, (_, i) =>
      historyRecord(`cccccccc-cccc-4ccc-8ccc-${String(i).padStart(12, '0')}`)
    );
    const res = await json('POST', '/sync/history', { records }, auth(session.accessToken));
    assert.equal(res.status, 413);
    assert.equal(res.data.code, 'batch_too_large');
  });

  await t.test('history: concurrent duplicate insert → one logical record', async () => {
    const session = await loginAs(`sync-conc-h-${crypto.randomBytes(4).toString('hex')}`);
    const id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    const body = { records: [historyRecord(id)] };
    const headers = auth(session.accessToken);
    const [a, b] = await Promise.all([
      json('POST', '/sync/history', body, headers),
      json('POST', '/sync/history', body, headers)
    ]);
    assert.ok(a.status === 200 && b.status === 200);
    const snap = await json('GET', '/sync/snapshot', undefined, headers);
    assert.equal(snap.status, 200);
    const matches = snap.data.history.filter((r) => r.id === id);
    assert.equal(matches.length, 1);
  });

  await t.test('history: retention keeps newest 2000', async () => {
    const session = await loginAs(`sync-ret-${crypto.randomBytes(4).toString('hex')}`);
    const h = auth(session.accessToken);
    // Insert in batches of 100; 21 batches = 2100.
    for (let batch = 0; batch < 21; batch += 1) {
      const records = Array.from({ length: 100 }, (_, i) => {
        const n = batch * 100 + i;
        return historyRecord(`eeeeeeee-eeee-4eee-8eee-${String(n).padStart(12, '0')}`, {
          payload: { summary: `n-${n}`, completedAt: new Date(1700000000000 + n).toISOString() }
        });
      });
      const res = await json('POST', '/sync/history', { records }, h);
      assert.equal(res.status, 200, `batch ${batch}: ${JSON.stringify(res.data)}`);
    }
    const snap = await json('GET', '/sync/snapshot', undefined, h);
    assert.equal(snap.status, 200);
    assert.ok(snap.data.history.length <= 2000);
    assert.equal(snap.data.history.length, 2000);
  });

  await t.test('prefs: create at 0, update, stale 409, concurrent one-winner', async () => {
    const session = await loginAs(`sync-prefs-${crypto.randomBytes(4).toString('hex')}`);
    const h = auth(session.accessToken);

    const create = await json(
      'PUT',
      '/sync/prefs',
      { schemaVersion: 1, baseRevision: 0, payload: prefsPayload() },
      h
    );
    assert.equal(create.status, 200);
    assert.equal(create.data.prefsRevision, 1);

    const update = await json(
      'PUT',
      '/sync/prefs',
      {
        schemaVersion: 1,
        baseRevision: 1,
        payload: { ...prefsPayload(), activeTheme: 'forest' }
      },
      h
    );
    assert.equal(update.status, 200);
    assert.equal(update.data.prefsRevision, 2);

    const stale = await json(
      'PUT',
      '/sync/prefs',
      { schemaVersion: 1, baseRevision: 1, payload: prefsPayload() },
      h
    );
    assert.equal(stale.status, 409);
    assert.equal(stale.data.code, 'stale_revision');
    assert.equal(stale.data.currentRevision, 2);

    const body = {
      schemaVersion: 1,
      baseRevision: 2,
      payload: { ...prefsPayload(), activeTheme: 'midnight' }
    };
    const [c1, c2] = await Promise.all([
      json('PUT', '/sync/prefs', body, h),
      json('PUT', '/sync/prefs', body, h)
    ]);
    const statuses = [c1.status, c2.status].sort();
    assert.deepEqual(statuses, [200, 409]);

    const forbidden = await json(
      'PUT',
      '/sync/prefs',
      {
        schemaVersion: 1,
        baseRevision: 99,
        payload: { activeTheme: 'x', accessToken: 'nope' }
      },
      h
    );
    assert.equal(forbidden.status, 400);
    assert.equal(forbidden.data.code, 'invalid_payload');
  });

  await t.test('legacy seed: create, idempotent, conflict, validation', async () => {
    const session = await loginAs(`sync-seed-${crypto.randomBytes(4).toString('hex')}`);
    const h = auth(session.accessToken);
    const payload = {
      metrics: {
        gamesPlayed: 10,
        wins: 4,
        byVariant: { sueca: { played: 10, wins: 4 } }
      }
    };

    const first = await json(
      'PUT',
      '/sync/legacy-stats-seed',
      { schemaVersion: 1, payload },
      h
    );
    assert.equal(first.status, 200);
    assert.equal(first.data.created, true);

    const again = await json(
      'PUT',
      '/sync/legacy-stats-seed',
      { schemaVersion: 1, payload },
      h
    );
    assert.equal(again.status, 200);
    assert.equal(again.data.idempotent, true);

    const conflict = await json(
      'PUT',
      '/sync/legacy-stats-seed',
      {
        schemaVersion: 1,
        payload: { metrics: { gamesPlayed: 99, wins: 1 } }
      },
      h
    );
    assert.equal(conflict.status, 409);
    assert.equal(conflict.data.code, 'immutable_seed_conflict');

    const session2 = await loginAs(`sync-seed-bad-${crypto.randomBytes(4).toString('hex')}`);
    const bad = await json(
      'PUT',
      '/sync/legacy-stats-seed',
      { schemaVersion: 1, payload: { metrics: { gamesPlayed: -1, wins: 0 } } },
      auth(session2.accessToken)
    );
    assert.equal(bad.status, 400);
  });

  await t.test('snapshot/status: empty vs populated; Account isolation', async () => {
    const a = await loginAs(`sync-iso-a-${crypto.randomBytes(4).toString('hex')}`);
    const b = await loginAs(`sync-iso-b-${crypto.randomBytes(4).toString('hex')}`);
    const ha = auth(a.accessToken);
    const hb = auth(b.accessToken);

    const empty = await json('GET', '/sync/snapshot', undefined, hb);
    assert.equal(empty.status, 200);
    assert.equal(empty.data.history.length, 0);
    assert.equal(empty.data.prefs, null);
    assert.equal(empty.data.legacyStatsSeed, null);

    const matchId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
    await json('POST', '/sync/history', { records: [historyRecord(matchId)] }, ha);
    await json(
      'PUT',
      '/sync/prefs',
      { schemaVersion: 1, baseRevision: 0, payload: prefsPayload() },
      ha
    );
    await json(
      'PUT',
      '/sync/legacy-stats-seed',
      { schemaVersion: 1, payload: { metrics: { gamesPlayed: 3, wins: 1 } } },
      ha
    );

    const snapA = await json('GET', '/sync/snapshot', undefined, ha);
    assert.equal(snapA.status, 200);
    assert.equal(snapA.data.history.length, 1);
    assert.equal(snapA.data.history[0].id, matchId);
    assert.ok(snapA.data.prefs);
    assert.ok(snapA.data.legacyStatsSeed);
    assert.equal(snapA.data.historyRevision, 1);
    assert.equal(snapA.data.prefsRevision, 1);

    const snapB = await json('GET', '/sync/snapshot', undefined, hb);
    assert.equal(snapB.data.history.length, 0);
    assert.equal(snapB.data.prefs, null);
    assert.equal(snapB.data.legacyStatsSeed, null);

    const statusA = await json('GET', '/sync/status', undefined, ha);
    assert.equal(statusA.data.hasLegacyStatsSeed, true);
    assert.ok(statusA.data.globalRevision >= 2);

    // Spoof accountId in body — rejected.
    const spoof = await json(
      'POST',
      '/sync/history',
      {
        accountId: a.account.id,
        records: [historyRecord('11111111-1111-4111-8111-111111111111')]
      },
      hb
    );
    assert.equal(spoof.status, 400);
  });

  await t.test('snapshot: sinceHistoryRevision incremental semantics', async () => {
    const session = await loginAs(`sync-incr-${crypto.randomBytes(4).toString('hex')}`);
    const h = auth(session.accessToken);
    const id1 = '12121212-1212-4121-8121-121212121212';
    const id2 = '13131313-1313-4131-8131-131313131313';
    await json('POST', '/sync/history', { records: [historyRecord(id1)] }, h);
    await json('POST', '/sync/history', { records: [historyRecord(id2)] }, h);

    const incr = await json('GET', '/sync/snapshot?sinceHistoryRevision=1', undefined, h);
    assert.equal(incr.status, 200);
    assert.equal(incr.data.historyIncremental, true);
    assert.equal(incr.data.history.length, 1);
    assert.equal(incr.data.history[0].id, id2);
  });

  await t.test('security: forged account JWT with wrong secret rejected', async () => {
    const forged = jwt.sign(
      { accountId: crypto.randomUUID(), tokenVersion: 1, typ: 'access' },
      'wrong-secret'
    );
    const res = await json('GET', '/sync/status', undefined, auth(forged));
    assert.equal(res.status, 401);
  });
});
