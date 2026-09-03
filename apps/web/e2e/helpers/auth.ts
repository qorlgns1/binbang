import type { APIResponse, Page } from '@playwright/test';

const E2E_EMAIL_PREFIX = 'e2e.';
const E2E_EMAIL_SUFFIX = '@example.com';

/**
 * E2E 인증 시나리오에서 재사용하는 테스트 계정 정보 구조.
 *
 * 인증이 이메일 OTP로 바뀌면서 비밀번호는 더 이상 쓰지 않는다.
 *
 * - `name`: 표시용 이름(계정 생성에는 쓰이지 않는다)
 * - `email`: 테스트 전용 이메일(`e2e.*@example.com`) 형식
 */
export interface Credentials {
  name: string;
  email: string;
}

/**
 * 충돌 없이 재실행 가능한 E2E 계정 정보를 생성한다.
 *
 * 설계 의도:
 * - 테스트를 여러 번 실행해도 계정 충돌을 피한다.
 * - cleanup API가 안전하게 삭제할 수 있도록 이메일 prefix/suffix를 고정한다.
 *
 * @returns 테스트에 즉시 사용할 고유 계정 정보
 */
export function buildUniqueCredentials(): Credentials {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    name: `E2E User ${suffix}`,
    email: `${E2E_EMAIL_PREFIX}${suffix}${E2E_EMAIL_SUFFIX}`,
  };
}

async function assertApiOk(response: APIResponse, context: string): Promise<void> {
  if (response.ok()) return;
  const body = await response.text().catch(() => '');
  throw new Error(`${context} failed: status=${response.status()} body=${body}`);
}

/**
 * test-only 엔드포인트로 인증코드를 발급받는다.
 *
 * 실제 발송 경로(`/api/auth/email-code`)는 코드를 응답에 담지 않으므로
 * E2E에서는 이 경로로 코드를 받아온다. 검증(`/api/auth/email-verify`)은
 * 실제 엔드포인트를 그대로 사용한다.
 *
 * @param page Playwright page 인스턴스
 * @param email 코드를 받을 E2E 이메일
 * @returns 6자리 인증코드
 */
export async function requestOtpCode(page: Page, email: string): Promise<string> {
  const response = await page.request.post('/api/test/e2e/otp', { data: { email } });
  await assertApiOk(response, 'requestOtpCode');

  const body = (await response.json()) as { code?: string };
  if (!body.code) {
    throw new Error('requestOtpCode failed: response did not include a code');
  }

  return body.code;
}

/**
 * 실제 로그인 UI를 통해 OTP 로그인을 완료하고 대시보드 진입까지 수행한다.
 *
 * 흐름:
 * 1) `/ko/login` 진입
 * 2) 이메일 입력 → 코드 요청
 * 3) test-only 엔드포인트로 받은 코드 입력 → 확인
 * 4) 성공 기준: `/dashboard` 도달
 *
 * 계정이 없으면 코드 검증 시점에 자동으로 생성된다(회원가입 단계 없음).
 *
 * @param page Playwright page 인스턴스
 * @param credentials 로그인에 사용할 계정 정보
 */
export async function loginThroughOtpUi(page: Page, credentials: Credentials): Promise<void> {
  await page.goto('/ko/login');

  await page.getByTestId('login-email-input').fill(credentials.email);

  await page.getByTestId('login-send-code-button').click();
  await page.getByTestId('login-code-input').waitFor();

  // 화면의 요청 이후에 코드를 재발급받는다.
  // 이메일당 유효 코드는 1개라, 나중에 발급한 코드가 유효한 코드다.
  const code = await requestOtpCode(page, credentials.email);

  await page.getByTestId('login-code-input').fill(code);
  await page.getByTestId('login-verify-button').click();

  await page.waitForURL('**/dashboard');
}

/**
 * OTP 로그인 후 초기 튜토리얼 정리까지 한 번에 수행한다.
 *
 * 목적:
 * - 개별 스펙마다 반복되는 온보딩 시퀀스를 공통화해 유지보수 포인트를 단일화한다.
 *
 * @param page Playwright page 인스턴스
 * @param credentials 로그인에 사용할 계정 정보
 */
export async function loginAndDismissTutorial(page: Page, credentials: Credentials): Promise<void> {
  await loginThroughOtpUi(page, credentials);
  await dismissTutorialIfVisible(page);
}

/**
 * 첫 로그인 시 노출될 수 있는 튜토리얼 다이얼로그를 조건부로 닫는다.
 *
 * 동작 이유:
 * - 튜토리얼은 계정 상태에 따라 나타나거나 나타나지 않는다.
 * - 테스트 플로우를 안정화하기 위해 "있으면 닫고, 없으면 계속 진행" 방식으로 처리한다.
 *
 * @param page Playwright page 인스턴스
 */
export async function dismissTutorialIfVisible(page: Page): Promise<void> {
  const skipButton = page.getByRole('button', { name: /건너뛰기|skip/i }).first();
  const isVisible = await skipButton.isVisible().catch(() => false);

  if (!isVisible) {
    return;
  }

  await skipButton.click().catch(() => undefined);
}

// ============================================================================
// API 기반 헬퍼 (브라우저 UI 없이 세션 수립 — 폴링/알림 로직 테스트 전용)
// ============================================================================

/**
 * API 호출만으로 계정 생성 + 로그인 세션을 수립한다.
 *
 * UI 대비 차이:
 * - 브라우저 렌더링 없이 test-only 코드 발급 + `POST /api/auth/email-verify` 호출
 * - `email-verify`가 세션 쿠키를 응답에 포함시키므로 이후 `page.request`와 `page.goto`에서 인증 유지
 * - 계정은 코드 검증 시점에 자동 생성된다(별도 회원가입 호출 없음)
 *
 * 사용 대상:
 * - 폴링/알림 로직을 검증하는 스펙 (vacancyAlert, dispatchPipeline, consentRequired)
 * - 로그인 UI 자체를 검증하는 스펙에는 `loginThroughOtpUi`를 유지
 */
export async function loginViaApi(page: Page, credentials: Credentials): Promise<void> {
  const code = await requestOtpCode(page, credentials.email);

  const verifyResp = await page.request.post('/api/auth/email-verify', {
    data: { email: credentials.email, code },
  });
  await assertApiOk(verifyResp, 'loginViaApi');
}

// ============================================================================

/**
 * 현재 로그인된 E2E 계정을 test-only API로 정리한다.
 *
 * 정책:
 * - cleanup endpoint는 개발/로컬에서만 열려 있으며, e2e 이메일 패턴 계정만 삭제한다.
 * - `401`/`404`는 테스트 종료 시점에서 허용 가능한 상태(이미 로그아웃/미존재)로 간주한다.
 * - 그 외 실패는 테스트를 깨지 않도록 warning으로만 남긴다.
 *
 * @param page Playwright page 인스턴스
 */
export async function cleanupSignedInE2eUser(page: Page): Promise<void> {
  const response = await page.request.delete('/api/test/e2e/cleanup-self');

  if (response.status() === 401 || response.status() === 404) {
    return;
  }

  if (!response.ok()) {
    const body = await response.text().catch(() => '');
    console.warn(`[e2e cleanup] failed: ${response.status()} ${body}`);
  }
}
