/**
 * Opaque refresh tokens — store only SHA-256 hashes.
 */
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getPool, withTransaction } from '../db/pool.js';

export function hashRefreshToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken), 'utf8').digest('hex');
}

export function generateRefreshToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export async function issueRefreshToken(accountId, ttlDays, client = null) {
  const raw = generateRefreshToken();
  const tokenHash = hashRefreshToken(raw);
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + Number(ttlDays) * 24 * 60 * 60 * 1000);
  const run = async (c) => {
    await c.query(
      `INSERT INTO refresh_tokens (id, account_id, token_hash, expires_at, revoked_at, created_at)
       VALUES ($1, $2, $3, $4, NULL, NOW())`,
      [id, accountId, tokenHash, expiresAt]
    );
    return { id, raw, expiresAt };
  };
  if (client) return run(client);
  return run(getPool());
}

export async function findActiveRefreshByRaw(rawToken) {
  const tokenHash = hashRefreshToken(rawToken);
  const { rows } = await getPool().query(
    `SELECT id, account_id, token_hash, expires_at, revoked_at, created_at
     FROM refresh_tokens
     WHERE token_hash = $1`,
    [tokenHash]
  );
  const row = rows[0];
  if (!row) return null;
  if (row.revoked_at) return { ...row, status: 'revoked' };
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return { ...row, status: 'expired' };
  }
  return { ...row, status: 'active' };
}

/**
 * Rotate: revoke old → insert new (same transaction).
 * Replaying the old raw token after rotation must fail.
 */
export async function rotateRefreshToken(rawToken, ttlDays) {
  return withTransaction(async (client) => {
    const tokenHash = hashRefreshToken(rawToken);
    const { rows } = await client.query(
      `SELECT id, account_id, expires_at, revoked_at
       FROM refresh_tokens
       WHERE token_hash = $1
       FOR UPDATE`,
      [tokenHash]
    );
    const row = rows[0];
    if (!row) return { ok: false, reason: 'not_found' };
    if (row.revoked_at) return { ok: false, reason: 'revoked' };
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      return { ok: false, reason: 'expired' };
    }

    await client.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL`,
      [row.id]
    );

    const next = await issueRefreshToken(row.account_id, ttlDays, client);
    return {
      ok: true,
      accountId: row.account_id,
      refreshToken: next.raw,
      refreshExpiresAt: next.expiresAt,
      previousId: row.id,
      refreshId: next.id
    };
  });
}

export async function revokeRefreshToken(rawToken) {
  const tokenHash = hashRefreshToken(rawToken);
  const { rowCount } = await getPool().query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash]
  );
  return rowCount > 0;
}

export async function revokeAllRefreshTokensForAccount(accountId) {
  const { rowCount } = await getPool().query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE account_id = $1 AND revoked_at IS NULL`,
    [accountId]
  );
  return rowCount;
}
