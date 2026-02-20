'use client';

import { useState } from 'react';
import { useHistoryConversationList } from '@/hooks/useHistoryConversationList';
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

  const { conversations, error, isLoading, mutate } = useHistoryConversationList({
    open,
    searchQuery,
  });
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
