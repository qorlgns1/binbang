import type { CheckJobPayload } from '@workspace/worker-shared/jobs';
import {
  createCheckCycle,
  findActiveCaseLinks,
  findActiveAccommodations,
  getSettings,
  loadSettings,
  retryStaleCaseNotifications,
  updateHeartbeat,
  type Job,
  type Queue,
} from '@workspace/worker-shared/runtime';

export function createCycleProcessor(checkQueue: Queue): (job: Job) => Promise<void> {
  return async (job: Job): Promise<void> => {
    if (job.name === 'notification-retry') {
      const retryResult = await retryStaleCaseNotifications({ batchSize: 25, pendingStaleMs: 2 * 60_000 });
      console.log(
        `\n[notification-retry] scanned=${retryResult.scanned} claimed=${retryResult.claimed} sent=${retryResult.sent} failed=${retryResult.failed} skipped=${retryResult.skipped}`,
      );
      return;
    }

    await loadSettings().catch((err: unknown): void => console.warn('Settings refresh failed, using cache:', err));

    const settings = getSettings();

    console.log('\n========================================');
    console.log(`Monitoring started: ${new Date().toLocaleString('ko-KR')}`);
    console.log(`Concurrency: ${settings.worker.concurrency}`);
    console.log('========================================');

    await updateHeartbeat(true);

    const startTime = Date.now();

    const accommodations = await findActiveAccommodations();

    // ACTIVE_MONITORING 상태 Case 중 숙소가 연결된 것들을 조회
    const caseByAccommodationId = await findActiveCaseLinks();

    console.log(`Accommodations to check: ${accommodations.length}`);
    if (caseByAccommodationId.size > 0) {
      console.log(`Active cases with linked accommodations: ${caseByAccommodationId.size}`);
    }

    if (accommodations.length === 0) {
      console.log('No accommodations to check.\n');
      await updateHeartbeat(false);
      return;
    }

    const cycleId = await createCheckCycle({
      startedAt: new Date(startTime),
      totalCount: accommodations.length,
      concurrency: settings.worker.concurrency,
      browserPoolSize: settings.worker.browserPoolSize,
      navigationTimeoutMs: settings.browser.navigationTimeoutMs,
      contentWaitMs: settings.browser.contentWaitMs,
      maxRetries: settings.checker.maxRetries,
    });

    const jobs = accommodations.map((acc): { name: string; data: CheckJobPayload } => {
      const caseLink = caseByAccommodationId.get(acc.id);
      return {
        name: 'check',
        data: {
          cycleId,
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
          ...(caseLink && { caseId: caseLink.caseId, conditionDefinition: caseLink.conditionDefinition }),
        } satisfies CheckJobPayload,
      };
    });

    await checkQueue.addBulk(jobs);

    console.log(`${accommodations.length} check jobs queued for cycle ${cycleId}`);
  };
}
