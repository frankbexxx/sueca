import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * UX-FESTA-01 — structural CSS contract for Festa responsive shell.
 * Geometry is validated manually at 360/390/420; this guards regressive max-height sums.
 */
describe('UX-FESTA-01 VariantModals festa shell', () => {
  const css = readFileSync(resolve(__dirname, './VariantModals.css'), 'utf8');

  it('does not use independent 62dvh spacer + 28dvh sheet caps', () => {
    expect(css).not.toMatch(/height:\s*calc\(\s*min\(\s*62dvh/);
    expect(css).not.toMatch(/\.variant-modal--festa-compact\s*\{[^}]*max-height:\s*28dvh/);
    expect(css).not.toMatch(/\.variant-modal--festa-setup\s*\{[^}]*max-height:\s*min\(30dvh,\s*250px\)/);
  });

  it('defines header / scroll body / pinned footer regions', () => {
    expect(css).toMatch(/\.king-festa-sheet__header\s*\{/);
    expect(css).toMatch(/\.king-festa-sheet__body\s*\{[\s\S]*?overflow-y:\s*auto/);
    expect(css).toMatch(/\.king-festa-sheet__body\s*\{[\s\S]*?min-height:\s*0/);
    expect(css).toMatch(/\.king-festa-sheet__footer\s*\{[\s\S]*?flex:\s*0\s+0\s+auto/);
  });

  it('keeps sheet max-height within a single viewport budget', () => {
    expect(css).toMatch(/max-height:\s*min\(\s*48dvh,\s*calc\(100dvh\s*-\s*7\.5rem\)\)/);
    expect(css).toMatch(/\.king-festa-sheet\b/);
  });

  it('allows festa choice buttons to wrap without overflow-x auto', () => {
    expect(css).toMatch(/\.king-festa-choice-grid\s*\{[\s\S]*?flex-wrap:\s*wrap/);
    expect(css).toMatch(/\.king-festa-choice-grid\s*\{[\s\S]*?overflow-x:\s*visible/);
  });
});
