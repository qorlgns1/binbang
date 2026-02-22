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
