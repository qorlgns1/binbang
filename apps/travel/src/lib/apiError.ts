import { ApiError } from '@workspace/shared/errors';
import type { ErrorResponseBody } from '@workspace/shared/errors';

export { ApiError } from '@workspace/shared/errors';

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: '로그인이 필요합니다',
  FORBIDDEN: '접근 권한이 없습니다',
  NOT_FOUND: '요청한 정보를 찾을 수 없습니다',
  CONFLICT: '이미 처리된 요청입니다',
  QUOTA_EXCEEDED: '사용 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',
  RATE_LIMITED: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',
  VALIDATION_ERROR: '입력값을 확인해 주세요.',
  BAD_REQUEST: '요청 형식이 올바르지 않습니다.',
  INTERNAL_SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  SERVICE_UNAVAILABLE: '서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해 주세요.',
};

const DEFAULT_ERROR_MESSAGE = '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.';

export function getUserMessage(error: Error): string {
  if (error instanceof ApiError) {
    return ERROR_MESSAGES[error.code] ?? DEFAULT_ERROR_MESSAGE;
  }
  return DEFAULT_ERROR_MESSAGE;
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
