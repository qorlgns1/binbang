'use client';

import type { UIMessage } from 'ai';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import {
  createConversationId,
  mapConversationEntitiesToMapEntities,
  mapConversationMessagesToUiMessages,
} from '@/components/chat/chatPanelUtils';
import { fetchConversationDetail, findFallbackConversationId } from '@/hooks/conversationRestoreApi';
import {
  clearConversationRestoreStorage,
  setLastConversationId,
  type RestoreTarget,
} from '@/hooks/conversationRestoreStorage';
import { useConversationAutoRestore } from '@/hooks/useConversationAutoRestore';
import { useConversationSnapshotSync } from '@/hooks/useConversationSnapshotSync';
import type { MergeStatus } from '@/hooks/useSessionMerge';
import type { MapEntity } from '@/lib/types';

interface UseConversationRestoreOptions {
  mergeStatus: MergeStatus;
  messages: UIMessage[];
  onEntitiesUpdate: (entities: MapEntity[]) => void;
  restoreAutoEnabled: boolean;
  setMessages: (messages: UIMessage[] | ((messages: UIMessage[]) => UIMessage[])) => void;
}

interface LoadConversationOptions {
  silent?: boolean;
  retryCount?: number;
}

export interface UseConversationRestoreResult {
  currentConversationId: string;
  restoreStatus: 'idle' | 'restoring' | 'failed';
  handleNewConversation: () => void;
  handleRetryRestore: () => Promise<void>;
  handleSelectConversation: (conversationId: string) => Promise<void>;
}

export function useConversationRestore({
  mergeStatus,
  messages,
  onEntitiesUpdate,
  restoreAutoEnabled,
  setMessages,
}: UseConversationRestoreOptions): UseConversationRestoreResult {
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'restoring' | 'failed'>('idle');
  const [restoreTargetConversationId, setRestoreTargetConversationId] = useState<string | null>(null);
  const [restorePreview, setRestorePreview] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string>(() => createConversationId());

  const clearRestoreState = useCallback(() => {
    setRestoreStatus('idle');
    setRestoreTargetConversationId(null);
    setRestorePreview('');
  }, []);

  const loadConversation = useCallback(
    async (conversationId: string, options?: LoadConversationOptions): Promise<boolean> => {
      try {
        const data = await fetchConversationDetail(conversationId, {
          retryCount: options?.retryCount,
        });

        if (!data) {
          throw new Error('Failed to load conversation');
        }

        setMessages(mapConversationMessagesToUiMessages(data.conversation.messages));
        setCurrentConversationId(conversationId);
        setLastConversationId(conversationId);
        onEntitiesUpdate(mapConversationEntitiesToMapEntities(data.conversation.entities));

        if (!options?.silent) {
          toast.success('대화를 불러왔습니다');
        }

        return true;
      } catch (error) {
        console.error('Failed to load conversation:', error);
        if (!options?.silent) {
          toast.error('대화를 불러오지 못했습니다');
        }
        return false;
      }
    },
    [onEntitiesUpdate, setMessages],
  );

  const restoreConversationWithFallback = useCallback(
    async (targetConversationId: string, preview: string): Promise<boolean> => {
      setRestoreStatus('restoring');

      // merge 완료 후 트리거되므로 retry 1회로 충분하다 (네트워크 일시 오류 대비)
      const restoredPrimary = await loadConversation(targetConversationId, { silent: true, retryCount: 1 });
      if (restoredPrimary) {
        clearRestoreState();
        toast.success('이전 대화를 복원했어요.');
        return true;
      }

      const fallbackConversationId = await findFallbackConversationId(preview, targetConversationId);
      if (fallbackConversationId) {
        const restoredFallback = await loadConversation(fallbackConversationId, { silent: true, retryCount: 1 });
        if (restoredFallback) {
          clearRestoreState();
          toast.success('최근 대화로 복원했어요.');
          return true;
        }
      }

      setRestoreStatus('failed');
      setRestoreTargetConversationId(targetConversationId);
      setRestorePreview(preview);
      toast.error('대화를 자동 복원하지 못했어요.');
      return false;
    },
    [clearRestoreState, loadConversation],
  );

  const handleSelectConversation = useCallback(
    async (conversationId: string) => {
      const restored = await loadConversation(conversationId);
      if (restored) {
        clearRestoreState();
      }
    },
    [clearRestoreState, loadConversation],
  );

  const handleRetryRestore = useCallback(async () => {
    if (!restoreTargetConversationId) {
      return;
    }

    await restoreConversationWithFallback(restoreTargetConversationId, restorePreview);
  }, [restoreConversationWithFallback, restorePreview, restoreTargetConversationId]);

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(createConversationId());
    clearRestoreState();
    clearConversationRestoreStorage();
    onEntitiesUpdate([]);
  }, [clearRestoreState, onEntitiesUpdate, setMessages]);

  const handleAutoRestoreTarget = useCallback(
    (restoreTarget: RestoreTarget) => {
      setRestorePreview(restoreTarget.preview);
      setRestoreTargetConversationId(restoreTarget.conversationId);
      void restoreConversationWithFallback(restoreTarget.conversationId, restoreTarget.preview);
    },
    [restoreConversationWithFallback],
  );

  useConversationSnapshotSync({
    currentConversationId,
    messages,
  });

  // merge 완료(done) 이후에 restore를 트리거한다.
  // authStatus 기반이 아니라 mergeStatus 기반으로 순서를 보장하여,
  // merge DB write 이전에 GET /api/conversations/:id 가 실행되는 race condition을 제거한다.
  useConversationAutoRestore({
    restoreAutoEnabled,
    mergeStatus,
    hasMessages: messages.length > 0,
    onRestoreTarget: handleAutoRestoreTarget,
  });

  return {
    currentConversationId,
    restoreStatus,
    handleNewConversation,
    handleRetryRestore,
    handleSelectConversation,
  };
}
