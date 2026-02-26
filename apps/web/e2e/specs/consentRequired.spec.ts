import { expect, test, type Page } from '@playwright/test';

/**
 * Sprint 2 정책 검증:
 * - 알림 등록 시 수신동의(consentOptIn)는 필수다.
 * - 사용자가 동의를 체크하지 않으면 서버 생성 API(POST /api/accommodations)가 호출되면 안 된다.
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

async function fillFormExceptConsent(page: Page): Promise<void> {
  await page.goto('/accommodations/new');
  const searchInput = page.getByTestId('hotel-search-input');
  const resultButtons = page.locator("[data-testid^='hotel-search-result-']");

  let hasSelectedHotel = false;

  for (const query of HOTEL_QUERY_CANDIDATES) {
    await searchInput.fill('');
    await searchInput.fill(query);

    const hasResults = await expect
      .poll(
        async () => {
          return await resultButtons.count();
        },
        { timeout: 20_000, intervals: [500, 1000, 1500] },
      )
      .toBeGreaterThan(0)
      .then(() => true)
      .catch(() => false);

    if (!hasResults) {
      continue;
    }

    await resultButtons.first().click();
    await expect(page.getByTestId('selected-hotel-card')).toBeVisible({ timeout: 10_000 });
    hasSelectedHotel = true;
    break;
  }

  if (!hasSelectedHotel) {
    throw new Error(
      '검색 가능한 Agoda 호텔이 없습니다. e2e 실행 전 실제 연결된 DB의 agoda_hotels 데이터를 확인해주세요.',
    );
  }

  await page.getByTestId('checkin-input').fill(formatDateFromToday(3));
  await page.getByTestId('checkout-input').fill(formatDateFromToday(5));
}

test.describe('sniper core consent requirement e2e', () => {
  test.skip(
    process.env.APP_ENV !== undefined && !['local', 'development'].includes(process.env.APP_ENV),
    '이 e2e는 local/development 환경에서만 실행하도록 제한합니다.',
  );

  test('수신동의 미체크 시 등록이 차단되고 생성 API가 호출되지 않는다', async ({ page }) => {
    const credentials = buildUniqueCredentials();
    let createAlertRequestCount = 0;

    page.on('request', (request) => {
      const path = new URL(request.url()).pathname;
      if (request.method() === 'POST' && path === '/api/accommodations') {
        createAlertRequestCount += 1;
      }
    });

    await test.step('회원가입/로그인', async () => {
      await signUpThroughUi(page, credentials);
      await loginThroughUi(page, credentials);
      await dismissTutorialIfVisible(page);
    });

    await test.step('호텔/날짜 입력 후 동의 없이 제출', async () => {
      await fillFormExceptConsent(page);
      await page.getByTestId('create-alert-submit-button').click();
    });

    await test.step('동의 에러 노출 + 생성 API 미호출 검증', async () => {
      await expect(page.getByText('알림 수신 동의가 필요합니다')).toBeVisible();
      await expect(page).toHaveURL(/\/accommodations\/new$/);
      await page.waitForTimeout(500);
      expect(createAlertRequestCount).toBe(0);
    });
  });
});
