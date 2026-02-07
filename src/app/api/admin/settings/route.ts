import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/prisma';
import type { SystemSettingItem, SystemSettingsResponse } from '@/types/admin';

const settingsUpdateSchema = z.object({
  settings: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.string(),
      }),
    )
    .min(1),
});

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

/** int 타입 설정의 값 검증 (정수 + 음수 방지) */
const nonNegativeInt = z
  .string()
  .refine((v) => v !== '' && Number.isInteger(Number(v)), { message: 'Valid integer required' })
  .refine((v) => Number(v) >= 0, { message: 'Must not be negative' });

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await prisma.systemSettings.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    const response: SystemSettingsResponse = {
      settings: rows.map(toSettingItem),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = settingsUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.errors }, { status: 400 });
    }

    const { settings: updates } = parsed.data;

    // 전체 설정 1회 조회 (검증 + 응답 베이스 겸용)
    const allSettings = await prisma.systemSettings.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    const settingMap = new Map(allSettings.map((s) => [s.key, s]));

    for (const update of updates) {
      const existing = settingMap.get(update.key);
      if (!existing) {
        return NextResponse.json({ error: `Unknown setting key: ${update.key}` }, { status: 400 });
      }
      if (existing.type === 'int') {
        const result = nonNegativeInt.safeParse(update.value);
        if (!result.success) {
          return NextResponse.json(
            { error: `Setting "${update.key}": ${result.error.issues[0].message}` },
            { status: 400 },
          );
        }
      }
    }

    // 실제로 값이 바뀐 항목만 필터
    const actualChanges = updates.filter((u) => {
      const existing = settingMap.get(u.key);
      return existing && existing.value !== u.value;
    });

    // 설정 업데이트 + 변경 로그를 하나의 트랜잭션으로 처리
    const txOps = [
      ...actualChanges.map((u) =>
        prisma.systemSettings.update({
          where: { key: u.key },
          data: { value: u.value },
        }),
      ),
      ...actualChanges.map((change) => {
        const existing = settingMap.get(change.key);
        return prisma.settingsChangeLog.create({
          data: {
            settingKey: change.key,
            oldValue: existing?.value ?? '',
            newValue: change.value,
            changedById: session.user.id,
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

    const response: SystemSettingsResponse = {
      settings: allSettings.map((s) => toSettingItem(settingMap.get(s.key) ?? s)),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin settings PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
