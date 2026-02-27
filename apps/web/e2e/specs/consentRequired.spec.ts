import { expect, test } from '@playwright/test';

import { buildUniqueCredentials, signUpAndLoginViaApi } from '../helpers/auth';
import { fillAlertFormRequiredFields } from '../helpers/accommodation';
import { applySniperCoreSuiteGuards } from '../helpers/suite';

/**
 * Sprint 2 정책 검증:
 * - 알림 등록 시 수신동의(consentOptIn)는 필수다.
 * - 사용자가 동의를 체크하지 않으면 서버 생성 API(POST /api/accommodations)가 호출되면 안 된다.
 *
 * 이 스펙은 mock 없이 실제 연결된 DB 검색(/api/hotels/search)을 사용한다.
 * local/development 환경에서 agoda_hotels 테이블에 실제 데이터가 존재해야 한다.
 */

test.describe('sniper core consent requirement e2e', () => {
  applySniperCoreSuiteGuards();

  /**
   * 정책 검증 시나리오:
   * - 수신동의 미체크 상태에서 제출하면
   *   1) UI 에러가 보여야 하고
   *   2) 생성 API POST 자체가 발생하지 않아야 한다.
   */
  test('수신동의 미체크 시 등록이 차단되고 생성 API가 호출되지 않는다', async ({ page }) => {
    const credentials = buildUniqueCredentials();
    let createAlertRequestCount = 0;

    // 브라우저 요청 이벤트를 가로채 POST /api/accommodations 호출 횟수를 수집한다.
    // "클라이언트 단 유효성 검증으로 차단"되면 이 값은 끝까지 0이어야 한다.
    page.on('request', (request) => {
      const path = new URL(request.url()).pathname;
      if (request.method() === 'POST' && path === '/api/accommodations') {
        createAlertRequestCount += 1;
      }
    });

    await test.step('회원가입/로그인', async () => {
      await signUpAndLoginViaApi(page, credentials);
    });

    await test.step('호텔/날짜 입력 후 동의 없이 제출', async () => {
      await fillAlertFormRequiredFields(page);
      await page.getByTestId('create-alert-submit-button').click();
    });

    await test.step('동의 에러 노출 + 생성 API 미호출 검증', async () => {
      await expect(page.getByText('알림 수신 동의가 필요합니다')).toBeVisible();
      await expect(page).toHaveURL(/\/accommodations\/new$/);
      // 서버 응답을 기다리는 방식이 아니라, 에러 UI 노출 시점에서 즉시 호출 카운트를 확인한다.
      expect(createAlertRequestCount).toBe(0);
    });
  });
});
