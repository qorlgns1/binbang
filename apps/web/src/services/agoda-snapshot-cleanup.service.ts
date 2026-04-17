import { AgodaPollRun, LessThan, getDataSource } from '@workspace/db';

export interface CleanupAgodaSnapshotsInput {
  cutoff: Date;
}

export interface CleanupAgodaSnapshotsResult {
  deletedPollRuns: number;
}

export async function cleanupExpiredAgodaPollRuns(
  input: CleanupAgodaSnapshotsInput,
): Promise<CleanupAgodaSnapshotsResult> {
  const ds = await getDataSource();
  const result = await ds.getRepository(AgodaPollRun).delete({ polledAt: LessThan(input.cutoff) });

  return {
    deletedPollRuns: result.affected ?? 0,
  };
}
