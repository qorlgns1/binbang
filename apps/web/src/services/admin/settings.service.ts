import { prisma } from '@workspace/db';
import { BadRequestError, ValidationError } from '@workspace/shared/errors';
import { BINBANG_SETTING_KEYS, clearBinbangRuntimeSettingsCache } from '@/services/binbang-runtime-settings.service';
import { WEB_SETTING_KEYS, clearWebSettingsCache } from '@/services/web-settings.service';
import type { SettingsChangeLogsResponse, SystemSettingItem, SystemSettingsResponse } from '@/types/admin';

// ============================================================================
// Types
// ============================================================================

export interface UpdateSettingsInput {
  settings: Array<{ key: string; value: string; minValue?: string; maxValue?: string }>;
  changedById: string;
}

export interface GetSettingsHistoryInput {
  settingKey?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit: number;
}

// ============================================================================
// Constants
// ============================================================================

const SETTING_SELECT = {
  key: true,
  value: true,
  type: true,
  category: true,
  description: true,
  minValue: true,
  maxValue: true,
  updatedAt: true,
} as const;

const BINBANG_SETTINGS_DEFAULTS = [
  {
    key: 'binbang.pollIntervalMinutes',
    value: '30',
    type: 'int',
    category: 'worker',
    description: 'Agoda API due poll 판정 간격(분)',
    minValue: '1',
    maxValue: '1440',
  },
  {
    key: 'binbang.duePollLimit',
    value: '20',
    type: 'int',
    category: 'worker',
    description: '1회 due poll에서 처리할 최대 숙소 수',
    minValue: '1',
    maxValue: '500',
  },
  {
    key: 'binbang.duePollConcurrency',
    value: '3',
    type: 'int',
    category: 'worker',
    description: 'due poll 동시 실행 수',
    minValue: '1',
    maxValue: '50',
  },
  {
    key: 'binbang.snapshotRetentionDays',
    value: '30',
    type: 'int',
    category: 'worker',
    description: 'Agoda poll run/snapshot 보존 일수',
    minValue: '1',
    maxValue: '365',
  },
  {
    key: 'binbang.priceDropThreshold',
    value: '0.1',
    type: 'string',
    category: 'checker',
    description: '전역 가격 하락 임계값 (0~1 사이, 예: 0.1 = 10%)',
    minValue: null,
    maxValue: null,
  },
  {
    key: 'binbang.vacancyCooldownHours',
    value: '24',
    type: 'int',
    category: 'checker',
    description: 'vacancy 이벤트 쿨다운 시간(시간)',
    minValue: '1',
    maxValue: '168',
  },
  {
    key: 'binbang.priceDropCooldownHours',
    value: '6',
    type: 'int',
    category: 'checker',
    description: 'price_drop 이벤트 쿨다운 시간(시간)',
    minValue: '1',
    maxValue: '168',
  },
  {
    key: 'binbang.emailProvider',
    value: 'console',
    type: 'string',
    category: 'notification',
    description: '이메일 전송 provider (console/resend)',
    minValue: null,
    maxValue: null,
  },
  {
    key: 'binbang.fromEmail',
    value: 'Binbang <no-reply@binbang.local>',
    type: 'string',
    category: 'notification',
    description: '이메일 발신자 주소',
    minValue: null,
    maxValue: null,
  },
  {
    key: 'binbang.notificationDispatchLimit',
    value: '50',
    type: 'int',
    category: 'notification',
    description: '1회 dispatch에서 처리할 최대 알림 수',
    minValue: '1',
    maxValue: '1000',
  },
  {
    key: 'binbang.notificationMaxAttempts',
    value: '5',
    type: 'int',
    category: 'notification',
    description: '알림 최대 재시도 횟수',
    minValue: '1',
    maxValue: '20',
  },
] as const;

const WEB_MONITORING_HEARTBEAT_SETTINGS_DEFAULTS = [
  {
    key: WEB_SETTING_KEYS.workerHealthyThresholdMs,
    value: '2400000',
    type: 'int',
    category: 'monitoring',
    description: '마지막 작업 후 이 시간 안에 응답이 있으면 "정상" 상태로 표시',
    minValue: '60000',
    maxValue: '86400000',
  },
  {
    key: WEB_SETTING_KEYS.workerDegradedThresholdMs,
    value: '5400000',
    type: 'int',
    category: 'monitoring',
    description: '마지막 작업 후 이 시간이 지나면 "주의" 상태로 표시 (초과 시 "중단")',
    minValue: '60000',
    maxValue: '86400000',
  },
  {
    key: WEB_SETTING_KEYS.heartbeatIntervalMs,
    value: '60000',
    type: 'int',
    category: 'heartbeat',
    description: '워커가 살아있음을 알리는 하트비트 업데이트 간격',
    minValue: '10000',
    maxValue: '600000',
  },
  {
    key: WEB_SETTING_KEYS.heartbeatMissedThreshold,
    value: '1',
    type: 'int',
    category: 'heartbeat',
    description: '알림 발송 전 놓쳐도 되는 하트비트 횟수 (이 횟수 이상 놓치면 알림)',
    minValue: '1',
    maxValue: '10',
  },
] as const;

// ============================================================================
// Helper Functions
// ============================================================================

interface SettingRow {
  key: string;
  value: string;
  type: string;
  category: string;
  description: string | null;
  minValue: string | null;
  maxValue: string | null;
  updatedAt: Date;
}

const CRON_SETTING_KEYS = new Set(['worker.cronSchedule', 'worker.publicAvailabilitySnapshotSchedule']);
const RATIO_SETTING_KEYS = new Set(['binbang.priceDropThreshold']);
const EMAIL_PROVIDER_SETTING_KEYS = new Set(['binbang.emailProvider']);
const BINBANG_SETTING_KEY_SET = new Set<string>(Object.values(BINBANG_SETTING_KEYS));
const WEB_SETTING_KEY_SET = new Set<string>(Object.values(WEB_SETTING_KEYS));

const CRON_FIELD_RULES = [
  { min: 0, max: 59 }, // minute
  { min: 0, max: 23 }, // hour
  { min: 1, max: 31 }, // day of month
  { min: 1, max: 12 }, // month
  { min: 0, max: 7 }, // day of week
] as const;

function isPositiveIntegerText(value: string): boolean {
  return /^[1-9]\d*$/.test(value);
}

function isIntegerText(value: string): boolean {
  return /^\d+$/.test(value);
}

function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

function validateCronToken(token: string, min: number, max: number): boolean {
  if (token.length === 0) return false;

  const parts = token.split('/');
  if (parts.length > 2) return false;

  const [base, step] = parts;
  if (step !== undefined && !isPositiveIntegerText(step)) return false;
  if (step !== undefined && !isInRange(Number(step), 1, max)) return false;

  if (base === '*') return true;

  if (base.includes('-')) {
    const rangeParts = base.split('-');
    if (rangeParts.length !== 2) return false;
    const [startText, endText] = rangeParts;
    if (!isIntegerText(startText) || !isIntegerText(endText)) return false;

    const start = Number(startText);
    const end = Number(endText);
    if (!isInRange(start, min, max) || !isInRange(end, min, max)) return false;
    if (start > end) return false;
    return true;
  }

  if (!isIntegerText(base)) return false;
  return isInRange(Number(base), min, max);
}

function isValidCronExpression(value: string): boolean {
  const fields = value.trim().split(/\s+/);
  if (fields.length !== 5) return false;

  return fields.every((field, index): boolean => {
    const rule = CRON_FIELD_RULES[index];
    const tokens = field.split(',');
    if (tokens.some((token): boolean => token.trim().length === 0)) return false;
    return tokens.every((token): boolean => validateCronToken(token.trim(), rule.min, rule.max));
  });
}

function toSettingItem(row: SettingRow): SystemSettingItem {
  return {
    key: row.key,
    value: row.value,
    type: row.type,
    category: row.category,
    description: row.description,
    minValue: row.minValue,
    maxValue: row.maxValue,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isValidRatioText(value: string): boolean {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 && parsed < 1;
}

async function ensureBinbangSettingsRows(): Promise<void> {
  await Promise.all(
    BINBANG_SETTINGS_DEFAULTS.map((setting) =>
      prisma.systemSettings.upsert({
        where: { key: setting.key },
        update: {
          type: setting.type,
          category: setting.category,
          description: setting.description,
          minValue: setting.minValue,
          maxValue: setting.maxValue,
        },
        create: setting,
      }),
    ),
  );
}

async function ensureWebMonitoringHeartbeatRows(): Promise<void> {
  await Promise.all(
    WEB_MONITORING_HEARTBEAT_SETTINGS_DEFAULTS.map((setting) =>
      prisma.systemSettings.upsert({
        where: { key: setting.key },
        update: {
          type: setting.type,
          category: setting.category,
          description: setting.description,
          minValue: setting.minValue,
          maxValue: setting.maxValue,
        },
        create: setting,
      }),
    ),
  );
}

async function ensureSettingsRows(): Promise<void> {
  await Promise.all([ensureBinbangSettingsRows(), ensureWebMonitoringHeartbeatRows()]);
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getSettings(): Promise<SystemSettingsResponse> {
  await ensureSettingsRows();

  const rows = await prisma.systemSettings.findMany({
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
    select: SETTING_SELECT,
  });

  return {
    settings: rows.map(toSettingItem),
  };
}

export async function updateSettings(input: UpdateSettingsInput): Promise<SystemSettingsResponse> {
  const { settings: updates, changedById } = input;

  await ensureSettingsRows();

  // 전체 설정 1회 조회 (검증 + 응답 베이스 겸용)
  const allSettings = await prisma.systemSettings.findMany({
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
    select: SETTING_SELECT,
  });

  const settingMap = new Map(
    allSettings.map((s: (typeof allSettings)[0]): [string, (typeof allSettings)[0]] => [s.key, s]),
  );

  // 키 존재 여부, 타입 검증, 범위 검증
  for (const update of updates) {
    const existing = settingMap.get(update.key);
    if (!existing) {
      throw new BadRequestError(`Unknown setting key: ${update.key}`);
    }

    // min/max 변경 시 유효성 검증
    if (update.minValue !== undefined || update.maxValue !== undefined) {
      const newMin =
        update.minValue !== undefined
          ? Number(update.minValue)
          : existing.minValue !== null
            ? Number(existing.minValue)
            : null;
      const newMax =
        update.maxValue !== undefined
          ? Number(update.maxValue)
          : existing.maxValue !== null
            ? Number(existing.maxValue)
            : null;

      if (newMin !== null && (Number.isNaN(newMin) || !Number.isInteger(newMin))) {
        throw new ValidationError(`Setting "${update.key}": minValue must be a valid integer`, [
          { field: 'minValue', message: 'Must be a valid integer' },
        ]);
      }
      if (newMax !== null && (Number.isNaN(newMax) || !Number.isInteger(newMax))) {
        throw new ValidationError(`Setting "${update.key}": maxValue must be a valid integer`, [
          { field: 'maxValue', message: 'Must be a valid integer' },
        ]);
      }
      if (newMin !== null && newMax !== null && newMin > newMax) {
        throw new ValidationError(`Setting "${update.key}": min must be ≤ max`, [
          { field: 'minValue', message: 'min must be ≤ max' },
        ]);
      }

      // min/max 변경 시 현재(또는 새) value가 범위 내인지 검증
      const effectiveValue = Number(update.value ?? existing.value);
      if (!Number.isNaN(effectiveValue) && existing.type === 'int') {
        if (newMin !== null && effectiveValue < newMin) {
          throw new ValidationError(
            `Setting "${update.key}": Current value ${effectiveValue} is below new min ${newMin}`,
            [{ field: 'value', message: `Value ${effectiveValue} is below min ${newMin}` }],
          );
        }
        if (newMax !== null && effectiveValue > newMax) {
          throw new ValidationError(
            `Setting "${update.key}": Current value ${effectiveValue} exceeds new max ${newMax}`,
            [{ field: 'value', message: `Value ${effectiveValue} exceeds max ${newMax}` }],
          );
        }
      }
    }

    if (existing.type === 'int') {
      const num = Number(update.value);
      if (update.value === '' || !Number.isInteger(num) || num < 0) {
        throw new ValidationError(`Setting "${update.key}": Valid non-negative integer required`, [
          { field: 'value', message: 'Valid non-negative integer required' },
        ]);
      }

      // value 변경 시 범위 검증 (새 min/max 또는 기존 min/max 기준)
      const effectiveMin =
        update.minValue !== undefined
          ? Number(update.minValue)
          : existing.minValue !== null
            ? Number(existing.minValue)
            : null;
      const effectiveMax =
        update.maxValue !== undefined
          ? Number(update.maxValue)
          : existing.maxValue !== null
            ? Number(existing.maxValue)
            : null;

      if (effectiveMin !== null && !Number.isNaN(effectiveMin) && num < effectiveMin) {
        throw new ValidationError(
          `Setting "${update.key}": Value must be between ${effectiveMin} and ${effectiveMax ?? '∞'}`,
          [{ field: 'value', message: `Must be between ${effectiveMin} and ${effectiveMax ?? '∞'}` }],
        );
      }
      if (effectiveMax !== null && !Number.isNaN(effectiveMax) && num > effectiveMax) {
        throw new ValidationError(
          `Setting "${update.key}": Value must be between ${effectiveMin ?? 0} and ${effectiveMax}`,
          [{ field: 'value', message: `Must be between ${effectiveMin ?? 0} and ${effectiveMax}` }],
        );
      }
    }

    if (CRON_SETTING_KEYS.has(update.key) && !isValidCronExpression(update.value)) {
      throw new ValidationError(
        `Setting "${update.key}": Invalid cron expression (5 fields, numeric syntax like "*/30 * * * *")`,
        [{ field: 'value', message: 'Invalid cron expression' }],
      );
    }

    if (RATIO_SETTING_KEYS.has(update.key) && !isValidRatioText(update.value)) {
      throw new ValidationError(`Setting "${update.key}": Value must be between 0 and 1`, [
        { field: 'value', message: 'Must be a decimal number between 0 and 1 (exclusive)' },
      ]);
    }

    if (EMAIL_PROVIDER_SETTING_KEYS.has(update.key)) {
      const normalized = update.value.trim().toLowerCase();
      if (normalized !== 'console' && normalized !== 'resend') {
        throw new ValidationError(`Setting "${update.key}": Supported values are console or resend`, [
          { field: 'value', message: 'Supported values: console, resend' },
        ]);
      }
    }
  }

  // 실제로 값이 바뀐 항목만 필터 (value, minValue, maxValue 중 하나라도 변경)
  const actualChanges = updates.filter((u: (typeof updates)[0]): boolean => {
    const existing = settingMap.get(u.key);
    if (!existing) return false;
    if (existing.value !== u.value) return true;
    if (u.minValue !== undefined && existing.minValue !== u.minValue) return true;
    if (u.maxValue !== undefined && existing.maxValue !== u.maxValue) return true;
    return false;
  });

  // 설정 업데이트 + 변경 로그를 하나의 트랜잭션으로 처리
  if (actualChanges.length > 0) {
    const updatedRows = await prisma.$transaction(async (tx): Promise<SettingRow[]> => {
      const updates = await Promise.all(
        actualChanges.map(
          (u): ReturnType<typeof tx.systemSettings.update> =>
            tx.systemSettings.update({
              where: { key: u.key },
              data: {
                value: u.value,
                ...(u.minValue !== undefined ? { minValue: u.minValue } : {}),
                ...(u.maxValue !== undefined ? { maxValue: u.maxValue } : {}),
              },
              select: SETTING_SELECT,
            }),
        ),
      );

      await Promise.all(
        actualChanges.map((change): Promise<{ id: string }> => {
          const existing = settingMap.get(change.key);
          return tx.settingsChangeLog.create({
            data: {
              settingKey: change.key,
              oldValue: existing?.value ?? '',
              newValue: change.value,
              changedById,
            },
            select: { id: true },
          });
        }),
      );

      return updates;
    });

    for (const row of updatedRows) {
      settingMap.set(row.key, row);
    }

    if (actualChanges.some((change) => BINBANG_SETTING_KEY_SET.has(change.key))) {
      clearBinbangRuntimeSettingsCache();
    }

    if (actualChanges.some((change) => WEB_SETTING_KEY_SET.has(change.key))) {
      clearWebSettingsCache();
    }
  }

  return {
    settings: allSettings.map(
      (s: (typeof allSettings)[0]): SystemSettingItem => toSettingItem(settingMap.get(s.key) ?? s),
    ),
  };
}

export async function getSettingsHistory(input: GetSettingsHistoryInput): Promise<SettingsChangeLogsResponse> {
  const { settingKey, from, to, cursor, limit } = input;

  const where: {
    settingKey?: string;
    createdAt?: { gte?: Date; lte?: Date };
  } = {};

  if (settingKey) {
    where.settingKey = settingKey;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const logs = await prisma.settingsChangeLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      settingKey: true,
      oldValue: true,
      newValue: true,
      createdAt: true,
      changedBy: {
        select: { id: true, name: true },
      },
    },
  });

  const hasMore = logs.length > limit;
  const items = hasMore ? logs.slice(0, limit) : logs;

  return {
    logs: items.map(
      (
        log,
      ): {
        id: string;
        settingKey: string;
        oldValue: string;
        newValue: string;
        createdAt: string;
        changedBy: { id: string; name: string | null };
      } => ({
        id: log.id,
        settingKey: log.settingKey,
        oldValue: log.oldValue,
        newValue: log.newValue,
        createdAt: log.createdAt.toISOString(),
        changedBy: { id: log.changedBy.id, name: log.changedBy.name },
      }),
    ),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}
