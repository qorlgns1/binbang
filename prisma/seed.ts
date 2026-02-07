import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

import { PrismaClient } from '@/generated/prisma/client';
import type { QuotaKey } from '@/generated/prisma/enums';

import {
  SEED_ACCOUNTS,
  SEED_ACCOMMODATIONS,
  SEED_CHECK_CYCLES,
  SEED_CHECK_LOGS,
  SEED_HEARTBEAT_HISTORY,
  SEED_NOW,
  SEED_PERMISSIONS,
  SEED_PLANS,
  SEED_PLAN_QUOTAS,
  SEED_ROLES,
  SEED_SESSIONS,
  SEED_SETTINGS_CHANGE_LOGS,
  SEED_USERS,
  SEED_VERIFICATION_TOKENS,
  SEED_WORKER_HEARTBEAT,
  SYSTEM_SETTINGS,
  type SeedUserKey,
} from './constants';

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
  console.log('🌱 Seeding database...');

  // ── RBAC: Roles ──
  for (const role of SEED_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { name: role.name, description: role.description },
    });
  }

  // ── RBAC: Permissions ──
  for (const perm of SEED_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { action: perm.action },
      update: {
        description: perm.description,
        roles: { set: perm.roles.map((name) => ({ name })) },
      },
      create: {
        action: perm.action,
        description: perm.description,
        roles: { connect: perm.roles.map((name) => ({ name })) },
      },
    });
  }

  // ── RBAC: Plans ──
  for (const plan of SEED_PLANS) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        roles: { set: plan.roles.map((name) => ({ name })) },
      },
      create: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        roles: { connect: plan.roles.map((name) => ({ name })) },
      },
    });
  }

  // ── RBAC: PlanQuotas ──
  for (const quota of SEED_PLAN_QUOTAS) {
    const plan = await prisma.plan.findUnique({ where: { name: quota.planName } });
    if (!plan) continue;

    await prisma.planQuota.upsert({
      where: { planId_key: { planId: plan.id, key: quota.key as QuotaKey } },
      update: { value: quota.value },
      create: { planId: plan.id, key: quota.key as QuotaKey, value: quota.value },
    });
  }

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

  assertUserIds(userIdByKey);

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

  await prisma.heartbeatHistory.createMany({
    data: SEED_HEARTBEAT_HISTORY,
    skipDuplicates: true,
  });

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

  for (const setting of SYSTEM_SETTINGS) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        type: setting.type,
        category: setting.category,
        description: setting.description,
      },
      create: setting,
    });
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
