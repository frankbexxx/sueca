import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Jest API compatibility for existing suites.
 * Prefer vi.* in new tests; keep jest.* working where already used.
 */
const jestCompat = Object.assign(vi, {
  dontMock: () => undefined,
  doUnmock: vi.doUnmock.bind(vi),
  doMock: vi.doMock.bind(vi),
  requireActual: (id: string) => {
    throw new Error(
      `jest.requireActual('${id}') is not supported under Vitest — use vi.importActual`
    );
  },
  requireMock: (id: string) => {
    throw new Error(
      `jest.requireMock('${id}') is not supported under Vitest — import the mocked binding`
    );
  }
});

(globalThis as unknown as { jest: typeof jestCompat }).jest = jestCompat;

afterEach(() => {
  cleanup();
});
