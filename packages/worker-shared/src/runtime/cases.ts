import { getDataSource, Case, CaseStatus, IsNull, Not } from '@workspace/db';

export interface ActiveCaseLink {
  caseId: string;
  accommodationId: string;
  conditionDefinition: string;
}

/**
 * ACTIVE_MONITORING 상태이면서 숙소가 연결된 Case 목록을 조회하고,
 * accommodationId → [{ caseId, conditionDefinition }, ...] 맵으로 반환한다.
 */
export async function findActiveCaseLinks(): Promise<Map<string, ActiveCaseLink[]>> {
  const ds = await getDataSource();
  const activeCases = await ds.getRepository(Case).find({
    where: { status: CaseStatus.ACTIVE_MONITORING, accommodationId: Not(IsNull()) },
    select: { id: true, accommodationId: true },
    relations: { submission: true },
  });

  const map = new Map<string, ActiveCaseLink[]>();
  for (const c of activeCases) {
    if (!c.accommodationId) continue;
    const extracted = (c.submission?.extractedFields as Record<string, unknown> | null) ?? null;
    const conditionDefinition =
      typeof extracted?.condition_definition === 'string' ? extracted.condition_definition : '';
    const arr = map.get(c.accommodationId) ?? [];
    arr.push({
      caseId: c.id,
      accommodationId: c.accommodationId,
      conditionDefinition,
    });
    map.set(c.accommodationId, arr);
  }

  return map;
}
