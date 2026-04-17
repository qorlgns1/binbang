import 'reflect-metadata';
import oracledb from 'oracledb';
import { DataSource } from 'typeorm';

import { Account } from './entities/auth/account.entity.ts';
import { Session } from './entities/auth/session.entity.ts';
import { User } from './entities/auth/user.entity.ts';
import { VerificationToken } from './entities/auth/verification-token.entity.ts';
import { AgodaConsentLog } from './entities/agoda/agoda-consent-log.entity.ts';
import { AgodaAlertEvent } from './entities/agoda/agoda-alert-event.entity.ts';
import { AgodaHotel } from './entities/agoda/agoda-hotel.entity.ts';
import { AgodaHotelSearch } from './entities/agoda/agoda-hotel-search.entity.ts';
import { AgodaNotification } from './entities/agoda/agoda-notification.entity.ts';
import { AgodaPollRun } from './entities/agoda/agoda-poll-run.entity.ts';
import { AgodaRoomSnapshot } from './entities/agoda/agoda-room-snapshot.entity.ts';
import { AffiliateAdvertiser } from './entities/affiliate/affiliate-advertiser.entity.ts';
import { AffiliateAuditJobState } from './entities/affiliate/affiliate-audit-job-state.entity.ts';
import { AffiliateAuditPurgeRun } from './entities/affiliate/affiliate-audit-purge-run.entity.ts';
import { AffiliateEvent } from './entities/affiliate/affiliate-event.entity.ts';
import { AffiliatePreferenceAuditLog } from './entities/affiliate/affiliate-preference-audit-log.entity.ts';
import { ConversationPreference } from './entities/affiliate/conversation-preference.entity.ts';
import { BillingEvent } from './entities/billing/billing-event.entity.ts';
import { ConditionMetEvent } from './entities/billing/condition-met-event.entity.ts';
import { PriceQuote } from './entities/billing/price-quote.entity.ts';
import { Subscription } from './entities/billing/subscription.entity.ts';
import { Case } from './entities/case/case.entity.ts';
import { CaseMessage } from './entities/case/case-message.entity.ts';
import { CaseNotification } from './entities/case/case-notification.entity.ts';
import { CaseStatusLog } from './entities/case/case-status-log.entity.ts';
import { FormQuestionMapping } from './entities/case/form-question-mapping.entity.ts';
import { FormSubmission } from './entities/case/form-submission.entity.ts';
import { Accommodation } from './entities/core/accommodation.entity.ts';
import { CheckCycle } from './entities/core/check-cycle.entity.ts';
import { CheckLog } from './entities/core/check-log.entity.ts';
import { HeartbeatHistory } from './entities/core/heartbeat-history.entity.ts';
import { WorkerHeartbeat } from './entities/core/worker-heartbeat.entity.ts';
import { PublicAvailabilityPrediction } from './entities/public/public-availability-prediction.entity.ts';
import { PublicAvailabilitySnapshot } from './entities/public/public-availability-snapshot.entity.ts';
import { PublicProperty } from './entities/public/public-property.entity.ts';
import { AuditLog } from './entities/rbac/audit-log.entity.ts';
import { Permission } from './entities/rbac/permission.entity.ts';
import { Plan } from './entities/rbac/plan.entity.ts';
import { PlanQuota } from './entities/rbac/plan-quota.entity.ts';
import { Role } from './entities/rbac/role.entity.ts';
import { PlatformPattern } from './entities/selector/platform-pattern.entity.ts';
import { PlatformSelector } from './entities/selector/platform-selector.entity.ts';
import { SelectorChangeLog } from './entities/selector/selector-change-log.entity.ts';
import { LandingEvent } from './entities/settings/landing-event.entity.ts';
import { SettingsChangeLog } from './entities/settings/settings-change-log.entity.ts';
import { SystemSettings } from './entities/settings/system-settings.entity.ts';
import { Destination } from './entities/travel/destination.entity.ts';
import { TravelConversation } from './entities/travel/travel-conversation.entity.ts';
import { TravelEntity } from './entities/travel/travel-entity.entity.ts';
import { TravelMessage } from './entities/travel/travel-message.entity.ts';
import { InitialOracleSchema1744000000000 } from './migrations/1744000000000-InitialOracleSchema.ts';
import { OracleTextIndexes1744000000001 } from './migrations/1744000000001-OracleTextIndexes.ts';

// oracledb thin mode — Oracle Instant Client 불필요
// mTLS OFF이므로 Wallet도 불필요
if (!oracledb.fetchAsString.includes(oracledb.CLOB)) {
  // Oracle thin driver에서 CLOB을 LOB 스트림으로 다루면 간헐적으로 buffer 오류가 난다.
  // 문자열로 강제 fetch해 서비스 레이어가 일반 string/null로만 다루게 만든다.
  oracledb.fetchAsString = [...oracledb.fetchAsString, oracledb.CLOB];
}

export const AppDataSource = new DataSource({
  type: 'oracle',
  connectString: process.env.ORACLE_CONNECT_STRING,
  username: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  // oracledb thin mode에서 statement caching이 간헐적 ERR_BUFFER_OUT_OF_BOUNDS를 유발.
  // 캐시 비활성화로 연결 상태 오염을 방지한다.
  extra: { stmtCacheSize: 0 },
  entities: [
    Account,
    Session,
    User,
    VerificationToken,
    AgodaConsentLog,
    AgodaAlertEvent,
    AgodaHotel,
    AgodaHotelSearch,
    AgodaNotification,
    AgodaPollRun,
    AgodaRoomSnapshot,
    AffiliateAdvertiser,
    AffiliateAuditJobState,
    AffiliateAuditPurgeRun,
    AffiliateEvent,
    AffiliatePreferenceAuditLog,
    ConversationPreference,
    BillingEvent,
    ConditionMetEvent,
    PriceQuote,
    Subscription,
    Case,
    CaseMessage,
    CaseNotification,
    CaseStatusLog,
    FormQuestionMapping,
    FormSubmission,
    Accommodation,
    CheckCycle,
    CheckLog,
    HeartbeatHistory,
    WorkerHeartbeat,
    PublicAvailabilityPrediction,
    PublicAvailabilitySnapshot,
    PublicProperty,
    AuditLog,
    Permission,
    Plan,
    PlanQuota,
    Role,
    PlatformPattern,
    PlatformSelector,
    SelectorChangeLog,
    LandingEvent,
    SettingsChangeLog,
    SystemSettings,
    Destination,
    TravelConversation,
    TravelEntity,
    TravelMessage,
  ],
  migrations: [InitialOracleSchema1744000000000, OracleTextIndexes1744000000001],
});

let dataSourceInitializationPromise: Promise<DataSource> | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }

  if (!dataSourceInitializationPromise) {
    dataSourceInitializationPromise = AppDataSource.initialize().catch((error: unknown) => {
      dataSourceInitializationPromise = null;
      throw error;
    });
  }

  return dataSourceInitializationPromise;
}
