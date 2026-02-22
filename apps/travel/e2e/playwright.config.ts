import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PW_PORT ?? 3310);
const baseHost = process.env.PW_BASE_HOST ?? 'localhost';
const baseURL = `http://${baseHost}:${port}`;
const slowMo = Number(process.env.PW_SLOW_MO ?? 0);

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: slowMo > 0 ? { slowMo } : undefined,
  },
  webServer: {
    command: `cd ../.. && pnpm with-env pnpm --filter @workspace/travel exec next dev --turbopack --port ${port}`,
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: false,
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
