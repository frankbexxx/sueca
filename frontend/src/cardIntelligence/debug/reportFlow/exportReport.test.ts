import { exportDebugReport } from './exportReport';
import { DEBUG_REPORT_SCHEMA_VERSION } from './types';

describe('exportReport', () => {
  it('T5 exports readable text for scenario', async () => {
    const result = await exportDebugReport({
      kind: 'scenario',
      scenarioId: 'LAB_K02',
      format: 'text',
    });
    expect(result.text).toBeTruthy();
    expect(result.text).toContain('Card Intelligence — Debug Report');
    expect(result.filename).toMatch(/\.txt$/);
  });

  it('T6 exports json with schema 10.0.0', async () => {
    const result = await exportDebugReport({
      kind: 'scenario',
      scenarioId: 'LAB_K02',
      format: 'json',
    });
    expect(result.json?.meta.schemaVersion).toBe(DEBUG_REPORT_SCHEMA_VERSION);
    const parsed = JSON.parse(result.text ?? '{}');
    expect(parsed.meta.schemaVersion).toBe(DEBUG_REPORT_SCHEMA_VERSION);
  });

  it('exports jsonl envelope with debug_report record type', async () => {
    const result = await exportDebugReport({
      kind: 'scenario',
      scenarioId: 'LAB_K02',
      format: 'jsonl',
    });
    expect(result.blob).toBeDefined();
    const line = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(result.blob!);
    });
    const envelope = JSON.parse(line);
    expect(envelope.exportRecordType).toBe('debug_report');
    expect(envelope.payload.meta.schemaVersion).toBe(DEBUG_REPORT_SCHEMA_VERSION);
  });
});
