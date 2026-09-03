import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PW_PORT ?? 3320);
const baseHost = process.env.PW_BASE_HOST ?? '127.0.0.1';
const baseURL = `http://${baseHost}:${port}`;
const slowMo = Number(process.env.PW_SLOW_MO ?? 0);

/**
 * e2e 전용 환경변수.
 *
 * `pnpm with-env` 가 `doppler run` 으로 감싸기 때문에, Playwright 의 `env` 로
 * 넘긴 값은 Doppler 주입에 덮어써진다. 그래서 셸 명령 안에서 Doppler 이후에
 * 다시 지정한다.
 *
 * 아래 command 가 `pnpm --filter ... dev` 대신 `next dev` 를 직접 부르는 이유도
 * 같다. 앱의 dev 스크립트는 자체적으로 doppler 를 한 번 더 실행해서, 그대로
 * 두면 여기서 지정한 값이 다시 덮어써진다.
 *
 * - NEXTAUTH_URL: Doppler 값은 https 주소라 세션 쿠키가 __Secure- 접두사와
 *   secure 플래그로 발급된다. e2e 는 http://127.0.0.1 에서 돌아 page.request 가
 *   그 쿠키를 보내지 않고 API 호출이 401 이 된다. 실행 주소로 맞춘다.
 * - BINBANG_ENABLE_E2E_ENDPOINTS: test-only 라우트를 이 실행에서만 연다.
 * - BINBANG_AGODA_SEARCH_API_URL: 실제 Agoda API 대신 mock 라우트를 쓴다.
 */
const e2eOverrides = [
  `NEXTAUTH_URL=${baseURL}`,
  'BINBANG_ENABLE_E2E_ENDPOINTS=true',
  `BINBANG_AGODA_SEARCH_API_URL=http://127.0.0.1:${port}/api/test/agoda-mock`,
].join(' ');

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  timeout: 180_000,
  expect: {
    timeout: 10_000,
  },
  retries: process.env.CI ? 1 : 0,
  // 인메모리 mock 상태 공유로 인한 테스트 간 간섭을 방지하기 위해 항상 직렬 실행
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: slowMo > 0 ? { slowMo } : undefined,
  },
  webServer: {
    // with-env 는 `doppler run` 으로 감싸므로 아래 env 로 넘긴 값이 덮어써진다.
    // Doppler 주입 뒤에 다시 지정해야 이긴다.
    command: `cd ../.. && pnpm with-env sh -c '${e2eOverrides} exec pnpm --filter @workspace/web exec next dev --experimental-next-config-strip-types'`,
    url: baseURL,
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env,
      PORT: String(port),
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
