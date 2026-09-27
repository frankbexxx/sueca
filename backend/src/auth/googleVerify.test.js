/**
 * Unit tests for Google verifier rules (no DB).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGoogleIdTokenVerifier } from './googleVerify.js';
import { loadConfig } from '../config.js';

function baseConfig(overrides = {}) {
  return loadConfig({
    GOOGLE_WEB_CLIENT_ID: 'web-client',
    GOOGLE_ANDROID_CLIENT_ID: 'android-client',
    AUTH_REQUIRE_EMAIL_VERIFIED: 'true',
    ...overrides
  });
}

test('google verifier accepts web audience', async () => {
  const v = createGoogleIdTokenVerifier(baseConfig(), {
    verifyIdToken: async () => ({
      iss: 'https://accounts.google.com',
      aud: 'web-client',
      sub: 'sub-1',
      email: 'a@b.c',
      email_verified: true,
      name: 'A'
    })
  });
  const id = await v.verify('tok');
  assert.equal(id.providerSubject, 'sub-1');
});

test('google verifier rejects wrong audience', async () => {
  const v = createGoogleIdTokenVerifier(baseConfig(), {
    verifyIdToken: async () => ({
      iss: 'https://accounts.google.com',
      aud: 'other',
      sub: 'sub-1',
      email_verified: true
    })
  });
  await assert.rejects(() => v.verify('tok'), (err) => err.code === 'invalid_audience');
});

test('google verifier rejects bad issuer', async () => {
  const v = createGoogleIdTokenVerifier(baseConfig(), {
    verifyIdToken: async () => ({
      iss: 'https://evil.example',
      aud: 'web-client',
      sub: 'sub-1',
      email_verified: true
    })
  });
  await assert.rejects(() => v.verify('tok'), (err) => err.code === 'invalid_issuer');
});

test('google verifier checks nonce when provided', async () => {
  const v = createGoogleIdTokenVerifier(baseConfig(), {
    verifyIdToken: async () => ({
      iss: 'accounts.google.com',
      aud: 'android-client',
      sub: 'sub-2',
      email_verified: true,
      nonce: 'n1'
    })
  });
  await assert.rejects(() => v.verify('tok', { nonce: 'n2' }), (err) => err.code === 'invalid_nonce');
  const ok = await v.verify('tok', { nonce: 'n1' });
  assert.equal(ok.audience, 'android-client');
});

test('Web GIS nonce is raw string equality (no SHA-256)', async () => {
  const rawWebNonce = 'abc-RAW_webNonce.123';
  const v = createGoogleIdTokenVerifier(baseConfig(), {
    verifyIdToken: async () => ({
      iss: 'https://accounts.google.com',
      aud: 'web-client',
      sub: 'sub-web',
      email: 'w@example.com',
      email_verified: true,
      nonce: rawWebNonce
    })
  });
  const ok = await v.verify('tok', { nonce: rawWebNonce });
  assert.equal(ok.providerSubject, 'sub-web');
  // Hashed form must NOT match — do not weaken Web validation.
  await assert.rejects(
    () => v.verify('tok', { nonce: 'sha256-of-raw-would-not-match' }),
    (err) => err.code === 'invalid_nonce'
  );
});

test('Android audience accepted separately from Web', async () => {
  const v = createGoogleIdTokenVerifier(baseConfig(), {
    verifyIdToken: async () => ({
      iss: 'https://accounts.google.com',
      aud: 'android-client',
      sub: 'sub-and',
      email: 'a@b.c',
      email_verified: true,
      name: 'And'
    })
  });
  const id = await v.verify('tok');
  assert.equal(id.audience, 'android-client');
  assert.equal(id.providerSubject, 'sub-and');
});

test('wrong Android audience rejected while Web audience still listed', async () => {
  const v = createGoogleIdTokenVerifier(baseConfig(), {
    verifyIdToken: async () => ({
      iss: 'https://accounts.google.com',
      aud: 'other-android-client',
      sub: 'sub-x',
      email_verified: true
    })
  });
  await assert.rejects(() => v.verify('tok'), (err) => err.code === 'invalid_audience');
});

test('Android Credential Manager nonce is raw string equality', async () => {
  const rawAndroidNonce = 'and-RAW_nonce.xyz';
  const v = createGoogleIdTokenVerifier(baseConfig(), {
    verifyIdToken: async () => ({
      iss: 'https://accounts.google.com',
      aud: 'android-client',
      sub: 'sub-and-nonce',
      email_verified: true,
      nonce: rawAndroidNonce
    })
  });
  const ok = await v.verify('tok', { nonce: rawAndroidNonce });
  assert.equal(ok.providerSubject, 'sub-and-nonce');
  await assert.rejects(
    () => v.verify('tok', { nonce: 'wrong-android-nonce' }),
    (err) => err.code === 'invalid_nonce'
  );
});

test('google verifier misconfigured when no audiences', async () => {
  const v = createGoogleIdTokenVerifier(
    loadConfig({ GOOGLE_WEB_CLIENT_ID: '', GOOGLE_ANDROID_CLIENT_ID: '' }),
    { verifyIdToken: async () => ({}) }
  );
  await assert.rejects(() => v.verify('tok'), (err) => err.code === 'misconfigured');
});
