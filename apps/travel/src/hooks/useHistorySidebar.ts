'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';

import {
  fetchHistoryConversations,
  type HistoryConversationListResponse,
} from '@/components/history/historySidebarApi';
import { useHistoryConversationActions } from '@/hooks/useHistoryConversationActions';

interface UseHistorySidebarOptions {
  open: boolean;
  historyEditEnabled: boolean;
  onClose: () => void;
  onNewConversation: () => void;
  onSelectConversation: (conversationId: string) => void;
}

export function useHistorySidebar({
  open,
  historyEditEnabled,
  onClose,
  onNewConversation,
  onSelectConversation,
}: UseHistorySidebarOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const trimmedSearchQuery = searchQuery.trim();
  const conversationsApiUrl =
    open && trimmedSearchQuery.length > 0
      ? `/api/conversations?q=${encodeURIComponent(trimmedSearchQuery)}`
      : open
        ? '/api/conversations'
        : null;

  const { data, error, mutate } = useSWR<HistoryConversationListResponse>(
    conversationsApiUrl,
    fetchHistoryConversations,
  );

  const conversations = useMemo(() => data?.conversations ?? [], [data?.conversations]);
  const isLoading = !data && !error;
  const {
    handleCancelEdit,
    handleDeleteCancel,
    handleDeleteConfirm,
    handleDeleteRequest,
    handleNewConversationClick,
    handleSaveTitle,
    handleSelect,
    handleStartEdit,
  } = useHistoryConversationActions({
    editingTitle,
    historyEditEnabled,
    mutate,
    onClose,
    onNewConversation,
    onSelectConversation,
    pendingDeleteId,
    setEditingConversationId,
    setEditingTitle,
    setPendingDeleteId,
  });

  return {
    conversations,
    editingConversationId,
    editingTitle,
    error,
    historyEditEnabled,
    isLoading,
    pendingDeleteId,
    searchQuery,
    setEditingTitle,
    setSearchQuery,
    handleCancelEdit,
    handleDeleteCancel,
    handleDeleteConfirm,
    handleDeleteRequest,
    handleNewConversationClick,
    handleSaveTitle,
    handleSelect,
    handleStartEdit,
  };
}
