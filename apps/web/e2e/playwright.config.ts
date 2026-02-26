import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PW_PORT ?? 3320);
const baseHost = process.env.PW_BASE_HOST ?? 'localhost';
const baseURL = `http://${baseHost}:${port}`;
const slowMo = Number(process.env.PW_SLOW_MO ?? 0);

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  timeout: 180_000,
  expect: {
    timeout: 10_000,
  },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: slowMo > 0 ? { slowMo } : undefined,
  },
  webServer: {
    command: `cd ../.. && pnpm with-env pnpm --filter @workspace/web exec next dev --turbopack --port ${port}`,
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env,
      PORT: String(port),
      // e2e 테스트 시 Agoda 실제 API 대신 mock 라우트 사용
      MOONCATCH_AGODA_SEARCH_API_URL: `http://localhost:${port}/api/test/agoda-mock`,
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
