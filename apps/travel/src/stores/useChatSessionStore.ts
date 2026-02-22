'use client';

import { create } from 'zustand';

import { createConversationId } from '@/components/chat/chatPanelUtils';
import type { MergeStatus } from '@/hooks/useSessionMerge';

interface ChatSessionState {
  sessionId: string | null;
  currentConversationId: string;
  mergeStatus: MergeStatus;
  setSessionId: (id: string | null) => void;
  setCurrentConversationId: (id: string) => void;
  setMergeStatus: (status: MergeStatus) => void;
  newConversation: () => void;
}

export const useChatSessionStore = create<ChatSessionState>((set) => ({
  sessionId: null,
  currentConversationId: createConversationId(),
  mergeStatus: 'idle',
  setSessionId: (id) => set({ sessionId: id }),
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
  setMergeStatus: (status) => set({ mergeStatus: status }),
  newConversation: () => set({ currentConversationId: createConversationId() }),
}));
