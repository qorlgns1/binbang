import { AuditLog, getDataSource } from '@workspace/db';

// ============================================================================
// Create
// ============================================================================

interface CreateAuditLogParams {
  actorId: string | null;
  targetId: string;
  entityType: string;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(AuditLog);
    const entity = repo.create({
      actorId: params.actorId,
      targetId: params.targetId,
      entityType: params.entityType,
      action: params.action,
      oldValue: params.oldValue !== undefined ? (params.oldValue as object) : null,
      newValue: params.newValue !== undefined ? (params.newValue as object) : null,
      ipAddress: params.ipAddress ?? null,
    });
    await repo.save(entity);
  } catch (error) {
    console.error('AuditLog 기록 실패:', error);
  }
}

// ============================================================================
// Types
// ============================================================================

interface UserInfo {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actor: UserInfo | null;
  targetId: string;
  targetUser: UserInfo | null;
  entityType: string;
  action: string;
  oldValue: unknown;
  newValue: unknown;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  nextCursor: string | null;
  total?: number;
}

export interface GetAuditLogsInput {
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit: number;
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getAuditLogs(input: GetAuditLogsInput): Promise<AuditLogsResponse> {
  const { action, entityType, from, to, cursor, limit } = input;

  const ds = await getDataSource();
  const repo = ds.getRepository(AuditLog);

  const qb = repo
    .createQueryBuilder('l')
    .leftJoinAndSelect('l.actor', 'actor')
    .leftJoinAndSelect('l.targetUser', 'targetUser')
    .orderBy('l.createdAt', 'DESC')
    .addOrderBy('l.id', 'DESC')
    .take(limit + 1);

  if (action) {
    qb.andWhere('l.action = :action', { action });
  }

  if (entityType) {
    qb.andWhere('l.entityType = :entityType', { entityType });
  }

  if (from) {
    qb.andWhere('l.createdAt >= :from', { from: new Date(from) });
  }

  if (to) {
    qb.andWhere('l.createdAt <= :to', { to: new Date(to) });
  }

  if (cursor) {
    const cursorItem = await repo.findOne({ where: { id: cursor }, select: { id: true, createdAt: true } });
    if (cursorItem) {
      qb.andWhere('(l.createdAt < :cursorDate OR (l.createdAt = :cursorDate AND l.id < :cursorId))', {
        cursorDate: cursorItem.createdAt,
        cursorId: cursor,
      });
    }
  }

  const auditLogs = await qb.getMany();

  const hasNextPage = auditLogs.length > limit;
  const logs = hasNextPage ? auditLogs.slice(0, limit) : auditLogs;
  const nextCursor = hasNextPage ? (logs[logs.length - 1]?.id ?? null) : null;

  let total: number | undefined;
  if (!cursor) {
    const countQb = repo.createQueryBuilder('l');
    if (action) countQb.andWhere('l.action = :action', { action });
    if (entityType) countQb.andWhere('l.entityType = :entityType', { entityType });
    if (from) countQb.andWhere('l.createdAt >= :from', { from: new Date(from) });
    if (to) countQb.andWhere('l.createdAt <= :to', { to: new Date(to) });
    total = await countQb.getCount();
  }

  return {
    logs: logs.map(
      (log): AuditLogEntry => ({
        id: log.id,
        actorId: log.actorId,
        actor: log.actor
          ? { id: log.actor.id, name: log.actor.name, email: log.actor.email, image: log.actor.image }
          : null,
        targetId: log.targetId,
        targetUser: log.targetUser
          ? {
              id: log.targetUser.id,
              name: log.targetUser.name,
              email: log.targetUser.email,
              image: log.targetUser.image,
            }
          : null,
        entityType: log.entityType,
        action: log.action,
        oldValue: log.oldValue,
        newValue: log.newValue,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt.toISOString(),
      }),
    ),
    nextCursor,
    ...(total !== undefined && { total }),
  };
}
