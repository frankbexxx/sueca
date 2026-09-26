/**
 * Google ID token verification for AUTH-01B.
 * Real verifier uses google-auth-library; tests inject a mock.
 */
import { OAuth2Client } from 'google-auth-library';
import { googleAudiences } from '../config.js';

const GOOGLE_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);

/**
 * @typedef {object} VerifiedGoogleIdentity
 * @property {string} providerSubject
 * @property {string|null} email
 * @property {boolean|null} emailVerified
 * @property {string|null} displayName
 * @property {string} audience
 * @property {string} issuer
 */

/**
 * @param {import('../config.js').loadConfig extends Function ? ReturnType<typeof import('../config.js').loadConfig> : any} config
 * @param {{ verifyIdToken?: Function }} [deps]
 */
export function createGoogleIdTokenVerifier(config, deps = {}) {
  const audiences = googleAudiences(config);
  const client = deps.verifyIdToken
    ? null
    : new OAuth2Client();

  /**
   * @param {string} idToken
   * @param {{ nonce?: string }} [opts]
   * @returns {Promise<VerifiedGoogleIdentity>}
   */
  async function verify(idToken, opts = {}) {
    if (!idToken || typeof idToken !== 'string') {
      const err = new Error('Missing id token');
      err.code = 'invalid_token';
      throw err;
    }
    if (audiences.length === 0) {
      const err = new Error('Google client IDs not configured');
      err.code = 'misconfigured';
      throw err;
    }

    let ticketPayload;
    if (deps.verifyIdToken) {
      ticketPayload = await deps.verifyIdToken(idToken, audiences);
    } else {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: audiences
      });
      ticketPayload = ticket.getPayload();
    }

    if (!ticketPayload || typeof ticketPayload !== 'object') {
      const err = new Error('Invalid token payload');
      err.code = 'invalid_token';
      throw err;
    }

    const iss = ticketPayload.iss;
    if (!GOOGLE_ISSUERS.has(iss)) {
      const err = new Error('Invalid issuer');
      err.code = 'invalid_issuer';
      throw err;
    }

    const aud = ticketPayload.aud;
    const audOk = Array.isArray(aud)
      ? aud.some((a) => audiences.includes(a))
      : audiences.includes(aud);
    if (!audOk) {
      const err = new Error('Invalid audience');
      err.code = 'invalid_audience';
      throw err;
    }

    if (!ticketPayload.sub || typeof ticketPayload.sub !== 'string') {
      const err = new Error('Missing subject');
      err.code = 'invalid_token';
      throw err;
    }

    if (opts.nonce != null && opts.nonce !== '') {
      if (ticketPayload.nonce !== opts.nonce) {
        const err = new Error('Nonce mismatch');
        err.code = 'invalid_nonce';
        throw err;
      }
    }

    const emailVerified =
      ticketPayload.email_verified === true ||
      ticketPayload.email_verified === 'true';

    if (config.requireEmailVerified && ticketPayload.email && !emailVerified) {
      const err = new Error('Email not verified');
      err.code = 'email_unverified';
      throw err;
    }

    return {
      providerSubject: ticketPayload.sub,
      email: ticketPayload.email || null,
      emailVerified: ticketPayload.email ? emailVerified : null,
      displayName: ticketPayload.name || null,
      audience: Array.isArray(aud) ? aud[0] : aud,
      issuer: iss
    };
  }

  return { verify, audiences };
}
