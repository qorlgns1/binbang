import { prisma } from '@workspace/db';

const DEFAULT_TRAVEL_GUEST_RETENTION_DAYS = 7;

interface CleanupTravelGuestConversationsInput {
  retentionDays?: number;
}

interface CleanupTravelGuestConversationsResult {
  retentionDays: number;
  cutoffAt: string;
  deletedCount: number;
}

export async function cleanupTravelGuestConversations(
  input: CleanupTravelGuestConversationsInput = {},
): Promise<CleanupTravelGuestConversationsResult> {
  const retentionDays =
    typeof input.retentionDays === 'number' && Number.isFinite(input.retentionDays) && input.retentionDays > 0
      ? Math.floor(input.retentionDays)
      : DEFAULT_TRAVEL_GUEST_RETENTION_DAYS;

  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const result = await prisma.travelConversation.deleteMany({
    where: {
      userId: null,
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return {
    retentionDays,
    cutoffAt: cutoffDate.toISOString(),
    deletedCount: result.count,
  };
}
