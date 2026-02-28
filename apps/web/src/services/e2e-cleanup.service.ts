import { prisma } from '@workspace/db';

/**
 * E2E 전용 계정 정리 결과.
 *
 * - `deleted=true`: 사용자 레코드를 실제로 삭제함
 * - `deleted=false`: 사용자 미존재(이미 정리됨)
 */
export interface CleanupE2eUserResult {
  deleted: boolean;
}

/**
 * E2E 테스트에서 생성한 사용자를 안전하게 삭제한다.
 *
 * 구현 포인트:
 * - 먼저 존재 여부를 확인해 불필요한 예외를 피한다.
 * - 실제 삭제는 `User` 단건 삭제로 수행한다.
 * - schema의 cascade 관계(Session/Account/Accommodation 등)에 의해
 *   관련 데이터가 함께 정리된다.
 *
 * @param userId 삭제 대상 사용자 ID
 * @returns 삭제 수행 여부
 */
export async function cleanupE2eUserById(userId: string): Promise<CleanupE2eUserResult> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!existing) {
    return { deleted: false };
  }

  await prisma.user.delete({
    where: { id: userId },
    select: { id: true },
  });

  return { deleted: true };
}
