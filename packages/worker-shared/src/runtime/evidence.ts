import { getDataSource, ConditionMetEvent, QueryFailedError } from '@workspace/db';

export interface CreateConditionMetEventInput {
  caseId: string;
  checkLogId: string;
  evidenceSnapshot: object;
  screenshotBase64: string | null;
  capturedAt: Date;
}

export async function createConditionMetEvent(input: CreateConditionMetEventInput): Promise<void> {
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(ConditionMetEvent);
    const entity = repo.create({
      caseId: input.caseId,
      checkLogId: input.checkLogId,
      evidenceSnapshot: input.evidenceSnapshot,
      screenshotBase64: input.screenshotBase64,
      capturedAt: input.capturedAt,
    });
    await repo.save(entity);
  } catch (error: unknown) {
    // @Unique(['caseId', 'checkLogId']) 위반 시 무시 (멱등)
    // Oracle ORA-00001: unique constraint violated
    if (error instanceof QueryFailedError) {
      const driverErr = (error as { driverError?: { errorNum?: number } }).driverError;
      if (driverErr?.errorNum === 1) {
        return;
      }
    }
    throw error;
  }
}
