'use client';

import type { UIMessage } from 'ai';
import { useEffect } from 'react';

import { saveConversationRestoreSnapshot } from '@/hooks/conversationRestoreStorage';

interface UseConversationSnapshotSyncOptions {
  currentConversationId: string;
  messages: UIMessage[];
}

export function useConversationSnapshotSync({ currentConversationId, messages }: UseConversationSnapshotSyncOptions) {
  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    saveConversationRestoreSnapshot(currentConversationId, messages);
  }, [currentConversationId, messages]);
}
