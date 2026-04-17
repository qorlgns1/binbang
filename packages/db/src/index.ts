// DataSource & 초기화 함수
export { AppDataSource, getDataSource } from './data-source.ts';

// TypeORM types used by service layer
export type { EntityManager, Repository } from 'typeorm';
export {
  Between,
  In,
  IsNull,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
  QueryFailedError,
} from 'typeorm';

// Entities
export { Account } from './entities/auth/account.entity.ts';
export { Session } from './entities/auth/session.entity.ts';
export { User } from './entities/auth/user.entity.ts';
export { VerificationToken } from './entities/auth/verification-token.entity.ts';

export { AgodaConsentLog } from './entities/agoda/agoda-consent-log.entity.ts';
export { AgodaAlertEvent } from './entities/agoda/agoda-alert-event.entity.ts';
export { AgodaHotel } from './entities/agoda/agoda-hotel.entity.ts';
export { AgodaHotelSearch } from './entities/agoda/agoda-hotel-search.entity.ts';
export { AgodaNotification } from './entities/agoda/agoda-notification.entity.ts';
export { AgodaPollRun } from './entities/agoda/agoda-poll-run.entity.ts';
export { AgodaRoomSnapshot } from './entities/agoda/agoda-room-snapshot.entity.ts';

export { AffiliateAdvertiser } from './entities/affiliate/affiliate-advertiser.entity.ts';
export { AffiliateAuditJobState } from './entities/affiliate/affiliate-audit-job-state.entity.ts';
export { AffiliateAuditPurgeRun } from './entities/affiliate/affiliate-audit-purge-run.entity.ts';
export { AffiliateEvent } from './entities/affiliate/affiliate-event.entity.ts';
export { AffiliatePreferenceAuditLog } from './entities/affiliate/affiliate-preference-audit-log.entity.ts';
export { ConversationPreference } from './entities/affiliate/conversation-preference.entity.ts';

export { BillingEvent } from './entities/billing/billing-event.entity.ts';
export { ConditionMetEvent } from './entities/billing/condition-met-event.entity.ts';
export { PriceQuote } from './entities/billing/price-quote.entity.ts';
export { Subscription } from './entities/billing/subscription.entity.ts';

export { Case } from './entities/case/case.entity.ts';
export { CaseMessage } from './entities/case/case-message.entity.ts';
export { CaseNotification } from './entities/case/case-notification.entity.ts';
export { CaseStatusLog } from './entities/case/case-status-log.entity.ts';
export { FormQuestionMapping } from './entities/case/form-question-mapping.entity.ts';
export { FormSubmission } from './entities/case/form-submission.entity.ts';

export { Accommodation } from './entities/core/accommodation.entity.ts';
export { CheckCycle } from './entities/core/check-cycle.entity.ts';
export { CheckLog } from './entities/core/check-log.entity.ts';
export { HeartbeatHistory } from './entities/core/heartbeat-history.entity.ts';
export { WorkerHeartbeat } from './entities/core/worker-heartbeat.entity.ts';

export { PublicAvailabilityPrediction } from './entities/public/public-availability-prediction.entity.ts';
export { PublicAvailabilitySnapshot } from './entities/public/public-availability-snapshot.entity.ts';
export { PublicProperty } from './entities/public/public-property.entity.ts';

export { AuditLog } from './entities/rbac/audit-log.entity.ts';
export { Permission } from './entities/rbac/permission.entity.ts';
export { Plan } from './entities/rbac/plan.entity.ts';
export { PlanQuota } from './entities/rbac/plan-quota.entity.ts';
export { Role } from './entities/rbac/role.entity.ts';

export { PlatformPattern } from './entities/selector/platform-pattern.entity.ts';
export { PlatformSelector } from './entities/selector/platform-selector.entity.ts';
export { SelectorChangeLog } from './entities/selector/selector-change-log.entity.ts';

export { LandingEvent } from './entities/settings/landing-event.entity.ts';
export { SettingsChangeLog } from './entities/settings/settings-change-log.entity.ts';
export { SystemSettings } from './entities/settings/system-settings.entity.ts';

export { Destination } from './entities/travel/destination.entity.ts';
export { TravelConversation } from './entities/travel/travel-conversation.entity.ts';
export { TravelEntity } from './entities/travel/travel-entity.entity.ts';
export { TravelMessage } from './entities/travel/travel-message.entity.ts';

// Enums
export * from './enums.ts';

// Shared Agoda catalog helpers
export * from './agoda-shared.ts';
