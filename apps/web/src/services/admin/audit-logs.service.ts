import type { Prisma } from '@/generated/prisma/client';
import prisma from '@/lib/prisma';

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

  const where: Prisma.AuditLogWhereInput = {};

  if (action) {
    where.action = action;
  }

  if (entityType) {
    where.entityType = entityType;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) {
      where.createdAt.gte = new Date(from);
    }
    if (to) {
      where.createdAt.lte = new Date(to);
    }
  }

  const auditLogs = await prisma.auditLog.findMany({
    where,
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      actorId: true,
      actor: {
        select: { id: true, name: true, email: true, image: true },
      },
      targetId: true,
      targetUser: {
        select: { id: true, name: true, email: true, image: true },
      },
      entityType: true,
      action: true,
      oldValue: true,
      newValue: true,
      ipAddress: true,
      createdAt: true,
    },
  });

  const hasNextPage = auditLogs.length > limit;
  const logs = hasNextPage ? auditLogs.slice(0, limit) : auditLogs;
  const nextCursor = hasNextPage ? (logs[logs.length - 1]?.id ?? null) : null;

  let total: number | undefined;
  if (!cursor) {
    total = await prisma.auditLog.count({ where });
  }

  return {
    logs: logs.map((log) => ({
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
    })),
    nextCursor,
    ...(total !== undefined && { total }),
  };
}
