export { DebugReportError } from './errors';
export {
  buildScenarioDebugReport,
  ciScenarioReport,
} from './buildScenarioReport';
export { buildEventDebugReport, ciEventReport } from './buildEventReport';
export {
  buildGameDebugReport,
  buildGameDebugReportFromData,
  buildGameReportDocumentFromData,
  ciGameReport,
} from './buildGameReport';
export { exportDebugReport, ciExportReport } from './exportReport';
export { formatHumanReport } from './formatHumanReport';
export { formatJsonReport } from './formatJsonReport';
export {
  buildDebugReportDocument,
  resolveReportOutput,
} from './documentHelpers';
export { classifyWarnings, formatWarningLine } from './warningTaxonomy';
export type {
  DebugReportDocument,
  ReportExportOptions,
  ReportFlowOptions,
  ExportReportResult,
} from './types';
export { DEBUG_REPORT_SCHEMA_VERSION } from './types';
