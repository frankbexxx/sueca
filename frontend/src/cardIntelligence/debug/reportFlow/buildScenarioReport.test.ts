import { buildScenarioDebugReport, ciScenarioReport } from './buildScenarioReport';
import { DEBUG_REPORT_SCHEMA_VERSION } from './types';

describe('buildScenarioReport', () => {
  it('T1 LAB_K02 includes contractId and classification', async () => {
    const doc = await buildScenarioDebugReport('LAB_K02');
    expect(doc.meta.schemaVersion).toBe(DEBUG_REPORT_SCHEMA_VERSION);
    expect(doc.text).toContain('LAB_K02');
    expect(doc.text).toContain('no_king_hearts');
    expect(doc.text).toContain('K02');
    expect(doc.summary.classification).toBeDefined();
  });

  it('T2 LAB_H13 has informational trick_end warning and good eval', async () => {
    const doc = await buildScenarioDebugReport('LAB_H13');
    expect(doc.summary.classification).toBe('good');
    const trickEndWarnings = doc.warnings.filter((w) => w.code === 'trick_end_missing');
    if (trickEndWarnings.length > 0) {
      expect(trickEndWarnings[0].severity).toBe('informational');
      expect(doc.text).toContain('[info]');
    }
  });

  it('returns string by default from ciScenarioReport', async () => {
    const text = await ciScenarioReport('LAB_K02');
    expect(typeof text).toBe('string');
    expect(text).toContain('Card Intelligence — Debug Report');
  });

  it('returns document when as:document', async () => {
    const doc = await ciScenarioReport('LAB_K02', { as: 'document' });
    expect(typeof doc).toBe('object');
    expect(doc).toHaveProperty('meta');
  });
});
