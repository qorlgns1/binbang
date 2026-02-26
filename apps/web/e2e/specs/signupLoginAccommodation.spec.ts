import { expect, test, type Page } from '@playwright/test';

/**
 * Sprint 1/2 SniperCore 핵심 사용자 가치:
 * 1) 신규 사용자가 직접 가입/로그인할 수 있어야 한다.
 * 2) Agoda 호텔을 검색해서 알림을 등록할 수 있어야 한다.
 * 3) 등록 직후 대시보드에서 내 알림(숙소)이 보이는지 확인해야 한다.
 *
 * 이 스펙은 mock 없이 실제 연결된 DB 검색(/api/hotels/search)을 사용한다.
 * local/development 환경에서 agoda_hotels 테이블에 실제 데이터가 존재해야 한다.
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

  if (!isVisible) {
    return;
  }

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
      .poll(async () => {
        return await resultButtons.count();
      }, { timeout: 20_000, intervals: [500, 1000, 1500] })
      .toBeGreaterThan(0)
      .then(() => true)
      .catch(() => false);

    if (!hasResults) {
      continue;
    }

    const firstResult = resultButtons.first();
    selectedHotelName = (await firstResult.locator('p').first().textContent())?.trim() ?? '';
    await firstResult.click();

    const selectedHotelCard = page.getByTestId('selected-hotel-card');
    await expect(selectedHotelCard).toBeVisible({ timeout: 10_000 });
    if (selectedHotelName) {
      await expect(selectedHotelCard).toContainText(selectedHotelName);
    }
    break;
  }

  if (!selectedHotelName) {
    throw new Error(
      '검색 가능한 Agoda 호텔이 없습니다. e2e 실행 전 실제 연결된 DB의 agoda_hotels 데이터를 확인해주세요.',
    );
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

test.describe('sniper core e2e', () => {
  test.skip(
    process.env.APP_ENV !== undefined && !['local', 'development'].includes(process.env.APP_ENV),
    '이 e2e는 local/development 환경에서만 실행하도록 제한합니다.',
  );

  test('회원가입부터 알림 등록까지 핵심 경로가 동작한다', async ({ page }) => {
    const credentials = buildUniqueCredentials();
    let selectedHotelName = '';

    await test.step('회원가입/로그인', async () => {
      await signUpThroughUi(page, credentials);
      await loginThroughUi(page, credentials);
      await dismissTutorialIfVisible(page);
    });

    await test.step('호텔 검색 후 알림 등록', async () => {
      selectedHotelName = await registerAlertThroughUi(page);
    });

    await test.step('대시보드에 등록 결과 반영 확인', async () => {
      if (!selectedHotelName) throw new Error('등록된 호텔명을 찾지 못했습니다.');
      await expect(
        page
          .getByTestId('accommodation-row-name')
          .filter({ hasText: selectedHotelName })
          .first(),
      ).toBeVisible();
    });
  });
});
