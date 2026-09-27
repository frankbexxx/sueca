/**
 * @vitest-environment jsdom
 * AUTH-01C — GIS renderButton (no FedCM / prompt) + initialize idempotency
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createGoogleSignInNonce,
  invalidateGoogleSignInSession,
  mountGoogleSignInButton,
  setGoogleSignInButtonMounterForTests
} from './googleWebSignIn';

describe('googleWebSignIn renderButton', () => {
  beforeEach(() => {
    setGoogleSignInButtonMounterForTests(null);
    invalidateGoogleSignInSession();
    document.body.innerHTML = '';
    document.head.querySelectorAll('script[src*="gsi/client"]').forEach((n) => n.remove());
    delete (window as unknown as { google?: unknown }).google;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setGoogleSignInButtonMounterForTests(null);
    invalidateGoogleSignInSession();
  });

  it('loads GIS, initialize once, renderButton, never prompt / FedCM', async () => {
    const initialize = vi.fn();
    const renderButton = vi.fn();
    const prompt = vi.fn();
    (window as unknown as { google: unknown }).google = {
      accounts: {
        id: { initialize, renderButton, prompt, cancel: vi.fn() }
      }
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const onCredential = vi.fn();
    const nonceSeen: string[] = [];

    initialize.mockImplementation((cfg: Record<string, unknown>) => {
      nonceSeen.push(String(cfg.nonce));
      expect(cfg.client_id).toBe('client-xyz');
      expect(cfg.auto_select).toBe(false);
      expect(cfg).not.toHaveProperty('use_fedcm_for_prompt');
      expect(typeof cfg.callback).toBe('function');
    });

    const mounted = await mountGoogleSignInButton({
      clientId: 'client-xyz',
      container,
      onCredential
    });

    expect('unmount' in mounted).toBe(true);
    expect(initialize).toHaveBeenCalledTimes(1);
    expect(renderButton).toHaveBeenCalledTimes(1);
    expect(renderButton.mock.calls[0][0]).toBe(container);
    expect(prompt).not.toHaveBeenCalled();
    expect(nonceSeen[0]).toBeTruthy();
    expect(nonceSeen[0]).toMatch(/^[A-Za-z0-9_-]+$/);

    const callback = initialize.mock.calls[0][0].callback as (r: { credential?: string }) => void;
    callback({ credential: 'id-token-abc' });
    expect(onCredential).toHaveBeenCalledTimes(1);
    expect(onCredential).toHaveBeenCalledWith({
      idToken: 'id-token-abc',
      nonce: nonceSeen[0]
    });

    if ('unmount' in mounted) mounted.unmount();
  });

  it('initialize is idempotent under StrictMode-like remount', async () => {
    const initialize = vi.fn();
    const renderButton = vi.fn();
    (window as unknown as { google: unknown }).google = {
      accounts: {
        id: { initialize, renderButton, prompt: vi.fn(), cancel: vi.fn() }
      }
    };

    const a = document.createElement('div');
    const b = document.createElement('div');
    const onA = vi.fn();
    const onB = vi.fn();

    const m1 = await mountGoogleSignInButton({
      clientId: 'same-client',
      container: a,
      onCredential: onA
    });
    if ('unmount' in m1) m1.unmount();

    const m2 = await mountGoogleSignInButton({
      clientId: 'same-client',
      container: b,
      onCredential: onB
    });

    expect(initialize).toHaveBeenCalledTimes(1);
    expect(renderButton).toHaveBeenCalledTimes(2);
    expect('nonce' in m1 && 'nonce' in m2 && m1.nonce === m2.nonce).toBe(true);

    const callback = initialize.mock.calls[0][0].callback as (r: { credential?: string }) => void;
    callback({ credential: 'tok' });
    expect(onA).not.toHaveBeenCalled();
    expect(onB).toHaveBeenCalledTimes(1);
    expect(onB.mock.calls[0][0].nonce).toBe(('nonce' in m2 && m2.nonce) || '');

    if ('unmount' in m2) m2.unmount();
  });

  it('returns unavailable when GIS script/API missing', async () => {
    const container = document.createElement('div');
    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      const el = node as HTMLScriptElement;
      queueMicrotask(() => {
        el.onerror?.(new Event('error') as unknown as Event);
      });
      return node;
    });

    const result = await mountGoogleSignInButton({
      clientId: 'client-xyz',
      container,
      onCredential: () => undefined
    });
    expect('ok' in result && result.ok === false).toBe(true);
    if ('ok' in result && result.ok === false) {
      expect(result.reason).toBe('unavailable');
    }
  });

  it('fresh nonce after invalidate', async () => {
    const initialize = vi.fn();
    (window as unknown as { google: unknown }).google = {
      accounts: {
        id: {
          initialize,
          renderButton: vi.fn(),
          prompt: vi.fn(),
          cancel: vi.fn()
        }
      }
    };
    const a = document.createElement('div');
    const b = document.createElement('div');
    const m1 = await mountGoogleSignInButton({
      clientId: 'c',
      container: a,
      onCredential: () => undefined
    });
    invalidateGoogleSignInSession();
    const m2 = await mountGoogleSignInButton({
      clientId: 'c',
      container: b,
      onCredential: () => undefined
    });
    expect(initialize).toHaveBeenCalledTimes(2);
    expect('nonce' in m1 && 'nonce' in m2).toBe(true);
    if ('nonce' in m1 && 'nonce' in m2) {
      expect(m1.nonce).not.toBe(m2.nonce);
      expect(m1.nonce).not.toBe(createGoogleSignInNonce());
    }
  });
});
