import { NextResponse } from 'next/server';

import { AppError, ValidationError } from '@workspace/shared/errors';
import type { ErrorResponseBody } from '@workspace/shared/errors';

import { logError } from './logger';

export type { ErrorResponseBody };

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

/**
 * Maps a service-layer error to a typed `NextResponse`.
 *
 * - `AppError` subclasses → their `statusCode` / `code`. Actual message is logged server-side only.
 * - `ValidationError` → includes `.details` in the body.
 * - Unknown errors → 500 with a generic message (the real error is logged).
 */
export function handleServiceError(
  error: unknown,
  logPrefix?: string,
  requestId?: string,
): NextResponse<ErrorResponseBody> {
  if (error instanceof AppError) {
    const prefix = logPrefix ?? 'AppError';
    logError('service_app_error', {
      requestId: requestId ?? null,
      prefix,
      errorCode: error.code,
      errorStatusCode: error.statusCode,
      error,
    });

    return NextResponse.json(
      createErrorBody(
        error.code,
        SAFE_CLIENT_MESSAGES[error.code] ?? 'An error occurred',
        error instanceof ValidationError ? error.details : undefined,
        requestId,
      ),
      { status: error.statusCode },
    );
  }

  const prefix = logPrefix ?? 'Unhandled service error';
  logError('service_unhandled_error', {
    requestId: requestId ?? null,
    prefix,
    error,
  });

  return NextResponse.json(createErrorBody('INTERNAL_SERVER_ERROR', 'Internal server error', undefined, requestId), {
    status: 500,
  });
}

export function unauthorizedResponse(message = 'Unauthorized', requestId?: string): NextResponse<ErrorResponseBody> {
  return NextResponse.json(createErrorBody('UNAUTHORIZED', message, undefined, requestId), { status: 401 });
}

export function badRequestResponse(
  message: string,
  details?: unknown,
  requestId?: string,
): NextResponse<ErrorResponseBody> {
  return NextResponse.json(createErrorBody('BAD_REQUEST', message, details, requestId), { status: 400 });
}

export function validationErrorResponse(details: unknown, requestId?: string): NextResponse<ErrorResponseBody> {
  return NextResponse.json(createErrorBody('VALIDATION_ERROR', 'Validation failed', details, requestId), {
    status: 400,
  });
}

export function forbiddenResponse(message = 'Forbidden', requestId?: string): NextResponse<ErrorResponseBody> {
  return NextResponse.json(createErrorBody('FORBIDDEN', message, undefined, requestId), { status: 403 });
}

export function notFoundResponse(message = 'Not found', requestId?: string): NextResponse<ErrorResponseBody> {
  return NextResponse.json(createErrorBody('NOT_FOUND', message, undefined, requestId), { status: 404 });
}

export function serviceUnavailableResponse(
  message = 'Service unavailable',
  details?: unknown,
  requestId?: string,
): NextResponse<ErrorResponseBody> {
  return NextResponse.json(createErrorBody('SERVICE_UNAVAILABLE', message, details, requestId), { status: 503 });
}

function createErrorBody(code: string, message: string, details?: unknown, requestId?: string): ErrorResponseBody {
  const body: ErrorResponseBody = {
    error: {
      code,
      message,
    },
  };

  if (details !== undefined) {
    body.error.details = details;
  }

  if (requestId) {
    body.error.requestId = requestId;
  }

  return body;
}
