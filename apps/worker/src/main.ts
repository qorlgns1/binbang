// Worker Entry Point
// ============================================
import { prisma } from '@workspace/db';
import {
  checkAgoda,
  checkAirbnb,
  closeBrowserPool,
  getSettings,
  initBrowserPool,
  invalidateSelectorCache,
  loadPlatformSelectors,
  recordHeartbeatHistory,
  startHeartbeatMonitoring,
  updateHeartbeat,
} from '@workspace/shared/worker';
import 'dotenv/config';
import { createServer } from 'http';
import cron from 'node-cron';

import { getCronConfig, initCronConfig, logConfig } from './config';
import { checkAllAccommodations, isProcessing } from './processor';

async function main(): Promise<void> {
  // 1. DB에서 설정 로드 + 워커 설정 초기화
  await initCronConfig();
  const config = getCronConfig();

  // 2. 브라우저 풀 초기화
  initBrowserPool(config.browserPoolSize);

  // 3. 시작 로그
  console.log(`\nWorker started`);
  logConfig();
  console.log(`Waiting for next execution...\n`);

  // 하트비트 모니터링 시작
  startHeartbeatMonitoring();

  // 4. Worker Heartbeat 기록
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
    .catch((error) => {
      console.error('Error starting worker heartbeat:', error);
    });

  // 5. 초기 실행 (딜레이 후)
  setTimeout(() => {
    checkAllAccommodations();
  }, config.startupDelay);

  // 6. 크론 스케줄 등록
  const scheduledTask = cron.schedule(config.schedule, checkAllAccommodations);

  // 7. 프로세스 종료 핸들링
  let isShuttingDown = false;

  async function gracefulShutdown(): Promise<void> {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\nShutdown signal received. Stopping worker...`);

    scheduledTask.stop();
    console.log('   - Cron schedule stopped');

    if (isProcessing()) {
      console.log('   - Waiting for running jobs to complete...');

      const startWait = Date.now();
      while (isProcessing() && Date.now() - startWait < config.shutdownTimeoutMs) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (isProcessing()) {
        console.log('   Timeout: Could not wait for job completion.');
      } else {
        console.log('   - All jobs completed');
      }
    }

    await closeBrowserPool();
    console.log('   - Browser pool closed');

    await prisma.$disconnect();
    console.log('   - DB disconnected');
    console.log('Worker stopped\n');

    process.exit(0);
  }

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

main().catch((error) => {
  console.error('Worker start failed:', error);
  process.exit(1);
});

// ============================================
// HTTP Control Server
// ============================================
const server = createServer((req, res) => {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/restart' && req.method === 'POST') {
    console.log('Worker restart requested');

    // 1초 후 종료하여 Docker가 재시작하도록 함
    setTimeout(() => {
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

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        isProcessing: isProcessing(),
      }),
    );
    return;
  }

  // 셀렉터 캐시 무효화 엔드포인트
  if (req.url === '/cache/invalidate' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const { platform } = body ? JSON.parse(body) : {};

        console.log(`Selector cache invalidation requested: ${platform || 'all'}`);

        // 캐시 무효화
        const invalidated = invalidateSelectorCache(platform);

        // 즉시 DB에서 다시 로드
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
  if (req.url === '/test' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const { url, platform, checkIn, checkOut, adults } = JSON.parse(body);

        if (!url || !platform) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'url and platform are required' }));
          return;
        }

        console.log(`Selector test requested: ${platform} - ${url}`);

        // 테스트용 가상 숙소 객체 생성
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

        // 테스트 속성 설정 로드
        const settings = getSettings();
        const testableAttributes = settings.selectorTest.testableAttributes;

        // 플랫폼에 따라 체커 호출 (testableAttributes 전달)
        const checker = platform === 'AIRBNB' ? checkAirbnb : checkAgoda;
        const result = await checker(testAccommodation, { testableAttributes });

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
server.listen(PORT, () => {
  console.log(`Worker Control Server listening on port ${PORT}`);
});

// ============================================
// Smart Heartbeat Update
// ============================================
let lastHeartbeatUpdateAt = 0;
const HEARTBEAT_MIN_INTERVAL_MS = 60_000; // 1분

// 20초마다 하트비트 업데이트 (스마트 로직)
setInterval(async () => {
  try {
    const now = Date.now();
    const elapsed = now - lastHeartbeatUpdateAt;

    // 처리 중이거나, 1분 이상 업데이트되지 않았을 때 DB 업데이트
    if (isProcessing() || elapsed >= HEARTBEAT_MIN_INTERVAL_MS) {
      lastHeartbeatUpdateAt = now;
      await updateHeartbeat(isProcessing());

      // 하트비트 히스토리 기록
      const status = isProcessing() ? 'processing' : 'healthy';
      await recordHeartbeatHistory(status, isProcessing(), process.uptime());
    }
  } catch (error) {
    console.error('Heartbeat update failed:', error);
  }
}, 20_000); // 20초마다 확인
