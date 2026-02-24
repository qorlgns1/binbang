import { prisma } from '@workspace/db';

const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_TRAVEL_GUEST_RETENTION_DAYS = 7;

export interface CleanupTravelGuestConversationsInput {
  retentionDays?: number;
}

export interface CleanupTravelGuestConversationsResult {
  retentionDays: number;
  cutoffAt: string;
  deletedCount: number;
}

function resolveRetentionDays(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_TRAVEL_GUEST_RETENTION_DAYS;
  }
  return Math.max(1, Math.floor(value));
}

/**
 * 7일(또는 지정 일수) 이상 경과한 게스트 전용 대화 삭제.
 * travel-guest-cleanup 스케줄 job에서 호출한다.
 */
export async function cleanupTravelGuestConversations(
  input: CleanupTravelGuestConversationsInput = {},
): Promise<CleanupTravelGuestConversationsResult> {
  const retentionDays = resolveRetentionDays(input.retentionDays);
  const cutoffDate = new Date(Date.now() - retentionDays * DAY_MS);

  const result = await prisma.travelConversation.deleteMany({
    where: {
      userId: null,
      createdAt: { lt: cutoffDate },
    },
  });

  return {
    retentionDays,
    cutoffAt: cutoffDate.toISOString(),
    deletedCount: result.count,
  };
}
