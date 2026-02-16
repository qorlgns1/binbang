import { NextResponse } from 'next/server';

import { AppError, type ValidationError } from '@workspace/shared/errors';

/** API 에러 응답 본문 형식. `handleServiceError`가 반환하는 JSON 구조와 일치합니다. */
export interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

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

    if ('details' in error && Array.isArray((error as ValidationError).details)) {
      body.error.details = (error as ValidationError).details;
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
