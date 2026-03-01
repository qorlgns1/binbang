import { expect, test } from '@playwright/test';

import { buildUniqueCredentials, signUpAndLoginViaApi } from '../helpers/auth';
import { registerAlertViaApi } from '../helpers/accommodation';
import {
  dispatchNotifications,
  getNotificationHistory,
  pollAccommodationOnceById,
  setAgodaMockScenario,
} from '../helpers/polling';
import { applyAgodaMockGuard, applySniperCoreSuiteGuards } from '../helpers/suite';

/**
 * Dispatch pipeline e2e:
 * vacancy 이벤트로 큐잉된 알림이 dispatch를 통해 실제 sent 상태로 전환됨을 검증한다.
 *
 * 전제:
 * - BINBANG_AGODA_SEARCH_API_URL=http://localhost:{port}/api/test/agoda-mock (playwright.config.ts에 설정)
 * - BINBANG_EMAIL_PROVIDER 미설정 시 console 프로바이더가 사용되므로 실제 이메일 발송 없이 sent 처리됨
 *
 * 검증 범위:
 * - vacancy 이벤트 큐잉(poll) 이후 dispatch가 picked > 0, sent >= 1을 반환해야 한다.
 * - 알림 이력 API에서 해당 숙소의 알림 상태가 'sent'로 업데이트되어야 한다.
 */

test.describe('dispatch pipeline e2e', () => {
  applySniperCoreSuiteGuards();
  applyAgodaMockGuard();

  test('vacancy 이벤트가 dispatch pipeline을 통해 sent 상태로 전환된다', async ({ page }) => {
    const credentials = buildUniqueCredentials();

    // 1. 회원가입 / 로그인 (API 직접 호출)
    await test.step('회원가입 / 로그인', async () => {
      await signUpAndLoginViaApi(page, credentials);
    });

    // 2. 알림 등록 (API 직접 호출 — 수신동의 포함, 호텔 검색 UI 생략)
    let accommodationId = '';
    await test.step('알림 등록 (수신동의 포함)', async () => {
      const result = await registerAlertViaApi(page);
      accommodationId = result.accommodationId;
    });

    // 4. 1차 폴: available → 베이스라인(스냅샷) 생성, vacancy 없음
    await test.step('1차 폴: available (베이스라인 생성, vacancy 없음)', async () => {
      await setAgodaMockScenario(page, 'available');
      const result = await pollAccommodationOnceById(page, accommodationId);

      expect(result.snapshotsInserted).toBeGreaterThan(0);
      expect(result.vacancyEventsInserted).toBe(0);
    });

    // 5. 2차 폴: sold_out → 결과 없음, vacancy 후보 상태 구성
    await test.step('2차 폴: sold_out (vacancy 후보 상태 구성)', async () => {
      await setAgodaMockScenario(page, 'sold_out');
      const result = await pollAccommodationOnceById(page, accommodationId);

      expect(result.snapshotsInserted).toBe(0);
      expect(result.vacancyEventsInserted).toBe(0);
    });

    // 6. 3차 폴: available → vacancy 감지 + 알림 큐잉
    let notificationsQueued = 0;
    await test.step('3차 폴: available (vacancy 감지, 알림 큐잉)', async () => {
      await setAgodaMockScenario(page, 'available');
      const result = await pollAccommodationOnceById(page, accommodationId);

      expect(result.vacancyEventsInserted).toBeGreaterThan(0);
      expect(result.notificationsQueued).toBeGreaterThan(0);
      notificationsQueued = result.notificationsQueued;
    });

    // 7. dispatch: 큐잉된 알림을 발송 처리 (queued → sent)
    //    console 프로바이더에서는 실제 이메일 없이 성공 처리됨
    await test.step('dispatch: 큐잉된 알림 발송 처리 (queued → sent)', async () => {
      const result = await dispatchNotifications(page);

      // picked는 이 테스트 외 다른 테스트의 알림도 포함될 수 있으나,
      // 현재 사용자 이메일의 알림은 반드시 sent에 포함되어야 한다.
      expect(result.picked).toBeGreaterThan(0);
      expect(result.sent).toBeGreaterThan(0);
      expect(result.failed).toBe(0);
    });

    // 8. 알림 이력에서 해당 숙소의 알림이 sent 상태로 반영되었는지 확인
    await test.step('알림 이력: vacancy 알림이 sent 상태로 업데이트됨', async () => {
      const history = await getNotificationHistory(page, accommodationId);
      const sentItems = history.filter((item) => item.status === 'sent');

      expect(sentItems).toHaveLength(notificationsQueued);
    });
  });
});
