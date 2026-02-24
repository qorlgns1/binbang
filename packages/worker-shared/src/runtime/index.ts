// Settings
export { getSettings, loadSettings } from './settings';
export {
  validateWorkerEnv,
  validateWebEnv,
  getEnv,
  getEnvNumber,
  getAffiliateAuditPurgeConfig,
  getTravelCachePrewarmConfig,
} from './settings/env';
export type { SystemSettingsCache } from './settings';
export type {
  AffiliateAuditPurgeConfig,
  AffiliateAuditTelegramConfig,
  TravelCachePrewarmConfig,
} from './settings/env';

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
export {
  refreshPublicAvailabilitySnapshots,
  DEFAULT_PUBLIC_AVAILABILITY_WINDOW_DAYS,
} from './publicAvailabilitySnapshots';
export type {
  RefreshPublicAvailabilitySnapshotsInput,
  RefreshPublicAvailabilitySnapshotsResult,
} from './publicAvailabilitySnapshots';
export { generatePredictions, DEFAULT_PREDICTION_WINDOW_DAYS } from './availabilityPredictor';
export type { GeneratePredictionsInput, GeneratePredictionsResult } from './availabilityPredictor';
export {
  runAffiliateAuditPurge,
  checkAffiliateAuditPurgeCronMiss,
  AFFILIATE_AUDIT_PURGE_JOB_NAME,
} from './affiliateAuditPurge';
export type {
  RunAffiliateAuditPurgeOptions,
  RunAffiliateAuditPurgeResult,
  CheckAffiliateAuditPurgeCronMissOptions,
  CheckAffiliateAuditPurgeCronMissResult,
} from './affiliateAuditPurge';
export { triggerTravelCachePrewarm } from './travelCachePrewarm';
export type { TriggerTravelCachePrewarmResult, TravelCachePrewarmMetrics } from './travelCachePrewarm';

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
export {
  notifyAvailable,
  sendKakaoNotification,
  sendAlertNotification,
  sendEmailNotification,
  sendNotificationWithFallback,
} from './notifications';
export type { NotificationFallbackResult } from './notifications';

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

// Case expiration
export { expireOverdueCases } from './caseExpiration';
export type { ExpireOverdueCasesInput, ExpireOverdueCasesResult } from './caseExpiration';

// Travel guest cleanup
export {
  cleanupTravelGuestConversations,
  DEFAULT_TRAVEL_GUEST_RETENTION_DAYS,
} from './travelGuestCleanup';
export type {
  CleanupTravelGuestConversationsInput,
  CleanupTravelGuestConversationsResult,
} from './travelGuestCleanup';

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
