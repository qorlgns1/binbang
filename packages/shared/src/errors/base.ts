/**
 * HTTP-aware application error base class.
 *
 * All service-layer errors should extend this class so that
 * API routes can map them to the correct HTTP status code
 * via `handleServiceError`.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}
