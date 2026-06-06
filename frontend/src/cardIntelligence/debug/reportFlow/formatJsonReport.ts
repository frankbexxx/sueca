import { DebugReportDocument } from './types';

export function formatJsonReport(doc: DebugReportDocument): string {
  return JSON.stringify(doc, null, 2);
}
