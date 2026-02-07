import prisma from '@/lib/prisma';
import type { SettingsChangeLogsResponse, SystemSettingItem, SystemSettingsResponse } from '@/types/admin';

// ============================================================================
// Types
// ============================================================================

export interface UpdateSettingsInput {
  settings: Array<{ key: string; value: string }>;
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
// Helper Functions
// ============================================================================

function toSettingItem(row: {
  key: string;
  value: string;
  type: string;
  category: string;
  description: string | null;
  updatedAt: Date;
}): SystemSettingItem {
  return {
    key: row.key,
    value: row.value,
    type: row.type,
    category: row.category,
    description: row.description,
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getSettings(): Promise<SystemSettingsResponse> {
  const rows = await prisma.systemSettings.findMany({
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
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
  });

  const settingMap = new Map(
    allSettings.map((s: (typeof allSettings)[0]): [string, (typeof allSettings)[0]] => [s.key, s]),
  );

  // 키 존재 여부 및 타입 검증
  for (const update of updates) {
    const existing = settingMap.get(update.key);
    if (!existing) {
      throw new Error(`Unknown setting key: ${update.key}`);
    }
    if (existing.type === 'int') {
      const num = Number(update.value);
      if (update.value === '' || !Number.isInteger(num) || num < 0) {
        throw new Error(`Setting "${update.key}": Valid non-negative integer required`);
      }
    }
  }

  // 실제로 값이 바뀐 항목만 필터
  const actualChanges = updates.filter((u: (typeof updates)[0]): boolean => {
    const existing = settingMap.get(u.key);
    return !!existing && existing.value !== u.value;
  });

  // 설정 업데이트 + 변경 로그를 하나의 트랜잭션으로 처리
  const txOps = [
    ...actualChanges.map(
      (u: (typeof actualChanges)[0]): ReturnType<typeof prisma.systemSettings.update> =>
        prisma.systemSettings.update({
          where: { key: u.key },
          data: { value: u.value },
        }),
    ),
    ...actualChanges.map((change: (typeof actualChanges)[0]): ReturnType<typeof prisma.settingsChangeLog.create> => {
      const existing = settingMap.get(change.key);
      return prisma.settingsChangeLog.create({
        data: {
          settingKey: change.key,
          oldValue: existing?.value ?? '',
          newValue: change.value,
          changedById,
        },
      });
    }),
  ];

  const results = txOps.length > 0 ? await prisma.$transaction(txOps) : [];

  // transaction 결과 중 앞쪽 actualChanges.length개가 SystemSettings 결과
  const updatedRows = results.slice(0, actualChanges.length) as Array<{
    key: string;
    value: string;
    type: string;
    category: string;
    description: string | null;
    updatedAt: Date;
  }>;

  for (const row of updatedRows) {
    settingMap.set(row.key, row);
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
