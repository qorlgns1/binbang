'use client';

import { HistorySidebarView } from '@/components/history/HistorySidebarView';
import { useHistorySidebar } from '@/hooks/useHistorySidebar';
import { isHistoryEditEnabled } from '@/lib/featureFlags';

interface HistorySidebarProps {
  open: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

export function HistorySidebar({ open, onClose, onSelectConversation, onNewConversation }: HistorySidebarProps) {
  const {
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
  } = useHistorySidebar({
    open,
    historyEditEnabled: isHistoryEditEnabled(),
    onClose,
    onNewConversation,
    onSelectConversation,
  });

  return (
    <HistorySidebarView
      open={open}
      onClose={onClose}
      conversations={conversations}
      editingConversationId={editingConversationId}
      editingTitle={editingTitle}
      pendingDeleteId={pendingDeleteId}
      historyEditEnabled={historyEditEnabled}
      searchQuery={searchQuery}
      isLoading={isLoading}
      error={error}
      setEditingTitle={setEditingTitle}
      setSearchQuery={setSearchQuery}
      onSelect={handleSelect}
      onStartEdit={handleStartEdit}
      onCancelEdit={handleCancelEdit}
      onSaveTitle={handleSaveTitle}
      onDeleteRequest={handleDeleteRequest}
      onDeleteConfirm={handleDeleteConfirm}
      onDeleteCancel={handleDeleteCancel}
      onNewConversationClick={handleNewConversationClick}
    />
  );
}
