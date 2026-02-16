import { prisma } from '@workspace/db';

// ============================================================================
// Types
// ============================================================================

export interface ExpireOverdueCasesInput {
  now?: Date;
  batchSize?: number;
}

export interface ExpireOverdueCasesResult {
  scannedCount: number;
  expiredCount: number;
  skippedNoWindow: number;
  elapsedMs: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BATCH_SIZE = 200;
const SYSTEM_ACTOR_ID = 'system:case-expiration';
const EXPIRATION_REASON = '요청 기간(request_window) 만료로 자동 종료';

// ============================================================================
// Implementation
// ============================================================================

/**
 * ACTIVE_MONITORING 상태인 케이스 중 `request_window` 날짜가
 * 지난 것을 찾아서 EXPIRED로 자동 전이한다.
 *
 * `request_window`는 FormSubmission.extractedFields에 'YYYY-MM-DD'
 * 형식으로 저장되어 있다. 해당 날짜의 UTC 자정(00:00)을 기준으로
 * 만료 여부를 판단한다.
 */
export async function expireOverdueCases(input: ExpireOverdueCasesInput = {}): Promise<ExpireOverdueCasesResult> {
  const now = input.now ?? new Date();
  const batchSize = input.batchSize ?? DEFAULT_BATCH_SIZE;
  const startMs = Date.now();

  const activeCases = await prisma.case.findMany({
    where: { status: 'ACTIVE_MONITORING' },
    take: batchSize,
    select: {
      id: true,
      submission: { select: { extractedFields: true } },
    },
  });

  let expiredCount = 0;
  let skippedNoWindow = 0;

  for (const c of activeCases) {
    const extracted = (c.submission?.extractedFields as Record<string, unknown> | null) ?? null;
    const requestWindow = typeof extracted?.request_window === 'string' ? extracted.request_window.trim() : null;

    if (!requestWindow) {
      skippedNoWindow++;
      continue;
    }

    const windowEndDate = parseWindowDate(requestWindow);
    if (!windowEndDate || windowEndDate >= now) {
      continue;
    }

    await prisma.$transaction(async (tx): Promise<void> => {
      await tx.case.update({
        where: { id: c.id },
        data: {
          status: 'EXPIRED',
          statusChangedAt: now,
          statusChangedBy: SYSTEM_ACTOR_ID,
        },
        select: { id: true },
      });

      await tx.caseStatusLog.create({
        data: {
          caseId: c.id,
          fromStatus: 'ACTIVE_MONITORING',
          toStatus: 'EXPIRED',
          changedById: SYSTEM_ACTOR_ID,
          reason: EXPIRATION_REASON,
        },
        select: { id: true },
      });
    });

    expiredCount++;
  }

  return {
    scannedCount: activeCases.length,
    expiredCount,
    skippedNoWindow,
    elapsedMs: Date.now() - startMs,
  };
}

/**
 * 'YYYY-MM-DD' 형식의 날짜 문자열을 UTC Date로 파싱한다.
 * 유효하지 않으면 null을 반환한다.
 */
function parseWindowDate(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;

  const date = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}
