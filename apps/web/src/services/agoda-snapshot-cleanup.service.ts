import { prisma } from '@workspace/db';

export interface CleanupAgodaSnapshotsInput {
  cutoff: Date;
}

export interface CleanupAgodaSnapshotsResult {
  deletedPollRuns: number;
}

export async function cleanupExpiredAgodaPollRuns(
  input: CleanupAgodaSnapshotsInput,
): Promise<CleanupAgodaSnapshotsResult> {
  const { count } = await prisma.agodaPollRun.deleteMany({
    where: { polledAt: { lt: input.cutoff } },
  });

  return {
    deletedPollRuns: count,
  };
}
