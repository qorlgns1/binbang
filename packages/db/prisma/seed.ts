/**
 * 개발 환경용 전체 시드 스크립트
 *
 * 운영 시드(seed-base.ts) + 테스트 데이터를 포함합니다:
 * - Production: RBAC, System Settings, Selectors/Patterns
 * - Development: 테스트 유저, 숙소, 체크 로그, 하트비트 등
 *
 * 실행: pnpm db:seed
 */
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

import { Prisma, PrismaClient } from '@/generated/prisma/client';

import {
  SEED_ACCOMMODATIONS,
  SEED_ACCOUNTS,
  SEED_BILLING_EVENTS,
  SEED_CASES,
  SEED_CASE_NOTIFICATIONS,
  SEED_CASE_STATUS_LOGS,
  SEED_CHECK_CYCLES,
  SEED_CHECK_LOGS,
  SEED_CONDITION_MET_EVENTS,
  SEED_FORM_SUBMISSIONS,
  SEED_HEARTBEAT_HISTORY,
  SEED_NOW,
  SEED_SESSIONS,
  SEED_SETTINGS_CHANGE_LOGS,
  SEED_USERS,
  SEED_VERIFICATION_TOKENS,
  SEED_WORKER_HEARTBEAT,
  type SeedUserKey,
} from './constants';
import { seedBase } from './seed-base';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? '',
});

const prisma = new PrismaClient({ adapter });

function assertUserIds(ids: Partial<Record<SeedUserKey, string>>): asserts ids is Record<SeedUserKey, string> {
  for (const user of SEED_USERS) {
    if (!ids[user.key]) throw new Error(`Seed user id missing for key="${user.key}"`);
  }
}

async function main() {
  console.log('🌱 Seeding database (full)...\n');

  // ── 1. Production 시드 먼저 실행 ──
  await seedBase();
  console.log('');

  // ── 2. 개발용 테스트 데이터 ──
  console.log('🧪 Seeding development data...');

  // ── Users ──
  const freePlan = await prisma.plan.findUnique({ where: { name: 'FREE' } });
  const userIdByKey: Partial<Record<SeedUserKey, string>> = {};

  for (const user of SEED_USERS) {
    const upserted = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: user.passwordHash,
        roles: { set: user.roleNames.map((name) => ({ name })) },
        planId: freePlan?.id ?? undefined,
      },
      create: {
        email: user.email,
        name: user.name,
        password: user.passwordHash,
        emailVerified: SEED_NOW,
        roles: { connect: user.roleNames.map((name) => ({ name })) },
        planId: freePlan?.id ?? undefined,
      },
      select: { id: true },
    });

    userIdByKey[user.key] = upserted.id;
  }
  console.log(`   ✓ Users: ${SEED_USERS.length}`);

  assertUserIds(userIdByKey);

  // ── Accounts ──
  for (const account of SEED_ACCOUNTS) {
    const userId = userIdByKey[account.userKey];
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      },
      update: {
        userId,
        type: account.type,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
        refresh_token_expires_in: account.refresh_token_expires_in,
      },
      create: {
        userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
        refresh_token_expires_in: account.refresh_token_expires_in,
      },
    });
  }
  console.log(`   ✓ Accounts: ${SEED_ACCOUNTS.length}`);

  // ── Sessions ──
  for (const session of SEED_SESSIONS) {
    const userId = userIdByKey[session.userKey];
    await prisma.session.upsert({
      where: { sessionToken: session.sessionToken },
      update: {
        userId,
        expires: session.expires,
      },
      create: {
        userId,
        sessionToken: session.sessionToken,
        expires: session.expires,
      },
    });
  }
  console.log(`   ✓ Sessions: ${SEED_SESSIONS.length}`);

  // ── Verification Tokens ──
  for (const token of SEED_VERIFICATION_TOKENS) {
    await prisma.verificationToken.upsert({
      where: { token: token.token },
      update: {
        identifier: token.identifier,
        expires: token.expires,
      },
      create: token,
    });
  }
  console.log(`   ✓ VerificationTokens: ${SEED_VERIFICATION_TOKENS.length}`);

  // ── Accommodations ──
  for (const accommodation of SEED_ACCOMMODATIONS) {
    const userId = userIdByKey[accommodation.userKey];
    await prisma.accommodation.upsert({
      where: { id: accommodation.id },
      update: {
        userId,
        name: accommodation.name,
        platform: accommodation.platform,
        url: accommodation.url,
        checkIn: accommodation.checkIn,
        checkOut: accommodation.checkOut,
        adults: accommodation.adults,
        isActive: accommodation.isActive,
        lastCheck: accommodation.lastCheck,
        lastStatus: accommodation.lastStatus,
        lastPrice: accommodation.lastPrice,
        lastPriceAmount: accommodation.lastPriceAmount,
        lastPriceCurrency: accommodation.lastPriceCurrency,
      },
      create: {
        id: accommodation.id,
        userId,
        name: accommodation.name,
        platform: accommodation.platform,
        url: accommodation.url,
        checkIn: accommodation.checkIn,
        checkOut: accommodation.checkOut,
        adults: accommodation.adults,
        isActive: accommodation.isActive,
        lastCheck: accommodation.lastCheck,
        lastStatus: accommodation.lastStatus,
        lastPrice: accommodation.lastPrice,
        lastPriceAmount: accommodation.lastPriceAmount,
        lastPriceCurrency: accommodation.lastPriceCurrency,
      },
    });
  }
  console.log(`   ✓ Accommodations: ${SEED_ACCOMMODATIONS.length}`);

  // ── Form Submissions ──
  const json = (v: unknown): Prisma.InputJsonValue => v as Prisma.InputJsonValue;

  for (const submission of SEED_FORM_SUBMISSIONS) {
    await prisma.formSubmission.upsert({
      where: { id: submission.id },
      update: {
        responseId: submission.responseId,
        status: submission.status,
        rawPayload: json(submission.rawPayload),
        extractedFields:
          submission.extractedFields === null
            ? Prisma.DbNull
            : submission.extractedFields
              ? json(submission.extractedFields)
              : undefined,
        rejectionReason: submission.rejectionReason,
        consentBillingOnConditionMet: submission.consentBillingOnConditionMet,
        consentServiceScope: submission.consentServiceScope,
        consentCapturedAt: submission.consentCapturedAt,
        consentTexts:
          submission.consentTexts === null
            ? Prisma.DbNull
            : submission.consentTexts
              ? json(submission.consentTexts)
              : undefined,
      },
      create: {
        id: submission.id,
        responseId: submission.responseId,
        status: submission.status,
        rawPayload: json(submission.rawPayload),
        extractedFields:
          submission.extractedFields === null
            ? Prisma.DbNull
            : submission.extractedFields
              ? json(submission.extractedFields)
              : undefined,
        rejectionReason: submission.rejectionReason,
        consentBillingOnConditionMet: submission.consentBillingOnConditionMet,
        consentServiceScope: submission.consentServiceScope,
        consentCapturedAt: submission.consentCapturedAt,
        consentTexts:
          submission.consentTexts === null
            ? Prisma.DbNull
            : submission.consentTexts
              ? json(submission.consentTexts)
              : undefined,
        receivedAt: submission.receivedAt,
      },
    });
  }
  console.log(`   ✓ FormSubmissions: ${SEED_FORM_SUBMISSIONS.length}`);

  // ── Cases ──
  for (const caseData of SEED_CASES) {
    const assignedTo = caseData.assignedToKey ? userIdByKey[caseData.assignedToKey] : null;
    const statusChangedBy = caseData.statusChangedByKey ? userIdByKey[caseData.statusChangedByKey] : null;
    const paymentConfirmedBy = caseData.paymentConfirmedByKey ? userIdByKey[caseData.paymentConfirmedByKey] : null;

    await prisma.case.upsert({
      where: { id: caseData.id },
      update: {
        submissionId: caseData.submissionId,
        status: caseData.status,
        assignedTo: assignedTo,
        statusChangedBy: statusChangedBy,
        statusChangedAt: caseData.statusChangedAt,
        note: caseData.note,
        ambiguityResult: caseData.ambiguityResult ? json(caseData.ambiguityResult) : undefined,
        clarificationResolvedAt: caseData.clarificationResolvedAt,
        paymentConfirmedAt: caseData.paymentConfirmedAt,
        paymentConfirmedBy: paymentConfirmedBy,
        accommodationId: caseData.accommodationId,
      },
      create: {
        id: caseData.id,
        submissionId: caseData.submissionId,
        status: caseData.status,
        assignedTo: assignedTo,
        statusChangedBy: statusChangedBy,
        statusChangedAt: caseData.statusChangedAt,
        note: caseData.note,
        ambiguityResult: caseData.ambiguityResult ? json(caseData.ambiguityResult) : undefined,
        clarificationResolvedAt: caseData.clarificationResolvedAt,
        paymentConfirmedAt: caseData.paymentConfirmedAt,
        paymentConfirmedBy: paymentConfirmedBy,
        accommodationId: caseData.accommodationId,
        createdAt: caseData.createdAt,
      },
    });
  }
  console.log(`   ✓ Cases: ${SEED_CASES.length}`);

  // ── Check Cycles ──
  for (const cycle of SEED_CHECK_CYCLES) {
    await prisma.checkCycle.upsert({
      where: { id: cycle.id },
      update: {
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
      },
      create: {
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
    });
  }
  console.log(`   ✓ CheckCycles: ${SEED_CHECK_CYCLES.length}`);

  // ── Check Logs ──
  for (const log of SEED_CHECK_LOGS) {
    const userId = userIdByKey[log.userKey];
    await prisma.checkLog.upsert({
      where: { id: log.id },
      update: {
        userId,
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
      },
      create: {
        id: log.id,
        userId,
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
    });
  }
  console.log(`   ✓ CheckLogs: ${SEED_CHECK_LOGS.length}`);

  // ── Case Status Logs ──
  for (const log of SEED_CASE_STATUS_LOGS) {
    const changedById = userIdByKey[log.changedByKey];
    await prisma.caseStatusLog.upsert({
      where: { id: log.id },
      update: {
        caseId: log.caseId,
        fromStatus: log.fromStatus,
        toStatus: log.toStatus,
        changedById,
        reason: log.reason,
      },
      create: {
        id: log.id,
        caseId: log.caseId,
        fromStatus: log.fromStatus,
        toStatus: log.toStatus,
        changedById,
        reason: log.reason,
        createdAt: log.createdAt,
      },
    });
  }
  console.log(`   ✓ CaseStatusLogs: ${SEED_CASE_STATUS_LOGS.length}`);

  // ── Condition Met Events ──
  for (const event of SEED_CONDITION_MET_EVENTS) {
    await prisma.conditionMetEvent.upsert({
      where: { id: event.id },
      update: {
        caseId: event.caseId,
        checkLogId: event.checkLogId,
        evidenceSnapshot: json(event.evidenceSnapshot),
        screenshotBase64: event.screenshotBase64,
        capturedAt: event.capturedAt,
      },
      create: {
        id: event.id,
        caseId: event.caseId,
        checkLogId: event.checkLogId,
        evidenceSnapshot: json(event.evidenceSnapshot),
        screenshotBase64: event.screenshotBase64,
        capturedAt: event.capturedAt,
        createdAt: event.createdAt,
      },
    });
  }
  console.log(`   ✓ ConditionMetEvents: ${SEED_CONDITION_MET_EVENTS.length}`);

  // ── Billing Events ──
  for (const billing of SEED_BILLING_EVENTS) {
    await prisma.billingEvent.upsert({
      where: { id: billing.id },
      update: {
        caseId: billing.caseId,
        type: billing.type,
        conditionMetEventId: billing.conditionMetEventId,
        amountKrw: billing.amountKrw,
        description: billing.description,
      },
      create: {
        id: billing.id,
        caseId: billing.caseId,
        type: billing.type,
        conditionMetEventId: billing.conditionMetEventId,
        amountKrw: billing.amountKrw,
        description: billing.description,
        createdAt: billing.createdAt,
      },
    });
  }
  console.log(`   ✓ BillingEvents: ${SEED_BILLING_EVENTS.length}`);

  // ── Case Notifications ──
  for (const notification of SEED_CASE_NOTIFICATIONS) {
    await prisma.caseNotification.upsert({
      where: { id: notification.id },
      update: {
        caseId: notification.caseId,
        channel: notification.channel,
        status: notification.status,
        payload: json(notification.payload),
        sentAt: notification.sentAt,
        failReason: notification.failReason,
        retryCount: notification.retryCount,
        maxRetries: notification.maxRetries,
        idempotencyKey: notification.idempotencyKey,
      },
      create: {
        id: notification.id,
        caseId: notification.caseId,
        channel: notification.channel,
        status: notification.status,
        payload: json(notification.payload),
        sentAt: notification.sentAt,
        failReason: notification.failReason,
        retryCount: notification.retryCount,
        maxRetries: notification.maxRetries,
        idempotencyKey: notification.idempotencyKey,
        createdAt: notification.createdAt,
      },
    });
  }
  console.log(`   ✓ CaseNotifications: ${SEED_CASE_NOTIFICATIONS.length}`);

  // ── Worker Heartbeat ──
  await prisma.workerHeartbeat.upsert({
    where: { id: SEED_WORKER_HEARTBEAT.id },
    update: {
      startedAt: SEED_WORKER_HEARTBEAT.startedAt,
      lastHeartbeatAt: SEED_WORKER_HEARTBEAT.lastHeartbeatAt,
      isProcessing: SEED_WORKER_HEARTBEAT.isProcessing,
      schedule: SEED_WORKER_HEARTBEAT.schedule,
      accommodationsChecked: SEED_WORKER_HEARTBEAT.accommodationsChecked,
      lastCycleErrors: SEED_WORKER_HEARTBEAT.lastCycleErrors,
      lastCycleDurationMs: SEED_WORKER_HEARTBEAT.lastCycleDurationMs,
    },
    create: SEED_WORKER_HEARTBEAT,
  });
  console.log(`   ✓ WorkerHeartbeat: 1`);

  // ── Heartbeat History ──
  await prisma.heartbeatHistory.createMany({
    data: SEED_HEARTBEAT_HISTORY,
    skipDuplicates: true,
  });
  console.log(`   ✓ HeartbeatHistory: ${SEED_HEARTBEAT_HISTORY.length}`);

  // ── Settings Change Logs ──
  for (const change of SEED_SETTINGS_CHANGE_LOGS) {
    const changedById = userIdByKey[change.changedByKey];
    await prisma.settingsChangeLog.upsert({
      where: { id: change.id },
      update: {
        settingKey: change.settingKey,
        oldValue: change.oldValue,
        newValue: change.newValue,
        changedById,
      },
      create: {
        id: change.id,
        settingKey: change.settingKey,
        oldValue: change.oldValue,
        newValue: change.newValue,
        changedById,
        createdAt: change.createdAt,
      },
    });
  }
  console.log(`   ✓ SettingsChangeLogs: ${SEED_SETTINGS_CHANGE_LOGS.length}`);

  console.log('\n✅ Full seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
