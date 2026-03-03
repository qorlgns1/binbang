import { AppError, ValidationError } from '@workspace/shared/errors';
import type { ErrorResponseBody } from '@workspace/shared/errors';

import { jsonResponse } from '@/lib/httpResponse';

/**
 * 클라이언트에 반환할 코드별 안전한 메시지.
 *
 * `AppError.message`는 내부 디버깅용이므로 클라이언트에 그대로 노출하지 않는다.
 * 실제 메시지는 서버 로그에만 남긴다.
 */
const SAFE_CLIENT_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not found',
  CONFLICT: 'Conflict',
  VALIDATION_ERROR: 'Validation failed',
  BAD_REQUEST: 'Bad request',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  QUOTA_EXCEEDED: 'Quota exceeded',
  RATE_LIMITED: 'Too many requests',
  SERVICE_UNAVAILABLE: 'Service unavailable',
};

function errorJsonResponse(body: ErrorResponseBody, status: number): Response {
  return jsonResponse(body, { status });
}

/**
 * Maps a service-layer error to a typed Response.
 *
 * - `AppError` subclasses → their `statusCode` / `code`. Actual message is logged server-side only.
 * - `ValidationError` → includes `.details` in the body.
 * - Unknown errors → 500 with a generic message (the real error is logged).
 */
export function handleServiceError(error: unknown, logPrefix?: string): Response {
  if (error instanceof AppError) {
    const prefix = logPrefix ?? 'AppError';
    console.error(`${prefix} [${error.code}]:`, error.message);

    const body: ErrorResponseBody = {
      error: {
        code: error.code,
        message: SAFE_CLIENT_MESSAGES[error.code] ?? 'An error occurred',
      },
    };

    if (error instanceof ValidationError) {
      body.error.details = error.details;
    }

    return errorJsonResponse(body, error.statusCode);
  }

  const prefix = logPrefix ?? 'Unhandled service error';
  console.error(`${prefix}:`, error);

  return errorJsonResponse(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
    },
    500,
  );
}

export function unauthorizedResponse(message = 'Unauthorized'): Response {
  return errorJsonResponse({ error: { code: 'UNAUTHORIZED', message } }, 401);
}

export function forbiddenResponse(message = 'Forbidden'): Response {
  return errorJsonResponse({ error: { code: 'FORBIDDEN', message } }, 403);
}

export function badRequestResponse(message: string, details?: unknown): Response {
  const body: ErrorResponseBody = { error: { code: 'BAD_REQUEST', message } };
  if (details !== undefined) body.error.details = details;
  return errorJsonResponse(body, 400);
}

export function validationErrorResponse(details: unknown): Response {
  return errorJsonResponse({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details } }, 400);
}

export function notFoundResponse(message = 'Not found'): Response {
  return errorJsonResponse({ error: { code: 'NOT_FOUND', message } }, 404);
}
