'use client';

import { Search, X } from 'lucide-react';

import { HistoryConversationItem } from '@/components/history/HistoryConversationItem';
import type { HistoryConversation } from '@/components/history/historySidebarTypes';

interface HistorySidebarViewProps {
  open: boolean;
  onClose: () => void;
  conversations: HistoryConversation[];
  editingConversationId: string | null;
  editingTitle: string;
  pendingDeleteId: string | null;
  historyEditEnabled: boolean;
  searchQuery: string;
  isLoading: boolean;
  error: unknown;
  setEditingTitle: (title: string) => void;
  setSearchQuery: (query: string) => void;
  onSelect: (conversationId: string) => void;
  onStartEdit: (conversationId: string, currentTitle: string | null) => void;
  onCancelEdit: () => void;
  onSaveTitle: (conversationId: string) => Promise<void>;
  onDeleteRequest: (conversationId: string) => void;
  onDeleteConfirm: (conversationId: string) => Promise<void>;
  onDeleteCancel: () => void;
  onNewConversationClick: () => void;
}

export function HistorySidebarView({
  open,
  onClose,
  conversations,
  editingConversationId,
  editingTitle,
  pendingDeleteId,
  historyEditEnabled,
  searchQuery,
  isLoading,
  error,
  setEditingTitle,
  setSearchQuery,
  onSelect,
  onStartEdit,
  onCancelEdit,
  onSaveTitle,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onNewConversationClick,
}: HistorySidebarViewProps) {
  const hasError = error != null;

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
              onChange={(event) => setSearchQuery(event.target.value)}
              className='w-full pl-9 pr-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-amber'
            />
          </div>
        </div>

        <div className='p-4 border-b border-border'>
          <button
            type='button'
            onClick={onNewConversationClick}
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

          {hasError && (
            <div className='p-4 text-center text-destructive'>
              <p className='text-sm'>대화를 불러오지 못했습니다.</p>
            </div>
          )}

          {!isLoading && !hasError && conversations.length === 0 && (
            <div className='p-4 text-center text-muted-foreground'>
              <p className='text-sm'>{searchQuery ? '검색 결과가 없습니다.' : '저장된 대화가 없습니다.'}</p>
            </div>
          )}

          {!isLoading &&
            !hasError &&
            conversations.map((conversation) => (
              <HistoryConversationItem
                key={conversation.id}
                conversation={conversation}
                editingConversationId={editingConversationId}
                editingTitle={editingTitle}
                pendingDeleteId={pendingDeleteId}
                historyEditEnabled={historyEditEnabled}
                setEditingTitle={setEditingTitle}
                onSelect={onSelect}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveTitle={onSaveTitle}
                onDeleteRequest={onDeleteRequest}
                onDeleteConfirm={onDeleteConfirm}
                onDeleteCancel={onDeleteCancel}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
