import { expect, test, type Page } from '@playwright/test';

/**
 * Vacancy 알림 e2e:
 * 회원가입 → 알림 등록 → 폴링 2회(sold_out → available) → 숙소 상세에서 알림 이력 확인
 *
 * 전제: MOONCATCH_AGODA_SEARCH_API_URL=http://localhost:{port}/api/test/agoda-mock
 *   → playwright.config.ts webServer.env에 이미 설정됨
 *   → 서버를 직접 실행하는 경우 .env.local에도 동일하게 설정 필요
 */

const PASSWORD = 'E2E-Password-1234!';
const HOTEL_QUERY_CANDIDATES = ['서울', '제주', '부산', 'seoul', 'hotel', 'jeju', 'busan'];

interface Credentials {
  name: string;
  email: string;
  password: string;
}

function buildUniqueCredentials(): Credentials {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    name: `E2E User ${suffix}`,
    email: `e2e.${suffix}@example.com`,
    password: PASSWORD,
  };
}

function formatDateFromToday(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function signUpThroughUi(page: Page, credentials: Credentials): Promise<void> {
  await page.goto('/ko/signup');
  await page.getByTestId('signup-name-input').fill(credentials.name);
  await page.getByTestId('signup-email-input').fill(credentials.email);
  await page.getByTestId('signup-password-input').fill(credentials.password);
  await page.getByTestId('signup-password-confirm-input').fill(credentials.password);
  await page.getByTestId('signup-submit-button').click();
  await page.waitForURL('**/ko/login');
}

async function loginThroughUi(page: Page, credentials: Credentials): Promise<void> {
  await page.getByTestId('login-email-input').fill(credentials.email);
  await page.getByTestId('login-password-input').fill(credentials.password);
  await page.getByTestId('login-submit-button').click();
  await page.waitForURL('**/dashboard');
}

async function dismissTutorialIfVisible(page: Page): Promise<void> {
  const skipButton = page.getByRole('button', { name: /건너뛰기|skip/i }).first();
  const isVisible = await skipButton
    .isVisible({ timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  if (!isVisible) return;
  await skipButton.click();
  await expect(skipButton).toBeHidden({ timeout: 10_000 });
}

async function registerAlertThroughUi(page: Page): Promise<string> {
  await page.goto('/accommodations/new');
  const searchInput = page.getByTestId('hotel-search-input');
  const resultButtons = page.locator("[data-testid^='hotel-search-result-']");

  let selectedHotelName = '';

  for (const query of HOTEL_QUERY_CANDIDATES) {
    await searchInput.fill('');
    await searchInput.fill(query);

    const hasResults = await expect
      .poll(async () => resultButtons.count(), { timeout: 20_000, intervals: [500, 1000, 1500] })
      .toBeGreaterThan(0)
      .then(() => true)
      .catch(() => false);

    if (!hasResults) continue;

    const firstResult = resultButtons.first();
    selectedHotelName = (await firstResult.locator('p').first().textContent())?.trim() ?? '';
    await firstResult.click();

    const selectedHotelCard = page.getByTestId('selected-hotel-card');
    await expect(selectedHotelCard).toBeVisible({ timeout: 10_000 });
    break;
  }

  if (!selectedHotelName) {
    throw new Error('검색 가능한 Agoda 호텔이 없습니다. agoda_hotels 테이블 데이터를 확인해주세요.');
  }

  await page.getByTestId('checkin-input').fill(formatDateFromToday(3));
  await page.getByTestId('checkout-input').fill(formatDateFromToday(5));

  const consentCheckbox = page.getByTestId('consent-optin-checkbox');
  await consentCheckbox.click();
  await expect(consentCheckbox).toHaveAttribute('data-state', 'checked');

  await page.getByTestId('create-alert-submit-button').click();
  await page.waitForURL('**/dashboard');

  return selectedHotelName;
}

test.describe('vacancy alert e2e', () => {
  test.skip(
    process.env.APP_ENV !== undefined && !['local', 'development'].includes(process.env.APP_ENV),
    '이 e2e는 local/development 환경에서만 실행하도록 제한합니다.',
  );

  test('알림 등록 후 vacancy 감지 시 숙소 상세에 알림 이력이 표시된다', async ({ page }) => {
    const credentials = buildUniqueCredentials();

    // 1. 회원가입 / 로그인
    await test.step('회원가입 / 로그인', async () => {
      await signUpThroughUi(page, credentials);
      await loginThroughUi(page, credentials);
      await dismissTutorialIfVisible(page);
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

      // "상세보기" 버튼 클릭
      await page
        .getByTestId('accommodation-row-name')
        .filter({ hasText: selectedHotelName })
        .first()
        .locator('../../../..')
        .getByRole('link', { name: /상세보기/i })
        .click();

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
      expect(body.result.snapshotsInserted).toBe(0); // sold_out이므로 스냅샷 없음
    });

    // 5. 2차 폴 — available (vacancy 이벤트 발생)
    await test.step('2차 폴: available (vacancy 감지)', async () => {
      await page.request.post('/api/test/agoda-mock/config', {
        data: { scenario: 'available' },
      });

      const res = await page.request.post(`/api/internal/accommodations/${accommodationId}/poll`);
      expect(res.ok()).toBeTruthy();

      const body = (await res.json()) as { ok: boolean; result: { vacancyEventsInserted: number } };
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
