'use client';

import { HistoryConversationActions } from '@/components/history/HistoryConversationActions';
import { HistoryConversationMeta } from '@/components/history/HistoryConversationMeta';
import type { HistoryConversation } from '@/components/history/historySidebarTypes';

interface HistoryConversationItemProps {
  conversation: HistoryConversation;
  editingConversationId: string | null;
  editingTitle: string;
  pendingDeleteId: string | null;
  historyEditEnabled: boolean;
  setEditingTitle: (value: string) => void;
  onSelect: (conversationId: string) => void;
  onStartEdit: (conversationId: string, currentTitle: string | null) => void;
  onCancelEdit: () => void;
  onSaveTitle: (conversationId: string) => Promise<void>;
  onDeleteRequest: (conversationId: string) => void;
  onDeleteConfirm: (conversationId: string) => Promise<void>;
  onDeleteCancel: () => void;
}

export function HistoryConversationItem({
  conversation,
  editingConversationId,
  editingTitle,
  pendingDeleteId,
  historyEditEnabled,
  setEditingTitle,
  onSelect,
  onStartEdit,
  onCancelEdit,
  onSaveTitle,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: HistoryConversationItemProps) {
  const isEditing = historyEditEnabled && editingConversationId === conversation.id;
  const isPendingDelete = pendingDeleteId === conversation.id;
  const hasPendingDelete = pendingDeleteId != null;

  return (
    // biome-ignore lint/a11y/useSemanticElements: 내부에 편집/삭제 button이 있어 진짜 button으로 감싸면 HTML 규격 위반(중첩 button). div+role=button+onKeyDown으로 접근성 확보.
    <div
      role='button'
      tabIndex={0}
      className='w-full p-4 border-b border-border hover:bg-muted cursor-pointer transition-colors group text-left'
      onClick={() => {
        if (!isEditing) {
          onSelect(conversation.id);
        }
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') {
          return;
        }

        e.preventDefault();
        if (!isEditing) {
          onSelect(conversation.id);
        }
      }}
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='flex-1 min-w-0'>
          {isEditing ? (
            <input
              type='text'
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' && !hasPendingDelete) {
                  void onSaveTitle(conversation.id);
                }
                if (e.key === 'Escape') {
                  onCancelEdit();
                }
              }}
              className='w-full rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber'
              maxLength={100}
            />
          ) : (
            <h3 className='font-medium text-sm truncate'>{conversation.title || '제목 없음'}</h3>
          )}
          <HistoryConversationMeta messageCount={conversation._count.messages} updatedAt={conversation.updatedAt} />
        </div>

        <div className='flex items-center gap-1'>
          <HistoryConversationActions
            conversationId={conversation.id}
            conversationTitle={conversation.title}
            historyEditEnabled={historyEditEnabled}
            isEditing={isEditing}
            isPendingDelete={isPendingDelete}
            hasPendingDelete={hasPendingDelete}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onSaveTitle={onSaveTitle}
            onDeleteRequest={onDeleteRequest}
            onDeleteConfirm={onDeleteConfirm}
            onDeleteCancel={onDeleteCancel}
          />
        </div>
      </div>
    </div>
  );
}
