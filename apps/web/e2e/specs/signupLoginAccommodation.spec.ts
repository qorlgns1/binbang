import { expect, test } from '@playwright/test';

import { buildUniqueCredentials, signUpAndLoginThroughUi } from '../helpers/auth';
import { registerAlertThroughUi } from '../helpers/accommodation';
import { applySniperCoreSuiteGuards } from '../helpers/suite';

/**
 * Sprint 1/2 SniperCore 핵심 사용자 가치:
 * 1) 신규 사용자가 직접 가입/로그인할 수 있어야 한다.
 * 2) Agoda 호텔을 검색해서 알림을 등록할 수 있어야 한다.
 * 3) 등록 직후 대시보드에서 내 알림(숙소)이 보이는지 확인해야 한다.
 *
 * 이 스펙은 mock 없이 실제 연결된 DB 검색(/api/hotels/search)을 사용한다.
 * local/development 환경에서 agoda_hotels 테이블에 실제 데이터가 존재해야 한다.
 */

test.describe('sniper core e2e', () => {
  applySniperCoreSuiteGuards();

  /**
   * 핵심 happy-path:
   * 1) 사용자 가입/로그인
   * 2) 알림 등록
   * 3) 대시보드에 결과 반영
   *
   * 비즈니스 관점에서 "첫 사용자 가치"가 살아 있는지 확인하는 스모크 시나리오다.
   */
  test('회원가입부터 알림 등록까지 핵심 경로가 동작한다', async ({ page }) => {
    const credentials = buildUniqueCredentials();
    let selectedHotelName = '';

    await test.step('회원가입/로그인', async () => {
      await signUpAndLoginThroughUi(page, credentials);
    });

    await test.step('호텔 검색 후 알림 등록', async () => {
      selectedHotelName = await registerAlertThroughUi(page);
    });

    await test.step('대시보드에 등록 결과 반영 확인', async () => {
      if (!selectedHotelName) throw new Error('등록된 호텔명을 찾지 못했습니다.');
      // 등록 직후 목록에 방금 등록한 호텔명이 노출되는지 검증한다.
      // 이는 POST 성공 + 목록 조회 반영까지 연결되었음을 의미한다.
      await expect(
        page.getByTestId('accommodation-row-name').filter({ hasText: selectedHotelName }).first(),
      ).toBeVisible();
    });
  });
});
