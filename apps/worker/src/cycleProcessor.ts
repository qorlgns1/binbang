import { prisma } from '@workspace/db';
import type { CheckJobPayload } from '@workspace/worker-shared/jobs';
import { getSettings, loadSettings, updateHeartbeat, type Job, type Queue } from '@workspace/worker-shared/runtime';

export function createCycleProcessor(checkQueue: Queue): (job: Job) => Promise<void> {
  return async (_job: Job): Promise<void> => {
    await loadSettings().catch((err: unknown): void => console.warn('Settings refresh failed, using cache:', err));

    const settings = getSettings();

    console.log('\n========================================');
    console.log(`Monitoring started: ${new Date().toLocaleString('ko-KR')}`);
    console.log(`Concurrency: ${settings.worker.concurrency}`);
    console.log('========================================');

    await updateHeartbeat(true);

    const startTime = Date.now();

    const accommodations = await prisma.accommodation.findMany({
      where: {
        isActive: true,
        checkIn: { gte: new Date() },
      },
      select: {
        id: true,
        name: true,
        url: true,
        platform: true,
        checkIn: true,
        checkOut: true,
        adults: true,
        lastStatus: true,
        user: { select: { id: true, kakaoAccessToken: true } },
      },
    });

    console.log(`Accommodations to check: ${accommodations.length}`);

    if (accommodations.length === 0) {
      console.log('No accommodations to check.\n');
      await updateHeartbeat(false);
      return;
    }

    const cycle = await prisma.checkCycle.create({
      data: {
        startedAt: new Date(startTime),
        totalCount: accommodations.length,
        concurrency: settings.worker.concurrency,
        browserPoolSize: settings.worker.browserPoolSize,
        navigationTimeoutMs: settings.browser.navigationTimeoutMs,
        contentWaitMs: settings.browser.contentWaitMs,
        maxRetries: settings.checker.maxRetries,
      },
      select: { id: true },
    });

    const jobs = accommodations.map((acc): { name: string; data: CheckJobPayload } => ({
      name: 'check',
      data: {
        cycleId: cycle.id,
        accommodationId: acc.id,
        name: acc.name,
        url: acc.url,
        platform: acc.platform,
        checkIn: acc.checkIn.toISOString(),
        checkOut: acc.checkOut.toISOString(),
        adults: acc.adults,
        userId: acc.user.id,
        kakaoAccessToken: acc.user.kakaoAccessToken,
        lastStatus: acc.lastStatus,
      } satisfies CheckJobPayload,
    }));

    await checkQueue.addBulk(jobs);

    console.log(`${accommodations.length} check jobs queued for cycle ${cycle.id}`);
  };
}
