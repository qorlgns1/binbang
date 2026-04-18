import {
  Accommodation,
  AgodaAlertEvent,
  AgodaConsentLog,
  AgodaNotification,
  AgodaPollRun,
  AgodaRoomSnapshot,
  In,
  Platform,
  getDataSource,
} from '@workspace/db';
import { startOfUtcDay } from '@workspace/shared/utils/date';
import { getHeartbeatStatus } from '../health.service';
import {
  buildAgodaNotificationReasonBreakdownFromRows,
  parseAgodaNotificationReason,
  type AgodaNotificationReasonStat,
} from '@/services/agoda-notification-observability.service';
import { getBinbangRuntimeSettings } from '@/services/binbang-runtime-settings.service';
import { ensureRedisConnected, getRedisClient } from '@/lib/redis';

const DEFAULT_LOOKBACK_DAYS = 7;
const FALSE_POSITIVE_LIMIT = 20;
const STALL_MULTIPLIER = 2;
const STALL_LIMIT = 20;

export interface AdminOpsFalsePositiveCandidate {
  eventId: string;
  detectedAt: string;
  accommodationId: string;
  accommodationName: string;
  eventType: string;
  eventStatus: string;
  notificationStatus: string | null;
  reason: string;
}

export interface StalledAccommodation {
  id: string;
  name: string;
  createdAt: string;
  lastPolledAt: string | null;
  stalledSinceMinutes: number;
}

export interface AdminOpsSummary {
  generatedAt: string;
  range: {
    from: string;
    to: string;
    days: number;
  };
  alerts: {
    total: number;
    active: number;
    registeredInRange: number;
  };
  notifications: {
    queued: number;
    sent: number;
    failed: number;
    suppressed: number;
    attempted: number;
    successRate: number;
    reasonBreakdown: {
      failed: AgodaNotificationReasonStat[];
      suppressed: AgodaNotificationReasonStat[];
    };
  };
  falsePositiveCandidates: AdminOpsFalsePositiveCandidate[];
  stalled: {
    count: number;
    items: StalledAccommodation[];
  };
  schedulerHealth: SchedulerJobStatus[];
}

export interface SchedulerJobStatus {
  key: string;
  displayName: string;
  status: 'ok' | 'failing' | 'unknown';
  latestFailure: {
    failedReason: string;
    failedAt: string;
  } | null;
}

export type AdminOpsDiagnosticLevel = 'ok' | 'info' | 'warn' | 'error';

export interface AdminOpsDiagnosticCheck {
  level: AdminOpsDiagnosticLevel;
  code: string;
  message: string;
  detail: string;
}

export interface AdminOpsAccommodationDiagnostics {
  query: string;
  accommodation: {
    id: string;
    name: string;
    platformId: string | null;
    isActive: boolean;
    checkIn: string;
    checkOut: string;
    createdAt: string;
    lastPolledAt: string | null;
    lastEventAt: string | null;
    userEmail: string | null;
  };
  config: {
    pollIntervalMinutes: number;
    emailProvider: 'console' | 'resend';
    fromEmail: string;
  };
  counters: {
    polls: {
      total: number;
      success: number;
      failed: number;
    };
    events: {
      total: number;
      vacancyDetected: number;
      vacancyRejected: number;
      priceDropDetected: number;
    };
    notifications: {
      queued: number;
      sent: number;
      failed: number;
      suppressed: number;
    };
  };
  vacancyContext: {
    successfulRuns: number;
    latestSuccessSnapshotCount: number | null;
    previousSuccessSnapshotCount: number | null;
    note: string;
  };
  consent: {
    latestType: string | null;
    hasActiveOptIn: boolean;
    recent: Array<{ type: string; email: string; createdAt: string }>;
  };
  recentPollRuns: Array<{
    id: string;
    polledAt: string;
    status: string;
    httpStatus: number | null;
    latencyMs: number | null;
    error: string | null;
    snapshotCount: number;
  }>;
  recentEvents: Array<{
    id: string;
    detectedAt: string;
    type: string;
    status: string;
    offerKey: string | null;
    latestNotificationStatus: string | null;
    latestNotificationReasonCode: string | null;
    latestNotificationError: string | null;
  }>;
  recentNotifications: Array<{
    id: string;
    createdAt: string;
    updatedAt: string;
    status: string;
    attempt: number;
    lastErrorCode: string | null;
    lastErrorMessage: string | null;
    lastError: string | null;
  }>;
  notificationReasons: {
    failed: AgodaNotificationReasonStat[];
    suppressed: AgodaNotificationReasonStat[];
  };
  checks: AdminOpsDiagnosticCheck[];
}

function startOfLookback(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function toRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 1000;
}

function toDbCount(value: number | string | null | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number.parseInt(value, 10) || 0;
  return 0;
}

function countByStatus(rows: Array<{ status: string; count: number | string }>): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = toDbCount(row.count);
    return acc;
  }, {});
}

type StatusCountRow = {
  status: string;
  count: number | string;
};

type NotificationReasonRow = {
  status: string;
  lastError: string | null;
};

type GroupCountQueryBuilder<TRow extends object> = {
  select(selection: string, alias: string): GroupCountQueryBuilder<TRow>;
  addSelect(selection: string, alias: string): GroupCountQueryBuilder<TRow>;
  where(whereSql: string, params: Record<string, unknown>): GroupCountQueryBuilder<TRow>;
  groupBy(group: string): GroupCountQueryBuilder<TRow>;
  addGroupBy(group: string): GroupCountQueryBuilder<TRow>;
  getRawMany(): Promise<TRow[]>;
};

type QueryBuilderRepository<TRow extends object> = {
  createQueryBuilder(alias: string): GroupCountQueryBuilder<TRow>;
};

async function groupStatusCounts(
  repo: QueryBuilderRepository<StatusCountRow>,
  alias: string,
  whereSql: string,
  params: Record<string, unknown>,
): Promise<StatusCountRow[]> {
  return repo
    .createQueryBuilder(alias)
    .select(`${alias}.status`, 'status')
    .addSelect('COUNT(*)', 'count')
    .where(whereSql, params)
    .groupBy(`${alias}.status`)
    .getRawMany();
}

async function fetchNotificationReasonRows(
  repo: QueryBuilderRepository<NotificationReasonRow>,
  alias: string,
  whereSql: string,
  params: Record<string, unknown>,
): Promise<NotificationReasonRow[]> {
  return repo
    .createQueryBuilder(alias)
    .select(`${alias}.status`, 'status')
    .addSelect(`${alias}.lastError`, 'lastError')
    .where(whereSql, params)
    .getRawMany();
}

async function loadNotificationStatsByAlertEventIds(eventIds: number[]): Promise<{
  latestByEventId: Map<number, { status: string; lastError: string | null }>;
  hasTerminalNotification: Set<number>;
}> {
  if (eventIds.length === 0) {
    return { latestByEventId: new Map(), hasTerminalNotification: new Set() };
  }

  const ds = await getDataSource();
  const rows = await ds.getRepository(AgodaNotification).find({
    where: { alertEventId: In(eventIds) },
    order: { alertEventId: 'ASC', createdAt: 'DESC' },
    select: { alertEventId: true, status: true, lastError: true },
  });

  const latestByEventId = new Map<number, { status: string; lastError: string | null }>();
  const hasTerminalNotification = new Set<number>();

  for (const row of rows) {
    if (!latestByEventId.has(row.alertEventId)) {
      latestByEventId.set(row.alertEventId, {
        status: row.status,
        lastError: row.lastError,
      });
    }

    if (row.status === 'failed' || row.status === 'suppressed') {
      hasTerminalNotification.add(row.alertEventId);
    }
  }

  return { latestByEventId, hasTerminalNotification };
}

async function countSnapshotsByPollRunIds(pollRunIds: number[]): Promise<Map<number, number>> {
  if (pollRunIds.length === 0) return new Map();

  const ds = await getDataSource();
  const rows = await ds
    .getRepository(AgodaRoomSnapshot)
    .createQueryBuilder('snapshot')
    .select('snapshot.pollRunId', 'pollRunId')
    .addSelect('COUNT(*)', 'count')
    .where('snapshot.pollRunId IN (:...pollRunIds)', { pollRunIds })
    .groupBy('snapshot.pollRunId')
    .getRawMany<{ pollRunId: number | string; count: number | string }>();

  return new Map(rows.map((row) => [toDbCount(row.pollRunId), toDbCount(row.count)]));
}

function dateUtcStart(date: Date): Date {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  return value;
}

function buildVacancyContextNote(input: {
  successfulRuns: number;
  latestSuccessSnapshotCount: number | null;
  previousSuccessSnapshotCount: number | null;
}): string {
  if (input.successfulRuns < 2) {
    return 'vacancy 판단에는 최소 2회 이상의 성공 poll이 필요합니다.';
  }

  if (input.previousSuccessSnapshotCount == null || input.latestSuccessSnapshotCount == null) {
    return '최근 성공 poll의 스냅샷 정보를 아직 계산할 수 없습니다.';
  }

  if (input.previousSuccessSnapshotCount === 0 && input.latestSuccessSnapshotCount > 0) {
    return '직전 성공 poll이 sold-out(0건)이고 현재 오퍼가 있어 vacancy 전환 조건을 만족할 수 있습니다.';
  }

  if (input.previousSuccessSnapshotCount > 0 && input.latestSuccessSnapshotCount > 0) {
    return '직전/현재 모두 오퍼가 있어 vacancy 전환(매진→재오픈) 조건이 성립하지 않습니다.';
  }

  if (input.latestSuccessSnapshotCount === 0) {
    return '현재 성공 poll 기준으로는 sold-out 상태입니다.';
  }

  return 'vacancy 전환 여부를 추가 관찰 중입니다.';
}

export async function getAdminOpsAccommodationDiagnostics(
  query: string,
): Promise<AdminOpsAccommodationDiagnostics | null> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length === 0) return null;

  const ds = await getDataSource();
  const accommodation = await ds
    .getRepository(Accommodation)
    .createQueryBuilder('accommodation')
    .leftJoinAndSelect('accommodation.user', 'user')
    .where('accommodation.platform = :platform', { platform: Platform.AGODA })
    .andWhere('(accommodation.id = :query OR accommodation.platformId = :query)', {
      query: normalizedQuery,
    })
    .orderBy('accommodation.createdAt', 'DESC')
    .getOne();

  if (!accommodation) {
    return null;
  }

  const runtimeSettings = await getBinbangRuntimeSettings();
  const accommodationId = accommodation.id;
  const now = new Date();
  const pollIntervalMinutes = runtimeSettings.pollIntervalMinutes;
  const pollIntervalMs = pollIntervalMinutes * 60_000;
  const emailProvider = runtimeSettings.emailProvider;

  const [
    pollStatusGroups,
    recentPollRunsRaw,
    successfulRuns,
    latestSuccessRuns,
    eventCount,
    vacancyDetectedCount,
    vacancyRejectedCount,
    priceDropDetectedCount,
    recentEventsRaw,
    notificationStatusGroups,
    notificationReasonGroups,
    recentNotificationsRaw,
    oldestQueuedNotification,
    consentRows,
    workerStatus,
    pollDueBullmqFailure,
  ] = await Promise.all([
    groupStatusCounts(ds.getRepository(AgodaPollRun), 'pollRun', 'pollRun.accommodationId = :accommodationId', {
      accommodationId,
    }),
    ds.getRepository(AgodaPollRun).find({
      where: { accommodationId },
      order: { polledAt: 'DESC' },
      take: 5,
      select: {
        id: true,
        polledAt: true,
        status: true,
        httpStatus: true,
        latencyMs: true,
        error: true,
      },
    }),
    ds.getRepository(AgodaPollRun).count({
      where: { accommodationId, status: 'success' },
    }),
    ds.getRepository(AgodaPollRun).find({
      where: { accommodationId, status: 'success' },
      order: { polledAt: 'DESC' },
      take: 2,
      select: {
        id: true,
      },
    }),
    ds.getRepository(AgodaAlertEvent).count({
      where: { accommodationId },
    }),
    ds.getRepository(AgodaAlertEvent).count({
      where: { accommodationId, type: 'vacancy', status: 'detected' },
    }),
    ds.getRepository(AgodaAlertEvent).count({
      where: { accommodationId, type: 'vacancy', status: 'rejected_verify_failed' },
    }),
    ds.getRepository(AgodaAlertEvent).count({
      where: { accommodationId, type: 'price_drop', status: 'detected' },
    }),
    ds.getRepository(AgodaAlertEvent).find({
      where: { accommodationId },
      order: { detectedAt: 'DESC' },
      take: 10,
      select: {
        id: true,
        detectedAt: true,
        type: true,
        status: true,
        offerKey: true,
      },
    }),
    groupStatusCounts(
      ds.getRepository(AgodaNotification),
      'notification',
      'notification.accommodationId = :accommodationId',
      { accommodationId },
    ),
    fetchNotificationReasonRows(
      ds.getRepository(AgodaNotification),
      'notification',
      'notification.accommodationId = :accommodationId AND notification.status IN (:...statuses)',
      { accommodationId, statuses: ['failed', 'suppressed'] },
    ),
    ds.getRepository(AgodaNotification).find({
      where: { accommodationId },
      order: { createdAt: 'DESC' },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        attempt: true,
        lastError: true,
      },
    }),
    ds.getRepository(AgodaNotification).findOne({
      where: { accommodationId, status: 'queued' },
      order: { createdAt: 'ASC' },
      select: {
        createdAt: true,
      },
    }),
    ds.getRepository(AgodaConsentLog).find({
      where: { accommodationId },
      order: { createdAt: 'DESC' },
      take: 5,
      select: {
        type: true,
        email: true,
        createdAt: true,
      },
    }),
    getHeartbeatStatus(),
    getLatestBullmqSchedulerFailure('repeat:binbang-poll-due-scheduler:'),
  ]);

  const recentPollRunIds = recentPollRunsRaw.map((run) => run.id);
  const latestSuccessRunIds = latestSuccessRuns.map((run) => run.id);
  const snapshotIds = [...new Set([...recentPollRunIds, ...latestSuccessRunIds])];
  const snapshotCountByRunId = await countSnapshotsByPollRunIds(snapshotIds);
  const { latestByEventId: latestNotificationsByEventId } = await loadNotificationStatsByAlertEventIds(
    recentEventsRaw.map((row) => row.id),
  );

  const recentPollRuns = recentPollRunsRaw.map((row) => ({
    id: row.id.toString(),
    polledAt: row.polledAt.toISOString(),
    status: row.status,
    httpStatus: row.httpStatus,
    latencyMs: row.latencyMs,
    error: row.error,
    snapshotCount: snapshotCountByRunId.get(row.id) ?? 0,
  }));

  const latestSuccessSnapshotCount =
    latestSuccessRuns[0] != null ? (snapshotCountByRunId.get(latestSuccessRuns[0].id) ?? 0) : null;
  const previousSuccessSnapshotCount =
    latestSuccessRuns[1] != null ? (snapshotCountByRunId.get(latestSuccessRuns[1].id) ?? 0) : null;

  const recentEvents = recentEventsRaw.map((row) => ({
    id: row.id.toString(),
    detectedAt: row.detectedAt.toISOString(),
    type: row.type,
    status: row.status,
    offerKey: row.offerKey,
    latestNotificationStatus: latestNotificationsByEventId.get(row.id)?.status ?? null,
    latestNotificationReasonCode: (() => {
      const n = latestNotificationsByEventId.get(row.id);
      if (!n || (n.status !== 'failed' && n.status !== 'suppressed')) return null;
      return parseAgodaNotificationReason(n.lastError, n.status).code;
    })(),
    latestNotificationError: latestNotificationsByEventId.get(row.id)?.lastError ?? null,
  }));

  const recentNotifications = recentNotificationsRaw.map((row) => {
    const isTerminal = row.status === 'failed' || row.status === 'suppressed';
    const parsedReason = isTerminal ? parseAgodaNotificationReason(row.lastError, row.status) : null;
    return {
      id: row.id.toString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      status: row.status,
      attempt: row.attempt,
      lastErrorCode: parsedReason?.code ?? null,
      lastErrorMessage: parsedReason?.message ?? null,
      lastError: row.lastError,
    };
  });

  const pollCounts = countByStatus(pollStatusGroups);
  const notificationCounts = countByStatus(notificationStatusGroups);
  const reasonBreakdown = buildAgodaNotificationReasonBreakdownFromRows(notificationReasonGroups, 3);
  const latestConsentType = consentRows[0]?.type ?? null;
  const queuedAgedMinutes =
    oldestQueuedNotification != null
      ? Math.floor((now.getTime() - oldestQueuedNotification.createdAt.getTime()) / 60_000)
      : 0;

  const checks: AdminOpsDiagnosticCheck[] = [];
  const latestPollRun = recentPollRunsRaw[0] ?? null;
  const createdAgoMs = now.getTime() - accommodation.createdAt.getTime();
  const noPollGraceMs = STALL_MULTIPLIER * pollIntervalMs;

  if (!accommodation.isActive) {
    checks.push({
      level: 'warn',
      code: 'accommodation_inactive',
      message: '숙소 모니터링이 비활성화 상태입니다.',
      detail: 'isActive=false 이므로 poll/알림 파이프라인이 멈춰 있을 수 있습니다.',
    });
  }

  if (!accommodation.platformId) {
    checks.push({
      level: 'error',
      code: 'missing_platform_id',
      message: 'Agoda platformId가 없습니다.',
      detail: 'AGODA API 기준 식별자가 없어 정상 폴링이 불가능합니다.',
    });
  }

  if (accommodation.checkIn < dateUtcStart(now)) {
    checks.push({
      level: 'info',
      code: 'checkin_past',
      message: '체크인 날짜가 이미 지났습니다.',
      detail: 'due poll 필터에서 제외될 수 있어 최근 poll이 없을 수 있습니다.',
    });
  }

  if (recentPollRunsRaw.length === 0) {
    const createdAgoMinutes = Math.floor(createdAgoMs / 60_000);
    if (createdAgoMs < pollIntervalMs) {
      checks.push({
        level: 'info',
        code: 'first_poll_pending',
        message: '첫 poll 실행 대기 중입니다.',
        detail: `등록 후 약 ${createdAgoMinutes}분 경과했습니다. 설정 주기(약 ${pollIntervalMinutes}분) 기준 다음 스케줄에서 실행될 수 있습니다.`,
      });
    } else if (createdAgoMs < noPollGraceMs) {
      checks.push({
        level: 'warn',
        code: 'first_poll_overdue',
        message: '첫 poll이 아직 실행되지 않았습니다.',
        detail: `등록 후 약 ${createdAgoMinutes}분이 경과했습니다(설정 주기 ${pollIntervalMinutes}분 초과). worker 스케줄 또는 큐 상태를 확인하세요.`,
      });
      checks.push(buildWorkerStatusCheck(workerStatus));
      if (pollDueBullmqFailure && pollDueBullmqFailure !== REDIS_UNAVAILABLE) {
        checks.push({
          level: 'error',
          code: 'bullmq_poll_due_failed',
          message: 'BullMQ binbang-poll-due 잡이 실패했습니다.',
          detail: `${pollDueBullmqFailure.failedReason} (실패 시각: ${pollDueBullmqFailure.failedAt})`,
        });
      }
    } else {
      checks.push({
        level: 'warn',
        code: 'no_poll_history_overdue',
        message: 'poll 기록이 아직 없습니다.',
        detail: `등록 후 약 ${createdAgoMinutes}분이 지났습니다. worker 스케줄/큐 또는 내부 API 연결 상태를 확인하세요.`,
      });
      checks.push(buildWorkerStatusCheck(workerStatus));
      if (pollDueBullmqFailure && pollDueBullmqFailure !== REDIS_UNAVAILABLE) {
        checks.push({
          level: 'error',
          code: 'bullmq_poll_due_failed',
          message: 'BullMQ binbang-poll-due 잡이 실패했습니다.',
          detail: `${pollDueBullmqFailure.failedReason} (실패 시각: ${pollDueBullmqFailure.failedAt})`,
        });
      }
    }
  } else if (latestPollRun?.status === 'failed') {
    checks.push({
      level: 'warn',
      code: 'latest_poll_failed',
      message: '최근 poll이 실패했습니다.',
      detail: latestPollRun.error ?? '오류 메시지가 비어 있습니다.',
    });
  }

  if (
    accommodation.lastPolledAt != null &&
    now.getTime() - accommodation.lastPolledAt.getTime() > STALL_MULTIPLIER * pollIntervalMs
  ) {
    checks.push({
      level: 'warn',
      code: 'poll_stalled',
      message: '폴링 주기 대비 마지막 poll 시각이 지연되었습니다.',
      detail: `현재 설정 기준 약 ${pollIntervalMinutes * STALL_MULTIPLIER}분 이상 갱신이 없습니다.`,
    });
  }

  if (!accommodation.user?.email?.trim()) {
    checks.push({
      level: 'error',
      code: 'missing_user_email',
      message: '수신자 이메일이 없습니다.',
      detail: 'notification dispatch 단계에서 suppressed 됩니다.',
    });
  }

  if (latestConsentType !== 'opt_in') {
    checks.push({
      level: 'error',
      code: 'missing_opt_in',
      message: '최신 수신동의가 opt_in이 아닙니다.',
      detail: '동의 로그가 없거나 opt_out 상태면 suppressed 처리됩니다.',
    });
  }

  if (emailProvider === 'console') {
    checks.push({
      level: 'warn',
      code: 'email_provider_console',
      message: '이메일 provider가 console입니다.',
      detail: '실제 이메일 전송 대신 서버 로그에만 기록됩니다.',
    });
  }

  if ((notificationCounts.failed ?? 0) > 0) {
    checks.push({
      level: 'warn',
      code: 'notification_failed_exists',
      message: 'failed 알림 이력이 있습니다.',
      detail: '최근 notification.lastError를 확인해 재시도 또는 설정 수정을 진행하세요.',
    });
  }

  if ((notificationCounts.suppressed ?? 0) > 0) {
    checks.push({
      level: 'warn',
      code: 'notification_suppressed_exists',
      message: 'suppressed 알림 이력이 있습니다.',
      detail: '동의 상태, 이메일 유무, 숙소 활성화 여부를 확인하세요.',
    });
  }

  const DISPATCH_INTERVAL_MINUTES = 5;
  if ((notificationCounts.queued ?? 0) > 0 && queuedAgedMinutes >= DISPATCH_INTERVAL_MINUTES) {
    checks.push({
      level: 'warn',
      code: 'notification_queue_backlog',
      message: 'queued 알림이 장시간 처리되지 않았습니다.',
      detail: `가장 오래된 queued 알림이 약 ${queuedAgedMinutes}분 경과했습니다.`,
    });
  }

  if (
    successfulRuns >= 2 &&
    (latestSuccessSnapshotCount ?? 0) > 0 &&
    (previousSuccessSnapshotCount ?? 0) > 0 &&
    vacancyDetectedCount === 0
  ) {
    checks.push({
      level: 'info',
      code: 'vacancy_transition_not_met',
      message: 'vacancy 전환 조건(매진→재오픈)이 최근 구간에서 성립하지 않았습니다.',
      detail: '초기 등록부터 빈방이 있던 경우 vacancy 이벤트가 발생하지 않을 수 있습니다.',
    });
  }

  if (checks.length === 0) {
    checks.push({
      level: 'ok',
      code: 'pipeline_healthy',
      message: '치명적인 차단 요인이 보이지 않습니다.',
      detail: '최근 로그 기준으로 알림 파이프라인이 정상 동작 중입니다.',
    });
  }

  return {
    query: normalizedQuery,
    accommodation: {
      id: accommodation.id,
      name: accommodation.name,
      platformId: accommodation.platformId,
      isActive: accommodation.isActive,
      checkIn: accommodation.checkIn.toISOString(),
      checkOut: accommodation.checkOut.toISOString(),
      createdAt: accommodation.createdAt.toISOString(),
      lastPolledAt: accommodation.lastPolledAt?.toISOString() ?? null,
      lastEventAt: accommodation.lastEventAt?.toISOString() ?? null,
      userEmail: accommodation.user?.email?.trim().toLowerCase() ?? null,
    },
    config: {
      pollIntervalMinutes,
      emailProvider,
      fromEmail: runtimeSettings.fromEmail,
    },
    counters: {
      polls: {
        total: recentPollRunsRaw.length > 0 ? Object.values(pollCounts).reduce((a, b) => a + b, 0) : 0,
        success: pollCounts.success ?? 0,
        failed: pollCounts.failed ?? 0,
      },
      events: {
        total: eventCount,
        vacancyDetected: vacancyDetectedCount,
        vacancyRejected: vacancyRejectedCount,
        priceDropDetected: priceDropDetectedCount,
      },
      notifications: {
        queued: notificationCounts.queued ?? 0,
        sent: notificationCounts.sent ?? 0,
        failed: notificationCounts.failed ?? 0,
        suppressed: notificationCounts.suppressed ?? 0,
      },
    },
    vacancyContext: {
      successfulRuns,
      latestSuccessSnapshotCount,
      previousSuccessSnapshotCount,
      note: buildVacancyContextNote({
        successfulRuns,
        latestSuccessSnapshotCount,
        previousSuccessSnapshotCount,
      }),
    },
    consent: {
      latestType: latestConsentType,
      hasActiveOptIn: latestConsentType === 'opt_in',
      recent: consentRows.map((row) => ({
        type: row.type,
        email: row.email,
        createdAt: row.createdAt.toISOString(),
      })),
    },
    recentPollRuns,
    recentEvents,
    recentNotifications,
    notificationReasons: reasonBreakdown,
    checks,
  };
}

async function fetchStalledAccommodations(now: Date): Promise<StalledAccommodation[]> {
  const runtimeSettings = await getBinbangRuntimeSettings();
  const stallThreshold = new Date(now.getTime() - STALL_MULTIPLIER * runtimeSettings.pollIntervalMinutes * 60_000);
  const todayStart = startOfUtcDay(now);
  const ds = await getDataSource();
  const rows = await ds
    .getRepository(Accommodation)
    .createQueryBuilder('accommodation')
    .where('accommodation.platform = :platform', { platform: Platform.AGODA })
    .andWhere('accommodation.isActive = :isActive', { isActive: true })
    .andWhere('accommodation.platformId IS NOT NULL')
    .andWhere('accommodation.checkIn >= :todayStart', { todayStart })
    .andWhere(
      '(accommodation.lastPolledAt <= :stallThreshold OR (accommodation.lastPolledAt IS NULL AND accommodation.createdAt <= :stallThreshold))',
      { stallThreshold },
    )
    .orderBy('accommodation.lastPolledAt', 'ASC')
    .addOrderBy('accommodation.createdAt', 'ASC')
    .take(STALL_LIMIT)
    .select(['accommodation.id', 'accommodation.name', 'accommodation.createdAt', 'accommodation.lastPolledAt'])
    .getMany();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    lastPolledAt: row.lastPolledAt?.toISOString() ?? null,
    stalledSinceMinutes: Math.floor(
      (now.getTime() - (row.lastPolledAt?.getTime() ?? row.createdAt.getTime())) / 60_000,
    ),
  }));
}

const BULLMQ_PREFIX = 'bull';
const CYCLE_QUEUE = 'accommodation-check-cycle';

const MONITORED_SCHEDULERS: { prefix: string; displayName: string }[] = [
  { prefix: 'repeat:binbang-poll-due-scheduler:', displayName: 'binbang-poll-due (30분 폴링)' },
  { prefix: 'repeat:binbang-dispatch-scheduler:', displayName: 'binbang-dispatch (5분 알림 발송)' },
];

const REDIS_UNAVAILABLE = Symbol('REDIS_UNAVAILABLE');

async function getLatestBullmqSchedulerFailure(
  schedulerPrefix: string,
): Promise<{ failedReason: string; failedAt: string } | null | typeof REDIS_UNAVAILABLE> {
  const redis = getRedisClient();
  if (!redis) return REDIS_UNAVAILABLE;
  try {
    const connected = await ensureRedisConnected(redis);
    if (!connected) return REDIS_UNAVAILABLE;
    const failedSetKey = `${BULLMQ_PREFIX}:${CYCLE_QUEUE}:failed`;
    const recentIds = await redis.zrevrange(failedSetKey, 0, 29);
    const matchingId = recentIds.find((id) => id.startsWith(schedulerPrefix));
    if (!matchingId) return null;
    const job = await redis.hgetall(`${BULLMQ_PREFIX}:${CYCLE_QUEUE}:${matchingId}`);
    if (!job.failedReason) return null;
    return {
      failedReason: job.failedReason,
      failedAt: job.finishedOn ? new Date(parseInt(job.finishedOn, 10)).toISOString() : 'unknown',
    };
  } catch (err) {
    console.warn('[ops] 스케줄러 헬스 조회 실패 (Redis 오류):', err);
    return REDIS_UNAVAILABLE;
  }
}

async function getSchedulerHealth(): Promise<SchedulerJobStatus[]> {
  return Promise.all(
    MONITORED_SCHEDULERS.map(async ({ prefix, displayName }) => {
      const result = await getLatestBullmqSchedulerFailure(prefix);
      if (result === REDIS_UNAVAILABLE) {
        return { key: prefix, displayName, status: 'unknown' as const, latestFailure: null };
      }
      return {
        key: prefix,
        displayName,
        status: result ? ('failing' as const) : ('ok' as const),
        latestFailure: result,
      };
    }),
  );
}

function buildWorkerStatusCheck(workerStatus: Awaited<ReturnType<typeof getHeartbeatStatus>>): AdminOpsDiagnosticCheck {
  if (workerStatus.workerStatus === 'stopped') {
    return {
      level: 'error',
      code: 'worker_stopped',
      message: 'Worker가 응답하지 않습니다.',
      detail: `마지막 하트비트로부터 약 ${Math.floor(workerStatus.minutesSinceLastHeartbeat)}분이 경과했습니다. Worker 프로세스를 확인하세요.`,
    };
  }
  return {
    level: 'warn',
    code: 'worker_running_poll_missing',
    message: 'Worker는 실행 중이나 poll이 발생하지 않았습니다.',
    detail:
      `마지막 하트비트 ${Math.floor(workerStatus.minutesSinceLastHeartbeat)}분 전. ` +
      'BullMQ binbang-poll-due 스케줄러가 Redis에 등록돼 있는지, ' +
      'WEB_INTERNAL_URL / BINBANG_INTERNAL_API_TOKEN 환경 변수가 올바른지, ' +
      'Worker 로그에서 [binbang-poll-due] 에러를 확인하세요.',
  };
}

function buildFalsePositiveReason(input: {
  eventStatus: string;
  notificationStatus: string | null;
  notificationError: string | null;
}): string {
  if (input.eventStatus === 'rejected_verify_failed') {
    return 'verify 단계에서 빈방 신호가 기각됨';
  }
  if (input.notificationStatus === 'failed') {
    const parsed = parseAgodaNotificationReason(input.notificationError, input.notificationStatus);
    return `알림 발송 실패: ${parsed.label}`;
  }
  if (input.notificationStatus === 'suppressed') {
    const parsed = parseAgodaNotificationReason(input.notificationError, input.notificationStatus);
    return `알림 억제: ${parsed.label}`;
  }
  return '수동 검토 필요';
}

export async function getAdminOpsSummary(lookbackDays = DEFAULT_LOOKBACK_DAYS): Promise<AdminOpsSummary> {
  const now = new Date();
  const days = Number.isFinite(lookbackDays) ? Math.max(1, Math.floor(lookbackDays)) : DEFAULT_LOOKBACK_DAYS;
  const from = startOfLookback(now, days);
  const ds = await getDataSource();

  const [
    alertsTotal,
    alertsActive,
    alertsRegisteredInRange,
    notificationGroups,
    notificationReasonGroups,
    falsePositiveRows,
    stalledItems,
    schedulerHealth,
  ] = await Promise.all([
    ds.getRepository(Accommodation).count({
      where: { platform: Platform.AGODA },
    }),
    ds.getRepository(Accommodation).count({
      where: { platform: Platform.AGODA, isActive: true },
    }),
    ds
      .getRepository(Accommodation)
      .createQueryBuilder('accommodation')
      .where('accommodation.platform = :platform', { platform: Platform.AGODA })
      .andWhere('accommodation.createdAt >= :from', { from })
      .getCount(),
    groupStatusCounts(ds.getRepository(AgodaNotification), 'notification', 'notification.createdAt >= :from', { from }),
    fetchNotificationReasonRows(
      ds.getRepository(AgodaNotification),
      'notification',
      'notification.createdAt >= :from AND notification.status IN (:...statuses)',
      { from, statuses: ['failed', 'suppressed'] },
    ),
    ds
      .getRepository(AgodaAlertEvent)
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.accommodation', 'accommodation')
      .where('event.detectedAt >= :from', { from })
      .andWhere('event.status IN (:...statuses)', { statuses: ['rejected_verify_failed', 'detected'] })
      .orderBy('event.detectedAt', 'DESC')
      .take(FALSE_POSITIVE_LIMIT * 10)
      .getMany(),
    fetchStalledAccommodations(now),
    getSchedulerHealth(),
  ]);

  const falsePositiveNotificationStats = await loadNotificationStatsByAlertEventIds(
    falsePositiveRows.map((row) => row.id),
  );
  const filteredFalsePositiveRows = falsePositiveRows
    .filter(
      (row) =>
        row.status === 'rejected_verify_failed' || falsePositiveNotificationStats.hasTerminalNotification.has(row.id),
    )
    .slice(0, FALSE_POSITIVE_LIMIT);

  const counts = countByStatus(notificationGroups);
  const reasonBreakdown = buildAgodaNotificationReasonBreakdownFromRows(notificationReasonGroups, 3);

  const queued = counts.queued ?? 0;
  const sent = counts.sent ?? 0;
  const failed = counts.failed ?? 0;
  const suppressed = counts.suppressed ?? 0;
  const attempted = sent + failed;

  return {
    generatedAt: now.toISOString(),
    range: {
      from: from.toISOString(),
      to: now.toISOString(),
      days,
    },
    alerts: {
      total: alertsTotal,
      active: alertsActive,
      registeredInRange: alertsRegisteredInRange,
    },
    notifications: {
      queued,
      sent,
      failed,
      suppressed,
      attempted,
      successRate: toRate(sent, attempted),
      reasonBreakdown,
    },
    falsePositiveCandidates: filteredFalsePositiveRows.map((row) => {
      const latestNotification = falsePositiveNotificationStats.latestByEventId.get(row.id);
      const notificationStatus = latestNotification?.status ?? null;
      return {
        eventId: row.id.toString(),
        detectedAt: row.detectedAt.toISOString(),
        accommodationId: row.accommodationId,
        accommodationName: row.accommodation?.name ?? '(deleted)',
        eventType: row.type,
        eventStatus: row.status,
        notificationStatus,
        reason: buildFalsePositiveReason({
          eventStatus: row.status,
          notificationStatus,
          notificationError: latestNotification?.lastError ?? null,
        }),
      };
    }),
    stalled: {
      count: stalledItems.length,
      items: stalledItems,
    },
    schedulerHealth,
  };
}
