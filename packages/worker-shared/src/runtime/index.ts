// Settings
export { getSettings, loadSettings } from './settings/index.js';
export {
  validateWorkerEnv,
  validateWebEnv,
  getEnv,
  getEnvNumber,
  getAffiliateAuditPurgeConfig,
  getTravelCachePrewarmConfig,
  getBinbangCronConfig,
} from './settings/env.js';
export type { SystemSettingsCache } from './settings/index.js';
export type {
  AffiliateAuditPurgeConfig,
  AffiliateAuditTelegramConfig,
  TravelCachePrewarmConfig,
  BinbangCronConfig,
} from './settings/env.js';

// Redis & Queue
export { createRedisConnection } from './connection.js';
export { createCycleQueue, createCheckQueue, QUEUE_NAMES } from './queues.js';
export { createCycleWorker, createCheckWorker } from './workers.js';
export type { CreateWorkerOptions } from './workers.js';
export { setupRepeatableJobs, removeRepeatableJobs } from './scheduler.js';
export { buildQueueSnapshot } from './queueSnapshot.js';
export type { QueueSnapshotResponse, QueueStats, QueueJobState, QueueJobSummary } from './queueSnapshot.js';
export {
  anonymizeExpiredLandingEventPii,
  DEFAULT_LANDING_EVENT_PII_RETENTION_DAYS,
} from './landingEventRetention.js';
export type { LandingEventPiiRetentionInput, LandingEventPiiRetentionResult } from './landingEventRetention.js';
export {
  refreshPublicAvailabilitySnapshots,
  DEFAULT_PUBLIC_AVAILABILITY_WINDOW_DAYS,
} from './publicAvailabilitySnapshots.js';
export type {
  RefreshPublicAvailabilitySnapshotsInput,
  RefreshPublicAvailabilitySnapshotsResult,
} from './publicAvailabilitySnapshots.js';
export { generatePredictions, DEFAULT_PREDICTION_WINDOW_DAYS } from './availabilityPredictor.js';
export type { GeneratePredictionsInput, GeneratePredictionsResult } from './availabilityPredictor.js';
export {
  runAffiliateAuditPurge,
  checkAffiliateAuditPurgeCronMiss,
  AFFILIATE_AUDIT_PURGE_JOB_NAME,
} from './affiliateAuditPurge.js';
export type {
  RunAffiliateAuditPurgeOptions,
  RunAffiliateAuditPurgeResult,
  CheckAffiliateAuditPurgeCronMissOptions,
  CheckAffiliateAuditPurgeCronMissResult,
} from './affiliateAuditPurge.js';
export { triggerTravelCachePrewarm } from './travelCachePrewarm.js';
export type { TriggerTravelCachePrewarmResult, TravelCachePrewarmMetrics } from './travelCachePrewarm.js';
export {
  triggerBinbangPollDue,
  triggerBinbangDispatch,
  triggerBinbangSnapshotCleanup,
} from './binbangCron.js';

// Heartbeat
export {
  updateHeartbeat,
  startHeartbeatMonitoring,
  stopHeartbeatMonitoring,
  recordHeartbeatHistory,
  getHeartbeatHistory,
} from './heartbeat.js';
export type { HeartbeatHistoryItem } from './heartbeat.js';

// Notifications
export {
  notifyAvailable,
  sendKakaoNotification,
  sendAlertNotification,
  sendEmailNotification,
  sendNotificationWithFallback,
} from './notifications.js';
export type { NotificationFallbackResult } from './notifications.js';

// Selectors (DB-backed loader; browser receives data via injection)
export {
  getPlatformSelectors,
  loadPlatformSelectors,
  invalidateSelectorCache,
  preloadSelectorCache,
  buildExtractorCode,
} from './selectors/index.js';
export type { PlatformSelectorCache, SelectorConfig } from './selectors/index.js';

// Evidence
export { createConditionMetEvent } from './evidence.js';
export type { CreateConditionMetEventInput } from './evidence.js';

// Condition trigger (atomic billing + notification)
export { triggerConditionMet } from './conditionTrigger.js';
export type { TriggerConditionMetInput, TriggerConditionMetResult } from './conditionTrigger.js';

// Case notifications (retry queue)
export { retryStaleCaseNotifications } from './caseNotifications.js';
export type { RetryCaseNotificationsOptions, RetryCaseNotificationsResult } from './caseNotifications.js';

// Cases
export { findActiveCaseLinks } from './cases.js';
export type { ActiveCaseLink } from './cases.js';

// Case expiration
export { expireOverdueCases } from './caseExpiration.js';
export type { ExpireOverdueCasesInput, ExpireOverdueCasesResult } from './caseExpiration.js';

// Travel guest cleanup
export {
  cleanupTravelGuestConversations,
  DEFAULT_TRAVEL_GUEST_RETENTION_DAYS,
} from './travelGuestCleanup.js';
export type {
  CleanupTravelGuestConversationsInput,
  CleanupTravelGuestConversationsResult,
} from './travelGuestCleanup.js';

// Status utilities
export { determineStatus, nightsBetween, isSameStayDates, shouldSendAvailabilityNotification } from './status.js';

// Check log
export { saveCheckLog } from './checkLog.js';
export type { SaveCheckLogInput } from './checkLog.js';

// Post-check operations
export { sendNotificationIfNeeded, updateAccommodationStatus } from './postCheck.js';
export type { SendNotificationInput } from './postCheck.js';

// Cycle management
export { findActiveAccommodations, createCheckCycle, finalizeCycleCounter } from './cycle.js';
export type { ActiveAccommodation, CreateCheckCycleInput } from './cycle.js';

// BullMQ types (re-exported for consumer convenience)
export type { Queue, Worker, Job } from 'bullmq';
