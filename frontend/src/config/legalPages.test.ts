/**
 * @vitest-environment node
 * REL-LEGAL-01D2 — legal page paths and published HTML content contract
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { legalPageHref } from './legalPages';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('legalPages', () => {
  it('builds relative hrefs under ./legal/', () => {
    expect(legalPageHref('privacy')).toMatch(/legal\/privacy\.html$/);
    expect(legalPageHref('terms')).toMatch(/legal\/terms\.html$/);
  });
});

describe('published legal HTML (Play v1)', () => {
  const privacy = fs.readFileSync(
    path.join(frontendRoot, 'public/legal/privacy.html'),
    'utf8'
  );
  const terms = fs.readFileSync(path.join(frontendRoot, 'public/legal/terms.html'), 'utf8');

  it('privacy states local-first / no Suecão server personal data / contact', () => {
    expect(privacy).toMatch(/28 September 2026/);
    expect(privacy).toMatch(/Francisco Bexiga/);
    expect(privacy).toMatch(/frankbex\.dev@gmail\.com/);
    expect(privacy).toMatch(/not specifically directed to children/i);
    expect(privacy).toMatch(/not.*collected onto Suecão-operated servers/i);
    expect(privacy).not.toMatch(/AdMob|Delete guest account|Replace with your support/i);
    expect(privacy).toMatch(/href="\.\/terms\.html"/);
  });

  it('terms separates app use from source licence / Portugal+EU', () => {
    expect(terms).toMatch(/28 September 2026/);
    expect(terms).toMatch(/Francisco Bexiga/);
    expect(terms).toMatch(/not.*the source-code licence/i);
    expect(terms).toMatch(/Portugal/);
    expect(terms).toMatch(/European Union/i);
    expect(terms).toMatch(/no.*real-money gambling/i);
    expect(terms).not.toMatch(/Replace with full legal text/i);
    expect(terms).toMatch(/href="\.\/privacy\.html"/);
  });
});
