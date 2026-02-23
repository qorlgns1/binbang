import { NextResponse } from 'next/server';

import { AppError, ValidationError } from '@workspace/shared/errors';
import type { ErrorResponseBody } from '@workspace/shared/errors';

export type { ErrorResponseBody };

/**
 * Maps a service-layer error to a typed `NextResponse`.
 *
 * - `AppError` subclasses → their `statusCode` / `code`.
 * - `ValidationError` → includes `.details` in the body.
 * - Unknown errors → 500 with a generic message (the real error is logged).
 */
export function handleServiceError(error: unknown, logPrefix?: string): NextResponse<ErrorResponseBody> {
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

    return NextResponse.json(body, { status: error.statusCode });
  }

  const prefix = logPrefix ?? 'Unhandled service error';
  console.error(`${prefix}:`, error);

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
    },
    { status: 500 },
  );
}

export function unauthorizedResponse(message = 'Unauthorized'): NextResponse<ErrorResponseBody> {
  return NextResponse.json({ error: { code: 'UNAUTHORIZED', message } }, { status: 401 });
}

export function badRequestResponse(message: string, details?: unknown): NextResponse<ErrorResponseBody> {
  const body: ErrorResponseBody = { error: { code: 'BAD_REQUEST', message } };
  if (details !== undefined) body.error.details = details;
  return NextResponse.json(body, { status: 400 });
}

export function validationErrorResponse(details: unknown): NextResponse<ErrorResponseBody> {
  return NextResponse.json(
    { error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details } },
    { status: 400 },
  );
}

export function forbiddenResponse(message = 'Forbidden'): NextResponse<ErrorResponseBody> {
  return NextResponse.json({ error: { code: 'FORBIDDEN', message } }, { status: 403 });
}

export function notFoundResponse(message = 'Not found'): NextResponse<ErrorResponseBody> {
  return NextResponse.json({ error: { code: 'NOT_FOUND', message } }, { status: 404 });
}

export function serviceUnavailableResponse(
  message = 'Service unavailable',
  details?: unknown,
): NextResponse<ErrorResponseBody> {
  const body: ErrorResponseBody = { error: { code: 'SERVICE_UNAVAILABLE', message } };
  if (details !== undefined) body.error.details = details;
  return NextResponse.json(body, { status: 503 });
}
