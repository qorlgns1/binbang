import { expect, test } from '@playwright/test';

import { buildUniqueCredentials, signUpAndLoginThroughUi } from '../helpers/auth';
import { registerAlertThroughUi } from '../helpers/accommodation';
import { applySniperCoreSuiteGuards } from '../helpers/suite';

/**
 * Vacancy 알림 e2e:
 * 회원가입 → 알림 등록 → 폴링 2회(sold_out → available) → 숙소 상세에서 알림 이력 확인
 *
 * 전제: MOONCATCH_AGODA_SEARCH_API_URL=http://localhost:{port}/api/test/agoda-mock
 *   → playwright.config.ts webServer.env에 이미 설정됨
 *   → 서버를 직접 실행하는 경우 .env.local에도 동일하게 설정 필요
 */

test.describe('vacancy alert e2e', () => {
  applySniperCoreSuiteGuards();

  /**
   * vacancy 핵심 시나리오:
   * 1) sold_out으로 baseline 생성(이벤트 없음)
   * 2) available로 전환 후 재폴링
   * 3) 상세 페이지 알림 이력에서 vacancy 이벤트 확인
   */
  test('알림 등록 후 vacancy 감지 시 숙소 상세에 알림 이력이 표시된다', async ({ page }) => {
    const credentials = buildUniqueCredentials();

    // 1. 회원가입 / 로그인
    await test.step('회원가입 / 로그인', async () => {
      await signUpAndLoginThroughUi(page, credentials);
    });

    // 2. 호텔 검색 후 알림 등록
    let selectedHotelName = '';
    await test.step('알림 등록', async () => {
      selectedHotelName = await registerAlertThroughUi(page);
    });

    // 3. 대시보드에서 숙소 상세 페이지로 이동해 accommodation ID 추출
    let accommodationId = '';
    await test.step('숙소 상세 페이지로 이동', async () => {
      await expect(
        page.getByTestId('accommodation-row-name').filter({ hasText: selectedHotelName }).first(),
      ).toBeVisible();

      // 행 전체를 먼저 특정한 뒤, 행 내부의 detail 링크를 클릭한다.
      // DOM 계층 상대경로 의존을 제거해 UI 구조 변경에 대한 내성을 높였다.
      const targetRow = page
        .getByTestId('accommodation-row')
        .filter({
          has: page.getByTestId('accommodation-row-name').filter({ hasText: selectedHotelName }).first(),
        })
        .first();
      await expect(targetRow).toBeVisible();
      await targetRow.getByTestId('accommodation-row-detail-link').click();

      await page.waitForURL('**/accommodations/**');
      const urlSegments = page.url().split('/accommodations/');
      accommodationId = urlSegments[1]?.split('?')[0]?.split('/')[0] ?? '';
      expect(accommodationId).toBeTruthy();
    });

    // 4. 1차 폴 — sold_out (baseline 세팅, vacancy 없음)
    await test.step('1차 폴: sold_out (baseline 세팅)', async () => {
      await page.request.post('/api/test/agoda-mock/config', {
        data: { scenario: 'sold_out' },
      });

      const res = await page.request.post(`/api/internal/accommodations/${accommodationId}/poll`);
      expect(res.ok()).toBeTruthy();

      const body = (await res.json()) as { ok: boolean; result: { snapshotsInserted: number } };
      // sold_out 응답은 결과가 비어 있으므로 baseline 스냅샷이 0이어야 한다.
      expect(body.result.snapshotsInserted).toBe(0);
    });

    // 5. 2차 폴 — available (vacancy 이벤트 발생)
    await test.step('2차 폴: available (vacancy 감지)', async () => {
      await page.request.post('/api/test/agoda-mock/config', {
        data: { scenario: 'available' },
      });

      const res = await page.request.post(`/api/internal/accommodations/${accommodationId}/poll`);
      expect(res.ok()).toBeTruthy();

      const body = (await res.json()) as { ok: boolean; result: { vacancyEventsInserted: number } };
      // 두 번째 폴에서 availability가 생겼으므로 vacancy 이벤트가 최소 1건 생성되어야 한다.
      expect(body.result.vacancyEventsInserted).toBeGreaterThan(0);
    });

    // 6. 숙소 상세 페이지 새로고침 후 알림 이력 확인
    await test.step('알림 이력에 vacancy 이벤트 표시', async () => {
      await page.reload();
      await expect(page.getByText('알림 이력')).toBeVisible();
      await expect(page.getByText('vacancy').first()).toBeVisible();
    });
  });
});
