import { findFallbackConversationId } from '@/hooks/conversationRestoreApi';

interface LoadConversationOptions {
  silent?: boolean;
  retryCount?: number;
}

type LoadFn = (id: string, opts: LoadConversationOptions) => Promise<boolean>;

export type RestoreOutcome = { type: 'restored_primary' } | { type: 'restored_fallback' } | { type: 'failed' };

/**
 * 복원 3단 fallback 시퀀스 (순수 함수 — React state 변경 없음).
 * primary 로드 실패 → preview 기반 검색 → 전체 목록 fallback → failed.
 */
export async function executeRestoreStrategy(
  targetId: string,
  preview: string,
  loadFn: LoadFn,
): Promise<RestoreOutcome> {
  const restoredPrimary = await loadFn(targetId, { silent: true, retryCount: 1 });
  if (restoredPrimary) return { type: 'restored_primary' };

  const fallbackId = await findFallbackConversationId(preview, targetId);
  if (fallbackId) {
    const restoredFallback = await loadFn(fallbackId, { silent: true, retryCount: 1 });
    if (restoredFallback) return { type: 'restored_fallback' };
  }

  return { type: 'failed' };
}
