'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

import {
  deleteHistoryConversation,
  fetchHistoryConversations,
  type HistoryConversationListResponse,
  updateHistoryConversationTitle,
} from '@/components/history/historySidebarApi';

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

  const { data, error, mutate } = useSWR<HistoryConversationListResponse>(conversationsApiUrl, fetchHistoryConversations);

  const conversations = useMemo(() => data?.conversations ?? [], [data?.conversations]);
  const isLoading = !data && !error;

  const handleDeleteRequest = useCallback((conversationId: string) => {
    setPendingDeleteId(conversationId);
  }, []);

  const handleDeleteConfirm = useCallback(
    async (conversationId: string) => {
      try {
        await deleteHistoryConversation(conversationId);
        setPendingDeleteId(null);
        await mutate();
      } catch (error) {
        console.error('Failed to delete conversation:', error);
        toast.error('삭제에 실패했습니다.');
        setPendingDeleteId(null);
      }
    },
    [mutate],
  );

  const handleDeleteCancel = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  const handleSelect = useCallback(
    (conversationId: string) => {
      onSelectConversation(conversationId);
      onClose();
    },
    [onClose, onSelectConversation],
  );

  const handleStartEdit = useCallback(
    (conversationId: string, currentTitle: string | null) => {
      if (!historyEditEnabled) {
        return;
      }

      setEditingConversationId(conversationId);
      setEditingTitle(currentTitle ?? '');
    },
    [historyEditEnabled],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingConversationId(null);
    setEditingTitle('');
  }, []);

  const handleSaveTitle = useCallback(
    async (conversationId: string) => {
      if (!historyEditEnabled) {
        return;
      }

      // CC-05: delete pending 상태에서는 edit 저장 차단 (명세 5.2)
      if (pendingDeleteId != null) {
        return;
      }

      const title = editingTitle.trim();
      if (!title) {
        toast.info('제목은 비어 있을 수 없습니다.');
        return;
      }

      try {
        await updateHistoryConversationTitle(conversationId, title);
        setEditingConversationId(null);
        setEditingTitle('');
        await mutate();
      } catch (error) {
        console.error('Failed to update conversation title:', error);
        toast.error('제목 수정에 실패했습니다.');
      }
    },
    [editingTitle, historyEditEnabled, mutate, pendingDeleteId],
  );

  const handleNewConversationClick = useCallback(() => {
    onNewConversation();
    onClose();
  }, [onClose, onNewConversation]);

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
