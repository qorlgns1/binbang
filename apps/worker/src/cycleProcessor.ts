import type { CheckJobPayload } from '@workspace/worker-shared/jobs';
import {
  anonymizeExpiredLandingEventPii,
  createCheckCycle,
  expireOverdueCases,
  findActiveCaseLinks,
  findActiveAccommodations,
  getSettings,
  loadSettings,
  refreshPublicAvailabilitySnapshots,
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

    if (job.name === 'landing-event-pii-retention') {
      const retentionDaysRaw = (job.data as { retentionDays?: unknown } | undefined)?.retentionDays;
      const retentionDays =
        typeof retentionDaysRaw === 'number' && Number.isFinite(retentionDaysRaw) && retentionDaysRaw > 0
          ? Math.floor(retentionDaysRaw)
          : undefined;

      const result = await anonymizeExpiredLandingEventPii({ retentionDays });
      console.log(
        `[landing-event-pii-retention] retentionDays=${result.retentionDays} cutoffAt=${result.cutoffAt} anonymized=${result.anonymizedCount}`,
      );
      return;
    }

    if (job.name === 'public-availability-snapshot') {
      const windowDaysRaw = (job.data as { windowDays?: unknown } | undefined)?.windowDays;
      const windowDays =
        typeof windowDaysRaw === 'number' && Number.isFinite(windowDaysRaw) && windowDaysRaw > 0
          ? Math.floor(windowDaysRaw)
          : undefined;

      const result = await refreshPublicAvailabilitySnapshots({ windowDays });
      console.log(
        `[public-availability-snapshot] snapshotDate=${result.snapshotDate} window=${result.windowStartAt}~${result.windowEndAt} scanned=${result.scannedAccommodations} properties=${result.upsertedProperties} snapshots=${result.upsertedSnapshots} skippedWithoutKey=${result.skippedWithoutKey} queryMs=${result.queryTimeMs} aggregationMs=${result.aggregationTimeMs} upsertMs=${result.upsertTimeMs}`,
      );
      return;
    }

    if (job.name === 'case-expiration') {
      const result = await expireOverdueCases();
      console.log(
        `[case-expiration] scanned=${result.scannedCount} expired=${result.expiredCount} skippedNoWindow=${result.skippedNoWindow} elapsedMs=${result.elapsedMs}`,
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

    const expectedJobCount = accommodations.reduce((sum, acc) => {
      const caseLinks = caseByAccommodationId.get(acc.id) ?? [];
      return sum + Math.max(1, caseLinks.length);
    }, 0);

    const cycleId = await createCheckCycle({
      startedAt: new Date(startTime),
      totalCount: expectedJobCount,
      concurrency: settings.worker.concurrency,
      browserPoolSize: settings.worker.browserPoolSize,
      navigationTimeoutMs: settings.browser.navigationTimeoutMs,
      contentWaitMs: settings.browser.contentWaitMs,
      maxRetries: settings.checker.maxRetries,
    });

    const jobs = accommodations.flatMap((acc): { name: string; data: CheckJobPayload }[] => {
      const caseLinks = caseByAccommodationId.get(acc.id) ?? [];

      const baseData = {
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
      } satisfies CheckJobPayload;

      if (caseLinks.length === 0) {
        return [{ name: 'check', data: baseData }];
      }

      return caseLinks.map((caseLink) => ({
        name: 'check',
        data: {
          ...baseData,
          caseId: caseLink.caseId,
          conditionDefinition: caseLink.conditionDefinition,
        } satisfies CheckJobPayload,
      }));
    });

    await checkQueue.addBulk(jobs);

    console.log(`${jobs.length} check jobs queued for cycle ${cycleId}`);
  };
}
