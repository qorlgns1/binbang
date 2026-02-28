import { test } from '@playwright/test';

import { cleanupSignedInE2eUser } from './auth';
import { setAgodaMockScenario } from './polling';

const ALLOWED_APP_ENVS = new Set(['local', 'development']);

/**
 * APP_ENV 값이 E2E 실행 허용 범위(local/development)인지 판별한다.
 *
 * 정책:
 * - APP_ENV가 정의되지 않은 로컬 실행은 기존 동작과의 호환성을 위해 허용한다.
 * - APP_ENV가 명시된 경우 local/development만 통과시킨다.
 *
 * @param appEnv 실행 환경 문자열
 * @returns 테스트 실행 허용 여부
 */
function isAllowedSniperCoreAppEnv(appEnv: string | undefined): boolean {
  if (!appEnv) {
    return true;
  }

  return ALLOWED_APP_ENVS.has(appEnv);
}

/**
 * SniperCore E2E 스펙 공통 가드(환경 제한 + 테스트 계정 정리 훅)를 등록한다.
 *
 * 적용 효과:
 * - 운영 환경에서 실수 실행되는 것을 방지한다.
 * - 각 테스트 종료 후 test-only cleanup endpoint를 호출해 DB 오염을 줄인다.
 *
 * 사용 위치:
 * - 각 `test.describe(...)` 블록 내부에서 1회 호출한다.
 */
export function applySniperCoreSuiteGuards(): void {
  test.afterEach(async ({ page }) => {
    await cleanupSignedInE2eUser(page);
  });

  test.skip(
    !isAllowedSniperCoreAppEnv(process.env.APP_ENV),
    '이 e2e는 local/development 환경에서만 실행하도록 제한합니다.',
  );
}

/**
 * Agoda mock을 사용하는 스펙에 추가하는 가드.
 *
 * `applySniperCoreSuiteGuards()`와 함께 호출한다.
 *
 * 적용 효과:
 * - 각 테스트 시작 전 mock을 `available`로 초기화해 이전 테스트의 상태 오염을 방지한다.
 * - 테스트가 중간에 실패해 mock이 `sold_out`으로 남아도 다음 테스트에 영향을 주지 않는다.
 *
 * 사용 위치:
 * - `vacancyAlert`, `dispatchPipeline` 등 `setAgodaMockScenario`를 사용하는 스펙의
 *   `test.describe(...)` 블록 내부에서 `applySniperCoreSuiteGuards()` 다음에 호출한다.
 */
export function applyAgodaMockGuard(): void {
  test.beforeEach(async ({ page }) => {
    await setAgodaMockScenario(page, 'available');
  });
}
