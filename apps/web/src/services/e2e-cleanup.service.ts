import { User, getDataSource } from '@workspace/db';

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
 * deleteMany를 사용해 TOCTOU 경합 없이 원자적으로 처리한다.
 * schema의 cascade 관계(Session/Account/Accommodation 등)에 의해
 * 관련 데이터가 함께 정리된다.
 *
 * @param userId 삭제 대상 사용자 ID
 * @returns 삭제 수행 여부
 */
export async function cleanupE2eUserById(userId: string): Promise<CleanupE2eUserResult> {
  const ds = await getDataSource();
  const result = await ds.getRepository(User).delete({ id: userId });
  return { deleted: (result.affected ?? 0) > 0 };
}
