'use client';

import type { UIMessage } from 'ai';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import {
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
import { useChatSessionStore } from '@/stores/useChatSessionStore';
import { usePlaceStore } from '@/stores/usePlaceStore';

interface UseConversationRestoreOptions {
  messages: UIMessage[];
  restoreAutoEnabled: boolean;
  setMessages: (messages: UIMessage[] | ((messages: UIMessage[]) => UIMessage[])) => void;
}

interface LoadConversationOptions {
  silent?: boolean;
  retryCount?: number;
}

export interface UseConversationRestoreResult {
  restoreStatus: 'idle' | 'restoring' | 'failed';
  handleNewConversation: () => void;
  handleRetryRestore: () => Promise<void>;
  handleSelectConversation: (conversationId: string) => Promise<void>;
}

export function useConversationRestore({
  messages,
  restoreAutoEnabled,
  setMessages,
}: UseConversationRestoreOptions): UseConversationRestoreResult {
  const { mergeStatus, currentConversationId, setCurrentConversationId, newConversation } = useChatSessionStore();
  const setEntities = usePlaceStore((s) => s.setEntities);

  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'restoring' | 'failed'>('idle');
  const [restoreTargetConversationId, setRestoreTargetConversationId] = useState<string | null>(null);
  const [restorePreview, setRestorePreview] = useState('');

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
        setEntities(mapConversationEntitiesToMapEntities(data.conversation.entities));

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
    [setCurrentConversationId, setEntities, setMessages],
  );

  const restoreConversationWithFallback = useCallback(
    async (targetConversationId: string, preview: string): Promise<boolean> => {
      setRestoreStatus('restoring');

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
    newConversation();
    clearRestoreState();
    clearConversationRestoreStorage();
    setEntities([]);
  }, [clearRestoreState, newConversation, setEntities, setMessages]);

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
  useConversationAutoRestore({
    restoreAutoEnabled,
    mergeStatus,
    hasMessages: messages.length > 0,
    onRestoreTarget: handleAutoRestoreTarget,
  });

  return {
    restoreStatus,
    handleNewConversation,
    handleRetryRestore,
    handleSelectConversation,
  };
}
