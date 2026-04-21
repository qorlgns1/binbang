import type { APIResponse, Page } from '@playwright/test';

const DEFAULT_PASSWORD = 'E2E-Password-1234!';
const E2E_EMAIL_PREFIX = 'e2e.';
const E2E_EMAIL_SUFFIX = '@example.com';

/**
 * E2E 인증 시나리오에서 재사용하는 테스트 계정 정보 구조.
 *
 * - `name`: 회원가입 UI에 입력할 사용자 이름
 * - `email`: 테스트 전용 이메일(`e2e.*@example.com`) 형식
 * - `password`: 로그인/회원가입에서 공통으로 사용하는 비밀번호
 */
export interface Credentials {
  name: string;
  email: string;
  password: string;
}

/**
 * 충돌 없이 재실행 가능한 E2E 계정 정보를 생성한다.
 *
 * 설계 의도:
 * - 테스트를 여러 번 실행해도 "이미 사용 중인 이메일" 충돌을 피한다.
 * - cleanup API가 안전하게 삭제할 수 있도록 이메일 prefix/suffix를 고정한다.
 *
 * @returns 테스트에 즉시 사용할 고유 계정 정보
 */
export function buildUniqueCredentials(): Credentials {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    name: `E2E User ${suffix}`,
    email: `${E2E_EMAIL_PREFIX}${suffix}${E2E_EMAIL_SUFFIX}`,
    password: DEFAULT_PASSWORD,
  };
}

/**
 * 실제 회원가입 UI를 통해 새 테스트 계정을 생성한다.
 *
 * 흐름:
 * 1) `/ko/signup` 진입
 * 2) 이름/이메일/비밀번호 입력
 * 3) 제출 버튼 클릭
 * 4) 성공 기준: locale과 무관하게 `/login`으로 리다이렉트
 *
 * @param page Playwright page 인스턴스
 * @param credentials 회원가입에 사용할 계정 정보
 */
export async function signUpThroughUi(page: Page, credentials: Credentials): Promise<void> {
  await page.goto('/ko/signup');

  await page.getByTestId('signup-name-input').fill(credentials.name);
  await page.getByTestId('signup-email-input').fill(credentials.email);
  await page.getByTestId('signup-password-input').fill(credentials.password);
  await page.getByTestId('signup-password-confirm-input').fill(credentials.password);
  await page.getByTestId('signup-submit-button').click();

  await page.waitForURL('**/login');
}

/**
 * 실제 로그인 UI를 통해 세션을 생성하고 대시보드 진입까지 완료한다.
 *
 * 성공 기준:
 * - 로그인 제출 후 `/dashboard` URL 도달
 *
 * @param page Playwright page 인스턴스
 * @param credentials 로그인에 사용할 계정 정보
 */
export async function loginThroughUi(page: Page, credentials: Credentials): Promise<void> {
  await page.getByTestId('login-email-input').fill(credentials.email);
  await page.getByTestId('login-password-input').fill(credentials.password);
  await page.getByTestId('login-submit-button').click();

  await page.waitForURL('**/dashboard');
}

/**
 * 회원가입 이후 로그인과 초기 튜토리얼 정리까지 한 번에 수행한다.
 *
 * 목적:
 * - 개별 스펙마다 반복되는 온보딩 시퀀스를 공통화해 유지보수 포인트를 단일화한다.
 * - 인증 플로우 자체의 단계(가입/로그인/튜토리얼 닫기)를 재사용 가능한 유스케이스로 묶는다.
 *
 * 내부 순서:
 * 1) `signUpThroughUi`
 * 2) `loginThroughUi`
 * 3) `dismissTutorialIfVisible`
 *
 * @param page Playwright page 인스턴스
 * @param credentials 회원가입/로그인에 사용할 동일 계정 정보
 */
export async function signUpAndLoginThroughUi(page: Page, credentials: Credentials): Promise<void> {
  await signUpThroughUi(page, credentials);
  await loginThroughUi(page, credentials);
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

async function assertApiOk(response: APIResponse, context: string): Promise<void> {
  if (response.ok()) return;
  const body = await response.text().catch(() => '');
  throw new Error(`${context} failed: status=${response.status()} body=${body}`);
}

/**
 * API 호출로 회원가입 + 로그인 세션을 수립한다.
 *
 * UI 대비 차이:
 * - 브라우저 렌더링 없이 `POST /api/auth/signup` + `POST /api/auth/credentials-login` 직접 호출
 * - `credentials-login`이 세션 쿠키를 응답에 포함시키므로 이후 `page.request`와 `page.goto`에서 인증 유지
 *
 * 사용 대상:
 * - 폴링/알림 로직을 검증하는 스펙 (vacancyAlert, dispatchPipeline)
 * - signup/login UI 자체를 검증하는 스펙(signupLoginAccommodation, consentRequired)에는 UI 헬퍼를 유지
 */
export async function signUpAndLoginViaApi(page: Page, credentials: Credentials): Promise<void> {
  const signupResp = await page.request.post('/api/auth/signup', {
    data: { email: credentials.email, password: credentials.password, name: credentials.name },
  });
  await assertApiOk(signupResp, 'signUpViaApi');

  const loginResp = await page.request.post('/api/auth/credentials-login', {
    data: { email: credentials.email, password: credentials.password },
  });
  await assertApiOk(loginResp, 'loginViaApi');
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
