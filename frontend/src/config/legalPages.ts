/**
 * REL-LEGAL-01D2 — static legal page URLs for in-app links.
 * Pages ship from frontend/public/legal/ into the Vite/Capacitor build.
 */
import { publicUrl } from '../config/runtimeEnv';

export type LegalPageId = 'privacy' | 'terms';

export function legalPageHref(page: LegalPageId): string {
  const base = publicUrl();
  const file = page === 'privacy' ? 'privacy.html' : 'terms.html';
  if (!base || base === '.') return `./legal/${file}`;
  return `${base}/legal/${file}`;
}
