/**
 * Suecão Account auth routes (AUTH-01B).
 * Isolated from POST /auth/guest multiplayer semantics.
 */
import { Router } from 'express';
import { findOrCreateAccountFromGoogleIdentity, getPrimaryGoogleIdentity, softDeleteAccount } from './accountRepo.js';
import { signAccessToken } from './accessToken.js';
import { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } from './refreshTokens.js';
import { createRequireAccountAuth } from './middleware.js';
import { createRateLimiter } from './rateLimit.js';
import { getGoogleVerifier } from './deps.js';
import { isDbConfigured, getPool } from '../db/pool.js';
import { getAccountById } from './accountRepo.js';
import { verifyAccessToken } from './accessToken.js';

function audit(event, meta = {}) {
  // Never log tokens.
  console.info('[auth]', event, meta);
}

function requireDb(res) {
  if (!isDbConfigured() || !getPool()) {
    res.status(503).json({ error: 'Account auth unavailable' });
    return false;
  }
  return true;
}

function sessionPayload(account, accessToken, refreshToken, refreshExpiresAt, extra = {}) {
  return {
    account: {
      id: account.id,
      displayName: account.displayName,
      status: account.status
    },
    accessToken,
    refreshToken,
    refreshExpiresAt: refreshExpiresAt?.toISOString?.() || refreshExpiresAt,
    ...extra
  };
}

/**
 * @param {ReturnType<typeof import('../config.js').loadConfig>} config
 */
export function createAccountAuthRouter(config) {
  const router = Router();
  const requireAccountAuth = createRequireAccountAuth(config);

  const loginLimit = createRateLimiter({ windowMs: 60_000, max: 20, name: 'google-login' });
  const refreshLimit = createRateLimiter({ windowMs: 60_000, max: 60, name: 'refresh' });
  const logoutLimit = createRateLimiter({ windowMs: 60_000, max: 60, name: 'logout' });

  router.post('/auth/google/id-token', loginLimit, async (req, res) => {
    if (!requireDb(res)) return;
    const idToken = req.body?.idToken;
    const nonce = req.body?.nonce;
    // Advisory only — never used for ownership/grants.
    const localGuestId =
      typeof req.body?.localGuestId === 'string' ? req.body.localGuestId.slice(0, 64) : undefined;

    try {
      const identity = await getGoogleVerifier(config).verify(idToken, { nonce });
      const { account, created } = await findOrCreateAccountFromGoogleIdentity({
        providerSubject: identity.providerSubject,
        email: identity.email,
        emailVerified: identity.emailVerified,
        displayName: identity.displayName
      });

      if (!account || account.status !== 'active') {
        audit('google_login_denied', { reason: 'inactive_account' });
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const accessToken = signAccessToken(account, {
        secret: config.accountJwtSecret,
        expiresIn: config.accessTokenTtl
      });
      const refresh = await issueRefreshToken(account.id, config.refreshTokenTtlDays);

      audit('google_login_ok', {
        accountId: account.id,
        created,
        hasLocalGuestHint: !!localGuestId
      });

      return res.json(
        sessionPayload(account, accessToken, refresh.raw, refresh.expiresAt, {
          linkResult: created ? 'created' : 'existing',
          email: identity.email
        })
      );
    } catch (err) {
      const code = err?.code || 'invalid_token';
      audit('google_login_fail', { reason: code });
      if (code === 'misconfigured') {
        return res.status(503).json({ error: 'Account auth unavailable' });
      }
      return res.status(401).json({ error: 'Unauthorized' });
    }
  });

  router.post('/auth/session/refresh', refreshLimit, async (req, res) => {
    if (!requireDb(res)) return;
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const rotated = await rotateRefreshToken(refreshToken, config.refreshTokenTtlDays);
      if (!rotated.ok) {
        audit('refresh_fail', { reason: rotated.reason });
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const account = await getAccountById(rotated.accountId);
      if (!account || account.status !== 'active') {
        audit('refresh_fail', { reason: 'inactive_account' });
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const accessToken = signAccessToken(account, {
        secret: config.accountJwtSecret,
        expiresIn: config.accessTokenTtl
      });
      audit('refresh_ok', { accountId: account.id });
      return res.json(
        sessionPayload(account, accessToken, rotated.refreshToken, rotated.refreshExpiresAt)
      );
    } catch {
      audit('refresh_fail', { reason: 'error' });
      return res.status(401).json({ error: 'Unauthorized' });
    }
  });

  router.post('/auth/logout', logoutLimit, async (req, res) => {
    if (!requireDb(res)) return;
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({ error: 'refreshToken required' });
    }
    try {
      const revoked = await revokeRefreshToken(refreshToken);
      audit('logout', { revoked });
      return res.json({ ok: true, revoked });
    } catch {
      return res.status(500).json({ error: 'Logout failed' });
    }
  });

  router.get('/me', requireAccountAuth, async (req, res) => {
    if (!requireDb(res)) return;
    const identity = await getPrimaryGoogleIdentity(req.account.id);
    return res.json({
      id: req.account.id,
      displayName: req.account.displayName,
      status: req.account.status,
      email: identity?.email ?? null
    });
  });

  return router;
}

/**
 * Soft-delete Account when Suecão access JWT is presented.
 * Returns false if the token is not an Account access token (caller may fall back to MP guest stub).
 */
export async function trySoftDeleteAccount(req, res, config) {
  if (!isDbConfigured() || !getPool()) return false;
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return false;
  try {
    const claims = verifyAccessToken(match[1], config.accountJwtSecret);
    const account = await getAccountById(claims.accountId);
    if (!account || account.tokenVersion !== claims.tokenVersion) {
      res.status(401).json({ error: 'Unauthorized' });
      return true;
    }
    if (account.status === 'pending_delete') {
      res.json({
        deleted: true,
        status: 'pending_delete',
        note: 'Cloud game data deletion deferred until REL-SYNC-01'
      });
      return true;
    }
    const updated = await softDeleteAccount(account.id);
    audit('account_soft_delete', { accountId: account.id });
    res.json({
      deleted: true,
      status: updated?.status || 'pending_delete',
      note: 'Cloud game data deletion deferred until REL-SYNC-01'
    });
    return true;
  } catch {
    return false;
  }
}
