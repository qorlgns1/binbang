import { expect, test, type Page } from '@playwright/test';

const CHAT_PROMPT = '서울에서 예약 가능한 4성급 호텔 추천해줘';

async function sendPrompt(page: Page, prompt: string) {
  const input = page.getByTestId('chat-input');
  await expect(input).toBeVisible();
  await input.fill(prompt);
  await page.getByTestId('chat-submit').click();
}

async function expectAssistantMessageOrFailFast(page: Page) {
  const assistantMessage = page.getByTestId('chat-message-assistant').last();
  const errorBanner = page.getByText('답변을 불러오지 못했어요');

  await expect
    .poll(
      async () => {
        if ((await assistantMessage.count()) > 0) return 'assistant';
        if ((await errorBanner.count()) > 0) return 'error';
        return 'pending';
      },
      { timeout: 90_000, intervals: [500, 1_000, 2_000] },
    )
    .toBe('assistant');
}

function entityCards(page: Page) {
  return page.locator("[data-testid^='entity-hover-']");
}

async function expectMapLoaded(page: Page) {
  await expect(page.getByTestId('map-panel')).toBeVisible();
  await expect(page.getByTestId('map-panel')).toHaveAttribute('data-map-provider', 'google');
  await expect(page.getByTestId('map-loading-overlay')).toBeHidden({ timeout: 30_000 });
}

async function expectMarkersVisible(page: Page) {
  const cards = entityCards(page);
  await expect(cards.first()).toBeVisible({ timeout: 30_000 });

  const count = await cards.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    const title = (await cards.nth(i).locator('h4').first().textContent())?.trim();
    if (!title) continue;
    await expect(page.getByRole('button', { name: title }).first()).toBeVisible();
  }
}

async function expectMarkerScaleOnCardHover(page: Page) {
  const firstCard = entityCards(page).first();
  await expect(firstCard).toBeVisible();

  const placeId = await firstCard.getAttribute('data-place-id');
  if (placeId) {
    const markerByTestId = page.getByTestId(`map-marker-${placeId}`).first();
    if ((await markerByTestId.count()) > 0) {
      await page.mouse.move(0, 0);
      await page.waitForTimeout(150);
      await expect(markerByTestId).toHaveAttribute('data-marker-scale', '1');
      await firstCard.hover();
      await expect(markerByTestId).toHaveAttribute('data-marker-scale', '1.3');
      return;
    }
  }

  const markerName = (await firstCard.locator('h4').first().textContent())?.trim();
  if (!markerName) {
    throw new Error('카드 제목을 찾지 못해 마커 hover 검증을 진행할 수 없습니다.');
  }

  const marker = page.getByRole('button', { name: markerName }).first();
  const before = await marker.boundingBox();
  await firstCard.hover();
  await page.waitForTimeout(200);
  const after = await marker.boundingBox();

  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect((after?.width ?? 0) + (after?.height ?? 0)).toBeGreaterThan((before?.width ?? 0) + (before?.height ?? 0));
}

test.describe('travel chat/map requirements', () => {
  test('@e2e 연속 플로우: 지도 -> 채팅 -> 마커 -> hover scale', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');

    await test.step('구글 지도 로드 확인', async () => {
      await expectMapLoaded(page);
    });

    await test.step('채팅 전송/응답 확인', async () => {
      await sendPrompt(page, CHAT_PROMPT);
      await expect(page.getByTestId('chat-message-user').last()).toContainText(CHAT_PROMPT);
      await expectAssistantMessageOrFailFast(page);
    });

    await test.step('추천 결과 마커 반영 확인', async () => {
      await expectMarkersVisible(page);
    });

    await test.step('카드 hover 시 마커 scale 증가 확인', async () => {
      await expectMarkerScaleOnCardHover(page);
    });
  });

  test('@map 초기 지도 로드 확인', async ({ page }) => {
    await page.goto('/');
    await expectMapLoaded(page);
  });
});
