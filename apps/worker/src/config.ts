import { validateWorkerEnv, loadSettings } from '@workspace/shared/worker';

interface CronConfig {
  schedule: string;
  concurrency: number;
  browserPoolSize: number;
  startupDelay: number;
  shutdownTimeoutMs: number;
}

let cronConfig: CronConfig | null = null;

/**
 * DB에서 설정을 읽어 워커 설정을 초기화한다.
 * 워커 시작 시 1회 호출.
 */
export async function initCronConfig(): Promise<void> {
  validateWorkerEnv();
  const settings = await loadSettings();

  const concurrency = Math.min(settings.worker.concurrency, settings.worker.browserPoolSize);

  cronConfig = {
    schedule: settings.worker.cronSchedule,
    concurrency,
    browserPoolSize: settings.worker.browserPoolSize,
    startupDelay: settings.worker.startupDelayMs,
    shutdownTimeoutMs: settings.worker.shutdownTimeoutMs,
  };
}

export function getCronConfig(): CronConfig {
  if (!cronConfig) {
    throw new Error('CRON_CONFIG not initialized. Call initCronConfig() first.');
  }
  return cronConfig;
}

export function logConfig(): void {
  const config = getCronConfig();
  console.log('Worker configuration:');
  console.log(`   - Schedule: ${config.schedule}`);
  console.log(`   - Concurrency: ${config.concurrency}`);
  console.log(`   - Browser pool: ${config.browserPoolSize}`);
  console.log(`   - Startup delay: ${config.startupDelay}ms`);
}
