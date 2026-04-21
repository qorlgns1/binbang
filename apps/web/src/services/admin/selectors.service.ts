import {
  type Platform,
  type SelectorCategory,
  PlatformSelector,
  SelectorChangeLog,
  getDataSource,
} from '@workspace/db';
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

  const ds = await getDataSource();
  const qb = ds
    .getRepository(PlatformSelector)
    .createQueryBuilder('s')
    .leftJoinAndSelect('s.createdBy', 'createdBy')
    .leftJoinAndSelect('s.updatedBy', 'updatedBy')
    .orderBy('s.platform', 'ASC')
    .addOrderBy('s.category', 'ASC')
    .addOrderBy('s.priority', 'DESC')
    .addOrderBy('s.name', 'ASC');

  if (platform) {
    qb.andWhere('s.platform = :platform', { platform });
  }
  if (category) {
    qb.andWhere('s.category = :category', { category });
  }
  if (!includeInactive) {
    qb.andWhere('s.isActive = :isActive', { isActive: true });
  }

  const selectors = await qb.getMany();

  return {
    selectors: selectors.map(toSelectorItem),
    total: selectors.length,
  };
}

export async function createSelector(input: CreateSelectorInput): Promise<PlatformSelectorItem> {
  const { createdById, ...body } = input;

  const ds = await getDataSource();
  const selectorRepo = ds.getRepository(PlatformSelector);

  // 중복 확인
  const existing = await selectorRepo.findOne({
    where: { platform: body.platform, category: body.category, name: body.name },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError('Selector with same name already exists');
  }

  // 생성
  const selector = await ds.transaction(async (manager) => {
    const repo = manager.getRepository(PlatformSelector);
    const logRepo = manager.getRepository(SelectorChangeLog);

    const entity = repo.create({
      platform: body.platform,
      category: body.category,
      name: body.name,
      selector: body.selector,
      extractorCode: body.extractorCode,
      priority: body.priority ?? 0,
      description: body.description,
      createdById,
      updatedById: createdById,
    });
    await repo.save(entity);

    const created = await repo.findOneOrFail({
      where: { id: entity.id },
      relations: { createdBy: true, updatedBy: true },
    });

    // 변경 로그 기록
    const log = logRepo.create({
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
    });
    await logRepo.save(log);

    return created;
  });

  return toSelectorItem(selector);
}

export async function updateSelector(input: UpdateSelectorInput): Promise<PlatformSelectorItem> {
  const { id, updatedById, ...body } = input;

  const ds = await getDataSource();
  const selectorRepo = ds.getRepository(PlatformSelector);

  // 기존 셀렉터 조회
  const existing = await selectorRepo.findOne({
    where: { id },
    select: { id: true, selector: true, priority: true, isActive: true },
  });

  if (!existing) {
    throw new NotFoundError('Selector not found');
  }

  // 업데이트
  const selector = await ds.transaction(async (manager) => {
    const repo = manager.getRepository(PlatformSelector);
    const logRepo = manager.getRepository(SelectorChangeLog);

    await repo.update(
      { id },
      {
        ...(body.selector !== undefined && { selector: body.selector }),
        ...(body.extractorCode !== undefined && { extractorCode: body.extractorCode }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.description !== undefined && { description: body.description }),
        updatedById,
      },
    );

    const updated = await repo.findOneOrFail({
      where: { id },
      relations: { createdBy: true, updatedBy: true },
    });

    // 변경 로그 기록
    const log = logRepo.create({
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
    });
    await logRepo.save(log);

    return updated;
  });

  return toSelectorItem(selector);
}

export async function deleteSelector(input: DeleteSelectorInput): Promise<void> {
  const { id, deletedById } = input;

  const ds = await getDataSource();
  const selectorRepo = ds.getRepository(PlatformSelector);

  const existing = await selectorRepo.findOne({
    where: { id },
    select: { id: true, platform: true, category: true, name: true, selector: true },
  });

  if (!existing) {
    throw new NotFoundError('Selector not found');
  }

  await ds.transaction(async (manager) => {
    const repo = manager.getRepository(PlatformSelector);
    const logRepo = manager.getRepository(SelectorChangeLog);

    await repo.delete({ id });

    const log = logRepo.create({
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
    });
    await logRepo.save(log);
  });
}

export async function getSelectorHistory(input: GetSelectorHistoryInput): Promise<SelectorChangeLogsResponse> {
  const { entityType, entityId, from, to, cursor, limit } = input;

  const ds = await getDataSource();
  const qb = ds
    .getRepository(SelectorChangeLog)
    .createQueryBuilder('l')
    .leftJoinAndSelect('l.changedBy', 'changedBy')
    .orderBy('l.createdAt', 'DESC')
    .take(limit + 1);

  if (entityType) {
    qb.andWhere('l.entityType = :entityType', { entityType });
  }
  if (entityId) {
    qb.andWhere('l.entityId = :entityId', { entityId });
  }
  if (from) {
    qb.andWhere('l.createdAt >= :from', { from: new Date(from) });
  }
  if (to) {
    qb.andWhere('l.createdAt <= :to', { to: new Date(to) });
  }
  if (cursor) {
    qb.andWhere('l.id < :cursor', { cursor });
  }

  const logs = await qb.getMany();

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
