import type { PatternType, Platform } from '@/generated/prisma/client';
import prisma from '@/lib/prisma';
import type {
  CreatePatternPayload,
  PlatformPatternItem,
  PlatformPatternsResponse,
  UpdatePatternPayload,
} from '@/types/admin';

// ============================================================================
// Types
// ============================================================================

export interface GetPatternsInput {
  platform?: Platform | null;
  patternType?: PatternType | null;
  includeInactive?: boolean;
}

export interface CreatePatternInput extends CreatePatternPayload {
  createdById: string;
}

export interface UpdatePatternInput extends UpdatePatternPayload {
  id: string;
  updatedById: string;
}

export interface DeletePatternInput {
  id: string;
  deletedById: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function toPatternItem(p: {
  id: string;
  platform: Platform;
  patternType: PatternType;
  pattern: string;
  locale: string;
  isActive: boolean;
  priority: number;
  createdBy: { id: string; name: string | null } | null;
  createdAt: Date;
  updatedAt: Date;
}): PlatformPatternItem {
  return {
    id: p.id,
    platform: p.platform,
    patternType: p.patternType,
    pattern: p.pattern,
    locale: p.locale,
    isActive: p.isActive,
    priority: p.priority,
    createdBy: p.createdBy,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getPatterns(input: GetPatternsInput): Promise<PlatformPatternsResponse> {
  const { platform, patternType, includeInactive = false } = input;

  const patterns = await prisma.platformPattern.findMany({
    where: {
      ...(platform && { platform }),
      ...(patternType && { patternType }),
      ...(!includeInactive && { isActive: true }),
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: [{ platform: 'asc' }, { patternType: 'asc' }, { priority: 'desc' }, { pattern: 'asc' }],
  });

  return {
    patterns: patterns.map(toPatternItem),
    total: patterns.length,
  };
}

export async function createPattern(input: CreatePatternInput): Promise<PlatformPatternItem> {
  const { createdById, ...body } = input;

  // 중복 확인
  const existing = await prisma.platformPattern.findUnique({
    where: {
      platform_patternType_pattern: {
        platform: body.platform,
        patternType: body.patternType,
        pattern: body.pattern,
      },
    },
  });

  if (existing) {
    throw new Error('Pattern already exists');
  }

  // 생성
  const pattern = await prisma.$transaction(
    async (
      tx,
    ): Promise<{
      id: string;
      platform: Platform;
      patternType: PatternType;
      pattern: string;
      locale: string;
      isActive: boolean;
      priority: number;
      createdBy: { id: string; name: string | null } | null;
      createdAt: Date;
      updatedAt: Date;
    }> => {
      const created = await tx.platformPattern.create({
        data: {
          platform: body.platform,
          patternType: body.patternType,
          pattern: body.pattern,
          locale: body.locale ?? 'ko',
          priority: body.priority ?? 0,
          createdById,
        },
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      });

      // 변경 로그 기록
      await tx.selectorChangeLog.create({
        data: {
          entityType: 'PlatformPattern',
          entityId: created.id,
          action: 'create',
          newValue: JSON.stringify({
            platform: body.platform,
            patternType: body.patternType,
            pattern: body.pattern,
            locale: body.locale ?? 'ko',
          }),
          changedById: createdById,
        },
      });

      return created;
    },
  );

  return toPatternItem(pattern);
}

export async function updatePattern(input: UpdatePatternInput): Promise<PlatformPatternItem> {
  const { id, updatedById, ...body } = input;

  // 기존 패턴 조회
  const existing = await prisma.platformPattern.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Pattern not found');
  }

  // 변경된 필드 추적
  const changes: { field: string; oldValue: string; newValue: string }[] = [];

  if (body.pattern !== undefined && body.pattern !== existing.pattern) {
    changes.push({ field: 'pattern', oldValue: existing.pattern, newValue: body.pattern });
  }
  if (body.isActive !== undefined && body.isActive !== existing.isActive) {
    changes.push({ field: 'isActive', oldValue: String(existing.isActive), newValue: String(body.isActive) });
  }
  if (body.priority !== undefined && body.priority !== existing.priority) {
    changes.push({ field: 'priority', oldValue: String(existing.priority), newValue: String(body.priority) });
  }
  if (body.locale !== undefined && body.locale !== existing.locale) {
    changes.push({ field: 'locale', oldValue: existing.locale, newValue: body.locale });
  }

  if (changes.length === 0) {
    throw new Error('No changes detected');
  }

  // 업데이트
  const pattern = await prisma.$transaction(
    async (
      tx,
    ): Promise<{
      id: string;
      platform: Platform;
      patternType: PatternType;
      pattern: string;
      locale: string;
      isActive: boolean;
      priority: number;
      createdBy: { id: string; name: string | null } | null;
      createdAt: Date;
      updatedAt: Date;
    }> => {
      const updated = await tx.platformPattern.update({
        where: { id },
        data: {
          ...(body.pattern !== undefined && { pattern: body.pattern }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
          ...(body.priority !== undefined && { priority: body.priority }),
          ...(body.locale !== undefined && { locale: body.locale }),
        },
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      });

      // 각 변경에 대해 로그 생성
      for (const change of changes) {
        await tx.selectorChangeLog.create({
          data: {
            entityType: 'PlatformPattern',
            entityId: id,
            action: change.field === 'isActive' ? 'toggle' : 'update',
            field: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue,
            changedById: updatedById,
          },
        });
      }

      return updated;
    },
  );

  return toPatternItem(pattern);
}

export async function deletePattern(input: DeletePatternInput): Promise<void> {
  const { id, deletedById } = input;

  const existing = await prisma.platformPattern.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Pattern not found');
  }

  await prisma.$transaction(async (tx): Promise<void> => {
    // 변경 로그 기록
    await tx.selectorChangeLog.create({
      data: {
        entityType: 'PlatformPattern',
        entityId: id,
        action: 'delete',
        oldValue: JSON.stringify({
          platform: existing.platform,
          patternType: existing.patternType,
          pattern: existing.pattern,
        }),
        changedById: deletedById,
      },
    });

    // 삭제
    await tx.platformPattern.delete({
      where: { id },
    });
  });
}
