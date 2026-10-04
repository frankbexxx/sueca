import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSignInAnonymously = vi.fn();
const mockGetAuth = vi.fn();
const mockGetFirebaseApp = vi.fn(() => ({ name: '[DEFAULT]' }));

vi.mock('firebase/auth', () => ({
  getAuth: (...args: unknown[]) => mockGetAuth(...args),
  signInAnonymously: (...args: unknown[]) => mockSignInAnonymously(...args)
}));

vi.mock('./firebaseConfig', () => ({
  getFirebaseApp: () => mockGetFirebaseApp()
}));

describe('firebaseAuth', () => {
  beforeEach(() => {
    vi.resetModules();
    mockSignInAnonymously.mockReset();
    mockGetAuth.mockReset();
    mockGetFirebaseApp.mockClear();
    mockGetFirebaseApp.mockReturnValue({ name: '[DEFAULT]' });
  });

  async function load() {
    return import('./firebaseAuth');
  }

  it('reuses existing anonymous/current Firebase user', async () => {
    const existing = { uid: 'uid-existing' };
    mockGetAuth.mockReturnValue({ currentUser: existing });
    const { ensureAnonymousAuth, resetFirebaseAuthForTests } = await load();
    resetFirebaseAuthForTests();

    const user = await ensureAnonymousAuth();
    expect(user).toBe(existing);
    expect(mockSignInAnonymously).not.toHaveBeenCalled();
  });

  it('calls signInAnonymously when no current user', async () => {
    const auth = { currentUser: null as null | { uid: string } };
    mockGetAuth.mockReturnValue(auth);
    const signedIn = { uid: 'uid-new' };
    mockSignInAnonymously.mockResolvedValueOnce({ user: signedIn });
    const { ensureAnonymousAuth, resetFirebaseAuthForTests } = await load();
    resetFirebaseAuthForTests();

    const user = await ensureAnonymousAuth();
    expect(mockSignInAnonymously).toHaveBeenCalledTimes(1);
    expect(mockSignInAnonymously).toHaveBeenCalledWith(auth);
    expect(user.uid).toBe('uid-new');
  });

  it('propagates auth failure when sign-in returns no user', async () => {
    mockGetAuth.mockReturnValue({ currentUser: null });
    mockSignInAnonymously.mockResolvedValueOnce({ user: null });
    const { ensureAnonymousAuth, resetFirebaseAuthForTests } = await load();
    resetFirebaseAuthForTests();

    await expect(ensureAnonymousAuth()).rejects.toThrow(/Anonymous authentication failed/);
  });

  it('propagates signInAnonymously rejection', async () => {
    mockGetAuth.mockReturnValue({ currentUser: null });
    mockSignInAnonymously.mockRejectedValueOnce(new Error('network down'));
    const { ensureAnonymousAuth, resetFirebaseAuthForTests } = await load();
    resetFirebaseAuthForTests();

    await expect(ensureAnonymousAuth()).rejects.toThrow(/network down/);
  });

  it('does not import product account auth modules', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'firebaseAuth.ts'),
      'utf8'
    );
    const imports = source
      .split('\n')
      .filter((line) => /^\s*import\s/.test(line))
      .join('\n');
    expect(imports).not.toMatch(
      /authState|accountAuthApi|getAuthState|localGuestIdentity|syncFirstLink/
    );
    expect(imports).toMatch(/firebase\/auth/);
    expect(imports).toMatch(/firebaseConfig/);
  });
});
