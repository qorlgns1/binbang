import { type CheckerRuntimeConfig, checkAccommodation } from '@workspace/worker-shared/browser';
import type { CheckJobPayload } from '@workspace/worker-shared/jobs';
import {
  createConditionMetEvent,
  determineStatus,
  finalizeCycleCounter,
  getPlatformSelectors,
  getSettings,
  saveCheckLog,
  sendNotificationIfNeeded,
  updateAccommodationStatus,
  type Job,
} from '@workspace/worker-shared/runtime';

export async function processCheck(job: Job): Promise<void> {
  const data = job.data as CheckJobPayload;
  const startTime = Date.now();

  try {
    console.log(`\n[${data.name}] Check started`);

    const settings = getSettings();
    const runtimeConfig: CheckerRuntimeConfig = {
      maxRetries: settings.checker.maxRetries,
      navigationTimeoutMs: settings.browser.navigationTimeoutMs,
      contentWaitMs: settings.browser.contentWaitMs,
      patternRetryMs: settings.browser.patternRetryMs,
      retryDelayMs: settings.checker.retryDelayMs,
      blockResourceTypes: settings.checker.blockResourceTypes,
      captureScreenshot: !!data.caseId,
    };

    const selectorCache = getPlatformSelectors(data.platform);

    const result = await checkAccommodation(
      {
        id: data.accommodationId,
        url: data.url,
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        adults: data.adults,
        platform: data.platform,
      },
      { runtimeConfig, selectorCache },
    );

    const status = determineStatus(result);
    logStatus(status, result);

    const durationMs = Date.now() - startTime;

    const checkLogId = await saveCheckLog(
      {
        accommodationId: data.accommodationId,
        userId: data.userId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        cycleId: data.cycleId,
      },
      status,
      result,
      { durationMs, retryCount: result.retryCount, previousStatus: data.lastStatus },
    );

    // Case-linked 모니터링에서 AVAILABLE 감지 시 증거 생성
    if (data.caseId && status === 'AVAILABLE') {
      await createConditionMetEvent({
        caseId: data.caseId,
        checkLogId,
        evidenceSnapshot: {
          checkUrl: result.checkUrl,
          platform: data.platform,
          status,
          price: result.price,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          conditionDefinition: data.conditionDefinition ?? null,
        },
        screenshotBase64: result.screenshotBase64 ?? null,
        capturedAt: new Date(),
      });
      console.log(`  Evidence captured for case ${data.caseId}`);
    }

    await sendNotificationIfNeeded(
      {
        accommodationId: data.accommodationId,
        userId: data.userId,
        name: data.name,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        lastStatus: data.lastStatus,
        kakaoAccessToken: data.kakaoAccessToken,
        price: result.price,
        checkUrl: result.checkUrl,
      },
      status,
    );
    await updateAccommodationStatus(data.accommodationId, status, result.price, result.metadata);

    console.log(`  Done (${durationMs}ms)`);

    // Atomically update cycle counters and finalize if complete
    await finalizeCycleCounter(data.cycleId, status !== 'ERROR');
  } catch (error) {
    console.error(`  Processing failed:`, error);

    // Update cycle counter on failure
    await finalizeCycleCounter(data.cycleId, false).catch((): void => {});
  }
}

function logStatus(status: string, result: { error: string | null; price: string | null }): void {
  switch (status) {
    case 'ERROR':
      console.log(`  Error: ${result.error}`);
      break;
    case 'AVAILABLE':
      console.log(`  Available! ${result.price || ''}`);
      break;
    case 'UNAVAILABLE':
      console.log(`  Unavailable`);
      break;
  }
}
