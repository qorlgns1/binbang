/**
 * HTTP-aware application error base class.
 *
 * All service-layer errors should extend this class so that
 * API routes can map them to the correct HTTP status code
 * via `handleServiceError`.
 *
 * @param message - 사용자/로그용 메시지
 * @param statusCode - HTTP 상태 코드 (예: 400, 404)
 * @param code - 기계식 에러 코드 (예: VALIDATION_ERROR, NOT_FOUND)
 */
type ErrorWithCaptureStackTrace = ErrorConstructor & {
  captureStackTrace?: (targetObject: object, constructorOpt?: new (...args: never[]) => unknown) => void;
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;

    (Error as ErrorWithCaptureStackTrace).captureStackTrace?.(this, new.target);
  }
}
