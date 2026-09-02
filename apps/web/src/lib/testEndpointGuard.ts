/**
 * test-only 라우트의 활성화 여부.
 *
 * `NODE_ENV !== 'production'` 만으로 막으면 부족하다. 배포된 development 환경이
 * 정확히 그 조건으로 뜨고 포트가 공개되어 있어, 인증 없는 테스트 엔드포인트가
 * 인터넷에 열린 채로 동작한다.
 *
 * 그래서 명시적 opt-in 을 요구한다. 기본값은 비활성이며, 로컬 e2e 는
 * playwright 설정이 이 플래그를 켜서 실행한다.
 *
 * production 에서는 플래그와 무관하게 항상 비활성이다.
 */
export const E2E_ENDPOINTS_ENV_KEY = 'BINBANG_ENABLE_E2E_ENDPOINTS';

export function areTestEndpointsEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env[E2E_ENDPOINTS_ENV_KEY]?.trim() === 'true';
}
