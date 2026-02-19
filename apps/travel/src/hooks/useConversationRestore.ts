'use client';

import type { UIMessage } from 'ai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  createConversationId,
  getUserMessagePreview,
  LAST_CONVERSATION_ID_STORAGE_KEY,
  mapConversationEntitiesToMapEntities,
  mapConversationMessagesToUiMessages,
  parsePendingRestoreSnapshot,
  PENDING_RESTORE_STALE_MS,
  PENDING_RESTORE_STORAGE_KEY,
  type ConversationEntityPayload,
  type ConversationMessagePayload,
  type ConversationSummary,
  type PendingRestoreSnapshot,
} from '@/components/chat/chatPanelUtils';
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

interface ConversationDetailResponse {
  conversation: {
    id: string;
    messages: ConversationMessagePayload[];
    entities: ConversationEntityPayload[];
  };
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
  const hasAutoRestoredConversationRef = useRef(false);
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
      const retryCount = options?.retryCount ?? 0;

      try {
        let response: Response | null = null;

        for (let attempt = 0; attempt <= retryCount; attempt += 1) {
          response = await fetch(`/api/conversations/${conversationId}`);
          if (response.ok) {
            break;
          }

          const shouldRetry = (response.status === 403 || response.status === 404) && attempt < retryCount;
          if (!shouldRetry) {
            break;
          }

          await new Promise((resolve) => {
            setTimeout(resolve, 400 * (attempt + 1));
          });
        }

        if (!response || !response.ok) {
          throw new Error('Failed to load conversation');
        }

        const data = (await response.json()) as ConversationDetailResponse;
        setMessages(mapConversationMessagesToUiMessages(data.conversation.messages));
        setCurrentConversationId(conversationId);
        localStorage.setItem(LAST_CONVERSATION_ID_STORAGE_KEY, conversationId);
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

  const findFallbackConversationId = useCallback(async (preview: string, excludeId: string): Promise<string | null> => {
    const trimmedPreview = preview.trim();
    const urls =
      trimmedPreview.length >= 2
        ? [`/api/conversations?q=${encodeURIComponent(trimmedPreview.slice(0, 32))}`, '/api/conversations']
        : ['/api/conversations'];

    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          continue;
        }

        const data = (await response.json()) as { conversations: ConversationSummary[] };
        const fallback = data.conversations.find((conversation) => conversation.id !== excludeId)?.id ?? null;
        if (fallback) {
          return fallback;
        }
      } catch (error) {
        console.error('Failed to find fallback conversation:', error);
      }
    }

    return null;
  }, []);

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
    [clearRestoreState, findFallbackConversationId, loadConversation],
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
    localStorage.removeItem(PENDING_RESTORE_STORAGE_KEY);
    localStorage.removeItem(LAST_CONVERSATION_ID_STORAGE_KEY);
    onEntitiesUpdate([]);
  }, [clearRestoreState, onEntitiesUpdate, setMessages]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    const snapshot: PendingRestoreSnapshot = {
      conversationId: currentConversationId,
      updatedAt: Date.now(),
      preview: getUserMessagePreview(messages),
    };

    localStorage.setItem(LAST_CONVERSATION_ID_STORAGE_KEY, currentConversationId);
    localStorage.setItem(PENDING_RESTORE_STORAGE_KEY, JSON.stringify(snapshot));
  }, [currentConversationId, messages]);

  // merge 완료(done) 이후에 restore를 트리거한다.
  // authStatus 기반이 아니라 mergeStatus 기반으로 순서를 보장하여,
  // merge DB write 이전에 GET /api/conversations/:id 가 실행되는 race condition을 제거한다.
  useEffect(() => {
    if (!restoreAutoEnabled) {
      return;
    }

    if (mergeStatus !== 'done' || hasAutoRestoredConversationRef.current) {
      return;
    }

    hasAutoRestoredConversationRef.current = true;
    if (messages.length > 0) {
      return;
    }

    let pendingSnapshot = parsePendingRestoreSnapshot(localStorage.getItem(PENDING_RESTORE_STORAGE_KEY));
    const now = Date.now();
    if (
      pendingSnapshot &&
      typeof pendingSnapshot.updatedAt === 'number' &&
      now - pendingSnapshot.updatedAt > PENDING_RESTORE_STALE_MS
    ) {
      localStorage.removeItem(PENDING_RESTORE_STORAGE_KEY);
      pendingSnapshot = null;
    }

    const storedConversationId = localStorage.getItem(LAST_CONVERSATION_ID_STORAGE_KEY);
    const targetConversationId = pendingSnapshot?.conversationId ?? storedConversationId;

    if (!targetConversationId) {
      return;
    }

    setRestorePreview(pendingSnapshot?.preview ?? '');
    localStorage.removeItem(PENDING_RESTORE_STORAGE_KEY);
    localStorage.removeItem(LAST_CONVERSATION_ID_STORAGE_KEY);
    setRestoreTargetConversationId(targetConversationId);
    void restoreConversationWithFallback(targetConversationId, pendingSnapshot?.preview ?? '');
  }, [mergeStatus, messages.length, restoreAutoEnabled, restoreConversationWithFallback]);

  return {
    currentConversationId,
    restoreStatus,
    handleNewConversation,
    handleRetryRestore,
    handleSelectConversation,
  };
}
