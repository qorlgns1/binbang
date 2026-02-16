// Worker Entry Point
// ============================================
import { prisma } from '@workspace/db';
import {
  type CheckerRuntimeConfig,
  checkAgoda,
  checkAirbnb,
  closeBrowserPool,
  initBrowserPool,
} from '@workspace/worker-shared/browser';
import {
  createCheckQueue,
  createCheckWorker,
  createCycleQueue,
  createCycleWorker,
  buildQueueSnapshot,
  createRedisConnection,
  getPlatformSelectors,
  getSettings,
  invalidateSelectorCache,
  loadPlatformSelectors,
  recordHeartbeatHistory,
  setupRepeatableJobs,
  startHeartbeatMonitoring,
  updateHeartbeat,
} from '@workspace/worker-shared/runtime';
import 'dotenv/config';
import { createServer } from 'node:http';

import { processCheck } from './checkProcessor';
import { getConfig, initConfig, logConfig } from './config';
import { createCycleProcessor } from './cycleProcessor';

async function main(): Promise<void> {
  // 1. 설정 초기화
  await initConfig();
  const config = getConfig();

  // 2. 브라우저 풀 초기화
  const settings = getSettings();
  initBrowserPool({
    poolSize: config.browserPoolSize,
    launchConfig: {
      protocolTimeoutMs: settings.browser.protocolTimeoutMs,
    },
  });

  // 3. Redis 연결 & 큐 생성
  const queueConnection = createRedisConnection(config.redisUrl);
  const cycleWorkerConnection = createRedisConnection(config.redisUrl);
  const checkWorkerConnection = createRedisConnection(config.redisUrl);

  const cycleQueue = createCycleQueue(queueConnection);
  const checkQueue = createCheckQueue(queueConnection);

  // 4. BullMQ Workers 생성
  const cycleWorker = createCycleWorker(cycleWorkerConnection, createCycleProcessor(checkQueue), { concurrency: 1 });
  const checkWorker = createCheckWorker(checkWorkerConnection, processCheck, { concurrency: config.concurrency });

  // 5. Repeatable job 설정
  await setupRepeatableJobs(cycleQueue, config.schedule, {
    publicAvailabilitySnapshotSchedule: settings.worker.publicAvailabilitySnapshotSchedule,
    publicAvailabilityWindowDays: settings.worker.publicAvailabilitySnapshotWindowDays,
  });

  // 6. 시작 로그
  console.log(`\nWorker started`);
  logConfig();
  console.log(`Waiting for next execution...\n`);

  // 하트비트 모니터링 시작
  startHeartbeatMonitoring();

  // 7. Worker Heartbeat 기록
  prisma.workerHeartbeat
    .upsert({
      where: { id: 'singleton' },
      update: {
        startedAt: new Date(),
        lastHeartbeatAt: new Date(),
        schedule: config.schedule,
      },
      create: {
        id: 'singleton',
        startedAt: new Date(),
        schedule: config.schedule,
      },
    })
    .catch((error): void => {
      console.error('Error starting worker heartbeat:', error);
    });

  // 8. 초기 실행 (딜레이 후)
  setTimeout((): void => {
    cycleQueue
      .add('cycle-trigger', { triggeredAt: new Date().toISOString() })
      .catch((err: unknown): void => console.error('Initial cycle trigger failed:', err));
  }, config.startupDelay);

  // 9. 프로세스 종료 핸들링
  let isShuttingDown = false;

  async function gracefulShutdown(): Promise<void> {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\nShutdown signal received. Stopping worker...`);

    console.log('   - Closing BullMQ workers...');
    await Promise.all([cycleWorker.close(), checkWorker.close()]);
    console.log('   - Workers closed');

    await Promise.all([cycleQueue.close(), checkQueue.close()]);
    console.log('   - Queues closed');

    await Promise.all([cycleWorkerConnection.quit(), checkWorkerConnection.quit(), queueConnection.quit()]);
    console.log('   - Redis disconnected');

    await closeBrowserPool();
    console.log('   - Browser pool closed');

    await prisma.$disconnect();
    console.log('   - DB disconnected');
    console.log('Worker stopped\n');

    process.exit(0);
  }

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);

  // ============================================
  // HTTP Control Server (내부 네트워크 전용, 외부 접근은 네트워크/방화벽으로 차단)
  // ============================================
  const server = createServer((req, res): void => {
    const requestUrl = new URL(req.url ?? '/', 'http://localhost');
    const pathname = requestUrl.pathname;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (pathname === '/restart' && req.method === 'POST') {
      console.log('Worker restart requested');

      setTimeout((): void => {
        console.log('Worker restarting...');
        process.exit(1);
      }, 1000);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          message: 'Worker restarting...',
          timestamp: new Date().toISOString(),
        }),
      );
      return;
    }

    if (pathname === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        }),
      );
      return;
    }

    if (pathname === '/queue/snapshot' && req.method === 'GET') {
      void (async (): Promise<void> => {
        try {
          const rawLimit = requestUrl.searchParams.get('limit');
          const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
          const snapshot = await buildQueueSnapshot(cycleQueue, checkQueue, parsedLimit);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(snapshot));
        } catch (error) {
          console.error('Queue snapshot failed:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error',
            }),
          );
        }
      })();
      return;
    }

    if (pathname === '/public-availability-snapshot/run' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk): void => {
        body += chunk.toString();
      });
      req.on('end', (): void => {
        void (async (): Promise<void> => {
          let parsed: { windowDays?: unknown } = {};
          if (body) {
            try {
              parsed = JSON.parse(body) as { windowDays?: unknown };
            } catch {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
              return;
            }
          }

          try {
            const rawWindowDays = parsed.windowDays;
            const hasWindowDays = rawWindowDays !== undefined;
            const windowDays =
              typeof rawWindowDays === 'number' && Number.isFinite(rawWindowDays) && rawWindowDays > 0
                ? Math.floor(rawWindowDays)
                : undefined;

            if (hasWindowDays && windowDays === undefined) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'windowDays must be a positive integer' }));
              return;
            }

            const job = await cycleQueue.add('public-availability-snapshot', {
              triggeredAt: new Date().toISOString(),
              windowDays,
              source: 'manual-admin',
            });

            res.writeHead(202, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                success: true,
                message: 'Public availability snapshot job queued',
                jobId: job.id,
                windowDays: windowDays ?? null,
              }),
            );
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error',
              }),
            );
          }
        })();
      });
      return;
    }

    // 셀렉터 캐시 무효화 엔드포인트
    if (pathname === '/cache/invalidate' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk): void => {
        body += chunk.toString();
      });
      req.on('end', async (): Promise<void> => {
        try {
          const { platform } = body ? JSON.parse(body) : {};

          console.log(`Selector cache invalidation requested: ${platform || 'all'}`);

          const invalidated = invalidateSelectorCache(platform);

          if (platform) {
            await loadPlatformSelectors(platform, true);
          } else {
            await Promise.all([loadPlatformSelectors('AIRBNB', true), loadPlatformSelectors('AGODA', true)]);
          }

          console.log(`Cache invalidation completed: ${invalidated.join(', ') || 'none'}`);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: true,
              invalidated,
              reloaded: platform ? [platform] : ['AIRBNB', 'AGODA'],
            }),
          );
        } catch (error) {
          console.error('Cache invalidation failed:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error',
            }),
          );
        }
      });
      return;
    }

    // 셀렉터 테스트 엔드포인트
    if (pathname === '/test' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk): void => {
        body += chunk.toString();
      });
      req.on('end', async (): Promise<void> => {
        try {
          const { url, platform, checkIn, checkOut, adults } = JSON.parse(body);

          if (!url || !platform) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'url and platform are required' }));
            return;
          }

          console.log(`Selector test requested: ${platform} - ${url}`);

          const testAccommodation = {
            id: 'test',
            name: 'Test Accommodation',
            url,
            platform,
            checkIn: checkIn ? new Date(checkIn) : new Date(),
            checkOut: checkOut ? new Date(checkOut) : new Date(Date.now() + 86400000),
            adults: adults || 2,
            rooms: 1,
          };

          const testSettings = getSettings();
          const testableAttributes = testSettings.selectorTest.testableAttributes;
          const runtimeConfig: CheckerRuntimeConfig = {
            maxRetries: testSettings.checker.maxRetries,
            navigationTimeoutMs: testSettings.browser.navigationTimeoutMs,
            contentWaitMs: testSettings.browser.contentWaitMs,
            patternRetryMs: testSettings.browser.patternRetryMs,
            retryDelayMs: testSettings.checker.retryDelayMs,
            blockResourceTypes: testSettings.checker.blockResourceTypes,
          };

          const selectorCache = getPlatformSelectors(platform);
          const checker = platform === 'AIRBNB' ? checkAirbnb : checkAgoda;
          const result = await checker(testAccommodation, {
            testableAttributes,
            runtimeConfig,
            selectorCache,
          });

          console.log(`Test result: ${result.available ? 'Available' : 'Unavailable'} - ${result.price || 'N/A'}`);
          console.log(`Testable elements extracted: ${result.testableElements?.length ?? 0}`);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              available: result.available,
              price: result.price,
              error: result.error,
              metadata: result.metadata,
              checkUrl: result.checkUrl,
              matchedSelectors: result.matchedSelectors || [],
              matchedPatterns: result.matchedPatterns || [],
              testableElements: result.testableElements || [],
            }),
          );
        } catch (error) {
          console.error('Test error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error',
            }),
          );
        }
      });
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Not found',
      }),
    );
  });

  const PORT = process.env.WORKER_CONTROL_PORT || 3500;
  server.listen(PORT, (): void => {
    console.log(`Worker Control Server listening on port ${PORT}`);
  });

  // ============================================
  // Smart Heartbeat Update
  // ============================================
  let lastHeartbeatUpdateAt = 0;
  const HEARTBEAT_MIN_INTERVAL_MS = 60_000; // 1분

  setInterval(async (): Promise<void> => {
    try {
      const now = Date.now();
      const elapsed = now - lastHeartbeatUpdateAt;

      if (elapsed >= HEARTBEAT_MIN_INTERVAL_MS) {
        lastHeartbeatUpdateAt = now;
        await updateHeartbeat(false);

        await recordHeartbeatHistory('healthy', false, process.uptime());
      }
    } catch (error) {
      console.error('Heartbeat update failed:', error);
    }
  }, 20_000);
}

main().catch((error): void => {
  console.error('Worker start failed:', error);
  process.exit(1);
});
