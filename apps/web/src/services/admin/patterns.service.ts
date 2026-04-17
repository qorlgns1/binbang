import { type PatternType, type Platform, PlatformPattern, SelectorChangeLog, getDataSource } from '@workspace/db';
import { BadRequestError, ConflictError, NotFoundError } from '@workspace/shared/errors';
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

  const ds = await getDataSource();
  const qb = ds
    .getRepository(PlatformPattern)
    .createQueryBuilder('p')
    .leftJoinAndSelect('p.createdBy', 'createdBy')
    .orderBy('p.platform', 'ASC')
    .addOrderBy('p.patternType', 'ASC')
    .addOrderBy('p.priority', 'DESC')
    .addOrderBy('p.pattern', 'ASC');

  if (platform) {
    qb.andWhere('p.platform = :platform', { platform });
  }
  if (patternType) {
    qb.andWhere('p.patternType = :patternType', { patternType });
  }
  if (!includeInactive) {
    qb.andWhere('p.isActive = :isActive', { isActive: true });
  }

  const patterns = await qb.getMany();

  return {
    patterns: patterns.map(toPatternItem),
    total: patterns.length,
  };
}

export async function createPattern(input: CreatePatternInput): Promise<PlatformPatternItem> {
  const { createdById, ...body } = input;

  const ds = await getDataSource();
  const patternRepo = ds.getRepository(PlatformPattern);

  // 중복 확인
  const existing = await patternRepo.findOne({
    where: { platform: body.platform, patternType: body.patternType, pattern: body.pattern },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError('Pattern already exists');
  }

  // 생성
  const pattern = await ds.transaction(async (manager) => {
    const repo = manager.getRepository(PlatformPattern);
    const logRepo = manager.getRepository(SelectorChangeLog);

    const entity = repo.create({
      platform: body.platform,
      patternType: body.patternType,
      pattern: body.pattern,
      locale: body.locale ?? 'ko',
      priority: body.priority ?? 0,
      createdById,
    });
    await repo.save(entity);

    // createdBy 관계 로드
    const created = await repo.findOneOrFail({
      where: { id: entity.id },
      relations: { createdBy: true },
    });

    // 변경 로그 기록
    const log = logRepo.create({
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
    });
    await logRepo.save(log);

    return created;
  });

  return toPatternItem(pattern);
}

export async function updatePattern(input: UpdatePatternInput): Promise<PlatformPatternItem> {
  const { id, updatedById, ...body } = input;

  const ds = await getDataSource();
  const patternRepo = ds.getRepository(PlatformPattern);

  // 기존 패턴 조회
  const existing = await patternRepo.findOne({
    where: { id },
    select: { id: true, pattern: true, isActive: true, priority: true, locale: true },
  });

  if (!existing) {
    throw new NotFoundError('Pattern not found');
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
    throw new BadRequestError('No changes detected');
  }

  // 업데이트
  const pattern = await ds.transaction(async (manager) => {
    const repo = manager.getRepository(PlatformPattern);
    const logRepo = manager.getRepository(SelectorChangeLog);

    await repo.update(
      { id },
      {
        ...(body.pattern !== undefined && { pattern: body.pattern }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.locale !== undefined && { locale: body.locale }),
      },
    );

    const updated = await repo.findOneOrFail({
      where: { id },
      relations: { createdBy: true },
    });

    // 각 변경에 대해 로그 생성
    for (const change of changes) {
      const log = logRepo.create({
        entityType: 'PlatformPattern',
        entityId: id,
        action: change.field === 'isActive' ? 'toggle' : 'update',
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        changedById: updatedById,
      });
      await logRepo.save(log);
    }

    return updated;
  });

  return toPatternItem(pattern);
}

export async function deletePattern(input: DeletePatternInput): Promise<void> {
  const { id, deletedById } = input;

  const ds = await getDataSource();
  const patternRepo = ds.getRepository(PlatformPattern);

  const existing = await patternRepo.findOne({
    where: { id },
    select: { id: true, platform: true, patternType: true, pattern: true },
  });

  if (!existing) {
    throw new NotFoundError('Pattern not found');
  }

  await ds.transaction(async (manager) => {
    const repo = manager.getRepository(PlatformPattern);
    const logRepo = manager.getRepository(SelectorChangeLog);

    // 변경 로그 기록
    const log = logRepo.create({
      entityType: 'PlatformPattern',
      entityId: id,
      action: 'delete',
      oldValue: JSON.stringify({
        platform: existing.platform,
        patternType: existing.patternType,
        pattern: existing.pattern,
      }),
      changedById: deletedById,
    });
    await logRepo.save(log);

    // 삭제
    await repo.delete({ id });
  });
}
