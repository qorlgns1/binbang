import { ApiError } from '@workspace/shared/errors';
import type { ErrorResponseBody } from '@workspace/shared/errors';

export { ApiError } from '@workspace/shared/errors';

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
