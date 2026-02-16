import { type Platform, type SelectorCategory, prisma } from '@workspace/db';
import { ConflictError, NotFoundError } from '@workspace/shared/errors';
import type {
  CreateSelectorPayload,
  PlatformSelectorItem,
  PlatformSelectorsResponse,
  SelectorChangeLogsResponse,
  UpdateSelectorPayload,
} from '@/types/admin';

// ============================================================================
// Types
// ============================================================================

export interface GetSelectorsInput {
  platform?: Platform | null;
  category?: SelectorCategory | null;
  includeInactive?: boolean;
}

export interface CreateSelectorInput extends CreateSelectorPayload {
  createdById: string;
}

export interface UpdateSelectorInput extends UpdateSelectorPayload {
  id: string;
  updatedById: string;
}

export interface DeleteSelectorInput {
  id: string;
  deletedById: string;
}

export interface GetSelectorHistoryInput {
  entityType?: 'PlatformSelector' | 'PlatformPattern';
  entityId?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function toSelectorItem(s: {
  id: string;
  platform: Platform;
  category: SelectorCategory;
  name: string;
  selector: string;
  extractorCode: string | null;
  priority: number;
  isActive: boolean;
  description: string | null;
  createdBy: { id: string; name: string | null } | null;
  updatedBy: { id: string; name: string | null } | null;
  createdAt: Date;
  updatedAt: Date;
}): PlatformSelectorItem {
  return {
    id: s.id,
    platform: s.platform,
    category: s.category,
    name: s.name,
    selector: s.selector,
    extractorCode: s.extractorCode,
    priority: s.priority,
    isActive: s.isActive,
    description: s.description,
    createdBy: s.createdBy,
    updatedBy: s.updatedBy,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getSelectors(input: GetSelectorsInput): Promise<PlatformSelectorsResponse> {
  const { platform, category, includeInactive = false } = input;

  const selectors = await prisma.platformSelector.findMany({
    where: {
      ...(platform && { platform }),
      ...(category && { category }),
      ...(!includeInactive && { isActive: true }),
    },
    select: {
      id: true,
      platform: true,
      category: true,
      name: true,
      selector: true,
      extractorCode: true,
      priority: true,
      isActive: true,
      description: true,
      createdBy: { select: { id: true, name: true } },
      updatedBy: { select: { id: true, name: true } },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ platform: 'asc' }, { category: 'asc' }, { priority: 'desc' }, { name: 'asc' }],
  });

  return {
    selectors: selectors.map(toSelectorItem),
    total: selectors.length,
  };
}

export async function createSelector(input: CreateSelectorInput): Promise<PlatformSelectorItem> {
  const { createdById, ...body } = input;

  // 중복 확인
  const existing = await prisma.platformSelector.findUnique({
    where: {
      platform_category_name: {
        platform: body.platform,
        category: body.category,
        name: body.name,
      },
    },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError('Selector with same name already exists');
  }

  // 생성
  const selector = await prisma.$transaction(
    async (
      tx,
    ): Promise<{
      id: string;
      platform: Platform;
      category: SelectorCategory;
      name: string;
      selector: string;
      extractorCode: string | null;
      priority: number;
      isActive: boolean;
      description: string | null;
      createdBy: { id: string; name: string | null } | null;
      updatedBy: { id: string; name: string | null } | null;
      createdAt: Date;
      updatedAt: Date;
    }> => {
      const created = await tx.platformSelector.create({
        data: {
          platform: body.platform,
          category: body.category,
          name: body.name,
          selector: body.selector,
          extractorCode: body.extractorCode,
          priority: body.priority ?? 0,
          description: body.description,
          createdById,
          updatedById: createdById,
        },
        select: {
          id: true,
          platform: true,
          category: true,
          name: true,
          selector: true,
          extractorCode: true,
          priority: true,
          isActive: true,
          description: true,
          createdBy: { select: { id: true, name: true } },
          updatedBy: { select: { id: true, name: true } },
          createdAt: true,
          updatedAt: true,
        },
      });

      // 변경 로그 기록
      await tx.selectorChangeLog.create({
        data: {
          entityType: 'PlatformSelector',
          entityId: created.id,
          action: 'create',
          newValue: JSON.stringify({
            platform: body.platform,
            category: body.category,
            name: body.name,
            selector: body.selector,
            priority: body.priority ?? 0,
          }),
          changedById: createdById,
        },
        select: { id: true },
      });

      return created;
    },
  );

  return toSelectorItem(selector);
}

export async function updateSelector(input: UpdateSelectorInput): Promise<PlatformSelectorItem> {
  const { id, updatedById, ...body } = input;

  // 기존 셀렉터 조회
  const existing = await prisma.platformSelector.findUnique({
    where: { id },
    select: { id: true, selector: true, priority: true, isActive: true },
  });

  if (!existing) {
    throw new NotFoundError('Selector not found');
  }

  // 업데이트
  const selector = await prisma.$transaction(
    async (
      tx,
    ): Promise<{
      id: string;
      platform: Platform;
      category: SelectorCategory;
      name: string;
      selector: string;
      extractorCode: string | null;
      priority: number;
      isActive: boolean;
      description: string | null;
      createdBy: { id: string; name: string | null } | null;
      updatedBy: { id: string; name: string | null } | null;
      createdAt: Date;
      updatedAt: Date;
    }> => {
      const updated = await tx.platformSelector.update({
        where: { id },
        data: {
          ...(body.selector !== undefined && { selector: body.selector }),
          ...(body.extractorCode !== undefined && { extractorCode: body.extractorCode }),
          ...(body.priority !== undefined && { priority: body.priority }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
          ...(body.description !== undefined && { description: body.description }),
          updatedById,
        },
        select: {
          id: true,
          platform: true,
          category: true,
          name: true,
          selector: true,
          extractorCode: true,
          priority: true,
          isActive: true,
          description: true,
          createdBy: { select: { id: true, name: true } },
          updatedBy: { select: { id: true, name: true } },
          createdAt: true,
          updatedAt: true,
        },
      });

      // 변경 로그 기록
      await tx.selectorChangeLog.create({
        data: {
          entityType: 'PlatformSelector',
          entityId: id,
          action: 'update',
          oldValue: JSON.stringify({
            selector: existing.selector,
            priority: existing.priority,
            isActive: existing.isActive,
          }),
          newValue: JSON.stringify({
            selector: updated.selector,
            priority: updated.priority,
            isActive: updated.isActive,
          }),
          changedById: updatedById,
        },
        select: { id: true },
      });

      return updated;
    },
  );

  return toSelectorItem(selector);
}

export async function deleteSelector(input: DeleteSelectorInput): Promise<void> {
  const { id, deletedById } = input;

  const existing = await prisma.platformSelector.findUnique({
    where: { id },
    select: { id: true, platform: true, category: true, name: true, selector: true },
  });

  if (!existing) {
    throw new NotFoundError('Selector not found');
  }

  await prisma.$transaction(async (tx): Promise<void> => {
    await tx.platformSelector.delete({
      where: { id },
    });

    await tx.selectorChangeLog.create({
      data: {
        entityType: 'PlatformSelector',
        entityId: id,
        action: 'delete',
        oldValue: JSON.stringify({
          platform: existing.platform,
          category: existing.category,
          name: existing.name,
          selector: existing.selector,
        }),
        changedById: deletedById,
      },
      select: { id: true },
    });
  });
}

export async function getSelectorHistory(input: GetSelectorHistoryInput): Promise<SelectorChangeLogsResponse> {
  const { entityType, entityId, from, to, cursor, limit } = input;

  const where: {
    entityType?: string;
    entityId?: string;
    createdAt?: { gte?: Date; lte?: Date };
    id?: { lt: string };
  } = {};

  if (entityType) {
    where.entityType = entityType;
  }

  if (entityId) {
    where.entityId = entityId;
  }

  if (from) {
    where.createdAt = { ...where.createdAt, gte: new Date(from) };
  }

  if (to) {
    where.createdAt = { ...where.createdAt, lte: new Date(to) };
  }

  if (cursor) {
    where.id = { lt: cursor };
  }

  const logs = await prisma.selectorChangeLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    select: {
      id: true,
      entityType: true,
      entityId: true,
      action: true,
      field: true,
      oldValue: true,
      newValue: true,
      createdAt: true,
      changedBy: {
        select: { id: true, name: true },
      },
    },
  });

  const hasMore = logs.length > limit;
  const items = hasMore ? logs.slice(0, -1) : logs;

  return {
    logs: items.map(
      (
        log,
      ): {
        id: string;
        entityType: 'PlatformSelector' | 'PlatformPattern';
        entityId: string;
        action: 'create' | 'update' | 'delete' | 'toggle';
        field: string | null;
        oldValue: string | null;
        newValue: string | null;
        changedBy: { id: string; name: string | null };
        createdAt: string;
      } => ({
        id: log.id,
        entityType: log.entityType as 'PlatformSelector' | 'PlatformPattern',
        entityId: log.entityId,
        action: log.action as 'create' | 'update' | 'delete' | 'toggle',
        field: log.field,
        oldValue: log.oldValue,
        newValue: log.newValue,
        changedBy: log.changedBy,
        createdAt: log.createdAt.toISOString(),
      }),
    ),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}
