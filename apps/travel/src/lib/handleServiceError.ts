import { AppError, ValidationError } from '@workspace/shared/errors';
import type { ErrorResponseBody } from '@workspace/shared/errors';

import { jsonResponse } from '@/lib/httpResponse';

function errorJsonResponse(body: ErrorResponseBody, status: number): Response {
  return jsonResponse(body, { status });
}

/**
 * Maps a service-layer error to a typed Response.
 *
 * - `AppError` subclasses → their `statusCode` / `code`.
 * - `ValidationError` → includes `.details` in the body.
 * - Unknown errors → 500 with a generic message (the real error is logged).
 */
export function handleServiceError(error: unknown, logPrefix?: string): Response {
  if (error instanceof AppError) {
    const body: ErrorResponseBody = {
      error: {
        code: error.code,
        message: error.message,
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
