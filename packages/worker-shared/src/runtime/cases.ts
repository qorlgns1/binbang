import { prisma } from '@workspace/db';

export interface ActiveCaseLink {
  caseId: string;
  accommodationId: string;
  conditionDefinition: string;
}

/**
 * ACTIVE_MONITORING 상태이면서 숙소가 연결된 Case 목록을 조회하고,
 * accommodationId → { caseId, conditionDefinition } 맵으로 반환한다.
 */
export async function findActiveCaseLinks(): Promise<Map<string, ActiveCaseLink>> {
  const activeCases = await prisma.case.findMany({
    where: { status: 'ACTIVE_MONITORING', accommodationId: { not: null } },
    select: {
      id: true,
      accommodationId: true,
      submission: { select: { extractedFields: true } },
    },
  });

  const map = new Map<string, ActiveCaseLink>();
  for (const c of activeCases) {
    if (!c.accommodationId) continue;
    const extracted = c.submission.extractedFields as Record<string, unknown> | null;
    const conditionDefinition =
      typeof extracted?.condition_definition === 'string' ? extracted.condition_definition : '';
    map.set(c.accommodationId, {
      caseId: c.id,
      accommodationId: c.accommodationId,
      conditionDefinition,
    });
  }

  return map;
}
