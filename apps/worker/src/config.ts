import { getEnv, loadSettings, validateWorkerEnv } from '@workspace/worker-shared/runtime';

interface WorkerConfig {
  redisUrl: string;
  schedule: string;
  concurrency: number;
  browserPoolSize: number;
  startupDelay: number;
  shutdownTimeoutMs: number;
}

let workerConfig: WorkerConfig | null = null;

/**
 * DB에서 설정을 읽어 워커 설정을 초기화한다.
 * 워커 시작 시 1회 호출.
 */
export async function initConfig(): Promise<void> {
  validateWorkerEnv();
  const settings = await loadSettings();

  const concurrency = Math.min(settings.worker.concurrency, settings.worker.browserPoolSize);

  workerConfig = {
    redisUrl: getEnv('REDIS_URL'),
    schedule: settings.worker.cronSchedule,
    concurrency,
    browserPoolSize: settings.worker.browserPoolSize,
    startupDelay: settings.worker.startupDelayMs,
    shutdownTimeoutMs: settings.worker.shutdownTimeoutMs,
  };
}

export function getConfig(): WorkerConfig {
  if (!workerConfig) {
    throw new Error('Worker config not initialized. Call initConfig() first.');
  }
  return workerConfig;
}

function maskRedisUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = '***';
    return parsed.toString();
  } catch {
    return '(invalid URL)';
  }
}

export function logConfig(): void {
  const config = getConfig();
  console.log('Worker configuration:');
  console.log(`   - Schedule: ${config.schedule}`);
  console.log(`   - Concurrency: ${config.concurrency}`);
  console.log(`   - Browser pool: ${config.browserPoolSize}`);
  console.log(`   - Startup delay: ${config.startupDelay}ms`);
  console.log(`   - Redis: ${maskRedisUrl(config.redisUrl)}`);
}
