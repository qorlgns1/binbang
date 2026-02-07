import type { InputJsonValue } from '@/generated/prisma/internal/prismaNamespace';
import prisma from '@/lib/prisma';

interface CreateAuditLogParams {
  actorId: string | null;
  targetId: string;
  entityType: string;
  action: string;
  oldValue?: InputJsonValue;
  newValue?: InputJsonValue;
  ipAddress?: string;
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        targetId: params.targetId,
        entityType: params.entityType,
        action: params.action,
        oldValue: params.oldValue ?? undefined,
        newValue: params.newValue ?? undefined,
        ipAddress: params.ipAddress ?? undefined,
      },
    });
  } catch (error) {
    console.error('AuditLog 기록 실패:', error);
  }
}
