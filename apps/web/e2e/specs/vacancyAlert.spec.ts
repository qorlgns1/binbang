import { expect, test } from '@playwright/test';

import { buildUniqueCredentials, signUpAndLoginThroughUi } from '../helpers/auth';
import { registerAlertThroughUi } from '../helpers/accommodation';
import { getNotificationHistory, pollAccommodationOnceById, setAgodaMockScenario } from '../helpers/polling';
import { applySniperCoreSuiteGuards } from '../helpers/suite';

/**
 * Vacancy 알림 e2e:
 * 회원가입 → 알림 등록 → 다중 폴링(베이스라인/재등장/쿨다운) → 숙소 상세와 알림 이력 확인
 *
 * 전제: MOONCATCH_AGODA_SEARCH_API_URL=http://localhost:{port}/api/test/agoda-mock
 *   → playwright.config.ts webServer.env에 이미 설정됨
 *   → 서버를 직접 실행하는 경우 .env.local에도 동일하게 설정 필요
 */

test.describe('vacancy alert e2e', () => {
  applySniperCoreSuiteGuards();

  /**
   * vacancy 회귀 방지 시나리오:
   *
   * 1) 첫 poll이 available이어도(베이스라인 없음) vacancy를 만들지 않아야 한다.
   * 2) sold_out 이후 available 재등장 시 vacancy를 생성해야 한다.
   * 3) 같은 패턴이 쿨다운 내 재발하면 신규 vacancy를 만들지 않아야 한다.
   *
   * 즉, false positive/false negative/중복 알림을 한 번에 검증한다.
   */
  test('vacancy 감지 핵심 회귀(베이스라인/재등장/쿨다운)를 만족한다', async ({ page }) => {
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

    // 4. 첫 poll이 available이어도 hasBaseline=false 이므로 vacancy를 만들지 않아야 한다.
    await test.step('1차 폴: available (baseline 없음, vacancy 금지)', async () => {
      await setAgodaMockScenario(page, 'available');
      const result = await pollAccommodationOnceById(page, accommodationId);

      expect(result.snapshotsInserted).toBeGreaterThan(0);
      expect(result.vacancyEventsDetected).toBe(0);
      expect(result.vacancyEventsRejectedByVerify).toBe(0);
      expect(result.vacancyEventsInserted).toBe(0);
      expect(result.vacancyEventsSkippedByCooldown).toBe(0);
    });

    // 5. sold_out으로 전환하면 현재 결과가 없으므로 vacancy는 여전히 0이어야 한다.
    await test.step('2차 폴: sold_out (현재 결과 없음)', async () => {
      await setAgodaMockScenario(page, 'sold_out');
      const result = await pollAccommodationOnceById(page, accommodationId);

      expect(result.snapshotsInserted).toBe(0);
      expect(result.vacancyEventsDetected).toBe(0);
      expect(result.vacancyEventsRejectedByVerify).toBe(0);
      expect(result.vacancyEventsInserted).toBe(0);
      expect(result.vacancyEventsSkippedByCooldown).toBe(0);
    });

    // 6. sold_out -> available 재등장에서는 vacancy가 생성되어야 한다.
    await test.step('3차 폴: available (재등장으로 vacancy 생성)', async () => {
      await setAgodaMockScenario(page, 'available');
      const result = await pollAccommodationOnceById(page, accommodationId);

      expect(result.vacancyEventsDetected).toBeGreaterThan(0);
      expect(result.vacancyEventsRejectedByVerify).toBe(0);
      expect(result.vacancyEventsInserted).toBeGreaterThan(0);
      expect(result.vacancyEventsSkippedByCooldown).toBe(0);
      expect(result.notificationsQueued).toBeGreaterThan(0);
    });

    // 7. 다시 sold_out으로 내린다(다음 재등장 후보 상태 구성).
    await test.step('4차 폴: sold_out (재등장 후보 상태 구성)', async () => {
      await setAgodaMockScenario(page, 'sold_out');
      const result = await pollAccommodationOnceById(page, accommodationId);

      expect(result.snapshotsInserted).toBe(0);
      expect(result.vacancyEventsDetected).toBe(0);
      expect(result.vacancyEventsInserted).toBe(0);
    });

    // 8. 쿨다운 기간 내 재등장은 감지는 되더라도 신규 삽입이 차단되어야 한다.
    await test.step('5차 폴: available (쿨다운으로 신규 vacancy 차단)', async () => {
      await setAgodaMockScenario(page, 'available');
      const result = await pollAccommodationOnceById(page, accommodationId);

      expect(result.vacancyEventsDetected).toBeGreaterThan(0);
      expect(result.vacancyEventsInserted).toBe(0);
      expect(result.vacancyEventsSkippedByCooldown).toBeGreaterThan(0);
      expect(result.notificationsQueued).toBe(0);
    });

    // 9. 최종 알림 이력은 vacancy 1건만 유지되어야 한다(중복 알림 방지 검증).
    await test.step('알림 이력에 vacancy 알림이 1건만 존재', async () => {
      const history = await getNotificationHistory(page, accommodationId);
      const vacancyNotifications = history.filter((item) => item.type === 'vacancy');
      expect(vacancyNotifications).toHaveLength(1);

      await page.reload();
      await expect(page.getByText('알림 이력')).toBeVisible();
      await expect(page.getByText('vacancy').first()).toBeVisible();
    });
  });
});
