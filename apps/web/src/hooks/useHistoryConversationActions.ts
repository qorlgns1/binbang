'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';

import { deleteHistoryConversation, updateHistoryConversationTitle } from '@/components/history/historySidebarApi';

interface UseHistoryConversationActionsOptions {
  editingTitle: string;
  historyEditEnabled: boolean;
  mutate: () => Promise<unknown>;
  onClose: () => void;
  onNewConversation: () => void;
  onSelectConversation: (conversationId: string) => void;
  pendingDeleteId: string | null;
  setEditingConversationId: (conversationId: string | null) => void;
  setEditingTitle: (title: string) => void;
  setPendingDeleteId: (conversationId: string | null) => void;
}

export function useHistoryConversationActions({
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
}: UseHistoryConversationActionsOptions) {
  const handleDeleteRequest = useCallback(
    (conversationId: string) => {
      setPendingDeleteId(conversationId);
    },
    [setPendingDeleteId],
  );

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
    [mutate, setPendingDeleteId],
  );

  const handleDeleteCancel = useCallback(() => {
    setPendingDeleteId(null);
  }, [setPendingDeleteId]);

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
    [historyEditEnabled, setEditingConversationId, setEditingTitle],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingConversationId(null);
    setEditingTitle('');
  }, [setEditingConversationId, setEditingTitle]);

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
    [editingTitle, historyEditEnabled, mutate, pendingDeleteId, setEditingConversationId, setEditingTitle],
  );

  const handleNewConversationClick = useCallback(() => {
    onNewConversation();
    onClose();
  }, [onClose, onNewConversation]);

  return {
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
