import 'dotenv/config';

import type { DataSource } from 'typeorm';
import { In } from 'typeorm';

import {
  Account,
  BillingEvent,
  Case,
  CaseMessage,
  CaseNotification,
  CaseStatusLog,
  CheckCycle,
  CheckLog,
  ConditionMetEvent,
  FormSubmission,
  HeartbeatHistory,
  Plan,
  Role,
  Session,
  SettingsChangeLog,
  User,
  VerificationToken,
  WorkerHeartbeat,
  Accommodation,
} from '../src/index.ts';
import {
  SEED_ACCOMMODATIONS,
  SEED_ACCOUNTS,
  SEED_BILLING_EVENTS,
  SEED_CASE_MESSAGES,
  SEED_CASE_NOTIFICATIONS,
  SEED_CASE_STATUS_LOGS,
  SEED_CASES,
  SEED_CHECK_CYCLES,
  SEED_CHECK_LOGS,
  SEED_CONDITION_MET_EVENTS,
  SEED_FORM_SUBMISSIONS,
  SEED_HEARTBEAT_HISTORY,
  SEED_SESSIONS,
  SEED_SETTINGS_CHANGE_LOGS,
  SEED_USERS,
  SEED_VERIFICATION_TOKENS,
  SEED_WORKER_HEARTBEAT,
  SEED_NOW,
  type SeedUserKey,
} from '../src/constants/index.ts';
import { destroyDataSource, getManagedDataSource, upsertEntity } from './seed-helpers.ts';
import { seedBase } from './seed-base.ts';

function assertUserIds(ids: Partial<Record<SeedUserKey, string>>): asserts ids is Record<SeedUserKey, string> {
  for (const user of SEED_USERS) {
    if (!ids[user.key]) {
      throw new Error(`Seed user id missing for key="${user.key}"`);
    }
  }
}

export async function seed(existingDataSource?: DataSource): Promise<void> {
  const { ds, shouldDestroy } = await getManagedDataSource(existingDataSource);

  try {
    console.log('🌱 Seeding development data...');
    await seedBase(ds);
    console.log('');

    const planRepo = ds.getRepository(Plan);
    const roleRepo = ds.getRepository(Role);
    const userRepo = ds.getRepository(User);
    const accountRepo = ds.getRepository(Account);
    const sessionRepo = ds.getRepository(Session);
    const verificationTokenRepo = ds.getRepository(VerificationToken);
    const accommodationRepo = ds.getRepository(Accommodation);
    const formSubmissionRepo = ds.getRepository(FormSubmission);
    const caseRepo = ds.getRepository(Case);
    const cycleRepo = ds.getRepository(CheckCycle);
    const checkLogRepo = ds.getRepository(CheckLog);
    const caseStatusLogRepo = ds.getRepository(CaseStatusLog);
    const conditionMetEventRepo = ds.getRepository(ConditionMetEvent);
    const billingEventRepo = ds.getRepository(BillingEvent);
    const caseNotificationRepo = ds.getRepository(CaseNotification);
    const caseMessageRepo = ds.getRepository(CaseMessage);
    const workerHeartbeatRepo = ds.getRepository(WorkerHeartbeat);
    const heartbeatHistoryRepo = ds.getRepository(HeartbeatHistory);
    const settingsChangeLogRepo = ds.getRepository(SettingsChangeLog);

    const freePlan = await planRepo.findOne({ where: { name: 'FREE' } });
    const userIdByKey: Partial<Record<SeedUserKey, string>> = {};

    for (const seededUser of SEED_USERS) {
      const roles = await roleRepo.findBy({ name: In([...seededUser.roleNames]) });
      const existing = await userRepo.findOne({
        where: { email: seededUser.email },
        relations: { roles: true },
      });

      const user = await userRepo.save(
        userRepo.create({
          ...(existing ?? {}),
          email: seededUser.email,
          name: seededUser.name,
          password: seededUser.passwordHash,
          emailVerified: existing?.emailVerified ?? SEED_NOW,
          planId: freePlan?.id ?? null,
          roles,
        }),
      );

      userIdByKey[seededUser.key] = user.id;
    }
    console.log(`   ✓ Users: ${SEED_USERS.length}`);

    assertUserIds(userIdByKey);

    for (const seededAccount of SEED_ACCOUNTS) {
      await upsertEntity(
        accountRepo,
        {
          where: {
            provider: seededAccount.provider,
            providerAccountId: seededAccount.providerAccountId,
          },
        },
        {
          userId: userIdByKey[seededAccount.userKey],
          type: seededAccount.type,
          provider: seededAccount.provider,
          providerAccountId: seededAccount.providerAccountId,
          refresh_token: seededAccount.refresh_token,
          access_token: seededAccount.access_token,
          expires_at: seededAccount.expires_at,
          token_type: seededAccount.token_type,
          scope: seededAccount.scope,
          id_token: seededAccount.id_token,
          session_state: seededAccount.session_state,
          refresh_token_expires_in: seededAccount.refresh_token_expires_in,
        },
      );
    }
    console.log(`   ✓ Accounts: ${SEED_ACCOUNTS.length}`);

    for (const seededSession of SEED_SESSIONS) {
      await upsertEntity(
        sessionRepo,
        { where: { sessionToken: seededSession.sessionToken } },
        {
          sessionToken: seededSession.sessionToken,
          userId: userIdByKey[seededSession.userKey],
          expires: seededSession.expires,
        },
      );
    }
    console.log(`   ✓ Sessions: ${SEED_SESSIONS.length}`);

    for (const token of SEED_VERIFICATION_TOKENS) {
      await upsertEntity(
        verificationTokenRepo,
        { where: { token: token.token } },
        {
          identifier: token.identifier,
          token: token.token,
          expires: token.expires,
        },
      );
    }
    console.log(`   ✓ VerificationTokens: ${SEED_VERIFICATION_TOKENS.length}`);

    for (const seededAccommodation of SEED_ACCOMMODATIONS) {
      await upsertEntity(
        accommodationRepo,
        { where: { id: seededAccommodation.id } },
        {
          id: seededAccommodation.id,
          userId: userIdByKey[seededAccommodation.userKey],
          name: seededAccommodation.name,
          platform: seededAccommodation.platform,
          url: seededAccommodation.url,
          checkIn: seededAccommodation.checkIn,
          checkOut: seededAccommodation.checkOut,
          adults: seededAccommodation.adults,
          isActive: seededAccommodation.isActive,
          lastCheck: seededAccommodation.lastCheck,
          lastStatus: seededAccommodation.lastStatus,
          lastPrice: seededAccommodation.lastPrice,
          lastPriceAmount: seededAccommodation.lastPriceAmount,
          lastPriceCurrency: seededAccommodation.lastPriceCurrency,
        },
      );
    }
    console.log(`   ✓ Accommodations: ${SEED_ACCOMMODATIONS.length}`);

    for (const submission of SEED_FORM_SUBMISSIONS) {
      await upsertEntity(
        formSubmissionRepo,
        { where: { id: submission.id } },
        {
          id: submission.id,
          responseId: submission.responseId,
          status: submission.status,
          rawPayload: submission.rawPayload,
          extractedFields: submission.extractedFields,
          rejectionReason: submission.rejectionReason,
          consentBillingOnConditionMet: submission.consentBillingOnConditionMet,
          consentServiceScope: submission.consentServiceScope,
          consentCapturedAt: submission.consentCapturedAt,
          consentTexts: submission.consentTexts,
          receivedAt: submission.receivedAt,
        },
      );
    }
    console.log(`   ✓ FormSubmissions: ${SEED_FORM_SUBMISSIONS.length}`);

    for (const seededCase of SEED_CASES) {
      await upsertEntity(
        caseRepo,
        { where: { id: seededCase.id } },
        {
          id: seededCase.id,
          submissionId: seededCase.submissionId,
          status: seededCase.status,
          assignedTo: seededCase.assignedToKey ? userIdByKey[seededCase.assignedToKey] : null,
          statusChangedAt: seededCase.statusChangedAt,
          statusChangedBy: seededCase.statusChangedByKey ? userIdByKey[seededCase.statusChangedByKey] : null,
          note: seededCase.note,
          ambiguityResult: seededCase.ambiguityResult,
          clarificationResolvedAt: seededCase.clarificationResolvedAt,
          paymentConfirmedAt: seededCase.paymentConfirmedAt,
          paymentConfirmedBy: seededCase.paymentConfirmedByKey ? userIdByKey[seededCase.paymentConfirmedByKey] : null,
          accommodationId: seededCase.accommodationId,
          createdAt: seededCase.createdAt,
        },
      );
    }
    console.log(`   ✓ Cases: ${SEED_CASES.length}`);

    for (const cycle of SEED_CHECK_CYCLES) {
      await upsertEntity(
        cycleRepo,
        { where: { id: cycle.id } },
        {
          id: cycle.id,
          startedAt: cycle.startedAt,
          completedAt: cycle.completedAt,
          durationMs: cycle.durationMs,
          totalCount: cycle.totalCount,
          successCount: cycle.successCount,
          errorCount: cycle.errorCount,
          concurrency: cycle.concurrency,
          browserPoolSize: cycle.browserPoolSize,
          navigationTimeoutMs: cycle.navigationTimeoutMs,
          contentWaitMs: cycle.contentWaitMs,
          maxRetries: cycle.maxRetries,
          createdAt: cycle.createdAt,
        },
      );
    }
    console.log(`   ✓ CheckCycles: ${SEED_CHECK_CYCLES.length}`);

    for (const log of SEED_CHECK_LOGS) {
      await upsertEntity(
        checkLogRepo,
        { where: { id: log.id } },
        {
          id: log.id,
          userId: userIdByKey[log.userKey],
          accommodationId: log.accommodationId,
          status: log.status,
          price: log.price,
          priceAmount: log.priceAmount,
          priceCurrency: log.priceCurrency,
          errorMessage: log.errorMessage,
          notificationSent: log.notificationSent,
          checkIn: log.checkIn,
          checkOut: log.checkOut,
          pricePerNight: log.pricePerNight,
          cycleId: log.cycleId,
          durationMs: log.durationMs,
          retryCount: log.retryCount,
          previousStatus: log.previousStatus,
          createdAt: log.createdAt,
        },
      );
    }
    console.log(`   ✓ CheckLogs: ${SEED_CHECK_LOGS.length}`);

    for (const log of SEED_CASE_STATUS_LOGS) {
      await upsertEntity(
        caseStatusLogRepo,
        { where: { id: log.id } },
        {
          id: log.id,
          caseId: log.caseId,
          fromStatus: log.fromStatus,
          toStatus: log.toStatus,
          changedById: userIdByKey[log.changedByKey],
          reason: log.reason,
          createdAt: log.createdAt,
        },
      );
    }
    console.log(`   ✓ CaseStatusLogs: ${SEED_CASE_STATUS_LOGS.length}`);

    for (const event of SEED_CONDITION_MET_EVENTS) {
      await upsertEntity(
        conditionMetEventRepo,
        { where: { id: event.id } },
        {
          id: event.id,
          caseId: event.caseId,
          checkLogId: event.checkLogId,
          evidenceSnapshot: event.evidenceSnapshot,
          screenshotBase64: event.screenshotBase64,
          capturedAt: event.capturedAt,
          createdAt: event.createdAt,
        },
      );
    }
    console.log(`   ✓ ConditionMetEvents: ${SEED_CONDITION_MET_EVENTS.length}`);

    for (const billing of SEED_BILLING_EVENTS) {
      await upsertEntity(
        billingEventRepo,
        { where: { id: billing.id } },
        {
          id: billing.id,
          caseId: billing.caseId,
          type: billing.type,
          conditionMetEventId: billing.conditionMetEventId,
          amountKrw: billing.amountKrw,
          description: billing.description,
          createdAt: billing.createdAt,
        },
      );
    }
    console.log(`   ✓ BillingEvents: ${SEED_BILLING_EVENTS.length}`);

    for (const notification of SEED_CASE_NOTIFICATIONS) {
      await upsertEntity(
        caseNotificationRepo,
        { where: { id: notification.id } },
        {
          id: notification.id,
          caseId: notification.caseId,
          channel: notification.channel,
          status: notification.status,
          payload: notification.payload,
          sentAt: notification.sentAt,
          failReason: notification.failReason,
          retryCount: notification.retryCount,
          maxRetries: notification.maxRetries,
          idempotencyKey: notification.idempotencyKey,
          createdAt: notification.createdAt,
        },
      );
    }
    console.log(`   ✓ CaseNotifications: ${SEED_CASE_NOTIFICATIONS.length}`);

    for (const message of SEED_CASE_MESSAGES) {
      await upsertEntity(
        caseMessageRepo,
        { where: { id: message.id } },
        {
          id: message.id,
          caseId: message.caseId,
          templateKey: message.templateKey,
          channel: message.channel,
          content: message.content,
          sentById: userIdByKey[message.sentByKey],
          createdAt: message.createdAt,
        },
      );
    }
    console.log(`   ✓ CaseMessages: ${SEED_CASE_MESSAGES.length}`);

    await upsertEntity(workerHeartbeatRepo, { where: { id: SEED_WORKER_HEARTBEAT.id } }, SEED_WORKER_HEARTBEAT);
    console.log('   ✓ WorkerHeartbeat: 1');

    for (const heartbeat of SEED_HEARTBEAT_HISTORY) {
      await upsertEntity(
        heartbeatHistoryRepo,
        { where: { id: heartbeat.id } },
        {
          id: heartbeat.id,
          timestamp: heartbeat.timestamp,
          status: heartbeat.status,
          isProcessing: heartbeat.isProcessing,
          uptime: heartbeat.uptime,
          workerId: heartbeat.workerId,
        },
      );
    }
    console.log(`   ✓ HeartbeatHistory: ${SEED_HEARTBEAT_HISTORY.length}`);

    for (const change of SEED_SETTINGS_CHANGE_LOGS) {
      await upsertEntity(
        settingsChangeLogRepo,
        { where: { id: change.id } },
        {
          id: change.id,
          settingKey: change.settingKey,
          oldValue: change.oldValue,
          newValue: change.newValue,
          changedById: userIdByKey[change.changedByKey],
          createdAt: change.createdAt,
        },
      );
    }
    console.log(`   ✓ SettingsChangeLogs: ${SEED_SETTINGS_CHANGE_LOGS.length}`);

    console.log('\n✅ Full seeding completed.');
  } finally {
    await destroyDataSource(ds, shouldDestroy);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch((error) => {
    console.error('❌ Full seeding failed:', error);
    process.exit(1);
  });
}
