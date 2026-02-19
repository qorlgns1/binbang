'use client';

import { Search, X } from 'lucide-react';

import { HistoryConversationItem } from '@/components/history/HistoryConversationItem';
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

  if (!open) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-40 flex'>
      <button
        type='button'
        onClick={onClose}
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        aria-label='사이드바 닫기'
      />

      <div className='relative z-10 w-80 bg-background border-r border-border shadow-2xl flex flex-col'>
        <div className='flex items-center justify-between p-4 border-b border-border'>
          <h2 className='text-lg font-semibold'>대화 히스토리</h2>
          <button
            type='button'
            onClick={onClose}
            className='p-2 rounded-full hover:bg-muted transition-colors'
            aria-label='닫기'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        <div className='p-4 border-b border-border'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <input
              type='text'
              placeholder='대화 검색...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-9 pr-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-amber'
            />
          </div>
        </div>

        <div className='p-4 border-b border-border'>
          <button
            type='button'
            onClick={handleNewConversationClick}
            className='w-full py-2 px-4 bg-brand-amber text-white rounded-lg hover:bg-brand-amber/90 transition-colors font-medium'
          >
            새 대화 시작
          </button>
        </div>

        <div className='flex-1 overflow-y-auto'>
          {isLoading && (
            <div className='p-4 text-center text-muted-foreground'>
              <p className='text-sm'>로딩 중...</p>
            </div>
          )}

          {error && (
            <div className='p-4 text-center text-destructive'>
              <p className='text-sm'>대화를 불러오지 못했습니다.</p>
            </div>
          )}

          {!isLoading && !error && conversations.length === 0 && (
            <div className='p-4 text-center text-muted-foreground'>
              <p className='text-sm'>{searchQuery ? '검색 결과가 없습니다.' : '저장된 대화가 없습니다.'}</p>
            </div>
          )}

          {!isLoading &&
            !error &&
            conversations.map((conversation) => (
              <HistoryConversationItem
                key={conversation.id}
                conversation={conversation}
                editingConversationId={editingConversationId}
                editingTitle={editingTitle}
                pendingDeleteId={pendingDeleteId}
                historyEditEnabled={historyEditEnabled}
                setEditingTitle={setEditingTitle}
                onSelect={handleSelect}
                onStartEdit={handleStartEdit}
                onCancelEdit={handleCancelEdit}
                onSaveTitle={handleSaveTitle}
                onDeleteRequest={handleDeleteRequest}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={handleDeleteCancel}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
