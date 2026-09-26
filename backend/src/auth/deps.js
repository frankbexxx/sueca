/**
 * Mutable auth dependencies for production defaults + test injection.
 * Never put tokens here.
 */
import { createGoogleIdTokenVerifier } from './googleVerify.js';

/** @type {{ googleVerifier: null | { verify: Function } }} */
export const authDeps = {
  googleVerifier: null
};

export function getGoogleVerifier(config) {
  if (authDeps.googleVerifier) return authDeps.googleVerifier;
  return createGoogleIdTokenVerifier(config);
}

export function setGoogleVerifierForTests(verifier) {
  authDeps.googleVerifier = verifier;
}

export function clearGoogleVerifierForTests() {
  authDeps.googleVerifier = null;
}
