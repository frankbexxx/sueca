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
