/**
 * API 에러 응답 본문 형식.
 *
 * 서버의 `handleServiceError`가 반환하는 JSON 구조와 일치합니다.
 * 양쪽 앱(web / travel)에서 공유되는 단일 소스입니다.
 */
export interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * HTTP API 응답에서 파싱된 클라이언트 사이드 에러.
 *
 * 서버가 `ErrorResponseBody` 형태로 내려주는 에러를 클라이언트에서
 * 타입화된 객체로 다루기 위한 클래스입니다.
 * `AppError`의 클라이언트 사이드 대칭 쌍.
 */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
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
