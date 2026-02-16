import { prisma } from '@workspace/db';
import { BadRequestError, ValidationError } from '@workspace/shared/errors';
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

// ============================================================================
// Service Functions
// ============================================================================

export async function getSettings(): Promise<SystemSettingsResponse> {
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
