'use client';

import type { UIMessage } from 'ai';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import {
  mapConversationEntitiesToMapEntities,
  mapConversationMessagesToUiMessages,
} from '@/components/chat/chatPanelUtils';
import { fetchConversationDetail } from '@/hooks/conversationRestoreApi';
import {
  clearConversationRestoreStorage,
  setLastConversationId,
  type RestoreTarget,
} from '@/hooks/conversationRestoreStorage';
import { executeRestoreStrategy } from '@/hooks/conversationRestoreStrategy';
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

// 불일치 상태 불가능 — status === 'failed'일 때만 targetConversationId/preview 존재
type RestoreState =
  | { status: 'idle' }
  | { status: 'restoring' }
  | { status: 'failed'; targetConversationId: string; preview: string };

export interface UseConversationRestoreResult {
  restoreStatus: RestoreState['status'];
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

  const [restoreState, setRestoreState] = useState<RestoreState>({ status: 'idle' });

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
      setRestoreState({ status: 'restoring' });

      const outcome = await executeRestoreStrategy(targetConversationId, preview, loadConversation);

      if (outcome.type === 'restored_primary') {
        setRestoreState({ status: 'idle' });
        toast.success('이전 대화를 복원했어요.');
        return true;
      }

      if (outcome.type === 'restored_fallback') {
        setRestoreState({ status: 'idle' });
        toast.success('최근 대화로 복원했어요.');
        return true;
      }

      setRestoreState({ status: 'failed', targetConversationId, preview });
      toast.error('대화를 자동 복원하지 못했어요.');
      return false;
    },
    [loadConversation],
  );

  const handleSelectConversation = useCallback(
    async (conversationId: string) => {
      const restored = await loadConversation(conversationId);
      if (restored) {
        setRestoreState({ status: 'idle' });
      }
    },
    [loadConversation],
  );

  const handleRetryRestore = useCallback(async () => {
    if (restoreState.status !== 'failed') return;
    await restoreConversationWithFallback(restoreState.targetConversationId, restoreState.preview);
  }, [restoreConversationWithFallback, restoreState]);

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    newConversation();
    setRestoreState({ status: 'idle' });
    clearConversationRestoreStorage();
    setEntities([]);
  }, [newConversation, setEntities, setMessages]);

  const handleAutoRestoreTarget = useCallback(
    (restoreTarget: RestoreTarget) => {
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
    restoreStatus: restoreState.status,
    handleNewConversation,
    handleRetryRestore,
    handleSelectConversation,
  };
}
