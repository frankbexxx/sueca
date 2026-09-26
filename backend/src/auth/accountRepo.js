/**
 * Account / ExternalIdentity repository (AUTH-01B).
 */
import { v4 as uuidv4 } from 'uuid';
import { getPool, withTransaction } from '../db/pool.js';

const PROVIDER_GOOGLE = 'google';

export function mapAccount(row) {
  if (!row) return null;
  return {
    id: row.id,
    displayName: row.display_name,
    status: row.status,
    tokenVersion: row.token_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapExternalIdentity(row) {
  if (!row) return null;
  return {
    id: row.id,
    accountId: row.account_id,
    provider: row.provider,
    providerSubject: row.provider_subject,
    email: row.email,
    emailVerified: row.email_verified,
    createdAt: row.created_at
  };
}

export async function getAccountById(accountId, client = getPool()) {
  const { rows } = await client.query(
    `SELECT id, display_name, status, token_version, created_at, updated_at
     FROM accounts WHERE id = $1`,
    [accountId]
  );
  return mapAccount(rows[0]);
}

export async function findExternalIdentity(provider, providerSubject, client = getPool()) {
  const { rows } = await client.query(
    `SELECT id, account_id, provider, provider_subject, email, email_verified, created_at
     FROM external_identities
     WHERE provider = $1 AND provider_subject = $2`,
    [provider, providerSubject]
  );
  return mapExternalIdentity(rows[0]);
}

export async function getPrimaryGoogleIdentity(accountId, client = getPool()) {
  const { rows } = await client.query(
    `SELECT id, account_id, provider, provider_subject, email, email_verified, created_at
     FROM external_identities
     WHERE account_id = $1 AND provider = $2
     ORDER BY created_at ASC
     LIMIT 1`,
    [accountId, PROVIDER_GOOGLE]
  );
  return mapExternalIdentity(rows[0]);
}

/**
 * Find existing Google-linked account, or create Account + ExternalIdentity.
 * Concurrent first logins: UNIQUE(provider, subject) + retry on conflict.
 */
export async function findOrCreateAccountFromGoogleIdentity(identity) {
  const provider = PROVIDER_GOOGLE;
  const subject = identity.providerSubject;
  if (!subject) throw new Error('providerSubject required');

  const existing = await findExternalIdentity(provider, subject);
  if (existing) {
    const account = await getAccountById(existing.accountId);
    return { account, externalIdentity: existing, created: false };
  }

  try {
    return await withTransaction(async (client) => {
      const accountId = uuidv4();
      const extId = uuidv4();
      const displayName = identity.displayName || null;
      const now = new Date();

      await client.query(
        `INSERT INTO accounts (id, display_name, status, token_version, created_at, updated_at)
         VALUES ($1, $2, 'active', 1, $3, $3)`,
        [accountId, displayName, now]
      );

      await client.query(
        `INSERT INTO external_identities
           (id, account_id, provider, provider_subject, email, email_verified, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          extId,
          accountId,
          provider,
          subject,
          identity.email ?? null,
          identity.emailVerified ?? null,
          now
        ]
      );

      const account = await getAccountById(accountId, client);
      const externalIdentity = await findExternalIdentity(provider, subject, client);
      return { account, externalIdentity, created: true };
    });
  } catch (err) {
    // Unique violation — another concurrent request won.
    if (err && (err.code === '23505' || /unique/i.test(String(err.message)))) {
      const externalIdentity = await findExternalIdentity(provider, subject);
      if (!externalIdentity) throw err;
      const account = await getAccountById(externalIdentity.accountId);
      return { account, externalIdentity, created: false };
    }
    throw err;
  }
}

export async function softDeleteAccount(accountId) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE accounts
       SET status = 'pending_delete',
           token_version = token_version + 1,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, display_name, status, token_version, created_at, updated_at`,
      [accountId]
    );
    await client.query(
      `UPDATE refresh_tokens
       SET revoked_at = NOW()
       WHERE account_id = $1 AND revoked_at IS NULL`,
      [accountId]
    );
    return mapAccount(rows[0]);
  });
}

export { PROVIDER_GOOGLE };
