import { expect, type APIResponse, type Page } from '@playwright/test';

const DEFAULT_HOTEL_QUERY_CANDIDATES = ['서울', '제주', '부산', 'seoul', 'hotel', 'jeju', 'busan'];

/**
 * 알림 등록 폼의 필수 필드 자동 입력 옵션.
 *
 * - `checkInOffsetDays`: 오늘 기준 체크인 날짜 오프셋(기본 +3일)
 * - `checkOutOffsetDays`: 오늘 기준 체크아웃 날짜 오프셋(기본 +5일)
 * - `hotelQueryCandidates`: 검색어 후보 목록(순서대로 시도)
 */
interface FillAlertFormRequiredFieldsOptions {
  checkInOffsetDays?: number;
  checkOutOffsetDays?: number;
  hotelQueryCandidates?: string[];
}

/**
 * 오늘 날짜를 기준으로 offset이 적용된 `YYYY-MM-DD` 문자열을 만든다.
 *
 * 용도:
 * - date input(`type='date'`)에 직접 주입 가능한 형식 보장
 * - 테스트 실행 날짜가 달라져도 하드코딩 없이 유효한 미래 날짜 사용
 *
 * @param offsetDays 오늘 기준 이동 일수
 * @returns `YYYY-MM-DD` 형식 날짜 문자열
 */
export function formatDateFromToday(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 알림 등록 폼의 필수 입력값(호텔 선택/체크인/체크아웃)까지 채운다.
 *
 * 동작 방식:
 * 1) `/accommodations/new` 이동
 * 2) 호텔 검색 후보어를 순차 시도
 * 3) 검색 결과가 뜨면 첫 항목 선택
 * 4) 날짜 필드 입력
 *
 * 실패 조건:
 * - 어떤 검색어에서도 결과를 못 찾으면 예외 throw
 *
 * @param page Playwright page 인스턴스
 * @param options 입력 커스터마이즈 옵션
 * @returns 선택된 호텔명(대시보드 반영 검증에 재사용)
 */
export async function fillAlertFormRequiredFields(
  page: Page,
  options: FillAlertFormRequiredFieldsOptions = {},
): Promise<string> {
  const checkInOffsetDays = options.checkInOffsetDays ?? 3;
  const checkOutOffsetDays = options.checkOutOffsetDays ?? 5;
  const hotelQueryCandidates = options.hotelQueryCandidates ?? DEFAULT_HOTEL_QUERY_CANDIDATES;

  await page.goto('/accommodations/new');
  const searchInput = page.getByTestId('hotel-search-input');
  const resultButtons = page.locator("[data-testid^='hotel-search-result-']");

  let selectedHotelName = '';

  for (const query of hotelQueryCandidates) {
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

  await page.getByTestId('checkin-input').fill(formatDateFromToday(checkInOffsetDays));
  await page.getByTestId('checkout-input').fill(formatDateFromToday(checkOutOffsetDays));

  return selectedHotelName;
}

/**
 * 실제 UI에서 알림 등록을 끝까지 수행한다.
 *
 * 내부적으로:
 * - `fillAlertFormRequiredFields`를 호출해 호텔/날짜를 채우고
 * - 수신동의 체크 후 제출 버튼을 눌러 `/dashboard` 리다이렉트를 기다린다.
 *
 * @param page Playwright page 인스턴스
 * @param options 입력 커스터마이즈 옵션
 * @returns 등록된 호텔명(후속 assertion용)
 */
export async function registerAlertThroughUi(
  page: Page,
  options: FillAlertFormRequiredFieldsOptions = {},
): Promise<string> {
  const selectedHotelName = await fillAlertFormRequiredFields(page, options);

  const consentCheckbox = page.getByTestId('consent-optin-checkbox');
  await consentCheckbox.click();
  await expect(consentCheckbox).toHaveAttribute('data-state', 'checked');

  await page.getByTestId('create-alert-submit-button').click();
  await page.waitForURL('**/dashboard');

  return selectedHotelName;
}

// ============================================================================
// API 기반 헬퍼 (브라우저 UI 없이 알림 등록 — 폴링/알림 로직 테스트 전용)
// ============================================================================

interface HotelSearchItem {
  hotelId: string;
  name: string;
}

interface HotelSearchEnvelope {
  hotels: HotelSearchItem[];
}

interface AccommodationApiResponse {
  id: string;
  name: string;
}

async function assertApiOk(response: APIResponse, context: string): Promise<void> {
  if (response.ok()) return;
  const body = await response.text().catch(() => '');
  throw new Error(`${context} failed: status=${response.status()} body=${body}`);
}

/**
 * API 호출로 알림을 등록하고 accommodation ID와 호텔명을 반환한다.
 *
 * UI 대비 차이:
 * - 브라우저 렌더링 없이 `GET /api/hotels/search` + `POST /api/accommodations` 직접 호출
 * - 호텔 검색 재시도 루프(최대 20s/후보어)를 제거해 속도를 대폭 개선
 *
 * 사용 대상:
 * - 폴링/알림 로직을 검증하는 스펙 (vacancyAlert, dispatchPipeline)
 *
 * @param page Playwright page 인스턴스 (인증 세션이 수립된 상태)
 * @param checkInOffsetDays 오늘 기준 체크인 날짜 오프셋 (기본 +3일)
 * @param checkOutOffsetDays 오늘 기준 체크아웃 날짜 오프셋 (기본 +5일)
 * @returns 생성된 accommodation의 ID와 호텔명
 */
export async function registerAlertViaApi(
  page: Page,
  checkInOffsetDays = 3,
  checkOutOffsetDays = 5,
): Promise<{ accommodationId: string; hotelName: string }> {
  // 1. DB에서 호텔 검색 (후보어 순서대로 첫 결과 사용)
  let platformId = '';
  let hotelName = '';

  for (const query of DEFAULT_HOTEL_QUERY_CANDIDATES) {
    const searchResp = await page.request.get(`/api/hotels/search?q=${encodeURIComponent(query)}`);
    if (!searchResp.ok()) continue;

    const body = (await searchResp.json()) as HotelSearchEnvelope;
    const first = body.hotels?.[0];
    if (first) {
      platformId = first.hotelId;
      hotelName = first.name;
      break;
    }
  }

  if (!platformId) {
    throw new Error(
      '검색 가능한 Agoda 호텔이 없습니다. e2e 실행 전 실제 연결된 DB의 agoda_hotels 데이터를 확인해주세요.',
    );
  }

  // 2. 알림 등록 (수신동의 포함)
  const checkIn = formatDateFromToday(checkInOffsetDays);
  const checkOut = formatDateFromToday(checkOutOffsetDays);

  const createResp = await page.request.post('/api/accommodations', {
    data: {
      platformId,
      name: hotelName,
      checkIn,
      checkOut,
      adults: 2,
      children: 0,
      rooms: 1,
      currency: 'KRW',
      locale: 'ko',
      consentOptIn: true,
    },
  });
  await assertApiOk(createResp, 'registerAlertViaApi');

  const created = (await createResp.json()) as AccommodationApiResponse;
  return { accommodationId: created.id, hotelName: created.name };
}
