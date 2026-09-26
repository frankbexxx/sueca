-- AUTH-01B — Suecão Account identity (no game/sync tables)

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY,
  display_name TEXT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending_delete')),
  token_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts (status);

CREATE TABLE IF NOT EXISTS external_identities (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts (id),
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  email TEXT NULL,
  email_verified BOOLEAN NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_external_identities_provider_subject UNIQUE (provider, provider_subject)
);

CREATE INDEX IF NOT EXISTS idx_external_identities_account_id
  ON external_identities (account_id);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts (id),
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_refresh_tokens_token_hash
  ON refresh_tokens (token_hash);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_account_id
  ON refresh_tokens (account_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active
  ON refresh_tokens (account_id)
  WHERE revoked_at IS NULL;
