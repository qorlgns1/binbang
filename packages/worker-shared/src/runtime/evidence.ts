import { type Prisma, prisma } from '@workspace/db';

export interface CreateConditionMetEventInput {
  caseId: string;
  checkLogId: string;
  evidenceSnapshot: Prisma.InputJsonValue;
  screenshotBase64: string | null;
  capturedAt: Date;
}

export async function createConditionMetEvent(input: CreateConditionMetEventInput): Promise<void> {
  try {
    await prisma.conditionMetEvent.create({
      data: {
        caseId: input.caseId,
        checkLogId: input.checkLogId,
        evidenceSnapshot: input.evidenceSnapshot,
        screenshotBase64: input.screenshotBase64,
        capturedAt: input.capturedAt,
      },
      select: { id: true },
    });
  } catch (error: unknown) {
    // @@unique([caseId, checkLogId]) 위반 시 무시 (멱등)
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2002') {
      return;
    }
    throw error;
  }
}
