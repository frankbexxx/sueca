export type ProviderErrorCode =
  | 'network'
  | 'timeout'
  | 'parse'
  | 'http'
  | 'aborted'
  | 'config';

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly statusCode?: number;

  constructor(code: ProviderErrorCode, message: string, statusCode?: number) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.statusCode = statusCode;
  }
}
