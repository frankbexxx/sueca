-- SYNC-01B — account-scoped sync storage (history, prefs, legacyStatsSeed)
-- Soft-deleted accounts keep rows (accounts row remains). Hard-delete cascades.

CREATE TABLE IF NOT EXISTS sync_account_state (
  account_id UUID PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
  global_revision BIGINT NOT NULL DEFAULT 0,
  history_revision BIGINT NOT NULL DEFAULT 0,
  prefs_revision BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_match_history (
  account_id UUID NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  idempotency_key TEXT NULL,
  schema_version INTEGER NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  server_revision BIGINT NOT NULL,
  PRIMARY KEY (account_id, match_id),
  CONSTRAINT sync_match_history_match_id_len CHECK (char_length(match_id) BETWEEN 1 AND 128),
  CONSTRAINT sync_match_history_schema_version_pos CHECK (schema_version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_sync_match_history_account_revision
  ON sync_match_history (account_id, server_revision);

CREATE INDEX IF NOT EXISTS idx_sync_match_history_account_created
  ON sync_match_history (account_id, created_at DESC);

-- Secondary dedupe: one idempotency_key per account when present.
CREATE UNIQUE INDEX IF NOT EXISTS uq_sync_match_history_account_idempotency
  ON sync_match_history (account_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS sync_prefs (
  account_id UUID PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
  schema_version INTEGER NOT NULL,
  payload JSONB NOT NULL,
  server_revision BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sync_prefs_schema_version_pos CHECK (schema_version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_sync_prefs_revision
  ON sync_prefs (account_id, server_revision);

CREATE TABLE IF NOT EXISTS sync_legacy_stats_seed (
  account_id UUID PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
  schema_version INTEGER NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sync_legacy_stats_seed_schema_version_pos CHECK (schema_version >= 1)
);
