import { ApiError } from '@workspace/shared/errors';
import type { ErrorResponseBody } from '@workspace/shared/errors';
import type { ZodIssue } from 'zod';

export { ApiError } from '@workspace/shared/errors';

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: '로그인이 필요합니다',
  FORBIDDEN: '접근 권한이 없습니다',
  NOT_FOUND: '요청한 항목을 찾을 수 없습니다',
  CONFLICT: '이미 존재하는 항목입니다',
  QUOTA_EXCEEDED: '플랜 한도에 도달했습니다',
  RATE_LIMITED: '잠시 후 다시 시도해 주세요',
  VALIDATION_ERROR: '입력값을 확인해 주세요',
  BAD_REQUEST: '잘못된 요청입니다',
  INTERNAL_SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요',
};

export function getUserMessage(error: Error): string {
  if (error instanceof ApiError) {
    return ERROR_MESSAGES[error.code] ?? '오류가 발생했습니다';
  }
  return '오류가 발생했습니다';
}

function isZodIssueLike(value: unknown): value is ZodIssue {
  if (typeof value !== 'object' || value === null) return false;

  const issue = value as { path?: unknown; message?: unknown };
  return Array.isArray(issue.path) && typeof issue.message === 'string';
}

export function getValidationDetails(error: Error): ZodIssue[] | null {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_ERROR') {
    return null;
  }

  if (!Array.isArray(error.details)) {
    return null;
  }

  const issues = error.details.filter(isZodIssueLike);
  return issues.length > 0 ? issues : null;
}

export function getValidationFieldErrors(error: Error): Record<string, string> | null {
  const issues = getValidationDetails(error);
  if (!issues) {
    return null;
  }

  const fieldErrors: Record<string, string> = {};

  for (const issue of issues) {
    const [firstPath] = issue.path;
    const key = typeof firstPath === 'string' ? firstPath : '_form';

    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

/**
 * `!res.ok` 응답을 `ApiError`로 파싱합니다.
 *
 * 서버가 `ErrorResponseBody` 형태로 내려주는 경우 code / message / details를 추출하고,
 * 파싱 실패 시 fallbackMessage를 사용합니다.
 */
export async function parseApiError(res: Response, fallbackMessage: string): Promise<ApiError> {
  try {
    const body = (await res.json()) as Partial<ErrorResponseBody>;
    const code = body?.error?.code ?? 'UNKNOWN';
    const message = body?.error?.message ?? fallbackMessage;
    const details = body?.error?.details;
    return new ApiError(code, message, details, res.status);
  } catch {
    return new ApiError('UNKNOWN', fallbackMessage, undefined, res.status);
  }
}
