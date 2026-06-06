export class DebugReportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DebugReportError';
  }
}
