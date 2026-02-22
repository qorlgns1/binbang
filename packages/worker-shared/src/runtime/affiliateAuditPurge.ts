import { prisma } from '@workspace/db';
import { sendTelegramMessageHttp, type SendTelegramConfig } from '@workspace/worker-shared/observability';

import { getAffiliateAuditPurgeConfig } from './settings/env';

type AlertSeverity = 'critical' | 'warning';

interface RedisLike {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<unknown>;
}

interface JobStateSnapshot {
  jobName: string;
  isFailing: boolean;
  failedAt: Date | null;
  recoveredAt: Date | null;
  retryCount: number;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  lastAlertCause: string | null;
  lastAlertSeverity: string | null;
  lastAlertSentAt: Date | null;
  lastRunStartedAt: Date | null;
}

interface AlertRoute {
  chatId: string;
  threadId: string | null;
}

interface RecoveryPayload {
  jobName: string;
  failedAt: Date;
  recoveredAt: Date;
  retryCount: number;
  lastErrorCode: string;
}

export interface RunAffiliateAuditPurgeOptions {
  redis: RedisLike | null;
  now?: Date;
  sleep?: (ms: number) => Promise<void>;
}

export interface RunAffiliateAuditPurgeResult {
  success: true;
  deletedCount: number;
  retryCount: number;
  retentionDays: number;
  runStartedAt: string;
  runFinishedAt: string;
}

export interface CheckAffiliateAuditPurgeCronMissOptions {
  redis: RedisLike | null;
  now?: Date;
}

export interface CheckAffiliateAuditPurgeCronMissResult {
  missed: boolean;
  source: 'redis' | 'db' | 'none';
  lastRunStartedAt: string | null;
  thresholdMinutes: number;
  elapsedMinutes: number | null;
  alerted: boolean;
}

export const AFFILIATE_AUDIT_PURGE_JOB_NAME = 'affiliate_audit_purge';
const RUN_STATUS_STARTED = 'run_started';
const RUN_STATUS_SUCCEEDED = 'succeeded';
const RUN_STATUS_FAILED = 'failed';
const REDIS_RUN_STARTED_TTL_SECONDS = 7 * 24 * 60 * 60;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeError(error: unknown): { code: string; message: string } {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return {
      code: error.code.trim() || 'unknown_error',
      message: error instanceof Error ? error.message : String(error),
    };
  }

  if (error instanceof Error) {
    const code = error.name?.trim() || 'unknown_error';
    return { code, message: error.message };
  }

  return { code: 'unknown_error', message: String(error) };
}

function buildRunStartedRedisKey(prefix: string): string {
  return `${prefix}:${AFFILIATE_AUDIT_PURGE_JOB_NAME}`;
}

function getCutoffDate(now: Date, retentionDays: number): Date {
  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}

export function escapeTelegramMarkdownV2(value: string): string {
  return value.replace(/([\\_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

function buildAlertMessage(input: {
  severity: AlertSeverity;
  title: string;
  cause: string;
  occurredAt: Date;
  details: Array<{ key: string; value: string }>;
}): string {
  const lines = [
    '*Affiliate Audit Purge Alert*',
    `*Severity:* ${escapeTelegramMarkdownV2(input.severity.toUpperCase())}`,
    `*Type:* ${escapeTelegramMarkdownV2(input.title)}`,
    `*Job:* ${escapeTelegramMarkdownV2(AFFILIATE_AUDIT_PURGE_JOB_NAME)}`,
    `*Cause:* ${escapeTelegramMarkdownV2(input.cause)}`,
    `*Occurred At \\(UTC\\):* ${escapeTelegramMarkdownV2(input.occurredAt.toISOString())}`,
  ];

  for (const detail of input.details) {
    lines.push(`*${escapeTelegramMarkdownV2(detail.key)}:* ${escapeTelegramMarkdownV2(detail.value)}`);
  }

  return lines.join('\n');
}

function toTelegramConfig(botToken: string | null): SendTelegramConfig | null {
  if (!botToken) return null;
  return { botToken };
}

function resolveAlertRoute(severity: AlertSeverity): AlertRoute | null {
  const config = getAffiliateAuditPurgeConfig();

  if (severity === 'critical') {
    if (!config.telegram.criticalChatId) return null;
    return {
      chatId: config.telegram.criticalChatId,
      threadId: config.telegram.criticalThreadId,
    };
  }

  if (!config.telegram.warningChatId) return null;
  return {
    chatId: config.telegram.warningChatId,
    threadId: config.telegram.warningThreadId,
  };
}

function shouldDedupeAlert(
  state: JobStateSnapshot | null,
  cause: string,
  severity: AlertSeverity,
  now: Date,
  dedupeWindowSeconds: number,
): boolean {
  if (!state?.lastAlertSentAt) return false;
  if (state.lastAlertCause !== cause) return false;
  if (state.lastAlertSeverity !== severity) return false;
  const elapsedMs = now.getTime() - state.lastAlertSentAt.getTime();
  return elapsedMs < dedupeWindowSeconds * 1000;
}

async function readJobState(): Promise<JobStateSnapshot | null> {
  return prisma.affiliateAuditJobState.findUnique({
    where: { jobName: AFFILIATE_AUDIT_PURGE_JOB_NAME },
    select: {
      jobName: true,
      isFailing: true,
      failedAt: true,
      recoveredAt: true,
      retryCount: true,
      lastErrorCode: true,
      lastErrorMessage: true,
      lastAlertCause: true,
      lastAlertSeverity: true,
      lastAlertSentAt: true,
      lastRunStartedAt: true,
    },
  });
}

async function upsertJobState(update: {
  isFailing?: boolean;
  failedAt?: Date | null;
  recoveredAt?: Date | null;
  retryCount?: number;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  lastAlertCause?: string | null;
  lastAlertSeverity?: string | null;
  lastAlertSentAt?: Date | null;
  lastRunStartedAt?: Date | null;
}): Promise<JobStateSnapshot> {
  return prisma.affiliateAuditJobState.upsert({
    where: { jobName: AFFILIATE_AUDIT_PURGE_JOB_NAME },
    create: {
      jobName: AFFILIATE_AUDIT_PURGE_JOB_NAME,
      isFailing: update.isFailing ?? false,
      failedAt: update.failedAt ?? null,
      recoveredAt: update.recoveredAt ?? null,
      retryCount: update.retryCount ?? 0,
      lastErrorCode: update.lastErrorCode ?? null,
      lastErrorMessage: update.lastErrorMessage ?? null,
      lastAlertCause: update.lastAlertCause ?? null,
      lastAlertSeverity: update.lastAlertSeverity ?? null,
      lastAlertSentAt: update.lastAlertSentAt ?? null,
      lastRunStartedAt: update.lastRunStartedAt ?? null,
    },
    update,
    select: {
      jobName: true,
      isFailing: true,
      failedAt: true,
      recoveredAt: true,
      retryCount: true,
      lastErrorCode: true,
      lastErrorMessage: true,
      lastAlertCause: true,
      lastAlertSeverity: true,
      lastAlertSentAt: true,
      lastRunStartedAt: true,
    },
  });
}

async function markAlertSent(cause: string, severity: AlertSeverity, now: Date): Promise<void> {
  await upsertJobState({
    lastAlertCause: cause,
    lastAlertSeverity: severity,
    lastAlertSentAt: now,
  });
}

async function sendAlert(input: {
  state: JobStateSnapshot | null;
  cause: string;
  severity: AlertSeverity;
  now: Date;
  title: string;
  details: Array<{ key: string; value: string }>;
}): Promise<boolean> {
  const config = getAffiliateAuditPurgeConfig();
  const route = resolveAlertRoute(input.severity);
  const telegramConfig = toTelegramConfig(config.telegram.botToken);

  if (!route || !telegramConfig) {
    console.warn('[affiliate-audit-purge] alert skipped: telegram route/config missing', {
      severity: input.severity,
      hasRoute: Boolean(route),
      hasBotToken: Boolean(telegramConfig),
    });
    return false;
  }

  if (shouldDedupeAlert(input.state, input.cause, input.severity, input.now, config.dedupeWindowSeconds)) {
    console.warn('[affiliate-audit-purge] alert deduped', {
      cause: input.cause,
      severity: input.severity,
    });
    return false;
  }

  const text = buildAlertMessage({
    severity: input.severity,
    title: input.title,
    cause: input.cause,
    occurredAt: input.now,
    details: input.details,
  });

  const result = await sendTelegramMessageHttp(
    {
      chatId: route.chatId,
      threadId: route.threadId,
      text,
      parseMode: 'MarkdownV2',
      disableNotification: input.severity === 'warning',
    },
    telegramConfig,
  );

  if (result === 'sent') {
    await markAlertSent(input.cause, input.severity, input.now);
    return true;
  }

  return false;
}

function validateRecoveryPayload(payload: Partial<RecoveryPayload>): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!payload.jobName?.trim()) missing.push('jobName');
  if (!(payload.failedAt instanceof Date) || Number.isNaN(payload.failedAt.getTime())) missing.push('failedAt');
  if (!(payload.recoveredAt instanceof Date) || Number.isNaN(payload.recoveredAt.getTime()))
    missing.push('recoveredAt');
  if (typeof payload.retryCount !== 'number' || !Number.isFinite(payload.retryCount)) missing.push('retryCount');
  if (!payload.lastErrorCode?.trim()) missing.push('lastErrorCode');

  return { valid: missing.length === 0, missing };
}

async function sendRecoveryAlert(
  stateBeforeSuccess: JobStateSnapshot,
  recoveredAt: Date,
  retentionDays: number,
): Promise<boolean> {
  const candidate: Partial<RecoveryPayload> = {
    jobName: AFFILIATE_AUDIT_PURGE_JOB_NAME,
    failedAt: stateBeforeSuccess.failedAt ?? undefined,
    recoveredAt,
    retryCount: stateBeforeSuccess.retryCount,
    lastErrorCode: stateBeforeSuccess.lastErrorCode ?? undefined,
  };

  const validated = validateRecoveryPayload(candidate);
  if (!validated.valid) {
    console.warn('[affiliate-audit-purge] recovery alert blocked: invalid payload', {
      missing: validated.missing,
    });
    return false;
  }

  if (
    !candidate.jobName ||
    !candidate.failedAt ||
    !candidate.recoveredAt ||
    candidate.retryCount == null ||
    !candidate.lastErrorCode
  ) {
    console.warn('[affiliate-audit-purge] recovery alert blocked: invalid payload after validation', {
      missing: validated.missing,
    });
    return false;
  }

  const payload: RecoveryPayload = {
    jobName: candidate.jobName,
    failedAt: candidate.failedAt,
    recoveredAt: candidate.recoveredAt,
    retryCount: candidate.retryCount,
    lastErrorCode: candidate.lastErrorCode,
  };

  return sendAlert({
    state: stateBeforeSuccess,
    cause: `recovered:${payload.lastErrorCode}`,
    severity: 'critical',
    now: recoveredAt,
    title: 'Recovery',
    details: [
      { key: 'Retention Days', value: String(retentionDays) },
      { key: 'Failed At (UTC)', value: payload.failedAt.toISOString() },
      { key: 'Recovered At (UTC)', value: payload.recoveredAt.toISOString() },
      { key: 'Retry Count', value: String(payload.retryCount) },
      { key: 'Last Error Code', value: payload.lastErrorCode },
    ],
  });
}

async function persistRunStarted(now: Date): Promise<{ runId: string; state: JobStateSnapshot }> {
  return prisma.$transaction(async (tx) => {
    const state = await tx.affiliateAuditJobState.upsert({
      where: { jobName: AFFILIATE_AUDIT_PURGE_JOB_NAME },
      create: {
        jobName: AFFILIATE_AUDIT_PURGE_JOB_NAME,
        lastRunStartedAt: now,
      },
      update: {
        lastRunStartedAt: now,
      },
      select: {
        jobName: true,
        isFailing: true,
        failedAt: true,
        recoveredAt: true,
        retryCount: true,
        lastErrorCode: true,
        lastErrorMessage: true,
        lastAlertCause: true,
        lastAlertSeverity: true,
        lastAlertSentAt: true,
        lastRunStartedAt: true,
      },
    });

    const run = await tx.affiliateAuditPurgeRun.create({
      data: {
        jobName: AFFILIATE_AUDIT_PURGE_JOB_NAME,
        runStartedAt: now,
        status: RUN_STATUS_STARTED,
        deletedCount: 0,
        retryCount: 0,
      },
      select: { id: true },
    });

    return { runId: run.id, state };
  });
}

async function writeRunStartedToRedis(redis: RedisLike | null, startedAt: Date): Promise<void> {
  if (!redis) return;
  const config = getAffiliateAuditPurgeConfig();
  const redisKey = buildRunStartedRedisKey(config.runStartedRedisKeyPrefix);
  await redis.setex(redisKey, REDIS_RUN_STARTED_TTL_SECONDS, startedAt.toISOString());
}

async function markRunSuccess(input: {
  runId: string;
  startedAt: Date;
  finishedAt: Date;
  deletedCount: number;
  retryCount: number;
}): Promise<JobStateSnapshot> {
  return prisma.$transaction(async (tx) => {
    await tx.affiliateAuditPurgeRun.update({
      where: { id: input.runId },
      data: {
        status: RUN_STATUS_SUCCEEDED,
        runFinishedAt: input.finishedAt,
        deletedCount: input.deletedCount,
        retryCount: input.retryCount,
        errorCode: null,
        errorMessage: null,
      },
      select: { id: true },
    });

    return tx.affiliateAuditJobState.upsert({
      where: { jobName: AFFILIATE_AUDIT_PURGE_JOB_NAME },
      create: {
        jobName: AFFILIATE_AUDIT_PURGE_JOB_NAME,
        isFailing: false,
        failedAt: null,
        recoveredAt: input.finishedAt,
        retryCount: input.retryCount,
        lastErrorCode: null,
        lastErrorMessage: null,
        lastRunStartedAt: input.startedAt,
      },
      update: {
        isFailing: false,
        recoveredAt: input.finishedAt,
        retryCount: input.retryCount,
        lastErrorCode: null,
        lastErrorMessage: null,
        lastRunStartedAt: input.startedAt,
      },
      select: {
        jobName: true,
        isFailing: true,
        failedAt: true,
        recoveredAt: true,
        retryCount: true,
        lastErrorCode: true,
        lastErrorMessage: true,
        lastAlertCause: true,
        lastAlertSeverity: true,
        lastAlertSentAt: true,
        lastRunStartedAt: true,
      },
    });
  });
}

async function markRunFailure(input: {
  runId: string;
  startedAt: Date;
  finishedAt: Date;
  retryCount: number;
  errorCode: string;
  errorMessage: string;
  previousFailedAt: Date | null;
}): Promise<JobStateSnapshot> {
  return prisma.$transaction(async (tx) => {
    await tx.affiliateAuditPurgeRun.update({
      where: { id: input.runId },
      data: {
        status: RUN_STATUS_FAILED,
        runFinishedAt: input.finishedAt,
        retryCount: input.retryCount,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage.slice(0, 1000),
      },
      select: { id: true },
    });

    return tx.affiliateAuditJobState.upsert({
      where: { jobName: AFFILIATE_AUDIT_PURGE_JOB_NAME },
      create: {
        jobName: AFFILIATE_AUDIT_PURGE_JOB_NAME,
        isFailing: true,
        failedAt: input.previousFailedAt ?? input.finishedAt,
        recoveredAt: null,
        retryCount: input.retryCount,
        lastErrorCode: input.errorCode,
        lastErrorMessage: input.errorMessage.slice(0, 1000),
        lastRunStartedAt: input.startedAt,
      },
      update: {
        isFailing: true,
        failedAt: input.previousFailedAt ?? input.finishedAt,
        recoveredAt: null,
        retryCount: input.retryCount,
        lastErrorCode: input.errorCode,
        lastErrorMessage: input.errorMessage.slice(0, 1000),
        lastRunStartedAt: input.startedAt,
      },
      select: {
        jobName: true,
        isFailing: true,
        failedAt: true,
        recoveredAt: true,
        retryCount: true,
        lastErrorCode: true,
        lastErrorMessage: true,
        lastAlertCause: true,
        lastAlertSeverity: true,
        lastAlertSentAt: true,
        lastRunStartedAt: true,
      },
    });
  });
}

async function purgeExpiredLogs(now: Date, retentionDays: number): Promise<number> {
  const cutoff = getCutoffDate(now, retentionDays);
  const result = await prisma.affiliatePreferenceAuditLog.deleteMany({
    where: {
      changedAt: {
        lt: cutoff,
      },
    },
  });
  return result.count;
}

export async function runAffiliateAuditPurge(
  options: RunAffiliateAuditPurgeOptions,
): Promise<RunAffiliateAuditPurgeResult> {
  const now = options.now ?? new Date();
  const sleepFn = options.sleep ?? wait;
  const config = getAffiliateAuditPurgeConfig();
  const retentionDays = Math.max(1, config.retentionDays);
  const retryMax = Math.max(1, config.retryMax);

  const runStarted = await persistRunStarted(now);

  try {
    await writeRunStartedToRedis(options.redis, now);
  } catch (error) {
    const normalized = normalizeError(error);
    await sendAlert({
      state: runStarted.state,
      cause: 'redis_write_failed',
      severity: 'warning',
      now,
      title: 'RunStarted Redis Write Failed',
      details: [
        { key: 'Error Code', value: normalized.code },
        { key: 'Error Message', value: normalized.message },
      ],
    });
  }

  let lastErrorCode = 'unknown_error';
  let lastErrorMessage = '';

  for (let attempt = 1; attempt <= retryMax; attempt += 1) {
    try {
      const deletedCount = await purgeExpiredLogs(now, retentionDays);
      const finishedAt = new Date();
      await markRunSuccess({
        runId: runStarted.runId,
        startedAt: now,
        finishedAt,
        deletedCount,
        retryCount: attempt - 1,
      });

      if (runStarted.state.isFailing && config.recoveryEnabled) {
        await sendRecoveryAlert(runStarted.state, finishedAt, retentionDays);
      }

      console.log(
        `[affiliate-audit-purge] success startedAt=${now.toISOString()} finishedAt=${finishedAt.toISOString()} deleted=${deletedCount} retryCount=${attempt - 1}`,
      );

      return {
        success: true,
        deletedCount,
        retryCount: attempt - 1,
        retentionDays,
        runStartedAt: now.toISOString(),
        runFinishedAt: finishedAt.toISOString(),
      };
    } catch (error) {
      const normalized = normalizeError(error);
      lastErrorCode = normalized.code;
      lastErrorMessage = normalized.message;

      if (attempt >= retryMax) {
        break;
      }

      const backoffMs = config.retryBackoffSeconds * 1000 * 2 ** (attempt - 1);
      console.warn(
        `[affiliate-audit-purge] attempt ${attempt} failed (${normalized.code}). retrying in ${backoffMs}ms`,
      );
      await sleepFn(backoffMs);
    }
  }

  const failedAt = new Date();
  const finalState = await markRunFailure({
    runId: runStarted.runId,
    startedAt: now,
    finishedAt: failedAt,
    retryCount: retryMax,
    errorCode: lastErrorCode,
    errorMessage: lastErrorMessage,
    previousFailedAt: runStarted.state.failedAt,
  });

  await sendAlert({
    state: finalState,
    cause: `final_failure:${lastErrorCode}`,
    severity: 'critical',
    now: failedAt,
    title: 'Final Failure',
    details: [
      { key: 'Retry Max', value: String(retryMax) },
      { key: 'Last Error Code', value: lastErrorCode },
      { key: 'Last Error Message', value: lastErrorMessage || '(empty)' },
    ],
  });

  throw new Error(`[affiliate-audit-purge] failed after ${retryMax} attempts: ${lastErrorCode}`);
}

async function readLastRunStartedAtFromRedis(redis: RedisLike | null): Promise<Date | null> {
  if (!redis) return null;
  const config = getAffiliateAuditPurgeConfig();
  const key = buildRunStartedRedisKey(config.runStartedRedisKeyPrefix);
  const value = await redis.get(key);
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

async function readLastRunStartedAtFromDb(): Promise<Date | null> {
  const state = await readJobState();
  return state?.lastRunStartedAt ?? null;
}

export async function checkAffiliateAuditPurgeCronMiss(
  options: CheckAffiliateAuditPurgeCronMissOptions,
): Promise<CheckAffiliateAuditPurgeCronMissResult> {
  const now = options.now ?? new Date();
  const config = getAffiliateAuditPurgeConfig();
  const thresholdMinutes = Math.max(1, config.cronMissThresholdMinutes);

  let source: 'redis' | 'db' | 'none' = 'none';
  let lastRunStartedAt: Date | null = null;

  try {
    lastRunStartedAt = await readLastRunStartedAtFromRedis(options.redis);
    if (lastRunStartedAt) {
      source = 'redis';
    }
  } catch (error) {
    console.warn('[affiliate-audit-purge] redis read for run_started failed. fallback to DB', error);
  }

  if (!lastRunStartedAt) {
    lastRunStartedAt = await readLastRunStartedAtFromDb();
    if (lastRunStartedAt) source = 'db';
  }

  if (!lastRunStartedAt) {
    return {
      missed: false,
      source,
      lastRunStartedAt: null,
      thresholdMinutes,
      elapsedMinutes: null,
      alerted: false,
    };
  }

  const elapsedMinutes = Math.floor((now.getTime() - lastRunStartedAt.getTime()) / 60000);
  const missed = elapsedMinutes > thresholdMinutes;
  if (!missed) {
    return {
      missed,
      source,
      lastRunStartedAt: lastRunStartedAt.toISOString(),
      thresholdMinutes,
      elapsedMinutes,
      alerted: false,
    };
  }

  const state = await readJobState();
  const alerted = await sendAlert({
    state,
    cause: `cron_missed:${thresholdMinutes}`,
    severity: 'critical',
    now,
    title: 'Cron Missed',
    details: [
      { key: 'Last Run Started At (UTC)', value: lastRunStartedAt.toISOString() },
      { key: 'Elapsed Minutes', value: String(elapsedMinutes) },
      { key: 'Threshold Minutes', value: String(thresholdMinutes) },
      { key: 'Source', value: source },
    ],
  });

  return {
    missed,
    source,
    lastRunStartedAt: lastRunStartedAt.toISOString(),
    thresholdMinutes,
    elapsedMinutes,
    alerted,
  };
}
