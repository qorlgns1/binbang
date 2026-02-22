import type { UIMessage } from 'ai';

import {
  getUserMessagePreview,
  LAST_CONVERSATION_ID_STORAGE_KEY,
  parsePendingRestoreSnapshot,
  PENDING_RESTORE_STALE_MS,
  PENDING_RESTORE_STORAGE_KEY,
  type PendingRestoreSnapshot,
} from '@/components/chat/chatPanelUtils';

export interface RestoreTarget {
  conversationId: string;
  preview: string;
}

export function setLastConversationId(conversationId: string) {
  localStorage.setItem(LAST_CONVERSATION_ID_STORAGE_KEY, conversationId);
}

export function saveConversationRestoreSnapshot(conversationId: string, messages: UIMessage[]) {
  const snapshot: PendingRestoreSnapshot = {
    conversationId,
    updatedAt: Date.now(),
    preview: getUserMessagePreview(messages),
  };

  setLastConversationId(conversationId);
  localStorage.setItem(PENDING_RESTORE_STORAGE_KEY, JSON.stringify(snapshot));
}

export function consumeRestoreTarget(): RestoreTarget | null {
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
    return null;
  }

  localStorage.removeItem(PENDING_RESTORE_STORAGE_KEY);
  localStorage.removeItem(LAST_CONVERSATION_ID_STORAGE_KEY);

  return {
    conversationId: targetConversationId,
    preview: pendingSnapshot?.preview ?? '',
  };
}

export function clearConversationRestoreStorage() {
  localStorage.removeItem(PENDING_RESTORE_STORAGE_KEY);
  localStorage.removeItem(LAST_CONVERSATION_ID_STORAGE_KEY);
}
