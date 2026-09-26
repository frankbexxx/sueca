/**
 * AUTH-01B — Account auth integration tests (Postgres + mocked Google verifier).
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
const ANDROID_AUD = process.env.GOOGLE_ANDROID_CLIENT_ID;

function mockPayload(overrides = {}) {
  return {
    iss: 'https://accounts.google.com',
    aud: WEB_AUD,
    sub: overrides.sub || `google-sub-${crypto.randomBytes(8).toString('hex')}`,
    email: overrides.email ?? 'player@example.com',
    email_verified: overrides.email_verified ?? true,
    name: overrides.name ?? 'Test Player',
    nonce: overrides.nonce,
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
  const { createGoogleIdTokenVerifier } = await import('./googleVerify.js');
  const { loadConfig } = await import('../config.js');

  // Default mock: treat idToken JSON as Google payload; otherwise invalid.
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
  const { clearGoogleVerifierForTests } = await import('./deps.js');
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

test('AUTH-01B account auth', async (t) => {
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

  await t.test('valid Google token creates Account + ExternalIdentity + session', async () => {
    const sub = `sub-new-${crypto.randomBytes(4).toString('hex')}`;
    const res = await json('POST', '/auth/google/id-token', {
      idToken: asToken(mockPayload({ sub })),
      localGuestId: 'guest-advisory-only'
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.linkResult, 'created');
    assert.ok(res.data.account?.id);
    assert.ok(res.data.accessToken);
    assert.ok(res.data.refreshToken);
  });

  await t.test('same Google subject returns same Account', async () => {
    const sub = `sub-exist-${crypto.randomBytes(4).toString('hex')}`;
    const first = await json('POST', '/auth/google/id-token', {
      idToken: asToken(mockPayload({ sub }))
    });
    const second = await json('POST', '/auth/google/id-token', {
      idToken: asToken(mockPayload({ sub }))
    });
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(second.data.linkResult, 'existing');
    assert.equal(first.data.account.id, second.data.account.id);
  });

  await t.test('concurrent first login → one Account', async () => {
    const sub = `sub-race-${crypto.randomBytes(4).toString('hex')}`;
    const token = asToken(mockPayload({ sub }));
    const results = await Promise.all(
      Array.from({ length: 8 }, () => json('POST', '/auth/google/id-token', { idToken: token }))
    );
    assert.ok(results.every((r) => r.status === 200));
    assert.equal(new Set(results.map((r) => r.data.account.id)).size, 1);
  });

  await t.test('invalid / wrong audience / missing sub / unverified email / nonce', async () => {
    assert.equal((await json('POST', '/auth/google/id-token', { idToken: 'invalid' })).status, 401);

    assert.equal(
      (
        await json('POST', '/auth/google/id-token', {
          idToken: asToken(mockPayload({ sub: 'x', aud: 'wrong' }))
        })
      ).status,
      401
    );

    const noSub = mockPayload();
    delete noSub.sub;
    assert.equal(
      (await json('POST', '/auth/google/id-token', { idToken: asToken(noSub) })).status,
      401
    );

    assert.equal(
      (
        await json('POST', '/auth/google/id-token', {
          idToken: asToken(
            mockPayload({ sub: `u-${crypto.randomBytes(2).toString('hex')}`, email_verified: false })
          )
        })
      ).status,
      401
    );

    assert.equal(
      (
        await json('POST', '/auth/google/id-token', {
          idToken: asToken(
            mockPayload({ sub: `n-${crypto.randomBytes(2).toString('hex')}`, nonce: 'n1' })
          ),
          nonce: 'n2'
        })
      ).status,
      401
    );
  });

  await t.test('Android audience accepted', async () => {
    const res = await json('POST', '/auth/google/id-token', {
      idToken: asToken(
        mockPayload({ sub: `and-${crypto.randomBytes(3).toString('hex')}`, aud: ANDROID_AUD })
      )
    });
    assert.equal(res.status, 200);
  });

  await t.test('/me with access token; MP guest rejected', async () => {
    const login = await json('POST', '/auth/google/id-token', {
      idToken: asToken(mockPayload({ sub: `me-${crypto.randomBytes(3).toString('hex')}` }))
    });
    const me = await json('GET', '/me', undefined, {
      Authorization: `Bearer ${login.data.accessToken}`
    });
    assert.equal(me.status, 200);
    assert.equal(me.data.id, login.data.account.id);

    const guest = await json('POST', '/auth/guest', { displayName: 'MP' });
    const meGuest = await json('GET', '/me', undefined, {
      Authorization: `Bearer ${guest.data.token}`
    });
    assert.equal(meGuest.status, 401);
  });

  await t.test('refresh rotation; old refresh rejected', async () => {
    const login = await json('POST', '/auth/google/id-token', {
      idToken: asToken(mockPayload({ sub: `ref-${crypto.randomBytes(3).toString('hex')}` }))
    });
    const oldRefresh = login.data.refreshToken;
    const refreshed = await json('POST', '/auth/session/refresh', { refreshToken: oldRefresh });
    assert.equal(refreshed.status, 200);
    assert.notEqual(refreshed.data.refreshToken, oldRefresh);
    assert.equal(
      (await json('POST', '/auth/session/refresh', { refreshToken: oldRefresh })).status,
      401
    );
  });

  await t.test('logout revokes refresh', async () => {
    const login = await json('POST', '/auth/google/id-token', {
      idToken: asToken(mockPayload({ sub: `out-${crypto.randomBytes(3).toString('hex')}` }))
    });
    const out = await json('POST', '/auth/logout', { refreshToken: login.data.refreshToken });
    assert.equal(out.status, 200);
    assert.equal(out.data.revoked, true);
    assert.equal(
      (
        await json('POST', '/auth/session/refresh', {
          refreshToken: login.data.refreshToken
        })
      ).status,
      401
    );
  });

  await t.test('soft-delete bumps tokenVersion and revokes refresh', async () => {
    const login = await json('POST', '/auth/google/id-token', {
      idToken: asToken(mockPayload({ sub: `del-${crypto.randomBytes(3).toString('hex')}` }))
    });
    const del = await json('DELETE', '/auth/account', undefined, {
      Authorization: `Bearer ${login.data.accessToken}`
    });
    assert.equal(del.status, 200);
    assert.equal(del.data.status, 'pending_delete');
    assert.equal(
      (
        await json('GET', '/me', undefined, {
          Authorization: `Bearer ${login.data.accessToken}`
        })
      ).status,
      401
    );
    assert.equal(
      (
        await json('POST', '/auth/session/refresh', {
          refreshToken: login.data.refreshToken
        })
      ).status,
      401
    );
  });

  await t.test('MP guest JWT unchanged and separate', async () => {
    const guest = await json('POST', '/auth/guest', { displayName: 'GuestMP' });
    assert.equal(guest.status, 200);
    const payload = jwt.verify(guest.data.token, process.env.JWT_SECRET);
    assert.equal(payload.guest, true);
    const del = await json('DELETE', '/auth/account', undefined, {
      Authorization: `Bearer ${guest.data.token}`
    });
    assert.equal(del.status, 200);
    assert.equal(del.data.deleted, true);
    assert.equal(del.data.status, undefined);
  });
});
