// Settings
export { getSettings, loadSettings } from './settings';
export { validateWorkerEnv, validateWebEnv, getEnv, getEnvNumber } from './settings/env';
export type { SystemSettingsCache } from './settings';

// Redis & Queue
export { createRedisConnection } from './connection';
export { createCycleQueue, createCheckQueue, QUEUE_NAMES } from './queues';
export { createCycleWorker, createCheckWorker } from './workers';
export type { CreateWorkerOptions } from './workers';
export { setupRepeatableJobs, removeRepeatableJobs } from './scheduler';
export { buildQueueSnapshot } from './queueSnapshot';
export type { QueueSnapshotResponse, QueueStats, QueueJobState, QueueJobSummary } from './queueSnapshot';
export {
  anonymizeExpiredLandingEventPii,
  DEFAULT_LANDING_EVENT_PII_RETENTION_DAYS,
} from './landingEventRetention';
export type { LandingEventPiiRetentionInput, LandingEventPiiRetentionResult } from './landingEventRetention';

// Heartbeat
export {
  updateHeartbeat,
  startHeartbeatMonitoring,
  stopHeartbeatMonitoring,
  recordHeartbeatHistory,
  getHeartbeatHistory,
} from './heartbeat';
export type { HeartbeatHistoryItem } from './heartbeat';

// Notifications
export { notifyAvailable, sendKakaoNotification, sendAlertNotification } from './notifications';

// Selectors (DB-backed loader; browser receives data via injection)
export {
  getPlatformSelectors,
  loadPlatformSelectors,
  invalidateSelectorCache,
  preloadSelectorCache,
  buildExtractorCode,
} from './selectors';
export type { PlatformSelectorCache, SelectorConfig } from './selectors';

// Evidence
export { createConditionMetEvent } from './evidence';
export type { CreateConditionMetEventInput } from './evidence';

// Condition trigger (atomic billing + notification)
export { triggerConditionMet } from './conditionTrigger';
export type { TriggerConditionMetInput, TriggerConditionMetResult } from './conditionTrigger';

// Case notifications (retry queue)
export { retryStaleCaseNotifications } from './caseNotifications';
export type { RetryCaseNotificationsOptions, RetryCaseNotificationsResult } from './caseNotifications';

// Cases
export { findActiveCaseLinks } from './cases';
export type { ActiveCaseLink } from './cases';

// Status utilities
export { determineStatus, nightsBetween, isSameStayDates, shouldSendAvailabilityNotification } from './status';

// Check log
export { saveCheckLog } from './checkLog';
export type { SaveCheckLogInput } from './checkLog';

// Post-check operations
export { sendNotificationIfNeeded, updateAccommodationStatus } from './postCheck';
export type { SendNotificationInput } from './postCheck';

// Cycle management
export { findActiveAccommodations, createCheckCycle, finalizeCycleCounter } from './cycle';
export type { ActiveAccommodation, CreateCheckCycleInput } from './cycle';

// BullMQ types (re-exported for consumer convenience)
export type { Queue, Worker, Job } from 'bullmq';
