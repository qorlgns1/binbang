/**
 * @shared/worker - Worker-only shared code
 *
 * This module contains code that should only be used by apps/worker.
 * apps/web MUST NOT import from this module.
 *
 * Organized into four domains (rules.md §4):
 * - browser/       Browser automation (execution only)
 * - jobs/          Job type definitions
 * - runtime/       Execution strategy, settings, queues
 * - observability/ Heartbeat, notifications, logging
 */

// Browser automation
export { checkAccommodation } from './browser';
export type { CheckAccommodationOptions, CheckerRuntimeConfig } from './browser';
export type { BrowserLaunchConfig, PageSetupConfig, BrowserPoolConfig } from './browser';
export { checkAirbnb } from './browser/airbnb';
export { checkAgoda } from './browser/agoda';
export { initBrowserPool, closeBrowserPool, acquireBrowser, releaseBrowser } from './browser/browserPool';

// Runtime — Settings
export { getSettings, loadSettings } from './runtime/settings';
export { validateWorkerEnv, validateWebEnv, getEnv, getEnvNumber } from './runtime/settings/env';
export type { SystemSettingsCache } from './runtime/settings';

// Runtime — Redis & Queue
export { createRedisConnection } from './runtime/connection';
export { createCycleQueue, createCheckQueue, QUEUE_NAMES } from './runtime/queues';
export { createCycleWorker, createCheckWorker } from './runtime/workers';
export type { CreateWorkerOptions } from './runtime/workers';
export { setupRepeatableJobs, removeRepeatableJobs } from './runtime/scheduler';
export type { Queue, Worker, Job } from 'bullmq';

// Jobs
export type { CycleJobPayload, CheckJobPayload } from './jobs';

// Observability — Heartbeat
export {
  updateHeartbeat,
  startHeartbeatMonitoring,
  stopHeartbeatMonitoring,
  recordHeartbeatHistory,
  getHeartbeatHistory,
} from './observability/heartbeat';
export type { HeartbeatHistoryItem } from './observability/heartbeat';

// Browser — Selectors
export {
  loadPlatformSelectors,
  getPlatformSelectors,
  invalidateSelectorCache,
  preloadSelectorCache,
} from './browser/selectors';
export type { PlatformSelectorCache, SelectorConfig } from './browser/selectors';

// Observability — Kakao
export { notifyAvailable, sendKakaoMessage } from './observability/kakao/message';
