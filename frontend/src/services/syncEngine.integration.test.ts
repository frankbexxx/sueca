/**
 * @vitest-environment jsdom
 * SYNC-01C — optional real local backend smoke (skips if Postgres/auth API down).
 *
 * Uses mocked Google verifier path via backend auth tests style is heavy from Vitest;
 * here we only hit /sync/* when VITE_AUTH_API_BASE_URL is reachable and a session
 * can be established with the same mock-token convention as backend auth tests.
 *
 * Set SYNC_01C_INTEGRATION=1 to require the smoke (fail if unavailable).
 */
import { beforeAll, describe, expect, it } from 'vitest';

const BASE = process.env.VITE_AUTH_API_BASE_URL || 'http://127.0.0.1:4000';
const required = process.env.SYNC_01C_INTEGRATION === '1';

describe('SYNC-01C real backend smoke (optional)', () => {
  let available = false;

  beforeAll(async () => {
    try {
      const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(800) });
      available = res.ok;
    } catch {
      available = false;
    }
  });

  it('backend health reachable when integration enabled', async () => {
    if (!available) {
      if (required) {
        throw new Error(`SYNC_01C_INTEGRATION requires ${BASE}/health`);
      }
      return;
    }
    const res = await fetch(`${BASE}/health`);
    expect(res.ok).toBe(true);
  });

  it('unauthenticated /sync/status is 401 (no guest sync)', async () => {
    if (!available) return;
    const res = await fetch(`${BASE}/sync/status`);
    expect(res.status).toBe(401);
  });
});
